const socket = io({ transports: ['websocket'] });
let isReg = false;

function toggleAuth() {
    isReg = !isReg;
    document.getElementById('auth-title').innerText = isReg ? 'РЕГИСТРАЦИЯ' : 'ВХОД';
    document.getElementById('auth-btn').innerText = isReg ? 'СОЗДАТЬ АККАУНТ' : 'ВОЙТИ В СИСТЕМУ';
}

function handleAuth() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if (u && p) socket.emit('authenticate', { username: u, password: p, isRegister: isReg });
}

socket.on('auth_error', msg => document.getElementById('error-msg').innerText = msg);

socket.on('auth_success', data => {
    window.userName = data.username;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    document.getElementById('my-name-display').innerText = data.username;
    socket.emit('user_join', data.username);
    socket.emit('get_history');
});

socket.on('update_users', list => {
    const div = document.getElementById('online-list');
    div.innerHTML = list.map(u => `<div>${u}</div>`).join('');
});

function renderMsg(data) {
    const isMine = data.name === window.userName;
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'outgoing' : 'incoming'}`;
    
    let html = `<span>${data.text}</span>`;
    if (data.type === 'image') html = `<img src="${data.text}" style="width:100%; border-radius:8px;">`;
    if (data.type === 'video') html = `<video src="${data.text}" controls style="width:100%; border-radius:8px;"></video>`;

    div.innerHTML = `<div class="bubble"><small style="color:var(--primary); font-weight:800">${data.name}</small><br>${html}<div style="text-align:right; font-size:9px; opacity:0.3; margin-top:5px;">${data.time}</div></div>`;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

socket.on('message', renderMsg);
socket.on('load_history', h => h.forEach(renderMsg));

document.getElementById('chat-form').onsubmit = (e) => {
    e.preventDefault();
    const i = document.getElementById('msg-input');
    if (i.value.trim()) {
        socket.emit('message', { name: window.userName, text: i.value, type: 'text' });
        i.value = '';
    }
};

document.getElementById('file-input').onchange = function() {
    const file = this.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
        socket.emit('message', { name: window.userName, text: e.target.result, type: file.type.startsWith('video') ? 'video' : 'image' });
    };
    reader.readAsDataURL(file);
};
