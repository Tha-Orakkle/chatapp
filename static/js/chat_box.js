
/*
* Variables
*/

const chat_submit_button = document.querySelector('.chat-box-input button');
const user_message_input = document.getElementById('user-message-input');
const chat_box_top_options = document.querySelector('.chat-top-options-icon');

const chat_box_top_popup = document.querySelector('.chat-box-top-bar .options-dialog');
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


chat_box_top_options.addEventListener('click', (e) => {
    const dialog = e.target.nextElementSibling;
    const all_dialogs = document.querySelectorAll('.options-dialog');

    all_dialogs.forEach(d => {
        if (d !== dialog){
            d.style.display = 'none';
        }
    })
    dialog.style.right = `${e.target.offsetWidth + 20}px`;
    dialog.style.top = '10px';
    dialog.style.display = dialog.style.display === 'block' ? 'none' : 'block';
});


popup_profile_btn.addEventListener('click', () => {
    from_popup_button = true;
    popup_profile_btn.parentElement.style.display = 'none'
    loadUserProfile(contact_data.id);
});

popup_clear_chat_btn.addEventListener('click', () => {
    popup_clear_chat_btn.parentElement.style.display = 'none'
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


chatlog.addEventListener('click', async (e) => {
    if (e.target.classList.contains('options')) {
        let dialog = null;
        if (e.target.nextElementSibling.classList.contains('options-dialog')) {
            dialog = e.target.nextElementSibling;
            const width = e.target.previousElementSibling.offsetWidth + 20;
            dialog.style.left = `${width}px`;
        } else {
            dialog = e.target.previousElementSibling;
            const width = e.target.nextElementSibling.offsetWidth + 20;
            dialog.style.right = `${width}px`;
        }

        const all_dialogs = document.querySelectorAll('.options-dialog');
        all_dialogs.forEach(d => {
            if (d !== dialog) {d.style.display = 'none';}
        })

        dialog.style.display = dialog.style.display === 'block' ? 'none' : 'block';
    }

    if (e.target.closest('.options-dialog')) {
        const message_div = e.target.closest('.chat-message');
        e.target.closest('.options-dialog').style.display = 'none';
        if (e.target.classList.contains('od-delete-msg')) {
            show_delete_message_popup(message_div);
        }
    }
    if (e.target.closest('.delete-msg.overlay')) {
        const overlay = e.target.closest('.delete-msg.overlay');
        if (e.target.id === 'delete-msg-yes') {
            const message_div = e.target.closest('.chat-message');
            overlay.style.visibility = 'hidden';
            const deleted = await delete_message(message_div.getAttribute('data-message-id'));
            if (deleted) {
                if (message_div === chatlog.lastElementChild) {
                    message_div.remove();
                    const ms_p = chatlog.lastElementChild.querySelector(':scope > p');
                    current_conversation.querySelector('.conversation-info').lastElementChild.textContent = ms_p.textContent;
                } else {
                    message_div.remove();
                }
            }

        } else if (e.target.id === 'delete-msg-no') {
            overlay.style.visibility = 'hidden';
        } else if (!e.target.closest('.delete-msg.response')) {
            overlay.style.visibility = 'hidden';
        }
    }
})

function show_delete_message_popup(message_div) {
    const message_popup_overlay = message_div.lastElementChild;
    message_popup_overlay.style.visibility = 'visible';
}

async function delete_message(message_id) {
    const url = API_BASE_URL + `conversation/${contact_data.convo_id}/message/${message_id}/`;
    let response = null;
    let deleted = false;
    try {
        response = await fetch(url, {
            'method': 'DELETE',
            'credentials': 'same-origin'
        })
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || `An error occurred`);
        }
        console.log(data);
        deleted = true
    } catch (error) {
        console.error(error.message);
        if (response && response.status === 401) {
            await get_token();
            delete_message(message_id);
        }
    }
    return deleted;
}