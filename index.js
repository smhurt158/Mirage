
class Brush {
    constructor({x, y, color, isCircle, angle, speed, colorSpeed, squareSize, targetColor}) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isCircle = isCircle;
        this.angle = angle;
        this.speed = speed;
        this.colorSpeed = colorSpeed;
        this.squareSize = squareSize;
        this.targetColor = targetColor;
    }

    draw(){
        let radius = this.squareSize / 2;
        let x = this.x;
        let y = this.y;
        let angle = this.angle;
        let currentColor = this.color;
        let targetColor = this.targetColor;
        let squareSize = this.squareSize;
        let colorSpeed = this.colorSpeed / 10;
        let isCircle = this.isCircle;
        let speed = this.speed;
        
        let dx = Math.cos(angle) * speed/10; 
        let dy = Math.sin(angle) * speed/10;

        for (let i = 0; i < 3; i++) {
            let current = currentColor[i];
            let target = targetColor[i];
            currentColor[i] = current < target ? Math.min(current + colorSpeed, target) : Math.max(current - colorSpeed, target);
        }

        if (currentColor[0] === targetColor[0] && currentColor[1] === targetColor[1] && currentColor[2] === targetColor[2]) {
            targetColor = generateRandomColor();
        }
        
        
        overlayContext.beginPath();
        if(showOutlines){
            overlayContext.strokeStyle = `rgba(0,0,0,255)`;
            if(isCircle){
                overlayContext.arc(x + radius, y + radius, radius, 0, 2 * Math.PI);
                overlayContext.stroke();
            }
            else{
                overlayContext.strokeRect(x, y, squareSize, squareSize);
            }
        }
        if(showCurrentColor){
            overlayContext.fillStyle = `rgba(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]}, 255)`;
            if(isCircle){
                overlayContext.arc(x + radius, y+radius, radius, 0, 2 * Math.PI);
                overlayContext.fill();
            }
            else{
                overlayContext.fillRect(x, y, squareSize, squareSize);
            }
        }
        const hiddenImageData = offScreenContext.getImageData(x, y, squareSize, squareSize).data;
        const visibleImageData = context.getImageData(x, y, squareSize, squareSize).data;

        for (let i = 0; i < squareSize; i++) {
            for (let j = 0; j < squareSize; j++) {
                if(isCircle && Math.pow(i - radius, 2) + Math.pow(j - radius, 2) > radius * radius) continue;
                const pixelIndex = ((j + i * squareSize) * 4);
                const hiddenColor = [hiddenImageData[pixelIndex], hiddenImageData[pixelIndex + 1], hiddenImageData[pixelIndex + 2]];
                const visibleColor = [visibleImageData[pixelIndex], visibleImageData[pixelIndex + 1], visibleImageData[pixelIndex + 2]];

                if (shouldDraw(currentColor, hiddenColor, visibleColor)) {
                    visibleImageData[pixelIndex] = currentColor[0];
                    visibleImageData[pixelIndex + 1] = currentColor[1];
                    visibleImageData[pixelIndex + 2] = currentColor[2];
                }
            }
        }
        context.putImageData(new ImageData(visibleImageData, squareSize, squareSize), x, y);

        x += dx; 
        y += dy;

        if (x < 0) { 
            angle = Math.PI - angle; x = 0; 
        }
        if (x + squareSize > canvas.width) {
            angle = Math.PI - angle; x = canvas.width - squareSize;
        }
        if (y < 0) { 
            angle = -angle; y = 0;
        }
        if (y + squareSize > canvas.height) { 
            angle = -angle; y = canvas.height - squareSize;
        }
        
        angle += (Math.random() - 0.5) * 0.1;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.color = currentColor;
        this.targetColor = targetColor;

    }
}


const imageLoader = document.getElementById('imageLoader');
const squareOutlineCheckbox = document.getElementById('square-outline-checkbox');
const squareCurrentColorCheckbox = document.getElementById('square-current-color-checkbox');
const useCirclesCheckbox = document.getElementById('use-circles-checkbox');
const squareSizeInput = document.getElementById('squareSize');
const colorSpeedInput = document.getElementById('colorSpeed');
const squareSpeedInput = document.getElementById('squareSpeed');
const numberOfSquaresInput = document.getElementById('numerOfSquares');
const drawingColorInput = document.getElementById('drawingColor');
const backgroundColorInput = document.getElementById('backgroundColor');
const drawingSizeInput = document.getElementById('drawingSize');
const drawIfCloserCheckbox = document.getElementById('drawIfCloser');

const canvasContainer = document.getElementById('canvasContainer');

const canvas = document.getElementById('canvas');
const overlayCanvas = document.getElementById('canvas-overlay');

