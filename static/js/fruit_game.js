const video = document.getElementById("video");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let lives = 3;
let fruits = [];
let slicedFruits = [];
let explosions = [];

// Determine the base URL dynamically to handle different hosting environments
const baseUrl = window.location.pathname.includes("/static/")
  ? "/"
  : "/static/";

// Get score and lives elements
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");

// Position score and lives for better visibility during gameplay
// Remove existing score and lives elements if they exist
if (scoreEl) scoreEl.remove();
if (livesEl) livesEl.remove();

// Create new score and lives elements with proper styling
const scoreDisplay = document.createElement("div");
scoreDisplay.id = "score";
scoreDisplay.style.position = "absolute";
scoreDisplay.style.top = "30px";
scoreDisplay.style.left = "30px";
scoreDisplay.style.fontSize = "28px";
scoreDisplay.style.fontWeight = "bold";
scoreDisplay.style.color = "white";
scoreDisplay.style.textShadow =
  "2px 2px 4px #000, -2px -2px 4px #000, 2px -2px 4px #000, -2px 2px 4px #000";
scoreDisplay.style.zIndex = "1000";
document.body.appendChild(scoreDisplay);

const livesDisplay = document.createElement("div");
livesDisplay.id = "lives";
livesDisplay.style.position = "absolute";
livesDisplay.style.top = "30px";
livesDisplay.style.right = "30px";
livesDisplay.style.fontSize = "28px";
livesDisplay.style.fontWeight = "bold";
livesDisplay.style.color = "white";
livesDisplay.style.textShadow =
  "2px 2px 4px #000, -2px -2px 4px #000, 2px -2px 4px #000, -2px 2px 4px #000";
livesDisplay.style.zIndex = "1000";
document.body.appendChild(livesDisplay);

scoreDisplay.textContent = `Score: ${score}`;
livesDisplay.textContent = `Lives: ${lives}`;

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.2; // Adjust the rate of speech (1 is normal speed)
  utterance.pitch = 1; // Adjust the pitch (1 is normal pitch)
  speechSynthesis.speak(utterance);
}
speak(
  "Slice as many fruits as possible. This improves your hand and eye co-ordination"
);
// Start webcam
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    video.onloadedmetadata = () => {
      video.play();
    };
  })
  .catch((error) => {
    console.error("Webcam error:", error);
    alert(
      "Camera access is required to play this game. Please allow camera access and reload the page."
    );
  });

// Hand tracking
const hands = new Hands({
  locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

let handX = 0,
  handY = 0;
hands.onResults((results) => {
  if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
    const tip = results.multiHandLandmarks[0][8]; // Index finger tip
    handX = (1 - tip.x) * canvas.width; // Invert x-axis after flipping
    handY = tip.y * canvas.height;
  }
});

const camera = new Camera(video, {
  onFrame: async () => await hands.send({ image: video }),
  width: canvas.width,
  height: canvas.height,
});
camera.start();

// Fruit/bomb spawner
function spawnFruitOrBomb() {
  const isBomb = Math.random() < 0.2;
  const x = Math.random() * (canvas.width - 100);
  const y = canvas.height + 100;
  const speed = Math.random() * 3 + 2;

  if (isBomb) {
    const img = new Image();
    img.src = `${baseUrl}assets/bomb.png`;
    img.onerror = () =>
      console.error(`Failed to load bomb image from ${img.src}`);
    fruits.push({ x, y, speed, img, isBomb: true, sliced: false });
  } else {
    const types = ["apple", "banana", "pineapple"];
    const type = types[Math.floor(Math.random() * types.length)];
    const img = new Image();
    img.src = `${baseUrl}assets/${type}.png`;
    img.onerror = () =>
      console.error(`Failed to load ${type} image from ${img.src}`);
    fruits.push({ x, y, speed, img, isBomb: false, sliced: false, type });
  }
}

// Check for fruits that went off-screen
function checkMissedFruits() {
  for (let i = fruits.length - 1; i >= 0; i--) {
    if (fruits[i].y < -100) {
      // Remove fruits that have gone off-screen
      // No penalty for missed fruits
      fruits.splice(i, 1);
    }
  }
}

// Main game loop
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Flip canvas and draw webcam
  ctx.save();
  ctx.scale(-1, 1); // Flip horizontally
  ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
  ctx.restore();

  // Update fruit positions
  fruits.forEach((fruit, index) => {
    fruit.y -= fruit.speed;
    ctx.drawImage(fruit.img, fruit.x, fruit.y, 80, 80);

    const dist = Math.hypot(handX - (fruit.x + 40), handY - (fruit.y + 40));
    if (dist < 50 && !fruit.sliced) {
      fruit.sliced = true;

      const now = Date.now();
      if (fruit.isBomb) {
        lives--;
        if (lives == 2) {
          speak("Oops! You are hitting the bombs. Be careful!");
        }
        if (lives == 1) {
          speak("Use your wrist properly. You will succeed");
        }
        explosions.push({ x: fruit.x, y: fruit.y, time: now });
      } else {
        score += 2;
        slicedFruits.push({
          x: fruit.x,
          y: fruit.y,
          img1: `${baseUrl}assets/${fruit.type}_half_1.png`,
          img2: `${baseUrl}assets/${fruit.type}_half_2.png`,
          time: now,
        });
      }

      fruits.splice(index, 1);
      updateUI();
    }
  });

  // Check for missed fruits
  checkMissedFruits();

  drawSlicedFruits();
  drawExplosions();
  drawHandPointer();

  if (lives <= 0) return gameOver();
  requestAnimationFrame(draw);
}

function drawHandPointer() {
  ctx.beginPath();
  ctx.arc(handX, handY, 12, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
}

function drawSlicedFruits() {
  const now = Date.now();
  slicedFruits = slicedFruits.filter((f) => now - f.time < 1000);
  slicedFruits.forEach((fruit) => {
    const img1 = new Image();
    const img2 = new Image();
    img1.src = fruit.img1;
    img2.src = fruit.img2;
    ctx.drawImage(img1, fruit.x - 20, fruit.y, 40, 40);
    ctx.drawImage(img2, fruit.x + 40, fruit.y, 40, 40);
  });
}

function drawExplosions() {
  const now = Date.now();
  const explosionImg = new Image();
  explosionImg.src = `${baseUrl}assets/explosion.png`;
  explosions = explosions.filter((e) => now - e.time < 500);
  explosions.forEach((e) => {
    ctx.drawImage(explosionImg, e.x - 20, e.y - 20, 100, 100);
  });
}

function updateUI() {
  scoreDisplay.textContent = `Score: ${score}`;
  livesDisplay.textContent = `Lives: ${lives}`;
}

function gameOver() {
  speak("Lives Over. No worries, Try harder next time.");
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "48px Arial";
  ctx.fillText("Game Over!", canvas.width / 2 - 150, canvas.height / 2);
  ctx.font = "32px Arial";
  ctx.fillText(
    `Final Score: ${score}`,
    canvas.width / 2 - 120,
    canvas.height / 2 + 60
  );
}

// Show a message about camera access
function showCameraMessage() {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  ctx.font = "24px Arial";
  ctx.fillText(
    "Please allow camera access to play",
    canvas.width / 2 - 200,
    canvas.height / 2
  );
}

// Check camera access
if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
  showCameraMessage();
  console.error("Camera access not available");
} else {
  // Start the game
  setInterval(spawnFruitOrBomb, 1200);
  draw();
}
