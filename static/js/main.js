const scrollContainers = document.querySelectorAll('.scroll-container');
    
scrollContainers.forEach(scrollContainer => {
    scrollContainer.addEventListener('scroll', () => {
        scrollContainer.classList.add('scrolling');
        
        clearTimeout(scrollContainer.scrollTimeout);
        scrollContainer.scrollTimeout = setTimeout(() => {
            scrollContainer.classList.remove('scrolling')}, 500);
    });
});


// const startConvo = document.querySelector('.start-new-convo');
// const userSearch = document.querySelector('.user-search');

// startConvo.addEventListener('click', () => {
//     userSearch.style.display = ' block';
// });

const contactNav = document.getElementById('contact-nav');
const sections = document.querySelectorAll('.section');


contactNav.addEventListener('click', () => {
    const contactSection = document.querySelector('.contacts-section');
    const selectedNav = document.querySelector('.selected');
    selectedNav.classList.remove('selected');
    contactNav.classList.add('selected');
    sections.forEach(section => {
        section.style.display = 'none';
    });
    contactSection.style.display = '';
})