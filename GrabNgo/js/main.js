// Simple carousel script for hero-image carousel
document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.querySelector('.carousel');
    if (!carousel) return;

    const images = carousel.querySelectorAll('.carousel-image');
    let currentIndex = 0;

    // Hide all images except the first
    images.forEach((img, index) => {
        if (index !== 0) img.style.display = 'none';
    });

    // Function to show next image
    function showNextImage() {
        images[currentIndex].style.display = 'none';
        currentIndex = (currentIndex + 1) % images.length;
        images[currentIndex].style.display = 'block';
    }

    // Change image every 3 seconds
    setInterval(showNextImage, 3000);
});
