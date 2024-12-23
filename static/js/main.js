/*
* Variables
*/

let currentChatSocket = null;
let following_ids = null;
let current_conversation = null;
const contact_data = {};

const chatapp_main_wrapper = document.querySelector('.chatapp-main-wrapper');
const API_BASE_URL = `http://${window.location.host}/api/v1/`;
const ws_url_prefix = `ws://${window.location.host}/ws/`;


// hidden elements with necessary IDs
const account_user_id = document.getElementById('account_user').getAttribute('data');
// const conversation_id_script = document.getElementById('conversation');
const conversation_with_id_script = document.getElementById('conversation_with');

// general
const scroll_containers = document.querySelectorAll('.scroll-container');

// variables from messages section
const open_conversation_list = document.querySelector('.open-conversations-list');
const conversations = document.querySelectorAll('.conversation');

// variable from chat box section
const chatlog = document.querySelector('.chat-log');
const chat_box_container = document.querySelector('.chat-box-container');
const chat_box_content = document.querySelector('.chat-box-content');
const chat_box_landing = document.querySelector('.chat-box-landing');
const chat_other_username = document.getElementById('chat-box-username');
const chat_other_avatar = document.getElementById('chat-box-avatar');


/*
 * IIFE for initial websocket connection
 */

const ws_url = ws_url_prefix + 'chatapp/';
let reconnectInterval = 1000;
const maxInterval = 30000;


const reconnectWebSocket = (type, uid=null, callback=null) => {
    setTimeout(() => {
        if (type === 'chatapp') {
            chatAppWebSocket();
        } else if (type === 'chat') {
            openWebSocket(uid, callback);
        }
        reconnectInterval = Math.min(reconnectInterval * 2, maxInterval);
    }, reconnectInterval);
}


const chatAppWebSocket = () => {
    let socket = new WebSocket(ws_url);

    socket.onopen = function() {
        console.log("connection for chatapp established");
        reconnectInterval = 1000;
    }
    socket.onclose = function() {
        console.log("connection for chatapp disconnected");
        reconnectWebSocket('chatapp');
    }

    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        if (data.type === 'connection') {
            console.log(data.status);
        } else if (data.type === 'chat_notification') {
            console.log(data)
            const conversation = get_or_create_conversation(data);
            update_conversation_content(data, conversation);
            move_conversation_to_top(conversation);
        }
    }
};

chatAppWebSocket();


/*
* Functions
*/

async function get_token() {
    console.log(`=========fetching new token===========`);
    const url = API_BASE_URL + `token/`;
    try {
        const response = await fetch(url, {
            'method': 'GET',
            'credentials': 'same-origin',
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || "An error occurred!");
        }
        console.log(data);
        console.log(`=========token fetched===========`);

        return data;

    } catch (error) {
        console.error(error.message)
    }
}

