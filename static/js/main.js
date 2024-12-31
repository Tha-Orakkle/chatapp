/*
* Variables
*/

let currentChatSocket = null;
let following_ids = null;
let current_conversation = null;
let contact_data = {};
let profile_data = {};
let is_expected_close = false;
let from_popup_button = false;




const chatapp_main_wrapper = document.querySelector('.chatapp-main-wrapper');
const API_BASE_URL = `http://${window.location.host}/api/v1/`;
const ws_url_prefix = `ws://${window.location.host}/ws/`;


// hidden elements with necessary IDs
const account_user_id = document.getElementById('account_user').getAttribute('data');

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
const chat_box_top_username = document.getElementById('chat-box-username');
const chat_box_top_avatar = document.getElementById('chat-box-avatar');


/*
 * CREATES WEBSOCKET THAT LISTENS FOR NOTIFICATIONS
 */

const ws_url = ws_url_prefix + 'chatapp/';
let reconnectInterval = 1000;
const maxInterval = 30000;

// reconnects web sockets when they close
const reconnectWebSocket = (type) => {
    setTimeout(() => {
        if (type === 'chatapp') {
            chatAppWebSocket();
        } else if (type === 'chat') {
            openWebSocket(contact_data.id, (conversation_id) => {
                fetch_conversation_history(conversation_id);
            });
        }
        reconnectInterval = Math.min(reconnectInterval * 2, maxInterval);
    }, reconnectInterval);
}

// opens websocket for the chatapp general - notifications etc
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

// get new token for API authentication
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
        console.log(`=========token fetched===========`);

        return data;

    } catch (error) {
        console.error(error.message)
    }
}

// gets cookie esp csrftoken
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

// scroll chat box to the bottom after each message
function scroll_to_bottom() {
    chatlog.scrollTop = chatlog.scrollHeight;
}

// moves a conversation to the top of the conversations list
function move_conversation_to_top(conversation=null) {
    conversation = conversation || current_conversation;
    conversation.remove();
    open_conversation_list.insertBefore(conversation, open_conversation_list.firstElementChild);
}

