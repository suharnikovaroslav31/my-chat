// Важно: форсируем использование Websocket для стабильности на Render
const socket = io({ transports: ['websocket'] }); 

const messageForm = document.getElementById('chat-form');
const messageInput = document.getElementById('msg-input');
const messageContainer = document.getElementById('messages');
const fileInput = document.getElementById('file-input');

function joinChat() {
    const name = document.getElementById('username-input').value.trim();
    if (name) {
        window.userName = name;
        document.getElementById('my-name').innerText = name;
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
    }
}

function renderMessage(data) {
    if (!data.name || !data.text) return;
    
    const isMine = data.name === window.userName;
    const item = document.createElement('div');
    item.className = `message ${isMine ? 'outgoing' : 'incoming'}`;

    let content = data.type === 'image' 
        ? `<img src="${data.text}" style="max-width:250px; border-radius:10px;">` 
        : `<div>${data.text}</div>`;

    item.innerHTML = `
        <div class="bubble" data-sender="${data.name}">
            ${content}
            <span class="time">${data.time || ''}</span>
        </div>
    `;
    messageContainer.appendChild(item);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

// Слушаем сервер
socket.on('message', (data) => renderMessage(data));

socket.on('load_history', (history) => {
    messageContainer.innerHTML = '';
    history.forEach(msg => renderMessage(msg));
});

// Отправка текста
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (messageInput.value.trim() && window.userName) {
        socket.emit('message', { 
            name: window.userName, 
            text: messageInput.value, 
            type: 'text' 
        });
        messageInput.value = '';
    }
});

// Отправка фото
fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file && window.userName) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('message', { 
                name: window.userName, 
                text: e.target.result, 
                type: 'image' 
            });
        };
        reader.readAsDataURL(file);
    }
});
