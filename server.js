const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

const PORT = process.env.PORT || 3000;

// Указываем серверу, где лежат файлы (чтобы не было ошибки как на скрине 97)
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// "Настоящая" база данных в памяти сервера
let usersBase = {}; 

io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    // Рассылаем реальный онлайн сразу всем
    io.emit('update_online', io.engine.clientsCount);

    socket.on('authenticate', (data) => {
        // Создаем "настоящий" профиль
        usersBase[socket.id] = {
            username: data.username,
            regDate: new Date().toLocaleDateString(),
            id: socket.id.substring(0, 8), // Короткий ID как в ТГ
            bio: "Космический странник"
        };
        
        console.log(`Пользователь ${data.username} зарегистрирован.`);
        socket.emit('auth_success', usersBase[socket.id]);
        
        // Обновляем список участников для всех
        io.emit('update_online', io.engine.clientsCount);
    });

    socket.on('message', (data) => {
        const user = usersBase[socket.id];
        if (user) {
            io.emit('message', { 
                name: user.username, 
                text: data.text,
                time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            });
        }
    });

    socket.on('disconnect', () => {
        delete usersBase[socket.id];
        io.emit('update_online', io.engine.clientsCount);
        console.log('Пользователь ушел');
    });
});

http.listen(PORT, () => {
    console.log(`Сервер ULTRA CORE запущен на порту ${PORT}`);
});
