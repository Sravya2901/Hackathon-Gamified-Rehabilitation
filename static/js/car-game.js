window.onload = async () => {
  const canvas = document.getElementById("gameCanvas");
  const poseCanvas = document.getElementById("poseCanvas");
  const poseCtx = poseCanvas.getContext("2d");

  const ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const carWidth = 100;
  const carHeight = 160;
  let carX = canvas.width / 2 - carWidth / 2;
  const carY = canvas.height - 180;

  let score = 0;
  let timeLeft = 20;
  let gameOver = false;

  let obstacles = [];
  let stream = null;

  const carImg = new Image();
  const busImg = new Image();
  const bgImg = new Image();

  carImg.src = "static/images/car.png";
  busImg.src = "static/images/hours.png";
  bgImg.src = "static/images/city-street.jpg";
  let collided = false;
  await Promise.all([
    new Promise((res) => (carImg.onload = res)),
    new Promise((res) => (busImg.onload = res)),
    new Promise((res) => (bgImg.onload = res)),
  ]);
  function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Adjust the rate of speech (1 is normal speed)
    utterance.pitch = 1; // Adjust the pitch (1 is normal pitch)
    speechSynthesis.speak(utterance);
  }
  let video = document.createElement("video");
  let detector;

  async function setupCamera() {
    speak(
      "Try to engage your whole body by moving left or right, your body movements defines the movement of car. All the best!!"
    );
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    return new Promise((resolve) => {
      video.onloadeddata = () => resolve(video);
    });
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
  function showFeedback(message) {
    const feedback = document.getElementById("feedback");
    feedback.textContent = message;
    setTimeout(() => (feedback.textContent = ""), 1500);
  }

  function createObstacle() {
    return {
      progress: 0.4, // Start closer to the road, closer to the visible area
      offsetX: (Math.random() - 0.5) * 2, // Small deviation from center\
      dodged: false,
    };
  }

  function drawCar() {
    ctx.drawImage(carImg, carX, carY, carWidth, carHeight);
  }

  function drawObstacle(ob) {
    const roadTopY = 200;
    const roadBottomY = canvas.height;
    const roadTopWidth = canvas.width * 0.1;
    const roadBottomWidth = canvas.width * 0.55;
    const roadCenterX = canvas.width / 2;

    const progress = ob.progress;

    // Position along the road
    const y = roadTopY + (roadBottomY - roadTopY) * progress;
    const currentRoadWidth =
      roadTopWidth + (roadBottomWidth - roadTopWidth) * progress;

    // X fixed around center with slight offset
    const x = roadCenterX + ob.offsetX * currentRoadWidth;

    // Bus scale
    const scale = 0.3 + 0.7 * progress;
    const width = 100 * scale;
    const height = 120 * scale;

    ctx.drawImage(busImg, x - width / 2, y - height / 2, width, height);

    // Move it slowly forward
    ob.progress += 0.003 + score * 0.0002; // Slower speed

    // Remove obstacle if it has moved off the screen
    if (ob.progress >= 1.05) {
      obstacles.splice(obstacles.indexOf(ob), 1);
      score++;
      showFeedback("Nice dodge!");
    }
  }

  function checkCollision(ob) {
    const obY = 200 + (canvas.height - 200) * ob.progress;
    const obScale = 0.3 + 0.7 * ob.progress;
    const obW = 100 * obScale;
    const obH = 120 * obScale;

    const obX =
      canvas.width / 2 +
      ob.offsetX *
        (canvas.width * 0.1 +
          (canvas.width * 0.55 - canvas.width * 0.1) * ob.progress);
    const carHitbox = {
      x: carX + 20,
      y: carY + 20,
      width: carWidth - 40,
      height: carHeight - 40,
    };

    const obHitbox = {
      x: obX - obW / 2 + 20,
      y: obY - obH / 2 + 20,
      width: obW - 40,
      height: obH - 40,
    };

    const collision =
      carHitbox.x < obHitbox.x + obHitbox.width &&
      carHitbox.x + carHitbox.width > obHitbox.x &&
      carHitbox.y < obHitbox.y + obHitbox.height &&
      carHitbox.y + carHitbox.height > obHitbox.y;

    if (collision) {
      collided = true;
      ob.dodged = false;

      endGame();
      return true;
    }

    return false;
  }

  function updatePositionFromPose(pose) {
    if (!pose || pose.keypoints.length < 12) return;

    const kp = {};
    pose.keypoints.forEach((p) => (kp[p.name] = p));

    if (kp.left_shoulder && kp.right_shoulder) {
      const midX = (kp.left_shoulder.x + kp.right_shoulder.x) / 2;
      const normalizedX = (midX / video.videoWidth) * canvas.width;
      carX += (canvas.width - normalizedX - carWidth / 2 - carX) * 0.2;
      carX = Math.max(0, Math.min(canvas.width - carWidth, carX));
    }
  }

  async function runPoseDetection() {
    poseCtx.clearRect(0, 0, poseCanvas.width, poseCanvas.height);

    const poses = await detector.estimatePoses(video);
    if (poses.length > 0) {
      updatePositionFromPose(poses[0]);

      // Draw video frame into small canvas
      poseCtx.drawImage(video, 0, 0, poseCanvas.width, poseCanvas.height);

      // Draw red dots for keypoints
      poses[0].keypoints.forEach((keypoint) => {
        if (keypoint.score > 0.3) {
          const x = (keypoint.x / video.videoWidth) * poseCanvas.width;
          const y = (keypoint.y / video.videoHeight) * poseCanvas.height;
          poseCtx.beginPath();
          poseCtx.arc(x, y, 4, 0, 2 * Math.PI);
          poseCtx.fillStyle = "red";
          poseCtx.fill();
        }
      });
    }

    if (!gameOver) requestAnimationFrame(runPoseDetection);
  }

  function gameLoop() {
    if (gameOver) return;

    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    drawCar();

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const ob = obstacles[i];
      drawObstacle(ob);

      // Check for collision
      if (checkCollision(ob)) {
        return; // End the game if there's a collision
      }

      // Remove obstacle if it reached the bottom
      if (ob.progress >= 1.05 && !ob.dodged) {
        ob.dodged = true;
        obstacles.splice(i, 1);
        const phrases = [
          "Great Move",
          "Nice one",
          "Well dodged",
          "Awesome",
          "You seem to be a good driver",
        ];
        const phrase = phrases[Math.floor(Math.random() * phrases.length)];
        score++;
        showFeedback("Great move!");
        speak(phrase);
      }
    }

    document.getElementById("score").textContent = `Score: ${score}`;
    requestAnimationFrame(gameLoop);
  }

  function showGameOverScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "white";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", canvas.width / 2, canvas.height / 2 - 40);
    ctx.font = "bold 40px Arial";
    ctx.fillText(
      `Your Score: ${score}`,
      canvas.width / 2,
      canvas.height / 2 + 20
    );
  }

  function endGame() {
    gameOver = true;
    // speak("No worries, Try harder next time.");
    if (collided) {
      speak("No worries, try harder next time");
    } else {
      speak("Great, you are maintaining a good posture and improving");
    }
    stopCamera();
    showGameOverScreen();
  }

  async function startGame() {
    await setupCamera();
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet
    );
    runPoseDetection();
    gameLoop();

    setInterval(() => {
      if (!gameOver && Math.random() > 0.3) {
        obstacles.push(createObstacle());
      }
    }, 800);

    const countdown = setInterval(() => {
      if (timeLeft > 0) {
        timeLeft--;
        document.getElementById(
          "timer"
        ).textContent = `⏱️ Time Left: ${timeLeft}s`;
      } else {
        clearInterval(countdown);
        endGame();
        // speak("No worries, Try harder next time.");
      }
    }, 1000);
  }

  startGame();
};
