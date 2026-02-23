const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const USERS_FILE = './users.json';
const HISTORY_FILE = './history.json';

// Инициализация файлов базы данных
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '{}');
if (!fs.existsSync(HISTORY_FILE)) fs.writeFileSync(HISTORY_FILE, '{}');

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    let currentRoom = 'основной-чат';
    let currentUser = null;

    socket.on('authenticate', (data) => {
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        
        if (data.isRegister) {
            if (users[data.username]) {
                return socket.emit('auth_error', 'Ник уже занят!');
            }
            // Создаем расширенный профиль
            users[data.username] = { 
                password: data.password,
                color: '#00d2ff',
                status: 'Новичок в ULTRA PRO'
            };
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            currentUser = data.username;
            socket.emit('auth_success', { username: data.username, profile: users[data.username] });
        } else {
            const user = users[data.username];
            if (user && user.password === data.password) {
                currentUser = data.username;
                socket.emit('auth_success', { username: data.username, profile: user });
            } else {
                socket.emit('auth_error', 'Неверный логин или пароль');
            }
        }
    });

    socket.on('join_room', (room) => {
        socket.leave(currentRoom);
        socket.join(room);
        currentRoom = room;
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        socket.emit('load_history', history[room] || []);
    });

    socket.on('message', (data) => {
        if (!currentUser) return;
        const history = JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
        if (!history[currentRoom]) history[currentRoom] = [];
        
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        const userColor = users[currentUser]?.color || '#00d2ff';

        const msg = { 
            name: currentUser, 
            text: data.text, 
            color: userColor,
            time: new Date().toLocaleTimeString() 
        };
        
        history[currentRoom].push(msg);
        fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
        io.to(currentRoom).emit('message', msg);
    });

    socket.on('update_profile', (data) => {
        if (!currentUser) return;
        const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
        if (users[currentUser]) {
            users[currentUser].status = data.status || users[currentUser].status;
            users[currentUser].color = data.color || users[currentUser].color;
            fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
            socket.emit('profile_updated', users[currentUser]);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server is running on port ' + PORT));
