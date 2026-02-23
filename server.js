const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const USERS_FILE = './users.json';
const HISTORY_FILE = './history.json';

if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '{}');

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    let currentUser = null;

    socket.on('authenticate', (data) => {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        if (data.isRegister) {
            if (users[data.username]) return socket.emit('auth_error', 'Этот позывной уже занят');
            users[data.username] = { password: data.password, color: '#00d2ff', status: 'Новый участник' };
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
        } else {
            const user = users[data.username];
            if (!user || user.password !== data.password) return socket.emit('auth_error', 'Доступ отклонен: неверные данные');
        }
        currentUser = data.username;
        socket.emit('auth_success', { username: data.username });
    });

    socket.on('join_room', (room) => {
        socket.join(room);
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        socket.emit('load_history', history[room] || []);
    });

    socket.on('message', (data) => {
        if (!currentUser) return;
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        if (!history['main']) history['main'] = [];
        const msg = { name: currentUser, text: data.text, time: new Date().toLocaleTimeString() };
        history['main'].push(msg);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        io.to('main').emit('message', msg);
    });
});

server.listen(3000, () => console.log('Ядро запущено на порту 3000'));
