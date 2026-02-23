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

    let content = '';
    if (data.type === 'image') {
        content = `<img src="${data.text}" style="max-width:100%; border-radius:15px; margin-top:5px;">`;
    } else if (data.type === 'video') {
        content = `<video src="${data.text}" controls style="max-width:100%; border-radius:15px; margin-top:5px;"></video>`;
    } else {
        content = `<div style="word-break: break-all;">${data.text}</div>`;
    }

    item.innerHTML = `
        <div class="bubble">
            <div style="font-size: 0.75em; opacity: 0.6; margin-bottom: 4px;">${data.name}</div>
            ${content}
            <div style="font-size: 0.65em; text-align: right; opacity: 0.5; margin-top: 4px;">${data.time}</div>
        </div>
    `;
    messageContainer.appendChild(item);
    messageContainer.scrollTop = messageContainer.scrollHeight;
}

socket.on('message', (data) => renderMessage(data));
socket.on('load_history', (history) => {
    messageContainer.innerHTML = '';
    history.forEach(msg => renderMessage(msg));
});

messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (messageInput.value.trim() && window.userName) {
        socket.emit('message', { name: window.userName, text: messageInput.value, type: 'text' });
        messageInput.value = '';
    }
});

fileInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file && window.userName) {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('message', { name: window.userName, text: e.target.result, type: type });
        };
        reader.readAsDataURL(file);
    }
});
