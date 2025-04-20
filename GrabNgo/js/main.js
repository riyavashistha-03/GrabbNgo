document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');

    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: [0, 0.5, 1.0]
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.intersectionRatio >= 1) {
                entry.target.style.transform = 'scale(1.1)';
                entry.target.style.transition = 'transform 0.3s ease';
                entry.target.style.zIndex = '10';
                entry.target.style.position = 'relative';
            } else if (entry.intersectionRatio >= 0.5) {
                entry.target.style.transform = 'scale(1.05)';
                entry.target.style.transition = 'transform 0.3s ease';
                entry.target.style.zIndex = '5';
                entry.target.style.position = 'relative';
            } else {
                entry.target.style.transform = 'scale(1)';
                entry.target.style.transition = 'transform 0.3s ease';
                entry.target.style.zIndex = '1';
                entry.target.style.position = 'static';
            }
        });
    }, observerOptions);

    featureCards.forEach(card => {
        observer.observe(card);
    });
});
