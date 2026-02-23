const socket = io({ transports: ['websocket'] });

function joinChat() {
    const name = document.getElementById('username-input').value.trim();
    if (name) {
        window.userName = name;
        document.getElementById('my-name').innerText = name;
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
    }
}

// Отслеживание печати
let typingTimeout;
document.getElementById('msg-input').addEventListener('input', () => {
    socket.emit('typing', { name: window.userName });
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('stop_typing'), 2000);
});

socket.on('display_typing', (data) => {
    document.getElementById('typing-indicator').innerText = `${data.name} печатает...`;
});

socket.on('hide_typing', () => {
    document.getElementById('typing-indicator').innerText = '';
});

function renderMessage(data) {
    if (!data.name || !data.text) return;
    const isMine = data.name === window.userName;
    const container = document.getElementById('messages');
    
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'outgoing' : 'incoming'}`;

    let mediaHtml = '';
    if (data.type === 'image' || data.type === 'video') {
        const tag = data.type === 'image' ? 'img' : 'video';
        mediaHtml = `<${tag} src="${data.text}" ${data.type==='video'?'controls':''} style="width:100%; border-radius:10px; margin-top:5px;"></${tag}>`;
        
        // Добавляем в галерею справа, если это картинка
        if (data.type === 'image') {
            const thumb = document.createElement('img');
            thumb.src = data.text;
            document.getElementById('media-gallery').prepend(thumb);
        }
    }

    div.innerHTML = `
        <div class="bubble">
            <small style="color:var(--accent); font-weight:bold;">${data.name}</small>
            ${mediaHtml || `<div style="margin-top:4px;">${data.text}</div>`}
            <div style="text-align:right; font-size:9px; opacity:0.4; margin-top:4px;">${data.time}</div>
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

socket.on('message', data => renderMessage(data));
socket.on('load_history', history => {
    document.getElementById('messages').innerHTML = '';
    history.forEach(m => renderMessage(m));
});

document.getElementById('chat-form').onsubmit = (e) => {
    e.preventDefault();
    const input = document.getElementById('msg-input');
    if (input.value.trim()) {
        socket.emit('message', { name: window.userName, text: input.value, type: 'text' });
        input.value = '';
        socket.emit('stop_typing');
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
