const scrollContainers = document.querySelectorAll('.scroll-container');
    
scrollContainers.forEach(scrollContainer => {
    scrollContainer.addEventListener('scroll', () => {
        scrollContainer.classList.add('scrolling');
        
        clearTimeout(scrollContainer.scrollTimeout);
        scrollContainer.scrollTimeout = setTimeout(() => {
            scrollContainer.classList.remove('scrolling')}, 500);
    });
});


// const startConvo = document.querySelector('.start-new-convo');
// const userSearch = document.querySelector('.user-search');

// startConvo.addEventListener('click', () => {
//     userSearch.style.display = ' block';
// });

const contactNav = document.getElementById('contact-nav');
const sections = document.querySelectorAll('.section');


contactNav.addEventListener('click', () => {
    const contactSection = document.querySelector('.contacts-section');
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    contactNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    contactSection.style.display = '';
})



/*
* Variables
*/
let currentChatSocket = null;
const API_BASE_URL = `http://${window.location.host}/api/v1/`;
const contacts = document.querySelectorAll('.contact-name');
const ws_url_prefix = `ws://${window.location.host}/ws/chat/`;
const chat_other_username = document.getElementById('chat-box-username');
const chatlog = document.querySelector('.chat-log');
const chat_submit_button = document.querySelector('.chat-box-input button');
const user_message_input = document.getElementById('user-message-input');
// const chat_container = document.getElementById('chat-box-container');

// hidden elements with necessary IDs
const conversation_with = document.getElementById('conversation_with');
const conversation = document.getElementById('conversation');



/*
* Functions
*/

function extract_messages_html(message) {
    const chat_message_div = document.createElement('div');
    const user2_id = conversation_with.getAttribute('data');

    chat_message_div.classList.add('chat-message');
    let html = ``;
    if (message.sender === user2_id) {
        chat_message_div.classList.add('received');
        html = `
        <p>${message.body}</p>
        <img src="/static/images/icons/options.png" alt="options-icon" class="options chat-log-options">
        <span>${message.created_at}</span>`;
    } else {
        chat_message_div.classList.add('sent')
        html = `
        <img src="/static/images/icons/options.png" alt="options-icon" class="options chat-log-options">
        <p>${message.body}</p>
        <span>${message.created_at}</span>`;
    }
    chat_message_div.innerHTML = html;

    return chat_message_div;
}


async function fetch_conversation_history(conversation_id) {
    const url = API_BASE_URL + `conversations/${conversation_id}/`;
    await fetch(url)
    .then(response => response.json())
    .then(data => {
        chatlog.textContent = '';
        console.log(data);
        chat_other_username.textContent = data.conversation.conversation_with.username;
        for (let msg of data.messages) {
            message = extract_messages_html(msg);
            chatlog.prepend(message);
        }
    })
    .catch(error => {
        console.log(`{${error}}`)
    })
}



function openWebSocket(uid, callback) {
    if (currentChatSocket) {
        currentChatSocket.close();
    }
    const url = ws_url_prefix + `${uid}/`
    currentChatSocket = new WebSocket(url);
    
    currentChatSocket.onopen = function(e) {
        console.log("connection established");
    }

    currentChatSocket.onclose = function (e) {
        console.log("connection lost");
    }
    
    currentChatSocket.onmessage = function (e) {
        data = JSON.parse(e.data);
        if (data.type === 'connection') {
            conversation.setAttribute('data', data.conversation_id)
            if (callback) callback(data.conversation_id);
        } else if (data.type === 'chat_message') {
            const new_message_div = document.createElement('div');
            const user2_id = conversation_with.getAttribute("data");
            let html = ''
            if (user2_id === data.sender) {
                new_message_div.classList.add('chat-message', 'received');
                html = `
                <p>${data.message}</p>
                <img src="/static/images/icons/options.png" alt="options-icon" class="options chat-log-options">
                <span>${data.created_at}</span>`
            } else {
                new_message_div.classList.add('chat-message', 'sent');
                html = `
                <img src="/static/images/icons/options.png" alt="options-icon" class="options chat-log-options">
                <p>${data.message}</p>
                <span>${data.created_at}</span>`
            }
            
            new_message_div.innerHTML = html;
            chatlog.append(new_message_div);
        }
    }

}

function send_message() {
    if (currentChatSocket) {   
        currentChatSocket.send(JSON.stringify({
            'type': 'chat_message',
            'body': user_message_input.value,
        }))
        user_message_input.value = '';
    }

}

/*
* Event Listeners
*/
contacts.forEach(contact => {
    contact.addEventListener('click', () => {
        uid = contact.getAttribute('user_id');
        conversation_with.setAttribute('data', uid)

        openWebSocket(uid, (conversation_id) => {
            fetch_conversation_history(conversation_id);
        });

    });
})

chat_submit_button.onclick = function (e) {
    send_message();
}

user_message_input.onkeyup = function (e) {
    if (e.keyCode === 13) {
        send_message();
    }
}