// updates the conversation content esp the last messages displayed
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
            conversation.innerHTML += `
            <img src="static/images/icons/options.png" alt="options-icon" class="options">
            <div class="options-dialog">
                <button class="od-profile">Profile</button>
                <button class="od-delete">Delete Conversation</button>
            </div>
            `
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
                </div>
                <img src="static/images/icons/options.png" alt="options-icon" class="options">
                <div class="options-dialog">
                <button class="od-profile">Profile</button>
                <button class="od-delete">Delete Conversation</button>
                </div>
                `
        } else {
            const msg_p = current_conversation.querySelector('.conversation-info p:last-child');
            msg_p.textContent = data.message.body.length > 20 ? data.message.body.slice(0, 21) + '...' : data.message.body;
        }
    }

}

// get or create conversation to move or add to the conversations list (messages)
function get_or_create_conversation(data=null) {
    let _conversation = null;
    if (data) {
        _conversation = document.querySelector(`[data-convo-id="${data.message.conversation}"]`);
        if (_conversation === null) {
            _conversation = document.createElement('div');
            _conversation.classList.add('conversation');
            _conversation.setAttribute('data-convo-id', data.message.conversation);
            _conversation.setAttribute('data-user-id', data.from.id);
            _conversation.addEventListener('click', (e) => {
                if (!e.target.classList.contains('options') && !e.target.closest('.options-dialog')) {
                    load_chat_box(_conversation);
                }
            });
        }
    } else {
        _conversation = document.querySelector(`[data-convo-id="${contact_data.convo_id}"]`);
            
    
        if (_conversation === null) {
            _conversation = document.createElement('div');
            _conversation.classList.add('conversation');
            _conversation.setAttribute('data-convo-id', contact_data.convo_id);
            _conversation.setAttribute('data-user-id', contact_data.id);
            _conversation.addEventListener('click', () => {
                if (!e.target.classList.contains('options') && !e.target.closest('.options-dialog')) {
                    load_chat_box(_conversation);
                }
            });
        }
    }
    
    return _conversation;
}

// converts each message to html element to be display in the chat box
function extract_messages_html(message) {
    const chat_message_div = document.createElement('div');
    const user2_id = contact_data.id;

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

// fetches conversation history 
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
        chatlog.textContent = '';
        chat_box_top_avatar.innerHTML = `
            <img src="${data.conversation.conversation_with.profile.avatar}" class="avatar"/>`
        chat_box_top_username.textContent = data.conversation.conversation_with.profile.full_name || 
                                          data.conversation.conversation_with.username;
        for (let msg of data.messages) {
            message = extract_messages_html(msg);
            chatlog.prepend(message);
        }
        scroll_to_bottom();

    } catch (error) {
        console.error(error.message)
        if (response && response.status === 401) {
            await get_token();
            fetch_conversation_history(conversation_id);
        }
    }
}


// opens web socket for real-time chat 
function openWebSocket(uid, callback) {
   // close chat socket if one is already open 

    const url = ws_url_prefix + `chat/${uid}/`
    currentChatSocket = new WebSocket(url);
    
    currentChatSocket.onopen = function(e) {
        console.log("chat connection established");
        reconnectInterval = 1000;
    }

    currentChatSocket.onclose = function (e) {
        console.log("chat connection lost");
        if (!is_expected_close) {
            reconnectWebSocket('chat');
        }
        is_expected_close = false;
    }
    
    currentChatSocket.onmessage = function (e) {
        data = JSON.parse(e.data);
        if (data.type === 'connection') {
            contact_data.convo_id = data.conversation_id;
            current_conversation = get_or_create_conversation();
            console.log(data.status);
            if (callback) callback(data.conversation_id);
        } else if (data.type === 'chat_message') {
            user_message_input.value = '';

            const new_message_div = document.createElement('div');

            const user2_id = contact_data.id
            console.log(data);
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

// prepares chat box for conversation history
function load_chat_box(conversation) {
    const unread_messages_div = conversation.querySelector('.unread-messages');
    unread_messages_div.innerHTML = `<p>0</p>`;
    unread_messages_div.classList.remove('active');
    contact_data.id = conversation.getAttribute('data-user-id');
    chat_box_container.style.padding = '0';
    chat_box_landing.style.display = 'none';
    chat_box_content.style.display = 'grid';

    // close chat socket if one is already open 
    if (currentChatSocket && currentChatSocket.readyState === WebSocket.OPEN) {
        console.log("Closing exisiting chat WebSocket connection");
        is_expected_close = true;
        currentChatSocket.close();
    }
    
    openWebSocket(contact_data.id, (conversation_id) => {
        fetch_conversation_history(conversation_id);
    });
}

// shows the user profile on the right
function showUserProfile(user_data) {
    // show profile page
    chatapp_main_wrapper.style.gridTemplateColumns = '100px 1fr 2fr 1fr';
    new_users_section.style.display = 'none';
    otherUserProfileSection.style.display = 'grid'
    profile_data = {
        id: user_data.user.id,
        avatar_url: user_data.user.profile.avatar,
        username: user_data.user.username,
    }
    
    const profile_full_name = document.querySelector('.other-profile-header h3');
    const profile_avatar = document.querySelector('.other-profile-avatar img');
    const profile_username = document.querySelector('.other-profile-info-item.username-info p');
    const profile_email = document.querySelector('.other-profile-info-item.email-info p');
    const profile_phone_number_div = document.querySelector('.other-profile-info-item.phone-number-info');
    const profile_phone_number = document.querySelector('.other-profile-info-item.phone-number-info p');

    const profile_bio_div = document.querySelector('.other-profile-info-item.bio-info');
    const profile_bio = document.querySelector('.other-profile-info-item.bio-info p');
    const profile_follow_btn = document.querySelector('.other-profile-btns .follow-btn');


    
    profile_full_name.textContent = user_data.user.profile.full_name || user_data.user.username;
    profile_avatar.src = user_data.user.profile.avatar;
    profile_username.textContent = '@'+ user_data.user.username;
    profile_email.textContent = user_data.user.email;
    
    // remove phone_number div if phone_number is null
    profile_phone_number.textContent = user_data.user.profile.phone_number;
    profile_phone_number_div.style.display = user_data.user.profile.phone_number ? 'flex' : 'none';

    // remove bio div if bio is empty
    profile_bio.textContent = user_data.user.profile.bio;
    profile_bio_div.style.display = user_data.user.profile.bio ? 'flex' : 'none';

    profile_follow_btn.setAttribute('data-following', user_data.following);
    profile_follow_btn.setAttribute('user-id', user_data.user.id);
    profile_follow_btn.textContent = user_data.following ? 'Unfollow' : 'Follow';

}

// fetches user details
async function loadUserProfile(user_id) {
    const url = API_BASE_URL + `users/${user_id}/`;
    let response = null;
    try {
        response = await fetch(url, {'credentials': 'same-origin'});
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }
        showUserProfile(data);

    } catch (error) {
        console.error(error.message);
        if (response && response.status === 401) {
            await get_token();
            loadUserProfile(user_id);
        }
    }

}

// deletes a conversation
async function delete_conversation(conversation_id, conversation) {
    const url = API_BASE_URL + `conversations/${conversation_id}/`;
    let response = null;
    try {
        response = await fetch(url, {
            'method': 'DELETE',
            'credentials': 'same-origin',
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || `An error occurred`);
        }
        console.log(data);
        if (conversation === current_conversation) {
            chatlog.textContent = '';
            chat_box_container.style.padding = '20px';
            chat_box_landing.style.display = 'block';
            chat_box_content.style.display = 'none';
            current_conversation = null;
        }
        conversation.remove();

    } catch (error) {
        console.error(error.message);
        if (response && response.status == 401) {
            await get_token();
            delete_conversation(conversation_id, conversation);
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
    conversation.addEventListener('click', (e) => {
        if (!e.target.classList.contains('options') && !e.target.closest('.options-dialog')) {
            load_chat_box(conversation); 
        }
    })
})


open_conversation_list.addEventListener('click', (e) => {

    if (e.target.classList.contains('options')) {
        const all_dialogs = open_conversation_list.querySelectorAll('.options-dialog');
        const dialog = e.target.nextElementSibling;

        all_dialogs.forEach(d => {
            if (d !== dialog) {
                d.style.display = 'none';
            }
        });
        dialog.style.display = dialog.style.display === 'block' ? 'none' : 'block';
    }
    if (e.target.classList.contains('od-profile')) {
        from_popup_button = true;
        const dialog = e.target.parentElement;
        const uid = dialog.parentElement.getAttribute('data-user-id');
        dialog.style.display = 'none';
        loadUserProfile(uid);
    }
    if (e.target.classList.contains('od-delete')) {
        const conversation = e.target.closest('.conversation');
        e.target.parentElement.style.display = 'none';
        delete_conversation(conversation.getAttribute('data-convo-id'), conversation);
    }
})