const context = canvas.getContext('2d');
const overlayContext = overlayCanvas.getContext('2d');

const saveButton = document.getElementById('saveButton');

let isDrawing = false;

let drawingProcess;

let showOutlines;
let showCurrentColor;
let circles;
let squareSize;
let colorSpeed;
let squareSpeed;
let numberOfSquares;
let drawingColor;
let backgroundColor;
let drawingSize;
let drawIfCloser;

let squares = [];
let image = null;



// Off-screen canvas for the original image
const offScreenCanvas = document.createElement('canvas');
const offScreenContext = offScreenCanvas.getContext('2d');

window.onload = function() {
    if (imageLoader.files.length > 0) {
        handleImage({ target: imageLoader });
    }
    showOutlines = squareOutlineCheckbox.checked;
    showCurrentColor = squareCurrentColorCheckbox.checked;
    circles = useCirclesCheckbox.checked;
    squareSize = parseInt(squareSizeInput.value);
    colorSpeed = parseInt(colorSpeedInput.value);
    squareSpeed = parseInt(squareSpeedInput.value);
    numberOfSquares = parseInt(numberOfSquaresInput.value);
    drawingColor = drawingColorInput.value;
    backgroundColor = backgroundColorInput.value;
    drawingSize = parseInt(drawingSizeInput.value);
    drawIfCloser = drawIfCloserCheckbox.checked;
};

window.onresize = function() {
    const scale = Math.min(window.innerWidth / image.width, window.innerHeight / image.height) * .9;
    let w = image.width*scale;
    let h = image.height*scale;

    canvasContainer.style.width = `${w + 2}px`;
    canvasContainer.style.height = `${h + 2}px`;
    canvas.style.width = `${w + 2}px`;
    canvas.style.height = `${h + 2}px`;
    overlayCanvas.style.width = `${w + 2}px`;
    overlayCanvas.style.height = `${h + 2}px`;
}

imageLoader.addEventListener('change', handleImage, false);

function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        image = img;
        img.onload = function() {
            const scale = Math.min(window.innerWidth / img.width, window.innerHeight / img.height) * .9;
            const realWidth = img.width * scale;
            const realHeight = img.height * scale;
            canvasContainer.style.width = `${realWidth + 2}px`;
            canvasContainer.style.height = `${realHeight + 2}px`;
            canvas.style.width = `${realWidth + 2}px`;
            canvas.style.height = `${realHeight + 2}px`;
            overlayCanvas.style.width = `${realWidth + 2}px`;
            overlayCanvas.style.height = `${realHeight + 2}px`;

            canvas.width = img.width;
            canvas.height = img.height;
            context.fillStyle = backgroundColor;
            context.fillRect(0, 0, canvas.width, canvas.height);

            overlayCanvas.width = canvas.width;
            overlayCanvas.height = canvas.height;

            offScreenCanvas.width = img.width;
            offScreenCanvas.height = img.height;
            offScreenContext.drawImage(img, 0, 0, offScreenCanvas.width, offScreenCanvas.height);
            
            endSquareProcesses();
            startDrawingAnimation();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

canvas.addEventListener('mousedown', function(event) {
    if (event.button !== 0) return;
    isDrawing = true;
    draw(event);
});

canvas.addEventListener('mousemove', function(event) {
    if (isDrawing) {
        draw(event);
    }
});

canvas.addEventListener('mouseup', function(event) {
    if (event.button !== 0) return;
    isDrawing = false;
});

canvas.addEventListener('mouseout', function(event) {
    if (event.button !== 0) return;
    isDrawing = false;
});

squareOutlineCheckbox.addEventListener('change', function() {
    showOutlines = squareOutlineCheckbox.checked;
});

squareCurrentColorCheckbox.addEventListener('change', function() {
    showCurrentColor = squareCurrentColorCheckbox.checked;
});

useCirclesCheckbox.addEventListener('change', function() {    
    circles = useCirclesCheckbox.checked;
    for (let i = 0; i < squares.length; i++) {
        squares[i].isCircle = circles;
    }
});

squareSizeInput.addEventListener('change', function() {
    squareSize = parseInt(squareSizeInput.value);
    for (let i = 0; i < squares.length; i++) {
        squares[i].squareSize = squareSize;
    }
});

colorSpeedInput.addEventListener('change', function() {
    colorSpeed = parseInt(colorSpeedInput.value);
    for (let i = 0; i < squares.length; i++) {
        squares[i].colorSpeed = colorSpeed;
    }
});

squareSpeedInput.addEventListener('change', function() {
    squareSpeed = parseInt(squareSpeedInput.value);
    for (let i = 0; i < squares.length; i++) {
        squares[i].speed = squareSpeed;
    }
});

drawingColorInput.addEventListener('change', function() {
    drawingColor = drawingColorInput.value;
});

backgroundColorInput.addEventListener('change', function() {
    backgroundColor = backgroundColorInput.value;
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);
});

