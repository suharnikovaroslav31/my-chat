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

const getData = (f) => {
    try { return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : (f === USERS_FILE ? {} : []); }
    catch { return f === USERS_FILE ? {} : []; }
};
const saveData = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

app.use(express.static(__dirname));

let onlineUsers = new Set();

io.on('connection', (socket) => {
    socket.on('authenticate', (data) => {
        const users = getData(USERS_FILE);
        const { username, password, isRegister } = data;

        if (isRegister) {
            if (users[username]) return socket.emit('auth_error', 'Ник занят!');
            users[username] = { password };
            saveData(USERS_FILE, users);
            socket.emit('auth_success', { username });
        } else {
            if (users[username] && users[username].password === password) {
                socket.emit('auth_success', { username });
            } else {
                socket.emit('auth_error', 'Ошибка входа!');
            }
        }
    });

    socket.on('user_join', (name) => {
        socket.userName = name;
        onlineUsers.add(name);
        io.emit('update_users', Array.from(onlineUsers));
    });

    socket.on('get_history', () => socket.emit('load_history', getData(HISTORY_FILE)));

    socket.on('message', (data) => {
        const msg = { ...data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        let history = getData(HISTORY_FILE);
        history.push(msg);
        saveData(HISTORY_FILE, history.slice(-50));
        io.emit('message', msg);
    });

    socket.on('disconnect', () => {
        if (socket.userName) {
            onlineUsers.delete(socket.userName);
            io.emit('update_users', Array.from(onlineUsers));
        }
    });
});

server.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log("🚀 Live"));
