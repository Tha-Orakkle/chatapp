/*
* Variables
*/

let currentChatSocket = null;
let following_ids = null;
let current_conversation = null;

const chatapp_main_wrapper = document.querySelector('.chatapp-main-wrapper');
const API_BASE_URL = `http://${window.location.host}/api/v1/`;
const ws_url_prefix = `ws://${window.location.host}/ws/`;

// hidden elements with necessary IDs
const account_user_id = document.getElementById('account_user').getAttribute('data');
const conversation = document.getElementById('conversation');
const conversation_with = document.getElementById('conversation_with');

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

(function () {
  const ws_url = ws_url_prefix + 'chatapp/';
  const socket = new WebSocket(ws_url);
  socket.onopen = function() {
    console.log(`connection for chatapp established`);
  }
  socket.onclose = function() {
    console.log("connection for chatapp established");
  }

  socket.onmessage = function(e) {
    const data = JSON.parse(e.data);
    if (data.type === 'connection') {
      console.log(data.status);
    }
  }
})();









/*
* Functions
*/

function scroll_to_bottom() {
    chatlog.scrollTop = chatlog.scrollHeight;
}

function move_conversation_to_top() {
    current_conversation.remove();
    open_conversation_list.insertBefore(current_conversation, open_conversation_list.firstElementChild.nextElementSibling);
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

function openWebSocket(uid, callback) {
    if (currentChatSocket) {
        currentChatSocket.close();
    }
    const url = ws_url_prefix + `chat/${uid}/`
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
            user_message_input.value = '';

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
        current_conversation = conversation;
        const uid = conversation.getAttribute('data-convo-with');
        const conversation_id = conversation.getAttribute('data-convo-id');
        conversation_with.setAttribute('data', uid);
        chat_box_container.style.padding = '0';
        chat_box_landing.style.display = 'none';
        chat_box_content.style.display = 'grid';
        openWebSocket(uid, (conversation_id) => {
            fetch_conversation_history(conversation_id);
        });
    })
})
