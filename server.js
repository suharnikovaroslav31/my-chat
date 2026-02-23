const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Настройка Socket.io для работы через прокси Render
const io = new Server(server, {
    cors: { origin: "*" },
    connectionStateRecovery: {} // Поможет не терять сообщения при плохом 4G
});

const HISTORY_FILE = path.join(__dirname, 'history.json');

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
    } catch (e) { return []; }
    return [];
}

function saveMessage(msg) {
    try {
        let history = loadHistory();
        history.push(msg);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-50), null, 2));
    } catch (e) { console.log("Ошибка записи истории"); }
}

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('🔌 Кто-то подключился');

    // Отправляем историю сразу при входе
    socket.emit('load_history', loadHistory());

    socket.on('message', (data) => {
        const messageData = {
            name: data.name,
            text: data.text,
            type: data.type || 'text',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        saveMessage(messageData);
        // io.emit отправляет ВСЕМ подключенным устройствам
        io.emit('message', messageData); 
    });
});

// ПОРТ для Render должен быть именно таким!
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 СЕРВЕР ЗАПУЩЕН НА ПОРТУ ${PORT}`);
});
