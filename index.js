
const imageLoader = document.getElementById('imageLoader');
const squareOutlineCheckbox = document.getElementById('square-outline-checkbox');
const squareCurrentColorCheckbox = document.getElementById('square-current-color-checkbox');
const useCirclesCheckbox = document.getElementById('use-circles-checkbox');
const squareSizeInput = document.getElementById('squareSize');
const colorSpeedInput = document.getElementById('colorSpeed');
const squareSpeedInput = document.getElementById('squareSpeed');
const numberOfSquaresInput = document.getElementById('numerOfSquares');

const canvasContainer = document.getElementById('canvasContainer');

const canvas = document.getElementById('canvas');
const overlayCanvas = document.getElementById('canvas-overlay');

const context = canvas.getContext('2d');
const overlayContext = overlayCanvas.getContext('2d');

const saveButton = document.getElementById('saveButton');

let isDrawing = false;

const squareProcesses = [];

let showOutlines;
let showCurrentColor;
let circles;
let squareSize;
let colorSpeed;
let squareSpeed;
let numberOfSquares;


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
};

window.onresize = function() {
    
}

imageLoader.addEventListener('change', handleImage, false);

function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const scale = Math.min(window.innerWidth / img.width, window.innerHeight / img.height);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;

            overlayCanvas.width = canvas.width;
            overlayCanvas.height = canvas.height;
            //context.drawImage(img, 0, 0, canvas.width, canvas.height);
            context.fillStyle = `rgba(255, 255, 255, 255)`;
            context.fillRect(0, 0, canvas.width, canvas.height);

            //overlayContext.fillStyle = `rgba(0, 0, 0, .5)`;
            //overlayContext.fillRect(0, 0, canvas.width, canvas.height);
            overlayCanvas.lineWidth = 2;

            canvasContainer.style.width = `${canvas.width + 2}px`;
            canvasContainer.style.height = `${canvas.height + 2}px`;
            canvas.style.width = `${canvas.width + 2}px`;
            canvas.style.height = `${canvas.height + 2}px`;
            overlayCanvas.style.width = `${canvas.width + 2}px`;
            overlayCanvas.style.height = `${canvas.height + 2}px`;

            // Draw the image to the off-screen canvas
            offScreenCanvas.width = img.width * scale;
            offScreenCanvas.height = img.height * scale;
            offScreenContext.drawImage(img, 0, 0, offScreenCanvas.width, offScreenCanvas.height);
            endSquareProcesses();
            startDrawingAnimation();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
}

canvas.addEventListener('mousedown', function(event) {
    isDrawing = true;
    draw(event);
});

canvas.addEventListener('mousemove', function(event) {
    if (isDrawing) {
        draw(event);
    }
});

canvas.addEventListener('mouseup', function() {
    isDrawing = false;
});

canvas.addEventListener('mouseout', function() {
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
});

squareSizeInput.addEventListener('change', function() {
    squareSize = parseInt(squareSizeInput.value);
});

colorSpeedInput.addEventListener('change', function() {
    colorSpeed = parseInt(colorSpeedInput.value);
});

squareSpeedInput.addEventListener('change', function() {
    squareSpeed = parseInt(squareSpeedInput.value);
});



numberOfSquaresInput.addEventListener('change', function() {
    const newValue = parseInt(numberOfSquaresInput.value);
    if(newValue < numberOfSquares){
        for (let i = 0; i < numberOfSquares - newValue; i++) {
            clearTimeout(squareProcesses.pop());
        }
    }
    else if(newValue > numberOfSquares){
        for (let i = 0; i < newValue - numberOfSquares; i++) {
            startSquare();
        }
    }
    numberOfSquares = newValue;
});

function endSquareProcesses(){
    for (let i = 0; i < squareProcesses.length; i++) {
        clearTimeout(squareProcesses[i]);
    }
}

function draw(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);

    const purpleColor = [128, 0, 128, 255];
    context.fillStyle = `rgba(${purpleColor[0]}, ${purpleColor[1]}, ${purpleColor[2]}, ${purpleColor[3]})`;
    context.fillRect(x, y, 100, 100);
}

