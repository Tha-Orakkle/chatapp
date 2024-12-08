const profileNav = document.getElementById('profile-nav');
const messagesNav = document.getElementById('messages-nav');
const contactNav = document.getElementById('contact-nav');
const bookmarkNav = document.getElementById('bookmark-nav');
const sections = document.querySelectorAll('.section');


profileNav.addEventListener('click', () => {
    const profileSection = document.querySelector('.profile-section');
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    profileNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    profileSection.style.display = 'block';
});

messagesNav.addEventListener('click', () => {
    const mesagesSection = document.querySelector('.messages-section');
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    messagesNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    mesagesSection.style.display = 'grid';
})

contactNav.addEventListener('click', () => {
    const contactSection = document.querySelector('.contacts-section');
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    contactNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    contactSection.style.display = 'grid';
})

bookmarkNav.addEventListener('click', () => {
    const bookmarkSection = document.querySelector('.bookmark-section');
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    bookmarkNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    bookmarkSection.style.display = 'block';
})


const profileBtn = document.querySelector('.profile-avatar-quick-menu');
const profilePopup = document.querySelector('.profile-popup');

profileBtn.addEventListener('click', () => {
    if (profilePopup.style.visibility === 'hidden') {
        profilePopup.style.visibility = 'visible';
    } else {
        profilePopup.style.visibility = 'hidden';
    }
});
