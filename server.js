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
    let userRoom = 'основной-чат';

    socket.on('authenticate', (data) => {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        if (data.isRegister) {
            users[data.username] = { password: data.password };
            fs.writeFileSync(USERS_FILE, JSON.stringify(users));
            socket.emit('auth_success', { username: data.username });
        } else if (users[data.username]?.password === data.password) {
            socket.emit('auth_success', { username: data.username });
        } else {
            socket.emit('auth_error', 'Ошибка!');
        }
    });

    socket.on('join_room', (room) => {
        socket.leave(userRoom);
        socket.join(room);
        userRoom = room;
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        socket.emit('load_history', history[room] || []);
    });

    socket.on('message', (data) => {
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        if (!history[userRoom]) history[userRoom] = [];
        const msg = { name: data.name, text: data.text, time: new Date().toLocaleTimeString() };
        history[userRoom].push(msg);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history));
        io.to(userRoom).emit('message', msg);
    });
});

server.listen(process.env.PORT || 3000);