drawingSizeInput.addEventListener('change', function() {
    drawingSize = parseInt(drawingSizeInput.value);
});

drawIfCloserCheckbox.addEventListener('change', function() {
    drawIfCloser = drawIfCloserCheckbox.checked;
})



numberOfSquaresInput.addEventListener('change', function() {
    const newValue = parseInt(numberOfSquaresInput.value);
    if(newValue < numberOfSquares){
        for (let i = 0; i < numberOfSquares - newValue; i++) {
            squares.pop();
        }
    }
    else if(newValue > numberOfSquares){
        for (let i = 0; i < newValue - numberOfSquares; i++) {
            squares.push(new Brush({
                x: Math.floor(Math.random() * canvas.width),
                y: Math.floor(Math.random() * canvas.height),
                color: generateRandomColor(),
                isCircle: circles,
                angle: Math.random() * 2 * Math.PI,
                speed: squareSpeed,
                colorSpeed: colorSpeed,
                squareSize: squareSize,
                targetColor: generateRandomColor()
            }));
        }
    }
    numberOfSquares = newValue;
});

function endSquareProcesses(){
    squares = [];
    clearTimeout(drawingProcess);
}

function draw(event) {
    const width = drawingSize;
    const radius = width/2;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    if(drawIfCloser){
        const drawingColorArray = [
            parseInt(drawingColor.substring(1,3), 16), 
            parseInt(drawingColor.substring(3,5), 16), 
            parseInt(drawingColor.substring(5,7), 16)
        ]; 


        const hiddenImageData = offScreenContext.getImageData(x-radius, y -radius, width, width).data;
        const visibleImageData = context.getImageData(x-radius, y-radius, width, width).data;
    
        for (let i = 0; i < width; i++) {
            for (let j = 0; j < width; j++) {
                if(circles && Math.pow(i - radius, 2) + Math.pow(j - radius, 2) > radius * radius) continue;
                const pixelIndex = ((j + i * width) * 4);
                const hiddenColor = [hiddenImageData[pixelIndex], hiddenImageData[pixelIndex + 1], hiddenImageData[pixelIndex + 2]];
                const visibleColor = [visibleImageData[pixelIndex], visibleImageData[pixelIndex + 1], visibleImageData[pixelIndex + 2]];
                
                if (shouldDraw(drawingColorArray, hiddenColor, visibleColor)) {
                    visibleImageData[pixelIndex] = drawingColorArray[0];
                    visibleImageData[pixelIndex + 1] = drawingColorArray[1];
                    visibleImageData[pixelIndex + 2] = drawingColorArray[2];
                }
            }
        }
        context.putImageData(new ImageData(visibleImageData, width, width), x-radius, y-radius);
    }
    else{
        context.beginPath();
        context.fillStyle = drawingColor;
        if(circles){
            context.arc(x, y, radius, 0, 2 * Math.PI);
            context.fill();
        }
        else{
            context.fillRect(x-radius, y-radius, width, width);
        }

    }
}

function startDrawingAnimation() {
    for (let i = 0; i < numberOfSquares; i++) {
        squares.push(new Brush({
            x: Math.floor(Math.random() * canvas.width),
            y: Math.floor(Math.random() * canvas.height),
            color: generateRandomColor(),
            isCircle: circles,
            angle: Math.random() * 2 * Math.PI,
            speed: squareSpeed,
            colorSpeed: colorSpeed,
            squareSize: squareSize,
            targetColor: generateRandomColor()
        }));
    }
    tick();
}

function tick(){
    overlayContext.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < squares.length; i++) {
        squares[i].draw();
    }
    drawingProcess = setTimeout(tick, 10);
}

function updateColorComponent(current, target, step) {
    return current < target ? Math.min(current + step, target) : Math.max(current - step, target);
}

function shouldDraw(currentColor, hiddenColor, visibleColor) {
    const currentDistance = calculateDistanceSquared(currentColor, hiddenColor);
    const visibleDistance = calculateDistanceSquared(visibleColor,hiddenColor);

    return currentDistance < visibleDistance;
}

function calculateDistanceSquared(colorA, colorB) {
    return Math.pow(colorA[0] - colorB[0], 2) + 
            Math.pow(colorA[1] - colorB[1], 2) + 
            Math.pow(colorA[2] - colorB[2], 2);
}

function generateRandomColor() {
    return [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
    ];
}

saveButton.addEventListener('click', function() {
    const link = document.createElement('a');
    link.download = 'modified_image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
});