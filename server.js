const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// База сообщений в оперативной памяти
let messages = [];

// Главная страница (чтобы не было "Cannot GET /")
app.get('/', (req, res) => {
    res.send('Speeky Server is Active!');
});

// Получение сообщений
app.get('/messages', (req, res) => {
    res.json(messages);
});

// Прием новых сообщений
app.post('/messages', (req, res) => {
    const msg = req.body;
    if(msg.text && msg.nick) {
        messages.push(msg);
        // Храним последние 50, чтобы сервер не тормозил
        if(messages.length > 50) messages.shift();
        res.status(201).json({status: "ok"});
    } else {
        res.status(400).json({status: "error"});
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер пашет на порту ${PORT}`);
});
