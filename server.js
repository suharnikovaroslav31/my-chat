const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

// Разрешаем передачу больших файлов (картинок) до 10мб
const io = new Server(server, {
    maxHttpBufferSize: 1e7,
    cors: { origin: "*" } // Разрешаем вход с любых устройств (телефонов)
});

const HISTORY_FILE = path.join(__dirname, 'history.json');

function loadHistory() {
    try {
        if (fs.existsSync(HISTORY_FILE)) {
            return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        }
    } catch (e) { console.log("Ошибка истории"); }
    return [];
}

function saveMessage(msg) {
    try {
        let history = loadHistory();
        history.push(msg);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history.slice(-100), null, 2));
    } catch (e) { console.log("Ошибка записи"); }
}

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    console.log('🔌 Кто-то подключился!');

    socket.on('request_history', () => {
        socket.emit('load_history', loadHistory());
    });

    socket.on('user_joined', (username) => {
        socket.username = username;
        io.emit('system_message', { text: `${username} в сети` });
    });

    socket.on('message', (data) => {
        const messageData = {
            name: data.name,
            text: data.text,
            type: data.type || 'text',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        saveMessage(messageData);
        io.emit('message', messageData);
    });

    socket.on('typing', (name) => {
        socket.broadcast.emit('display_typing', name);
    });

    socket.on('disconnect', () => {
        if (socket.username) io.emit('system_message', { text: `${socket.username} вышел` });
    });
});

// Слушаем на порту 3000 и на всех IP адресах (0.0.0.0)
server.listen(3000, '0.0.0.0', () => {
    console.log('🚀 СЕРВЕР ЗАПУЩЕН!');
    console.log('👉 С компа: http://localhost:3000');
    console.log('👉 С телефона: http://ТВОЙ_IP:3000');
});