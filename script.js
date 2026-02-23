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

function renderMessage(data) {
    if (!data.name || !data.text) return;
    const isMine = data.name === window.userName;
    const container = document.getElementById('messages');
    
    const div = document.createElement('div');
    div.className = `message ${isMine ? 'outgoing' : 'incoming'}`;

    let media = '';
    if (data.type === 'image') media = `<img src="${data.text}" style="width:100%; border-radius:10px; margin:5px 0;">`;
    if (data.type === 'video') media = `<video src="${data.text}" controls style="width:100%; border-radius:10px; margin:5px 0;"></video>`;

    div.innerHTML = `
        <div class="bubble">
            <small style="color:var(--accent); display:block; margin-bottom:5px;">${data.name}</small>
            ${media || `<span>${data.text}</span>`}
            <div style="text-align:right; font-size:10px; opacity:0.5; margin-top:5px;">${data.time}</div>
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
