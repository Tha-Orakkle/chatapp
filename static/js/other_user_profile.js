/*
* Variables
*/

const close_profile = document.querySelector('#close-profile');
const profile_follow_btn = document.querySelector('.other-profile-btns .follow-btn');
const profile_start_chat = document.querySelector('.other-profile-btns .start-chat');

/*
* Functions
*/



/*
* Event Listeners
*/

close_profile.addEventListener('click', () => {
    otherUserProfileSection.style.display = 'none'
    if (from_popup_button) {
        chatapp_main_wrapper.style.gridTemplateColumns = '100px 1fr 3fr';
        from_popup_button = false;
    } else {
        new_users_section.style.display = 'grid';
    }
})

profile_follow_btn.addEventListener('click', () => {
    follow_or_unfollow(profile_follow_btn, follow_btn_from_users_list);
})



profile_start_chat.addEventListener('click', () => {    
    contact_data = {...profile_data};

    // restructure interface and present chatbox
    chat_box_container.style.padding = '0';
    chat_box_landing.style.display = 'none';
    chat_box_content.style.display = 'grid';

    // close chat socket if one is already open 
    if (currentChatSocket && currentChatSocket.readyState === WebSocket.OPEN) {
        console.log("Closing exisiting chat WebSocket connection");
        is_expected_close = true;
        currentChatSocket.close();
    }

    // open websocket and fetch conversation history
    openWebSocket(profile_data.id, (conversation_id) => {
        fetch_conversation_history(conversation_id);
    });
})