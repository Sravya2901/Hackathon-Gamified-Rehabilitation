window.onload = () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
  
    let model;
    let video;
    let balloons = [];
    let frameCount = 0;
    let lastFingerTip = null;
    let smoothedFingerTip = null;
    let timeLeft = 60; // seconds
    let score = 0;
    let handPrediction = null; // Store the most recent prediction
    
    // Position history for better smoothing
    let positionHistory = [];
    const historyLength = 5; // Keep track of 5 recent positions
  
    async function setupCamera() {
      video = document.createElement('video');
      video.width = canvas.width;
      video.height = canvas.height;
      video.autoplay = true;
      speak("Raise your hand in front of the camera with your index finger extended, Move your hand to touch the balloons and pop them before the timer runs out, All the Best!")
  
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
  
        return new Promise((resolve) => {
          video.onloadeddata = () => resolve(video);
        });
      } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Unable to access your camera. Please make sure you have a camera connected and have granted permission.');
        throw error;
      }
    }
    function speak(text) {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 1; // Adjust the rate of speech (1 is normal speed)
          utterance.pitch = 2; // Adjust the pitch (1 is normal pitch)

          speechSynthesis.speak(utterance);
        }
  
    function createBalloon() {
      // Random colors for balloons
      const colors = ['#FF6B6B', '#4C6EF5', '#20c997', '#7950f2', '#fd7e14'];
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + 50,
        radius: 30 + Math.random() * 15, // Varying sizes
        speed: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)]
      };
    }
  
    function drawBalloon(balloon) {
      // Draw balloon body
      ctx.beginPath();
      ctx.fillStyle = balloon.color;
      ctx.arc(balloon.x, balloon.y, balloon.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw balloon knot
      ctx.beginPath();
      ctx.fillStyle = '#343a40';
      ctx.arc(balloon.x, balloon.y + balloon.radius + 5, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw balloon string
      ctx.beginPath();
      ctx.strokeStyle = '#343a40';
      ctx.lineWidth = 2;
      ctx.moveTo(balloon.x, balloon.y + balloon.radius + 5);
      ctx.lineTo(balloon.x, balloon.y + balloon.radius + 20);
      ctx.stroke();
    }
  
    function isCollision(balloon, fingerX, fingerY) {
      const dx = balloon.x - fingerX;
      const dy = balloon.y - fingerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Increased sensitivity by using a larger collision area
      return distance < balloon.radius * 1.0; // Increased to 1.0 for better responsiveness
    }
    
    // Calculate average position from history
    function getAveragePosition() {
      if (positionHistory.length === 0) return null;
      
      const avg = [0, 0, 0];
      for (const pos of positionHistory) {
        avg[0] += pos[0];
        avg[1] += pos[1];
        avg[2] += pos[2];
      }
      
      return [
        avg[0] / positionHistory.length,
        avg[1] / positionHistory.length,
        avg[2] / positionHistory.length
      ];
    }
    
    // Continuously run hand detection in the background
    async function continuousHandDetection() {
      try {
        const predictions = await model.estimateHands(video, true);
        if (predictions.length > 0) {
          handPrediction = predictions[0];
        }
        // Immediately request the next frame of hand detection
        requestAnimationFrame(continuousHandDetection);
      } catch (error) {
        console.error('Hand detection error:', error);
        // If there's an error, still continue the detection loop
        requestAnimationFrame(continuousHandDetection);
      }
    }
  
    function updateFingerPosition() {
      // Use the most recent prediction if available
      if (handPrediction) {
        const newFingerTip = handPrediction.landmarks[8];
        
        // Add the new position to history
        positionHistory.push([...newFingerTip]);
        
        // Keep history at the specified length
        if (positionHistory.length > historyLength) {
          positionHistory.shift();
        }
        
        // Get the averaged position
        const avgPosition = getAveragePosition();
        
        // Further smooth with the last position if available
        if (!smoothedFingerTip) {
          smoothedFingerTip = [...avgPosition];
        } else {
          // Apply stronger smoothing with 0.85 weight to new position
          smoothedFingerTip[0] = smoothedFingerTip[0] * 0.15 + avgPosition[0] * 0.85;
          smoothedFingerTip[1] = smoothedFingerTip[1] * 0.15 + avgPosition[1] * 0.85;
          smoothedFingerTip[2] = smoothedFingerTip[2] * 0.15 + avgPosition[2] * 0.85;
        }
        
        lastFingerTip = [...smoothedFingerTip];
      }
      
      return smoothedFingerTip || lastFingerTip;
    }
  
    async function gameLoop() {
      // First, draw the camera feed with horizontal flipping
      ctx.save();
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      // Semi-transparent overlay to make balloons more visible
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  
      // Update finger position every frame using the most recent prediction
      const fingerTip = updateFingerPosition();
  
      for (let i = balloons.length - 1; i >= 0; i--) {
        let b = balloons[i];
        b.y -= b.speed;
        drawBalloon(b);
  
        // Remove balloons that go offscreen
        if (b.y < -50) {
          balloons.splice(i, 1);
          continue;
        }
  
        // Check for collisions with finger
        if (fingerTip && isCollision(b, fingerTip[0], fingerTip[1])) {
          // Add pop animation
          ctx.beginPath();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.arc(b.x, b.y, b.radius * 1.5, 0, Math.PI * 2);
          ctx.fill();
          
          balloons.splice(i, 1);
          score++;
        }
      }
  
      // Display score
      ctx.fillStyle = '#343a40';
      ctx.font = 'bold 24px Poppins';
      ctx.textAlign = 'left';
      ctx.fillText(`Score: ${score}`, 20, 40);
  
      // Draw finger cursor
      if (fingerTip) {
        // Draw cursor trail for smoother visual appearance
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 50, 50, 0.3)';  // Transparent red for trail
        ctx.arc(fingerTip[0], fingerTip[1], 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Larger, more visible cursor for better feedback
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 50, 50, 0.7)';  // Red for better visibility
        ctx.arc(fingerTip[0], fingerTip[1], 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';  // White inner circle
        ctx.arc(fingerTip[0], fingerTip[1], 8, 0, Math.PI * 2);
        ctx.fill();
      }
  
      const timerDisplay = document.getElementById("timer");
      if (timerDisplay) {
        timerDisplay.textContent = `⏱️ Time Left: ${timeLeft}s`;
      }
  
      if (timeLeft > 0) {
        requestAnimationFrame(gameLoop);
      } else {
        // Game over display
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width/2, canvas.height/2 - 50);
        
        ctx.font = 'bold 36px Poppins';
        ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 20);
        
        ctx.font = '24px Poppins';
        ctx.fillText('Refresh the page to play again', canvas.width/2, canvas.height/2 + 80);
      }
    }
  
    async function start() {
      try {
        await setupCamera();
        model = await handpose.load();
        
        // Start continuous hand detection in a separate loop
        continuousHandDetection();
        
        // Generate balloons more frequently
        setInterval(() => {
          if (timeLeft > 0 && Math.random() > 0.4) { // 60% chance to create a balloon each interval
            balloons.push(createBalloon());
          }
        }, 700); // Slightly faster spawn rate
        
        gameLoop();
  
        // Timer countdown
        const countdown = setInterval(() => {
          timeLeft--;
          if (timeLeft <= 0) {
            clearInterval(countdown);
            balloons = [];
          }
        }, 1000);
      } catch (error) {
        console.error('Error starting game:', error);
      }
    }
  
    start();
};