/*
* Variables
*/

const contacts_list = document.querySelector('.contacts');
const start_new_convo = document.querySelector('.start-new-convo');
const new_users_list = document.querySelector('.new-users-list');
const close = document.querySelector('#close');
const find_new_user = document.querySelector('.find-new-user');
const new_users_section = document.querySelector('.new-users-section');


/*
* Functions
*/

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

async function get_all_contacts() {
    const url = API_BASE_URL + `user/${account_user_id}/following/`;
    let response = null;
    try {
        response = await fetch(url, {'credentials': 'same-origin'});
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }
        console.log(data)
        update_contacts_list(data);

    } catch (error) {
        console.error(error);
        if (response && response.status === 401) {
            await get_token();
            get_all_contacts();
        }
    }
}

async function call_get_contacts() {
    const btn = document.querySelector('#refresh-contact-btn');
    btn.classList.add('loading-active');
    await get_all_contacts();
    btn.classList.remove('loading-active');
}


async function get_following_ids() {
    let response;
    try {
        const url = API_BASE_URL + `following_ids/`;
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
        following_ids = await get_following_ids();
        if (!following_ids) {
            throw new Error(`Could not retrieve user's following`);
        }
        response = await fetch(url, {'credentials': 'same-origin'})
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occured');
        }
        console.log(data);
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

async function get_next_users(next_url) {
    let response = null;
    try {
        response = await fetch(next_url, {'credentials': 'same-origin'});
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || 'An error occurred');
        }
        console.log(data);
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

function remove_temp_nav() {
    const temp_nav = document.querySelector('.temp-nav');
    if (temp_nav) {
        temp_nav.remove();
    }
}

function add_temp_nav(next_url) {
    const temp_nav_div = document.createElement('div');
    temp_nav_div.classList.add('temp-nav');
    temp_nav_div.innerHTML = `
        <div class="temp-nav-next" next-url="${next_url}">&#43;</div>
    `;
    new_users_list.appendChild(temp_nav_div);
}

function update_users_list(users) {
    for (let user of users) {
        const user_div = document.createElement('div');
        user_div.classList.add('user', 'list-item');
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
    const contact = e.target.closest('.contact-name');
    if (contact) {
        const uid = contact.getAttribute('user_id');
        conversation_with.setAttribute('data', uid);
        chat_box_container.style.padding = '0';
        chat_box_landing.style.display = 'none';
        chat_box_content.style.display = 'grid';
        openWebSocket(uid, (conversation_id) => {
            fetch_conversation_history(conversation_id);
        });
    }
})


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

new_users_list.addEventListener('click', (e) => {
    if (e.target.classList.contains('follow-btn')) {
        console.log("performing task");
        follow_or_unfollow(e.target);
    }
    if (e.target.classList.contains('temp-nav-next')) {
        const next_url = e.target.getAttribute('next-url');
        get_next_users(next_url);  
    }
})