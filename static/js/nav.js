const profileNav = document.getElementById('profile-nav');
const messagesNav = document.getElementById('messages-nav');
const contactNav = document.getElementById('contact-nav');
const bookmarkNav = document.getElementById('bookmark-nav');

const sections = document.querySelectorAll('.section');
const profileSection = document.querySelector('.profile-section');
const mesagesSection = document.querySelector('.messages-section');
const contactSection = document.querySelector('.contacts-section');
const bookmarkSection = document.querySelector('.bookmark-section');

const profileBtn = document.querySelector('.profile-avatar-options');
const profilePopup = document.querySelector('.profile-popup');


profileNav.addEventListener('click', () => {
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    profileNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    profileSection.style.display = 'grid';
});

messagesNav.addEventListener('click', () => {
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    messagesNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    mesagesSection.style.display = 'grid';
})

contactNav.addEventListener('click', () => {
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    contactNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    contactSection.style.display = 'grid';
})

bookmarkNav.addEventListener('click', () => {
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    bookmarkNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    bookmarkSection.style.display = 'block';
})


profileBtn.addEventListener('click', (e) => {
    const dialog = profileBtn.nextElementSibling;
    const all_dialogs = document.querySelectorAll('.options-dialog');

    all_dialogs.forEach(d => {
        if (d !== dialog) {
            d.style.display = 'none';
        }
    });
    dialog.style.left = `70%`;
    dialog.style.width = '100px';
    dialog.style.display = dialog.style.display === 'block' ? 'none' : 'block';

});

const nav_avatar_options = document.querySelector('.nav-item.nav-avatar .options-dialog')

nav_avatar_options.addEventListener('click', (e) => {
    if (e.target === nav_avatar_options.lastElementChild) {
        window.location.href = '/logout';
    }
})