function get_cookie(name) {
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

function scroll_to_bottom() {
    chatlog.scrollTop = chatlog.scrollHeight;
}

function move_conversation_to_top(conversation=null) {
    conversation = conversation || current_conversation;
    conversation.remove();
    open_conversation_list.insertBefore(conversation, open_conversation_list.firstElementChild.nextElementSibling);
}


function update_conversation_content(data, conversation) {
    if (conversation) {
        const unread_messages_count = conversation.querySelector('.unread-messages p');
        const unread_count = unread_messages_count ? parseInt(unread_messages_count.textContent) : 0;
        conversation.innerHTML = `
            <div class="conversation-avatar conversation-item">
                <img src="${data.from.profile.avatar}" alt="profile-avatar" class="avatar">
            </div>
            <div class="conversation-info conversation-item">
                <p class="conversation-with-name">${data.from.username}</p>
                <p>
                ${data.message.body.length > 20 ? data.message.body.slice(0, 21) : data.message.body}
                </p>
            </div>`
            if (conversation !== current_conversation) {
                conversation.innerHTML += `
                <div class="unread-messages active">
                    <p>${unread_count + 1}</p>
                </div>`
            } else {
                conversation.innerHTML += `
                <div class="unread-messages">
                    <p>0</p>
                </div>`
            }
    } else {
        if (current_conversation && !current_conversation.firstElementChild) {
            current_conversation.innerHTML = `
                <div class="conversation-avatar conversation-item">
                    <img src="${contact_data.avatar_url}" alt="profile-avatar" class="avatar">
                </div>
                <div class="conversation-info conversation-item">
                    <p class="conversation-with-name">${contact_data.username}</p>
                    <p>
                    ${data.message.body.length > 20 ? data.message.body.slice(0, 21) : data.message.body}
                    </p>
                </div>
                <div class="unread-messages">
                    <p>0</p>
                </div>`
        } else {
            const msg_p = current_conversation.querySelector('.conversation-info p:last-child');
            msg_p.textContent = data.message.body.length > 20 ? data.message.body.slice(0, 21) + '...' : data.message.body;
        }
    }
}

function get_or_create_conversation(data) {
    let _conversation = null;
    if (data) {
        _conversation = document.querySelector(`[data-convo-id="${data.message.conversation}"]`);
        console.log(_conversation);
    
        if (_conversation === null) {
            _conversation = document.createElement('div');
            _conversation.classList.add('conversation');
            _conversation.setAttribute('data-convo-id', data.message.conversation);
            _conversation.setAttribute('data-convo-with', data.from.id);
            _conversation.addEventListener('click', () => {
                load_chat_box(_conversation);
            });
        }
    } else {
        _conversation = document.querySelector(`[data-convo-id="${contact_data.contact_convo_id}"]`);
            
        console.log(_conversation);
    
        if (_conversation === null) {
            console.log("CONTACT_DATA", contact_data);
            _conversation = document.createElement('div');
            _conversation.classList.add('conversation');
            _conversation.setAttribute('data-convo-id', contact_data.contact_convo_id);
            _conversation.setAttribute('data-convo-with', contact_data.contact_id);
            _conversation.addEventListener('click', () => {
                load_chat_box(_conversation);
            });
        }
    }
    
    return _conversation;
}

function extract_messages_html(message) {
    const chat_message_div = document.createElement('div');
    const user2_id = conversation_with_id_script.getAttribute('data');

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
    let response = null;
    try {
        response = await fetch(url, {
            'credentials': 'same-origin'
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || `An error occurred`);
        }
        console.log(data);
        chatlog.textContent = '';
        chat_other_avatar.innerHTML = `
            <img src="${data.conversation.conversation_with.profile.avatar}" class="avatar"/>`
        chat_other_username.textContent = data.conversation.conversation_with.profile.full_name || 
                                          data.conversation.conversation_with.username;
        for (let msg of data.messages) {
            message = extract_messages_html(msg);
            chatlog.prepend(message);
        }
        scroll_to_bottom();

    } catch (error) {
        console.error(`API Error: ${error.message}`)
        if (!response.ok) {
            await get_token();
            fetch_conversation_history(conversation_id);
        }
    }
}

function openWebSocket(uid, callback) {
    const url = ws_url_prefix + `chat/${uid}/`
    currentChatSocket = new WebSocket(url);
    
    currentChatSocket.onopen = function(e) {
        console.log("connection established");
        reconnectInterval = 1000;
    }

    currentChatSocket.onclose = function (e) {
        console.log("connection lost");
        reconnectWebSocket('chat', uid, callback);
    }
    
    currentChatSocket.onmessage = function (e) {
        data = JSON.parse(e.data);
        if (data.type === 'connection') {
            contact_data.contact_convo_id = data.conversation_id;
            current_conversation = get_or_create_conversation();
            console.log(data.status);
            if (callback) callback(data.conversation_id);
        } else if (data.type === 'chat_message') {
            user_message_input.value = '';

            const new_message_div = document.createElement('div');
            const user2_id = conversation_with_id_script.getAttribute("data");
            let html = ''
            if (user2_id === data.message.sender) {
                new_message_div.classList.add('chat-message', 'received');
                html = `
                <p>${data.message.body}</p>
                <img src="/static/images/icons/options.png" alt="options-icon" class="options chat-log-options">
                <span>${data.message.created_at}</span>`
            } else {
                new_message_div.classList.add('chat-message', 'sent');
                html = `
                <img src="/static/images/icons/options.png" alt="options-icon" class="options chat-log-options">
                <p>${data.message.body}</p>
                <span>${data.message.created_at}</span>`
            }
            
            // add new message to chat box
            new_message_div.innerHTML = html;
            chatlog.append(new_message_div);
            scroll_to_bottom();

            // update conversations list 
            update_conversation_content(data=data);
            move_conversation_to_top();
            
        }
    }

}

function load_chat_box(conversation) {
    console.log(conversation)
    const unread_messages_div = conversation.querySelector('.unread-messages');
    unread_messages_div.innerHTML = `<p>0</p>`;
    unread_messages_div.classList.remove('active');
    const uid = conversation.getAttribute('data-convo-with');
    const conversation_id = conversation.getAttribute('data-convo-id');
    conversation_with_id_script.setAttribute('data', uid);
    chat_box_container.style.padding = '0';
    chat_box_landing.style.display = 'none';
    chat_box_content.style.display = 'grid';
    
    // close chat socket if one is already open 
    if (currentChatSocket && currentChatSocket.readyState === WebSocket.OPEN) {
        console.log("Closing exisiting WebSocket connection");
        currentChatSocket.close();
    }
    openWebSocket(uid, (conversation_id) => {
        fetch_conversation_history(conversation_id);
    });
}


/*
* Event Listeners
*/

scroll_containers.forEach(scroll_container => {
    scroll_container.addEventListener('scroll', () => {
        scroll_container.classList.add('scrolling');
        
        clearTimeout(scroll_container.scrollTimeout);
        scroll_container.scrollTimeout = setTimeout(() => {
            scroll_container.classList.remove('scrolling')}, 500);
    });
});

conversations.forEach(conversation => {
    conversation.addEventListener('click', () => {
        load_chat_box(conversation); 
    })
})
