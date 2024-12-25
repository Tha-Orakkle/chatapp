/*
* Variables
*/

let follow_btn_from_users_list = null;

const contacts_list = document.querySelector('.contacts');
const start_new_convo = document.querySelector('.start-new-convo');
const new_users_list = document.querySelector('.new-users-list');
const close = document.querySelector('#close');
const find_new_user = document.querySelector('.find-new-user');
const new_users_section = document.querySelector('.new-users-section');
const otherUserProfileSection = document.querySelector('.other-profile-section');




/*
* Functions
*/

// updates the contact list afresh with the new data gotten from 
// get_all_contacts
function update_contacts_list(contacts) {
    contacts_list.textContent = '';
    for (let contact of contacts) {
        const contact_div = document.createElement('div');
        contact_div.classList.add('contact');
        contact_div.innerHTML = `
            <div class="contact-avatar">
                <img src="${contact.profile.avatar}" class="avatar">
            </div>
            <div class="contact-name" user_id="${contact.id}">
                <p>${contact.username}</p>
            </div>
            <img src="static/images/icons/options.png" alt="options-icon" class="options">
        `;
        contacts_list.appendChild(contact_div);
    }
}

// fetches all the contacts
async function get_all_contacts() {
    const url = API_BASE_URL + `user/${account_user_id}/following/`;
    let response = null;
    try {
        response = await fetch(url, {'credentials': 'same-origin'});
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }
        update_contacts_list(data);

    } catch (error) {
        console.error(error);
        if (response && response.status === 401) {
            await get_token();
            get_all_contacts();
        }
    }
}


// refreshes the contacts list
async function call_get_contacts() {
    const btn = document.querySelector('#refresh-contact-btn');
    btn.classList.add('loading-active');
    await get_all_contacts();
    btn.classList.remove('loading-active');
}

// gets a list of IDs of all the people the account user is currently following
async function get_following_ids() {
    let response;
    try {
        const url = API_BASE_URL + `following_ids/`;
        response = await fetch(url, {'credentials': 'same-origin'});
        const data = await response.json();
        if(!response.ok) {
            throw new Error(data.detail || 'An error occured')
        }
        return data;
    } catch (error) {
        console.error(error.message);
        return null;
    }
}


// gets new users for the find new users section 
async function get_users() {
    const url = API_BASE_URL + 'users/';
    let response = null;
    
    try {
        following_ids = await get_following_ids();
        if (!following_ids) {
            throw new Error(`Could not retrieve user's following`);
        }
        response = await fetch(url, {'credentials': 'same-origin'})
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occured');
        }
        new_users_list.textContent = '';
        remove_temp_nav();
        update_users_list(data.results);
        if (data.next) add_temp_nav(data.next);
    } catch (error) {
        console.error(error.message);
        if (error.message === `Could not retrieve user's following` || (response && response.status === 401)) {
            await get_token();
            get_users();
        }
    }
}

// follow or unfollows a user
async function follow_or_unfollow(btn, follow_btn_from_users_list=null) {
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
        if (data.status === 'unfollowed') {
            btn.setAttribute('data-following', false);
            btn.textContent = 'Follow';
            if (follow_btn_from_users_list) {
                follow_btn_from_users_list.setAttribute('data-following', false);
                follow_btn_from_users_list.textContent = 'Follow'
            }
        } else if (data.status === 'followed') {
            btn.setAttribute('data-following', true);
            btn.textContent = 'Unfollow';
            if (follow_btn_from_users_list) {
                follow_btn_from_users_list.setAttribute('data-following', false);
                follow_btn_from_users_list.textContent = 'Unfollow'
            }
        }

    } catch (error) {
        console.error(error.message);
        if (response.status === 401) {
            await get_token();
            follow_or_unfollow(btn);
        }
    }
}


// show more users on the find more users on the find new users section
async function get_next_users(next_url) {
    let response = null;
    try {
        response = await fetch(next_url, {'credentials': 'same-origin'});
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }
        remove_temp_nav();
        update_users_list(data.results);
        if(data.next) add_temp_nav(data.next);
    } catch(error) {
        console.error(error);
        if (response && response.status == 401) {
            get_token();
            get_next_users();
        }
    }
}

// remove navigation to show more users on the find new users section
function remove_temp_nav() {
    const temp_nav = document.querySelector('.temp-nav');
    if (temp_nav) {
        temp_nav.remove();
    }
}

// adds navigation to show more users on the find new users  section
function add_temp_nav(next_url) {
    const temp_nav_div = document.createElement('div');
    temp_nav_div.classList.add('temp-nav');
    temp_nav_div.innerHTML = `
        <div class="temp-nav-next" next-url="${next_url}">&#43;</div>
    `;
    new_users_list.appendChild(temp_nav_div);
}

// updates the users list in the find new user section
function update_users_list(users) {
    for (let user of users) {
        const user_div = document.createElement('div');
        user_div.classList.add('user', 'list-item');
        user_div.setAttribute('data-user-id', user.id);
        let html_temp = ``;
        let html = `
            <div class="user-avatar">
                <img src="${user.profile.avatar}" alt="user profile avatar" class="avatar">
            </div>
            <p>${user.username}</span></p>
        `;
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


/*
* Event Listeners
*/

contacts_list.addEventListener('click', (e) => {
    const contact = e.target.closest('.contact');
    if (contact) {
        const uid = contact.querySelector('.contact-name').getAttribute('user_id');

        // update contact data
        contact_data.id = uid;
        contact_data.avatar_url = contact.querySelector('img').src;
        contact_data.username = contact.querySelector('.contact-name p').textContent.trim();

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
        openWebSocket(uid, (conversation_id) => {
            fetch_conversation_history(conversation_id);
        });
    }
})


// loads contact section
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


// loads section to find all users on the app
find_new_user.addEventListener('click', () => {
    chatapp_main_wrapper.style.gridTemplateColumns = '100px 1fr 2fr 1fr';
    new_users_section.style.display = 'grid';

    get_users();

});


// close the find all users section
close.addEventListener('click', () => {
    new_users_section.style.display = 'none';
    chatapp_main_wrapper.style.gridTemplateColumns = '100px 1fr 3fr';
});

function showUserProfile(user_data) {
    // show profile page
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



// follow a user from the find all users section
// calls the follow_or_unfollow function 
new_users_list.addEventListener('click', (e) => {
    if (e.target.classList.contains('follow-btn')) {
        follow_or_unfollow(e.target);
    } else if (e.target.closest('.user')) {
        const user_id = e.target.closest('.user').getAttribute('data-user-id');
        follow_btn_from_users_list = e.target.closest('.user').children[2];
        loadUserProfile(user_id);
    }

    if (e.target.classList.contains('temp-nav-next')) {
        const next_url = e.target.getAttribute('next-url');
        get_next_users(next_url);  
    }

    
})