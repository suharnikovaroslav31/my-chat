const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

let onlineCount = 0;
let usersBase = {}; // ТУТ ХРАНЯТСЯ НАСТОЯЩИЕ ПРОФИЛИ

io.on('connection', (socket) => {
    onlineCount++;
    io.emit('update_online', onlineCount);

    // Логика регистрации/входа
    socket.on('authenticate', (data) => {
        // Сохраняем пользователя в "базу"
        usersBase[socket.id] = { 
            username: data.username, 
            regDate: new Date() 
        };
        socket.emit('auth_success', { username: data.username });
    });

    socket.on('message', (data) => {
        const user = usersBase[socket.id];
        if (user) {
            io.emit('message', { name: user.username, text: data.text });
        }
    });

    socket.on('disconnect', () => {
        onlineCount--;
        delete usersBase[socket.id];
        io.emit('update_online', onlineCount);
    });
});

http.listen(3000, () => console.log('Сервер запущен на порту 3000'));
