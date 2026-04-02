const bgCanvas = document.getElementById('bgCanvas'), mainCanvas = document.getElementById('mainCanvas'), tempCanvas = document.getElementById('tempCanvas');
const bgCtx = bgCanvas.getContext('2d'), mainCtx = mainCanvas.getContext('2d'), tempCtx = tempCanvas.getContext('2d');
const container = document.getElementById('canvasContainer'), startScreen = document.getElementById('startScreen'), textOverlay = document.getElementById('textOverlay');

const W = 800, H = 450;
[bgCanvas, mainCanvas, tempCanvas].forEach(c => { c.width = W; c.height = H; });
container.style.width = W + 'px'; container.style.height = H + 'px';

let isDrawing = false, currentMode = 'brush', currentSize = 15, lastPos = { x: 0, y: 0 };
let scale = 1, offsetX = 0, offsetY = 0, isPanning = false, spacePressed = false;
let undoStack = [], bgImage = null;

// --- DYNAMIC THEME ---
document.getElementById('startBgPicker').addEventListener('input', (e) => {
    const val = e.target.value;
    document.documentElement.style.setProperty('--accent', val);
    const r = parseInt(val.slice(1,3),16), g = parseInt(val.slice(3,5),16), b = parseInt(val.slice(5,7),16);
    document.documentElement.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.3)`);
});

// --- TEXT TOOL ---
function createTextInput(x, y) {
    const input = document.createElement('div');
    input.className = 'active-text-input';
    input.contentEditable = true;
    input.style.left = x + 'px'; input.style.top = y + 'px';
    input.style.fontSize = currentSize + 'px';
    input.style.color = document.getElementById('colorPicker').value;
    textOverlay.appendChild(input);
    setTimeout(() => input.focus(), 10);
    input.onblur = () => {
        if (input.innerText.trim()) {
            saveState();
            mainCtx.font = `${currentSize}px sans-serif`;
            mainCtx.fillStyle = input.style.color;
            mainCtx.textBaseline = 'top';
            mainCtx.fillText(input.innerText, x, y);
        }
        input.remove();
    };
}

// --- CORE MOUSE LOGIC ---
function getPos(e) {
    const rect = mainCanvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - rect.left) / scale, y: (cy - rect.top) / scale };
}

const start = (e) => {
    if (startScreen.style.display !== 'none') return;
    if (spacePressed) { isPanning = true; return; }
    const pos = getPos(e);
    if (currentMode === 'text') { createTextInput(pos.x, pos.y); return; }
    saveState();
    if (currentMode === 'fill') { floodFill(Math.floor(pos.x), Math.floor(pos.y), hexToRgb(document.getElementById('colorPicker').value)); } 
    else { isDrawing = true; lastPos = pos; }
};

const move = (e) => {
    if (isPanning) {
        offsetX += e.movementX || 0; offsetY += e.movementY || 0;
        container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
        return;
    }
    if (!isDrawing) return;
    const pos = getPos(e);
    const color = document.getElementById('colorPicker').value;

    if (currentMode === 'eraser') {
        mainCtx.save(); mainCtx.globalCompositeOperation = 'destination-out';
        mainCtx.lineWidth = currentSize; mainCtx.lineCap = 'round';
        mainCtx.beginPath(); mainCtx.moveTo(lastPos.x, lastPos.y); mainCtx.lineTo(pos.x, pos.y); mainCtx.stroke(); mainCtx.restore();
    } else if (currentMode === 'brush') {
        tempCtx.lineWidth = currentSize; tempCtx.lineCap = 'round'; tempCtx.strokeStyle = color;
        tempCtx.beginPath(); tempCtx.moveTo(lastPos.x, lastPos.y); tempCtx.lineTo(pos.x, pos.y); tempCtx.stroke();
    }
    lastPos = pos;
};

const stop = () => {
    if (isDrawing && currentMode === 'brush') mainCtx.drawImage(tempCanvas, 0, 0);
    isDrawing = false; isPanning = false; tempCtx.clearRect(0, 0, W, H);
};

// --- LISTENERS ---
window.addEventListener('mousedown', start);
window.addEventListener('mousemove', move);
window.addEventListener('mouseup', stop);
window.addEventListener('wheel', (e) => {
    if (startScreen.style.display !== 'none') return;
    e.preventDefault();
    scale = Math.min(Math.max(0.2, scale + (e.deltaY < 0 ? 0.1 : -0.1)), 6);
    container.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}, { passive: false });

// --- UI BUTTONS ---
document.getElementById('startBtn').onclick = () => {
    const c = document.getElementById('startBgPicker').value;
    bgCtx.fillStyle = c; bgCtx.fillRect(0,0,W,H);
    if(bgImage) bgCtx.drawImage(bgImage, 0,0,W,H);
    startScreen.style.display = 'none';
};

function setTool(m, id) {
    currentMode = m;
    document.querySelectorAll('.dock-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}
document.getElementById('brushBtn').onclick = () => setTool('brush', 'brushBtn');
document.getElementById('eraserBtn').onclick = () => setTool('eraser', 'eraserBtn');
document.getElementById('fillBtn').onclick = () => setTool('fill', 'fillBtn');
document.getElementById('textBtn').onclick = () => setTool('text', 'textBtn');

document.getElementById('undoBtn').onclick = undo;
document.getElementById('minimizeBtn').onclick = () => {
    document.querySelector('.mac-dock-container').classList.add('dock-hidden');
    document.getElementById('expandTrigger').style.display = 'flex';
};
document.getElementById('expandTrigger').onclick = () => {
    document.querySelector('.mac-dock-container').classList.remove('dock-hidden');
    document.getElementById('expandTrigger').style.display = 'none';
};
document.getElementById('saveBtn').onclick = () => {
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    const ctx = out.getContext('2d'); ctx.drawImage(bgCanvas, 0,0); ctx.drawImage(mainCanvas, 0,0);
    const a = document.createElement('a'); a.download = 'aether.png'; a.href = out.toDataURL(); a.click();
};
document.getElementById('exitBtn').onclick = () => location.reload();

document.getElementById('sizeSlider').oninput = (e) => {
    currentSize = e.target.value;
    const p = document.getElementById('brushPreview');
    p.style.width = currentSize/2 + 'px'; p.style.height = currentSize/2 + 'px';
};

window.addEventListener('keydown', (e) => { 
    if (e.code === 'Space') spacePressed = true;
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space') spacePressed = false; });

// --- HELPERS ---
function saveState() { undoStack.push(mainCtx.getImageData(0,0,W,H)); if(undoStack.length>35) undoStack.shift(); }
function undo() { if(undoStack.length>0) mainCtx.putImageData(undoStack.pop(), 0,0); }
function hexToRgb(h) { return { r: parseInt(h.slice(1,3),16), g: parseInt(h.slice(3,5),16), b: parseInt(h.slice(5,7),16) }; }

document.getElementById('bgUpload').onchange = (e) => {
    const r = new FileReader(); r.onload = (ev) => { const i = new Image(); i.onload = () => bgImage = i; i.src = ev.target.result; }; r.readAsDataURL(e.target.files[0]);
};

function floodFill(x, y, color) {
    const img = mainCtx.getImageData(0,0,W,H), d = img.data, sI = (y*W+x)*4;
    const r=d[sI], g=d[sI+1], b=d[sI+2], a=d[sI+3];
    if(r===color.r && g===color.g && b===color.b && a===255) return;
    const stack = [[x,y]];
    while(stack.length){
        const [cx, cy] = stack.pop(); const i = (cy*W+cx)*4;
        if(d[i]===r && d[i+1]===g && d[i+2]===b && d[i+3]===a){
            d[i]=color.r; d[i+1]=color.g; d[i+2]=color.b; d[i+3]=255;
            if(cx>0) stack.push([cx-1, cy]); if(cx<W-1) stack.push([cx+1, cy]);
            if(cy>0) stack.push([cx, cy-1]); if(cy<H-1) stack.push([cx, cy+1]);
        }
    }
    mainCtx.putImageData(img, 0,0);
}
