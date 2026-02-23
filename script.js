const socket = io({ transports: ['websocket'] });
let isReg = false;

function toggleAuth() {
    isReg = !isReg;
    document.getElementById('auth-title').innerText = isReg ? 'РЕГИСТРАЦИЯ' : 'ВХОД';
    document.getElementById('auth-btn').innerText = isReg ? 'СОЗДАТЬ' : 'ВОЙТИ';
}

function handleAuth() {
    const u = document.getElementById('username').value.trim();
    const p = document.getElementById('password').value.trim();
    if (u && p) socket.emit('authenticate', { username: u, password: p, isRegister: isReg });
}

socket.on('auth_error', m => document.getElementById('error-msg').innerText = m);

socket.on('auth_success', d => {
    window.userName = d.username;
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'flex';
    document.getElementById('my-name-display').innerText = d.username;
    socket.emit('user_join', d.username);
    socket.emit('get_history');
});

function renderMsg(data) {
    const isMine = data.name === window.userName;
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'outgoing' : 'incoming'}`;
    
    let content = `<span>${data.text}</span>`;
    if (data.type === 'image') {
        content = `<img src="${data.text}" style="width:100%; border-radius:10px;">`;
        const thumb = document.createElement('img');
        thumb.src = data.text;
        document.getElementById('media-gallery').prepend(thumb);
    }
    if (data.type === 'video') content = `<video src="${data.text}" controls style="width:100%; border-radius:10px;"></video>`;

    div.innerHTML = `<div class="bubble"><small style="color:#00d2ff; font-weight:800">${data.name}</small><br>${content}<div style="text-align:right; font-size:9px; opacity:0.3; margin-top:5px;">${data.time}</div></div>`;
    document.getElementById('messages').appendChild(div);
    document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

socket.on('message', renderMsg);
socket.on('load_history', h => h.forEach(renderMsg));
socket.on('update_users', l => document.getElementById('online-list').innerHTML = l.map(u => `<div style="padding:5px 15px; font-size:14px;">● ${u}</div>`).join(''));

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
    reader.onload = (e) => socket.emit('message', { name: window.userName, text: e.target.result, type: file.type.startsWith('video') ? 'video' : 'image' });
    reader.readAsDataURL(file);
};
