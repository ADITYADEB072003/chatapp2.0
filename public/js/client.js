const socket = io();
let messageArea = document.querySelector('.message_area');
let textarea = document.querySelector("#text");

let name = localStorage.getItem('username');
if (!name) {
    name = prompt("Enter your name");
    localStorage.setItem('username', name);
}

textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        sendMessage(e.target.value);
    }
});

function sendMessage(msg1) {
    let msg = {
        user: name,
        message: msg1,
    };
    appendMessage(msg, 'outgoing');
    textarea.value = '';
    scrollTobottom();
    socket.emit('message', msg);
}

function appendMessage(msg, type) {
    let maindiv = document.createElement('div');
    let classname = type;
    maindiv.classList.add(classname, 'message');
    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `;
    maindiv.innerHTML = markup;
    messageArea.appendChild(maindiv);
}

socket.on('message', (msg) => {
    appendMessage(msg, 'incoming');
    scrollTobottom();
});

function scrollTobottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}

function logout() {
    localStorage.removeItem('username');
    window.location.href = '/logout';
}
