const express = require('express');
const cors = require('cors');
const path = require('path'); // Добавили это
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Эта строчка заставит сервер видеть твой index.html

let messages = [];

// Теперь по главной ссылке будет открываться твой index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/messages', (req, res) => {
    res.json(messages);
});

app.post('/messages', (req, res) => {
    messages.push(req.body);
    if(messages.length > 50) messages.shift();
    res.status(201).json({status: "ok"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running!`));
