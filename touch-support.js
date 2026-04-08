// touch-support.js

function enableTouchDrawing() {
    const canvas = document.querySelector("canvas");
    if (!canvas) return; // Exit if canvas isn't on screen yet

    // 1. Critical: Stop the phone from scrolling/zooming while drawing
    canvas.style.touchAction = "none";

    const ctx = canvas.getContext("2d");

    // 2. Use PointerEvents (Covers Mouse, Finger, and Apple Pencil)
    canvas.addEventListener("pointerdown", (e) => {
        // This triggers your existing startDrawing function
        // Ensure your main script.js has a function named 'startDrawing'
        isDrawing = true; 
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener("pointermove", (e) => {
        if (!isDrawing) return;
        const rect = canvas.getBoundingClientRect();
        
        // This draws the line
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    });

    canvas.addEventListener("pointerup", () => {
        isDrawing = false;
        ctx.closePath();
    });
}

// 3. Wait for the "Start Creating" button to be clicked
// Replace '.start-btn' with whatever class your button actually has
document.addEventListener("click", (e) => {
    if (e.target.innerText === "Start Creating" || e.target.classList.contains("start-btn")) {
        setTimeout(enableTouchDrawing, 500); // Give the app a moment to load the canvas
    }
});
