const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e8 });

const USERS_FILE = path.join(__dirname, 'users.json');
const HISTORY_FILE = path.join(__dirname, 'history.json');

// Загрузка данных
const getData = (file) => {
    try { return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : (file === USERS_FILE ? {} : []); }
    catch (e) { return file === USERS_FILE ? {} : []; }
};

const saveData = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2));

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    // Регистрация / Вход
    socket.on('authenticate', (data) => {
        const users = getData(USERS_FILE);
        const { username, password, isRegister } = data;

        if (isRegister) {
            if (users[username]) return socket.emit('auth_error', 'Этот ник уже занят!');
            users[username] = { password }; // В реальности тут нужно хеширование
            saveData(USERS_FILE, users);
            socket.emit('auth_success', { username });
        } else {
            if (users[username] && users[username].password === password) {
                socket.emit('auth_success', { username });
            } else {
                socket.emit('auth_error', 'Неверное имя или пароль!');
            }
        }
    });

    socket.on('get_history', () => socket.emit('load_history', getData(HISTORY_FILE)));

    socket.on('message', (data) => {
        const msg = { ...data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        let history = getData(HISTORY_FILE);
        history.push(msg);
        saveData(HISTORY_FILE, history.slice(-50));
        io.emit('message', msg);
    });
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log(`🚀 Server on port ${process.env.PORT || 3000}`));
