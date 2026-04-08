// touch-support.js
const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

// Prevent scrolling when touching the canvas
canvas.style.touchAction = 'none';

function handleTouch(e) {
    e.preventDefault(); // Stops the page from shaking/moving
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    
    // Calculate exact touch position relative to canvas
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    return { x, y };
}

canvas.addEventListener('touchstart', (e) => {
    const pos = handleTouch(e);
    // Call your existing startDrawing function here
    startDrawing(pos.x, pos.y); 
});

canvas.addEventListener('touchmove', (e) => {
    const pos = handleTouch(e);
    // Call your existing drawing function here
    draw(pos.x, pos.y);
});
