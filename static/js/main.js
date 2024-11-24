const scrollContainers = document.querySelectorAll('.scroll-container');
    
scrollContainers.forEach(scrollContainer => {
    scrollContainer.addEventListener('scroll', () => {
        scrollContainer.classList.add('scrolling');
        
        clearTimeout(scrollContainer.scrollTimeout);
        scrollContainer.scrollTimeout = setTimeout(() => {
            scrollContainer.classList.remove('scrolling')}, 500);
    });
});
