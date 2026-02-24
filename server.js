const express = require('express');
const cors = require('cors'); // РАЗРЕШАЕТ ПЕРЕСЫЛКУ МЕЖДУ ЛЮДЬМИ
const app = express();

app.use(cors());
app.use(express.json());

let messages = [];

// Отдаем сообщения всем
app.get('/messages', (req, res) => {
    res.json(messages);
});

// Принимаем сообщения
app.post('/messages', (req, res) => {
    messages.push(req.body);
    if(messages.length > 50) messages.shift(); // Чтобы сервер не лопнул
    res.json({status: "ok"});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
