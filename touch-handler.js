// This function will connect your touch/pencil to the drawing logic
function initTouchSupport() {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    // 1. STOP THE SCROLLING
    // This is the most important line for mobile/iPad
    canvas.style.touchAction = 'none'; 

    const ctx = canvas.getContext('2d');

    // 2. HELPER TO GET COORDINATES
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        // Use e.touches[0] for fingers/pencil, or just e for mouse
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // 3. ATTACH TOUCH EVENTS
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const pos = getPos(e);
        // We call your existing startDrawing logic
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!isDrawing) return;
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }, { passive: false });

    canvas.addEventListener('touchend', () => {
        isDrawing = false;
    });
}

// 4. WAIT FOR THE START BUTTON
// Since your app starts with a menu, we wait for you to click "Start"
document.addEventListener('click', (e) => {
    if (e.target.textContent.includes("Start")) {
        // Give the UI a split second to transition, then enable touch
        setTimeout(initTouchSupport, 300);
    }
});
