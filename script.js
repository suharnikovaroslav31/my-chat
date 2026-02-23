const socket = io({ transports: ['websocket'] });
let isRegisterMode = false;

function toggleAuth() {
    isRegisterMode = !isRegisterMode;
    document.getElementById('auth-title').innerText = isRegisterMode ? 'РЕГИСТРАЦИЯ' : 'ВХОД';
    document.getElementById('auth-btn').innerText = isRegisterMode ? 'СОЗДАТЬ' : 'ВОЙТИ';
    document.querySelector('.toggle-text').innerText = isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться';
}

function handleAuth() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    if (username && password) {
        socket.emit('authenticate', { username, password, isRegister: isRegisterMode });
    }
}

socket.on('auth_error', (msg) => {
    document.getElementById('error-msg').innerText = msg;
});

socket.on('auth_success', (data) => {
    window.userName = data.username;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    document.getElementById('user-display').innerText = '👤 ' + data.username;
    socket.emit('get_history');
});

function renderMessage(data) {
    const isMine = data.name === window.userName;
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'outgoing' : 'incoming'}`;
    
    let content = `<span>${data.text}</span>`;
    if (data.type === 'image') content = `<img src="${data.text}" style="width:100%; border-radius:10px;">`;
    if (data.type === 'video') content = `<video src="${data.text}" controls style="width:100%; border-radius:10px;"></video>`;

    div.innerHTML = `<div class="bubble"><small style="color:var(--accent); font-weight:bold;">${data.name}</small><br>${content}<div style="text-align:right; font-size:9px; opacity:0.3;">${data.time}</div></div>`;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

socket.on('message', renderMessage);
socket.on('load_history', h => h.forEach(renderMessage));

document.getElementById('chat-form').onsubmit = (e) => {
    e.preventDefault();
    const input = document.getElementById('msg-input');
    if (input.value.trim()) {
        socket.emit('message', { name: window.userName, text: input.value, type: 'text' });
        input.value = '';
    }
};

document.getElementById('file-input').onchange = function() {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        const type = file.type.startsWith('video') ? 'video' : 'image';
        socket.emit('message', { name: window.userName, text: e.target.result, type: type });
    };
    reader.readAsDataURL(file);
};
