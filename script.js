// Умное подключение: само определяет IP сервера
const socket = io(); 

const messageForm = document.getElementById('chat-form');
const messageInput = document.getElementById('msg-input');
const messageContainer = document.getElementById('messages');
// Создаем индикатор "печатает" программно, если его нет в HTML
let typingIndicator = document.getElementById('typing-indicator');

function joinChat() {
    const nameInput = document.getElementById('username-input');
    const name = nameInput.value.trim();
    
    if (name !== "") {
        window.userName = name;
        document.getElementById('my-name').innerText = name;
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
        
        socket.emit('user_joined', name);
        socket.emit('request_history');
    }
}

function renderMessage(data) {
    if (!data.name || !data.text) return; // Защита от пустых данных

    const item = document.createElement('div');
    const isMine = data.name === window.userName;
    
    item.className = `message ${isMine ? 'outgoing' : 'incoming'}`;
    item.innerHTML = `
        <div class="bubble" data-sender="${data.name}">
            ${data.text}
            <span class="time">${data.time || ''}</span>
        </div>
    `;
    
    messageContainer.appendChild(item);
    messageContainer.scrollTo({ top: messageContainer.scrollHeight, behavior: 'smooth' });
}

// Слушаем историю
socket.on('load_history', (history) => {
    messageContainer.innerHTML = ''; 
    if (Array.isArray(history)) {
        history.forEach(msg => renderMessage(msg));
    }
});

// Новое сообщение
socket.on('message', (data) => {
    renderMessage(data);
});

// Печатает...
messageInput.addEventListener('input', () => {
    socket.emit('typing', window.userName);
});

let typingTimeout;
socket.on('display_typing', (name) => {
    if (typingIndicator) {
        typingIndicator.innerText = `${name} печатает...`;
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => { typingIndicator.innerText = ''; }, 2000);
    }
});

// Отправка
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (text) {
        socket.emit('message', {
            name: window.userName,
            text: text
        });
        messageInput.value = '';
    }
});