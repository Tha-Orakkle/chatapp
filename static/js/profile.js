/*
 *  Variables
 */
const edit_profile_btn = document.querySelector('.profile-header button');
const cancel = document.querySelector('#cancel');
const edit_profile_section = document.querySelector('.edit-profile-section');
const update_btn = document.querySelector('#edit-profile-submit-btn');
const edit_profile_input = document.querySelector('#edit-profile-input');
const edit_profile_avatar = document.querySelector('.edit-profile-avatar');
const close_error = document.querySelector('.edit-profile-error .top span');
const edit_profile_errors = document.querySelector('.edit-profile-error');
const success = document.querySelector('.success');


/*
 *  Functions
*/

function create_errors(data) {
    const error_body = document.querySelector('.edit-profile-error .body');
    error_body.textContent = '';
    for (let x in data) {
        const error = document.createElement('p');
        error.textContent = `*${data[x]}`;
        error_body.appendChild(error);
    }
    edit_profile_errors.style.display = 'flex';
    setTimeout(() => {
        edit_profile_errors.style.display = 'none';
    }, 2000);
}

function update_all_user_data(data) {
    const all_avatars = document.querySelectorAll('.avatar.account-user');
    const profile_name = document.querySelector('.profile-header h3');
    const profile_username = document.querySelector('.profile-info-item.username-info p')
    const profile_email = document.querySelector('.profile-info-item.email-info p')
    const profile_phone_number = document.querySelector('.profile-info-item.phone-number-info p')
    const profile_bio = document.querySelector('.profile-info-item.bio-info p')
    const timestamp = new Date().getTime();
    all_avatars.forEach(avi => {
        avi.src = data.profile.avatar + `?timestamp=${timestamp}`;
    })
    profile_name.textContent = data.profile.full_name;
    profile_username.textContent = '@' + data.username;
    profile_email.textContent = data.email;
    profile_phone_number.textContent = data.profile.phone_number;
    profile_bio.textContent = data.profile.bio;
}


/*
 *  Event Listeners
*/

edit_profile_btn.addEventListener('click', () => {
    profileSection.style.display = 'none';
    edit_profile_section.style.display = 'grid';
});

cancel.addEventListener('click', () => {
    edit_profile_section.style.display = 'none';
    profileSection.style.display = 'grid';
});

edit_profile_input.addEventListener('change', () => {
    const avatar = document.querySelector('#e-profile-avatar');
    const file = edit_profile_input.files[0];
    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            avatar.remove();
            img.classList.add('avatar', 'account-user');
            img.setAttribute('id', 'e-profile-avatar');
            edit_profile_avatar.prepend(img);
        };
        reader.readAsDataURL(file);
    }
})

update_btn.addEventListener('click', (e) => {
    e.preventDefault();
    const form_data = new FormData();
    const file = edit_profile_input.files[0];
    const username = document.querySelector('#username').value
    const full_name = document.querySelector('#full_name').value
    const email = document.querySelector('#email').value
    const phone_number = document.querySelector('#phone_number').value
    const bio = document.querySelector('#bio').value

    if (file) form_data.append('avatar', file);
    if (username) form_data.append('username', username);
    if (email) form_data.append('email', email);
    if (full_name) form_data.append('full_name', full_name);
    if (phone_number) form_data.append('phone_number', phone_number);
    if (bio) form_data.append('bio', bio);
    let response = null;
    let data = null

    async function update_user() {
        try {
            const url = API_BASE_URL + `users/${account_user_id}/`
            response = await fetch(url, {
                'method': 'PUT',
                'body': form_data,
                'credentials': 'same-origin',
                'headers': {
                    'X-CSRFToken': get_cookie('csrftoken'),
                }
            })
            data = await response.json();
            if (!response.ok) {
                throw new Error();
            }
            console.log(data)
            update_all_user_data(data.data);
            success.innerHTML = `<p>${data.message}</p>`
            success.style.display = 'block';
            edit_profile_section.style.display = 'none';
            profileSection.style.display = 'grid';
            setTimeout(() => {
                success.style.display = 'none';
            }, 3000)


        } catch (error) {
            console.log(data);

            if (response.status === 401) {
                await get_token();
                update_user();
            } else if (response.status === 400) {
                create_errors(data);
            }

        }
    }

    update_user();

})

close_error.addEventListener('click', () => {
    edit_profile_errors.style.display = 'none';
})