function startDrawingAnimation() {
    for (let i = 0; i < numberOfSquares; i++) {
        startSquare(i);
    }
}

function startSquare() {
    let x = Math.floor(Math.random() * canvas.width);
    let y = Math.floor(Math.random() * canvas.height);
    let angle = Math.random() * 2 * Math.PI;
    let dx = Math.cos(angle) * squareSpeed/10; 
    let dy = Math.sin(angle) * squareSpeed/10;
    let currentColor = generateRandomColor();
    let targetColor = generateRandomColor();

    function drawPixel() {
        let currSquareSize = squareSize;
        let radius = currSquareSize / 2;
        for (let i = 0; i < 3; i++) {
            currentColor[i] = updateColorComponent(currentColor[i], targetColor[i], colorSpeed / 10);
        }

        const hiddenImageData = offScreenContext.getImageData(x, y, currSquareSize, currSquareSize).data;
        const visibleImageData = context.getImageData(x, y, currSquareSize, currSquareSize).data;
        
        overlayContext.beginPath();
        if(showOutlines){
            overlayContext.strokeStyle = `rgba(0,0,0,255)`;
            if(circles){
                overlayContext.arc(x + radius, y+radius, radius, 0, 2 * Math.PI);
                overlayContext.stroke();
            }
            else{
                overlayContext.strokeRect(x, y, currSquareSize, currSquareSize);
            }
        }
        if(showCurrentColor){
            overlayContext.fillStyle = `rgba(${currentColor[0]}, ${currentColor[1]}, ${currentColor[2]}, 255)`;
            if(circles){
                overlayContext.arc(x + radius, y+radius, radius, 0, 2 * Math.PI);
                overlayContext.fill();
            }
            else{
                overlayContext.fillRect(x, y, currSquareSize, currSquareSize);
            }
            
        }
        if(showOutlines || showCurrentColor){
            const lastX = x;
            const lastY = y;
            const lastCircles = circles;
            setTimeout(()=> {
                if(lastCircles){
                    //TODO: Clear as circle
                }
                overlayContext.clearRect(lastX-2, lastY-2, currSquareSize + 4, currSquareSize + 4);
            }, 10);
        }

        for (let i = 0; i < currSquareSize; i++) {
            for (let j = 0; j < currSquareSize; j++) {
                if(circles && Math.pow(i - radius, 2) + Math.pow(j - radius, 2) > radius * radius) continue;
                const pixelIndex = ((j + i * currSquareSize) * 4);
                const hiddenColor = [hiddenImageData[pixelIndex], hiddenImageData[pixelIndex + 1], hiddenImageData[pixelIndex + 2]];
                const visibleColor = [visibleImageData[pixelIndex], visibleImageData[pixelIndex + 1], visibleImageData[pixelIndex + 2]];

                if (shouldDraw(currentColor, hiddenColor, visibleColor)) {
                    visibleImageData[pixelIndex] = currentColor[0];
                    visibleImageData[pixelIndex + 1] = currentColor[1];
                    visibleImageData[pixelIndex + 2] = currentColor[2];
                }
            }
        }
        context.putImageData(new ImageData(visibleImageData, currSquareSize, currSquareSize), x, y);

        x += dx; 
        y += dy;

        if (x < 0) { 
            angle = Math.PI - angle; x = 0; 
        }
        if (x + currSquareSize > canvas.width) {
            angle = Math.PI - angle; x = canvas.width - currSquareSize;
        }
        if (y < 0) { 
            angle = -angle; y = 0;
        }
        if (y + currSquareSize > canvas.height) { 
            angle = -angle; y = canvas.height - currSquareSize;
        }
        
        angle += (Math.random() - 0.5) * 0.1;
        dx = Math.cos(angle) * squareSpeed/10; 
        dy = Math.sin(angle) * squareSpeed/10; 

        if (currentColor[0] === targetColor[0] && currentColor[1] === targetColor[1] && currentColor[2] === targetColor[2]) {
            targetColor = generateRandomColor();
        }

        squareProcesses.push(setTimeout(drawPixel, 10));
    }

    drawPixel(); 
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