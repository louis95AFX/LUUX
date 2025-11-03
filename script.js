document.addEventListener('DOMContentLoaded', () => {
    const bagIcon = document.getElementById('bag-icon');

    // Simple interaction to add a touch of life
    bagIcon.addEventListener('click', () => {
        alert("Your shopping bag is currently empty. Start your luxury journey now!");
    });

    // You could add more complex logic here later, such as:
    // 1. Smooth scrolling for the navigation links.
    // 2. An animation for when products load into view (using Intersection Observer).
});