
/*
* Variables
*/

const chat_submit_button = document.querySelector('.chat-box-input button');
const user_message_input = document.getElementById('user-message-input');
const chat_box_top_options = document.querySelector('.chat-top-options-icon');
const chat_box_top_popup = document.querySelector('.chat-box-popup');
const popup_profile_btn = document.querySelector('#popup-profile-btn');
const popup_clear_chat_btn = document.querySelector('#popup-clear-chat');
const clear_chat_overlay = document.querySelector('.popup.clear-chat.overlay');
const clear_chat_yes = document.querySelector('#clear-chat-yes');
const clear_chat_no = document.querySelector('#clear-chat-no');



/*
* Functions
*/

function send_message() {
    if (currentChatSocket) {   
        currentChatSocket.send(JSON.stringify({
            'type': 'chat_message',
            'body': user_message_input.value,
        }))
    }
}


/*
* Event Listeners
*/

chat_submit_button.onclick = function (e) {
    if (user_message_input.value.trim() !== '') {
        send_message();
        // move_conversation_to_top();
    }
    
}

user_message_input.onkeyup = function (e) {
    if (e.keyCode === 13) {
        if (user_message_input.value.trim() !== '') {
            send_message();
            // move_conversation_to_top();
        }
    }
}


chat_box_top_options.addEventListener('click', () => {
    if (chat_box_top_popup.style.visibility === 'hidden') {
        chat_box_top_popup.style.visibility = 'visible';
    } else {
        chat_box_top_popup.style.visibility = 'hidden';
    }
});


popup_profile_btn.addEventListener('click', () => {
    from_popup_button = true;
    chat_box_top_popup.style.visibility = 'hidden';
    loadUserProfile(contact_data.id);
});

popup_clear_chat_btn.addEventListener('click', () => {
    chat_box_top_popup.style.visibility = 'hidden';
    clear_chat_overlay.style.visibility = 'visible';
});

clear_chat_no.addEventListener('click', () => {
    clear_chat_overlay.style.visibility = 'hidden';
});


clear_chat_yes.addEventListener('click', () => {
    const convo_id = contact_data.convo_id;
    const url = API_BASE_URL + `conversations/${convo_id}/?retain=yes`;

    clear_chat_overlay.style.visibility = 'hidden';

    async function clear_conversation() {
        let response = null;

        try {
            response = await fetch(url, {
                'method': 'DELETE',
                'credentialsnt': 'same-origin'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || `An error occurred`);
            }
            console.log(data);
            chatlog.innerHTML = '';

        } catch (error) {
            console.error(error.message);
            if (response.status === 401) {
                await get_token();
                clear_conversation();
                
            }
        }
    }
    clear_conversation();
    const conversation = document.querySelector(`[data-convo-id="${convo_id}"]`);
    conversation.querySelector('.conversation-info p:last-child').textContent = '';


})