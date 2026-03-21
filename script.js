const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const preview = document.getElementById('brush-preview');
let history = [], currentMode = 'pen', currentBrush = 'brush', bgColor = "#ffffff", drawing = false;
let projName = "Untitled";

// PWA: Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
}

document.getElementById('launchBtn').onclick = () => {
    projName = document.getElementById('projectName').value.trim() || "Artwork";
    bgColor = document.getElementById('bgPicker').value;
    document.getElementById('startScreen').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('startScreen').style.display = 'none';
        initCanvas();
    }, 500);
};

function initCanvas() {
    canvas.width = window.innerWidth * 1.5;
    canvas.height = window.innerHeight * 1.5;
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
}

// Cursor Preview
window.addEventListener('mousemove', (e) => {
    const size = document.getElementById('lineWidth').value;
    preview.style.width = size + "px";
    preview.style.height = size + "px";
    preview.style.left = e.clientX + "px";
    preview.style.top = e.clientY + "px";
    preview.style.display = (e.target.id === 'canvas') ? 'block' : 'none';
});

// Advanced Brush Engine
function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (e.clientX - rect.left) * (canvas.width / rect.width),
        y: (e.clientY - rect.top) * (canvas.height / rect.height)
    };
}

canvas.onmousedown = (e) => {
    drawing = true;
    const {x, y} = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
};

canvas.onmousemove = (e) => {
    if (!drawing) return;
    const {x, y} = getPos(e);
    const size = document.getElementById('lineWidth').value;
    const color = document.getElementById('colorPicker').value;

    ctx.strokeStyle = (currentMode === 'eraser') ? bgColor : color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = 1.0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Apply Brush Identity
    if (currentMode !== 'eraser') {
        switch(currentBrush) {
            case 'airbrush': ctx.globalAlpha = 0.08; ctx.lineWidth = size * 2.5; break;
            case 'calligraphy': ctx.setTransform(1, 0, 0.6, 1, 0, 0); ctx.lineWidth = size * 1.2; break;
            case 'pencil': ctx.globalAlpha = 0.4; ctx.lineWidth = size * 0.6; break;
            case 'crayon': 
                ctx.lineWidth = size; 
                ctx.setLineDash([1, size/2]); 
                break;
            case 'oil': ctx.globalAlpha = 0.9; ctx.lineWidth = size * 1.4; break;
            default: ctx.lineWidth = size; ctx.setLineDash([]); break;
        }
    } else {
        ctx.lineWidth = size * 2;
        ctx.setLineDash([]);
    }

    ctx.lineTo(x, y);
    ctx.stroke();
};

window.onmouseup = () => { if(drawing) { drawing = false; ctx.setLineDash([]); saveState(); } };

// UI Interaction
function setTool(t) {
    currentMode = t;
    document.querySelectorAll('.dock-item').forEach(b => b.classList.remove('active'));
    document.getElementById(t+'Btn').classList.add('active');
}

document.getElementById('penBtn').onclick = (e) => {
    e.stopPropagation();
    document.getElementById('brushMenu').classList.toggle('hidden');
    setTool('pen');
};

document.querySelectorAll('.brush-opt').forEach(opt => {
    opt.onclick = () => {
        currentBrush = opt.dataset.brush;
        document.querySelectorAll('.brush-opt').forEach(b => b.classList.remove('active'));
        opt.classList.add('active');
        document.getElementById('brushMenu').classList.add('hidden');
    };
});

// Fixed Click Handlers
document.getElementById('eraserBtn').onclick = () => setTool('eraser');
document.getElementById('pickerBtn').onclick = () => setTool('picker');
document.getElementById('undoBtn').onclick = () => {
    if(history.length > 1) {
        history.pop();
        ctx.putImageData(history[history.length-1], 0, 0);
    }
};

document.getElementById('saveBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = `${projName}.png`;
    link.href = canvas.toDataURL();
    link.click();
};

// Minimize Logic
const dock = document.getElementById('dockContainer');
const sparkle = document.getElementById('minimizedTrigger');

document.getElementById('minimizeBtn').onclick = () => {
    dock.style.transform = "translateY(150px) scale(0.8)";
    dock.style.opacity = "0";
    setTimeout(() => {
        dock.classList.add('hidden');
        sparkle.classList.remove('hidden');
    }, 400);
};

sparkle.onclick = () => {
    sparkle.classList.add('hidden');
    dock.classList.remove('hidden');
    setTimeout(() => {
        dock.style.transform = "translateY(0) scale(1)";
        dock.style.opacity = "1";
    }, 50);
};

function saveState() {
    if(history.length > 20) history.shift();
    history.push(ctx.getImageData(0,0,canvas.width, canvas.height));
}
