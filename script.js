// Seleccionar el botón y el audio
const startButton = document.getElementById('startButton');
const backgroundMusic = document.getElementById('backgroundMusic');

// Variable de control para la animación
let animationRunning = false;

// Evento de clic en el botón de inicio
startButton.addEventListener('click', () => {
    backgroundMusic.play().catch(error => {
        console.log('La reproducción automática fue bloqueada por el navegador:', error);
    });
    animationRunning = true; // Activar animación
    animate(); // Iniciar animación
    startButton.style.display = 'none'; // Ocultar el botón después de comenzar
});

// Configuración global
const GRAVITY = 0.05;
const BASE_FONT_SIZE = 100;
const BASE_CANVAS_WIDTH = 800;
const MIN_FONT_SIZE = 30;
const LINE_SPACING = 1.5;
const PARTICLE_COUNT = 100;
const PARTICLE_DECAY_MIN = 0.005;
const PARTICLE_DECAY_MAX = 0.015;

// Variables para fuegos artificiales y partículas
let fireworks = [];
let particles = [];

// Variables para texto
let textPoints = [];

// Obtención de canvas y contexto
const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');
const textCanvas = document.getElementById('textCanvas');
const textCtx = textCanvas.getContext('2d', { willReadFrequently: true }); // Optimización

/**
 * Ajusta el tamaño del canvas al tamaño de la ventana.
 */
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    textCanvas.width = canvas.width;
    textCanvas.height = canvas.height;

    updateTextCoordinates();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/**
 * Calcula el tamaño de fuente dinámico basado en el ancho del canvas.
 * @returns {number} Tamaño de la fuente.
 */
function getDynamicFontSize() {
    const scaleFactor = canvas.width / BASE_CANVAS_WIDTH;
    return Math.max(BASE_FONT_SIZE * scaleFactor, MIN_FONT_SIZE);
}

/**
 * Actualiza las coordenadas de las frases.
 */
function updateTextCoordinates() {
    const fontSize = getDynamicFontSize();
    const totalHeight = fontSize * LINE_SPACING * 2; // Espacio para dos líneas de texto
    const centerY = canvas.height / 2;

    const textPoints1 = getTextCoordinates('Oye tuuu, si tuu, quiero que sepas que... ', fontSize, centerY - totalHeight / 1);
    const textPoints2 = getTextCoordinates('Mañana te llevare a pasear y a pasarla bonito por tu dia.🌻', fontSize, centerY + totalHeight / 1);

    textPoints = textPoints1.concat(textPoints2);
}

/**
 * Genera las coordenadas para renderizar el texto en puntos.
 * @param {string} text - El texto a convertir.
 * @param {number} fontSize - Tamaño de la fuente.
 * @param {number} centerY - Coordenada Y central del texto.
 * @returns {Array} Arreglo de puntos (x, y) del texto.
 */
function getTextCoordinates(text, fontSize, centerY) {
    textCtx.clearRect(0, 0, textCanvas.width, textCanvas.height);
    textCtx.font = `${fontSize}px 'Georgia'`;
    textCtx.fillStyle = 'white';
    textCtx.textAlign = 'center';
    textCtx.textBaseline = 'middle';

    const lines = wrapText(text, textCanvas.width - 20, fontSize);
    const lineHeight = fontSize * LINE_SPACING;
    const startY = centerY - (lines.length - 1) * lineHeight / 2;

    lines.forEach((line, index) => {
        textCtx.fillText(line, textCanvas.width / 2, startY + index * lineHeight);
    });

    const imageData = textCtx.getImageData(0, 0, textCanvas.width, textCanvas.height);
    const points = [];

    for (let y = 0; y < textCanvas.height; y++) {
        for (let x = 0; x < textCanvas.width; x++) {
            const index = (y * textCanvas.width + x) * 4;
            if (imageData.data[index] > 200) {
                points.push({ x, y });
            }
        }
    }

    return points;
}

/**
 * Divide el texto en líneas ajustadas al ancho máximo permitido.
 * @param {string} text - El texto a dividir.
 * @param {number} maxWidth - Ancho máximo permitido para una línea.
 * @returns {Array} Líneas resultantes.
 */
function wrapText(text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = textCtx.measureText(`${currentLine} ${word}`).width;
        if (width < maxWidth) {
            currentLine += ` ${word}`;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

/**
 * Clase Fuego Artificial.
 */
class Firework {
    constructor(x, y, targetY, color) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.speed = Math.random() * 5 + 5;
        this.coordinates = Array(5).fill([x, y]);
        this.exploded = false;
        this.color = color;
    }

    update() {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        if (this.y <= this.targetY) {
            this.exploded = true;
            this.explode();
        } else {
            this.y -= this.speed;
        }
    }

    explode() {
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;

            // Asignar un objetivo aleatorio de textPoints
            const target = textPoints[Math.floor(Math.random() * textPoints.length)];
            particles.push(new Particle(this.x, this.y, this.color, angle, speed, target));
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

/**
 * Clase Partícula.
 */
class Particle {
    constructor(x, y, color, angle, speed, target) {
        this.x = x;
        this.y = y;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
        this.alpha = 1;
        this.decay = Math.random() * (PARTICLE_DECAY_MAX - PARTICLE_DECAY_MIN) + PARTICLE_DECAY_MIN;
        this.size = Math.random() * 1 + 2;
        this.color = color;
        this.target = target; // Objetivo al que debe converger la partícula
        this.hasReachedTarget = false; // Indicador para saber si llegó al objetivo
    }

    update() {
        if (!this.hasReachedTarget) {
            // Explosión inicial
            this.velocityY += GRAVITY;
            this.x += this.velocityX;
            this.y += this.velocityY;
            this.alpha -= this.decay;

            // Verificar si debe moverse al objetivo
            if (this.alpha <= 0.5) {
                this.hasReachedTarget = true;
            }
        } else if (this.target) {
            // Movimiento hacia el objetivo
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;

            this.x += dx * 0.02; // Velocidad hacia el objetivo
            this.y += dy * 0.02;

            // Detener el movimiento si está cerca del objetivo
            if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
                this.target = null; // Detener el movimiento
            }
        }
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.restore();
    }
}

/**
 * Genera un color aleatorio.
 * @returns {string} Color HSL aleatorio.
 */
function getRandomColor() {
    return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

/**
 * Lanza un fuego artificial.
 */
function launchFirework() {
    const x = Math.random() * canvas.width;
    const y = canvas.height;
    const targetY = Math.random() * (canvas.height / 2);
    const color = getRandomColor();
    fireworks.push(new Firework(x, y, targetY, color));
}

/**
 * Ciclo de animación.
 */
function animate() {
    if (!animationRunning) return; // Detener animación si no está activa
    requestAnimationFrame(animate);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.globalCompositeOperation = 'lighter';

    if (Math.random() < 0.05) launchFirework();

    fireworks = fireworks.filter(firework => {
        firework.update();
        firework.draw();
        return !firework.exploded;
    });

    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.alpha > 0 || particle.target !== null;
    });
}

// Inicia la animación
window.onload = animate;

// Evento de clic para lanzar fuegos artificiales manualmente
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = canvas.height;
    const targetY = Math.random() * (canvas.height / 2);
    const color = getRandomColor();
    fireworks.push(new Firework(x, y, targetY, color));
});