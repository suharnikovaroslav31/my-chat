const socket = io({ transports: ['websocket'] });
let isRegisterMode = false;

function toggleAuth() {
    isRegisterMode = !isRegisterMode;
    const title = document.getElementById('auth-title');
    const btn = document.getElementById('auth-btn');
    const toggleText = document.querySelector('.auth-toggle');

    if (isRegisterMode) {
        title.innerHTML = 'РЕГИСТРАЦИЯ';
        btn.innerHTML = 'СОЗДАТЬ АККАУНТ';
        btn.style.background = '#00ff88'; // Зеленый для регистрации
        toggleText.innerHTML = 'Уже есть аккаунт? Войти';
    } else {
        title.innerHTML = 'ВХОД';
        btn.innerHTML = 'ВОЙТИ';
        btn.style.background = '#00d2ff'; // Синий для входа
        toggleText.innerHTML = 'Нет аккаунта? Создать';
    }
}

function handleAuth() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    const errorDiv = document.getElementById('error-msg');

    if (!u || !p) {
        errorDiv.innerText = 'Заполните все поля!';
        return;
    }

    // Отправляем на сервер флаг isRegister
    socket.emit('authenticate', { 
        username: u, 
        password: p, 
        isRegister: isRegisterMode 
    });
}

socket.on('auth_error', (msg) => {
    document.getElementById('error-msg').innerText = msg;
});

socket.on('auth_success', (data) => {
    window.userName = data.username;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    socket.emit('user_join', data.username);
    socket.emit('get_history');
});

// Рендер сообщений и онлайн-списка
socket.on('message', renderMsg);
socket.on('load_history', h => {
    document.getElementById('messages').innerHTML = '';
    h.forEach(renderMsg);
});

function renderMsg(data) {
    const container = document.getElementById('messages');
    const isMine = data.name === window.userName;
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'outgoing' : 'incoming'}`;
    div.innerHTML = `
        <div class="bubble">
            <small style="color:var(--accent); font-weight:800">${data.name}</small><br>
            <span>${data.text}</span>
            <div style="text-align:right; font-size:9px; opacity:0.3; margin-top:5px;">${data.time}</div>
        </div>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

document.getElementById('chat-form').onsubmit = (e) => {
    e.preventDefault();
    const input = document.getElementById('msg-input');
    if (input.value.trim()) {
        socket.emit('message', { name: window.userName, text: input.value, type: 'text' });
        input.value = '';
    }
};
