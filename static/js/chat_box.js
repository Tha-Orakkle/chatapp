/*
* Variables
*/

const chat_submit_button = document.querySelector('.chat-box-input button');
const user_message_input = document.getElementById('user-message-input');

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
