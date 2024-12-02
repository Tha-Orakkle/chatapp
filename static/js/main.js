const scrollContainers = document.querySelectorAll('.scroll-container');
    
scrollContainers.forEach(scrollContainer => {
    scrollContainer.addEventListener('scroll', () => {
        scrollContainer.classList.add('scrolling');
        
        clearTimeout(scrollContainer.scrollTimeout);
        scrollContainer.scrollTimeout = setTimeout(() => {
            scrollContainer.classList.remove('scrolling')}, 500);
    });
});


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

// hidden elements with necessary IDs
const conversation = document.getElementById('conversation');
const conversation_with = document.getElementById('conversation_with');



/*
* Functions
*/

function scroll_to_bottom() {
    chatlog.scrollTop = chatlog.scrollHeight;
}

function getCookie(name) {
    let cookie_value = null;
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [n, v] = cookie.split('=');
        if (n === name) {
            cookie_value = decodeURIComponent(v.trim());
        }
    }
    return cookie_value;
}


async function get_token() {
    console.log(`=========fetching new token===========`)
    const url = API_BASE_URL + `token/`;
    try {
        const response = await fetch(url, {
            'method': 'GET',
            'credentials': 'same-origin',
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "An error occurred!")
        }
        console.log(`=========token fetched===========`)

        return data;

    } catch (error) {
        console.error(error.message)
    }
}

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
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || `An error occurred`);
        }
        console.log(data);
        chatlog.textContent = '';
        chat_other_username.textContent = data.conversation.conversation_with.username;
        for (let msg of data.messages) {
            message = extract_messages_html(msg);
            chatlog.prepend(message);
        }
        scroll_to_bottom();

    } catch (error) {
        console.error(`API Error: ${error.message}`)
        await get_token();
        console.log("==========re-initiating API request============")
        fetch_conversation_history(conversation_id);
    }
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
            scroll_to_bottom();

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
    if (user_message_input.value !== '') send_message();
}

user_message_input.onkeyup = function (e) {
    if (e.keyCode === 13) {
        if (user_message_input.value !== '') send_message();
    }
}
