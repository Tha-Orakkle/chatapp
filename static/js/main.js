/*
* Variables
*/
let currentChatSocket = null;
const chatapp_main_wrapper = document.querySelector('.chatapp-main-wrapper');
const API_BASE_URL = `http://${window.location.host}/api/v1/`;
const contacts = document.querySelectorAll('.contact-name');
const ws_url_prefix = `ws://${window.location.host}/ws/chat/`;
const chatlog = document.querySelector('.chat-log');
const chat_submit_button = document.querySelector('.chat-box-input button');
const user_message_input = document.getElementById('user-message-input');

// hidden elements with necessary IDs
const conversation = document.getElementById('conversation');
const conversation_with = document.getElementById('conversation_with');

// general
const scroll_containers = document.querySelectorAll('.scroll-container');

// variables from contacts section
const start_new_convo = document.querySelector('.start-new-convo');

// variable from chat box section
const chat_other_username = document.getElementById('chat-box-username');
const chat_other_avatar = document.getElementById('chat-box-avatar');

// variables from find-new-user section
const new_users_section = document.querySelector('.new-users-section');
const close = document.querySelector('.close');
const find_new_user = document.querySelector('.find-new-user');
const new_users_list = document.querySelector('.new-users-list');
// const follow_btns = document.querySelectorAll('.follow-btn');





scroll_containers.forEach(scroll_container => {
    scroll_container.addEventListener('scroll', () => {
        scroll_container.classList.add('scrolling');
        
        clearTimeout(scroll_container.scrollTimeout);
        scroll_container.scrollTimeout = setTimeout(() => {
            scroll_container.classList.remove('scrolling')}, 500);
    });
});


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
            console.log("==========re-initiating API request============")
            fetch_conversation_history(conversation_id);
        }
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


function update_users_list(users, following_ids) {
    const new_users_list = document.querySelector('.new-users-list');
    new_users_list.textContent = '';
    for (let user of users) {
        const user_div = document.createElement('div');
        user_div.classList.add('user', 'list-item');
        let html_temp = ``;
        let html = `
            <div class="user-avatar">
                <img src="${user.profile.avatar}" alt="user profile avatar" class="avatar">
            </div>
            <p>${user.profile.full_name || user.username}</p>
        `;
        console.log("USER ID", user.id);
        if (following_ids.includes(user.id)) {
            html_temp = `<button class='follow-btn' data-following="true" user-id="${user.id}">Unfollow</button>`;
        } else {
            html_temp = `<button class='follow-btn' data-following="false" user-id="${user.id}">Follow</button>`;
        }

        html += html_temp;
        user_div.innerHTML = html;
        new_users_list.appendChild(user_div);
    }
}

async function get_following() {
    let response;
    try {
        const url = API_BASE_URL + `following/`;
        response = await fetch(url, {'credentials': 'same-origin'});
        const data = await response.json();
        if(!response.ok) {
            throw new Error(data.detail || 'An error occured')
        }
        console.log(data);
        return data;
    } catch (error) {
        console.error(error.message);
        return null;
    }
}

async function get_users() {
    const url = API_BASE_URL + 'users/';
    let response = null;
    
    try {
        following_data = await get_following();
        if (!following_data) {
            throw new Error(`Could not retrieve user's following`);
        }
        response = await fetch(url, {'credentials': 'same-origin'})
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occured');
        }
        console.log(data);
        update_users_list(data, following_data);
    } catch (error) {
        console.error(error.message);
        if (error.message === `Could not retrieve user's following` || (response && response.status === 401)) {
            await get_token();
            get_users();
        }
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


start_new_convo.addEventListener('click', () => {
    const contactSection = document.querySelector('.contacts-section');
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    contactNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    contactSection.style.display = 'grid';
});

find_new_user.addEventListener('click', () => {
    chatapp_main_wrapper.style.gridTemplateColumns = '100px 1fr 2fr 1fr';
    new_users_section.style.display = 'grid';

    get_users();

});

close.addEventListener('click', () => {
    new_users_section.style.display = 'none';
    chatapp_main_wrapper.style.gridTemplateColumns = '100px 1fr 3fr';
});

async function follow_or_unfollow(btn) {
    const user_to_follow_id = btn.getAttribute('user-id');
    const action = (btn.getAttribute('data-following') === 'true') ? 'unfollow' : 'follow';
    const url = API_BASE_URL + `follow_or_unfollow/${user_to_follow_id}/?action=${action}`;
    let response = null;
    try {
        response = await fetch(url, {'crednetials': 'same-origin'});
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }
        console.log(data);
        if (data.status === 'unfollowed') {
            btn.setAttribute('data-following', false);
            btn.textContent = 'Follow';
        } else if (data.status === 'followed') {
            btn.setAttribute('data-following', true);
            btn.textContent = 'Unfollow';
        }

    } catch (error) {
        console.error(error.message);
        if (response.status === 401) {
            await get_token();
            follow_or_unfollow(btn);
        }
    }
}

new_users_list.addEventListener('click', (e) => {
    if (e.target.classList.contains('follow-btn')) {
        console.log("performing task");
        follow_or_unfollow(e.target);
    }
})

// follow_btns.forEach(btn => {
//     btn.addEventListener('click', () => {
//         console.log("performing task");
//         follow_or_unfollow(btn);
//     })
// })