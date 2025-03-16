import { CONSTANTS, Utils } from './game/engine.js';
import { ParticleSystem, Background } from './game/renderers.js';

// Game dimensions
const CAT_WIDTH = 40;
const CAT_HEIGHT = 40;

export const StartScreen = {
  mounted() {
    console.log("StartScreen hook mounted");
    const canvas = this.el;
    const ctx = canvas.getContext("2d");
    
    // Animation state
    let animationFrame;
    let lastTimestamp = 0;
    let elapsedTime = 0;
    
    // High score from local storage
    const highScore = localStorage.getItem('catRunnerHighScore') || 0;
    
    // Game elements
    const particles = [];
    const MAX_PARTICLES = 50;
    
    // Set up the canvas
    function setupCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    // Draw stars at night
    function drawStars(timeOfDay) {
      // Initialize stars if they don't exist
      if (!window.stars) {
        window.stars = [];
        for (let i = 0; i < 100; i++) {
          window.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.7),
            size: Math.random() * 2 + 1,
            twinkleSpeed: Math.random() * 0.01 + 0.005,
            twinkleOffset: Math.random() * Math.PI * 2
          });
        }
      }
      
      // Modify alpha based on time (fade stars in/out with dawn/dusk)
      const starBrightness = timeOfDay < 0.2 ? 1 : (0.35 - timeOfDay) / 0.15;
      
      // Draw each star with twinkling effect
      ctx.fillStyle = 'white';
      window.stars.forEach(star => {
        const twinkle = (Math.sin(elapsedTime * star.twinkleSpeed + star.twinkleOffset) + 1) / 2;
        ctx.globalAlpha = (0.3 + twinkle * 0.7) * starBrightness;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;
    }
    
    // Draw majestic mountains in the distance
    function drawMountains() {
      const groundY = Utils.getGroundY(canvas);
      const mountainHeight = canvas.height * 0.25;
      
      // Far mountains
      ctx.fillStyle = '#37465b';
      ctx.beginPath();
      ctx.moveTo(0, groundY - mountainHeight * 0.7);
      
      // Generate mountain range
      for (let x = 0; x < canvas.width; x += 50) {
        // Use perlin noise or similar function for more natural mountains
        // Here we're using a simplified sine-based approach
        const height = mountainHeight * 0.5 * 
                       (0.7 + 0.3 * Math.sin(x * 0.01 + 435) + 
                       0.2 * Math.sin(x * 0.02 + 123));
        ctx.lineTo(x, groundY - height);
      }
      
      ctx.lineTo(canvas.width, groundY - mountainHeight * 0.3);
      ctx.lineTo(canvas.width, groundY);
      ctx.lineTo(0, groundY);
      ctx.closePath();
      ctx.fill();
      
      // Closer mountains (darker)
      ctx.fillStyle = '#2b3848';
      ctx.beginPath();
      ctx.moveTo(0, groundY - mountainHeight * 0.5);
      
      for (let x = 0; x < canvas.width; x += 30) {
        const height = mountainHeight * 0.8 * 
                      (0.6 + 0.4 * Math.sin(x * 0.015 + 789) + 
                      0.3 * Math.sin(x * 0.03 + 456));
        ctx.lineTo(x, groundY - height);
      }
      
      ctx.lineTo(canvas.width, groundY - mountainHeight * 0.4);
      ctx.lineTo(canvas.width, groundY);
      ctx.lineTo(0, groundY);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw an animated cat
    function drawCat() {
      const catX = canvas.width * 0.2;
      const catY = Utils.getGroundY(canvas) - CONSTANTS.CAT_HEIGHT;
      
      // Make cat bob up and down slightly
      const bobAmount = Math.sin(elapsedTime * 0.003) * 3;
      
      // Cat body
      const bodyGradient = ctx.createLinearGradient(catX, catY, catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT);
      bodyGradient.addColorStop(0, "#FFCDD2"); // Light pink
      bodyGradient.addColorStop(1, "#EF9A9A"); // Darker pink
      ctx.fillStyle = bodyGradient;
      
      // Draw rounded body
      ctx.beginPath();
      ctx.moveTo(catX + CONSTANTS.CAT_WIDTH * 0.1, catY + CONSTANTS.CAT_HEIGHT);
      ctx.lineTo(catX + CONSTANTS.CAT_WIDTH * 0.9, catY + CONSTANTS.CAT_HEIGHT);
      ctx.quadraticCurveTo(catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT, catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT * 0.9);
      ctx.lineTo(catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT * 0.1);
      ctx.quadraticCurveTo(catX + CONSTANTS.CAT_WIDTH, catY, catX + CONSTANTS.CAT_WIDTH * 0.9, catY);
      ctx.lineTo(catX + CONSTANTS.CAT_WIDTH * 0.1, catY);
      ctx.quadraticCurveTo(catX, catY, catX, catY + CONSTANTS.CAT_HEIGHT * 0.1);
      ctx.lineTo(catX, catY + CONSTANTS.CAT_HEIGHT * 0.9);
      ctx.quadraticCurveTo(catX, catY + CONSTANTS.CAT_HEIGHT, catX + CONSTANTS.CAT_WIDTH * 0.1, catY + CONSTANTS.CAT_HEIGHT);
      ctx.fill();
      
      // Cat ears
      ctx.fillStyle = "#FFCDD2";
      ctx.beginPath();
      ctx.moveTo(catX + 5, catY + 5);
      ctx.lineTo(catX - 5, catY - 10);
      ctx.lineTo(catX + 15, catY - 5);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(catX + CONSTANTS.CAT_WIDTH - 5, catY + 5);
      ctx.lineTo(catX + CONSTANTS.CAT_WIDTH + 5, catY - 10);
      ctx.lineTo(catX + CONSTANTS.CAT_WIDTH - 15, catY - 5);
      ctx.fill();
      
      // Cat eyes
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      const eyeSize = 4;
      const blinkHeight = Math.floor(elapsedTime / 2000) % 8 === 0 ? 1 : eyeSize; // Blink every few seconds
      ctx.ellipse(catX + 12, catY + 15 + bobAmount/2, eyeSize, blinkHeight, 0, 0, Math.PI * 2);
      ctx.ellipse(catX + CONSTANTS.CAT_WIDTH - 12, catY + 15 + bobAmount/2, eyeSize, blinkHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Cat mouth (smiling)
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(catX + 15, catY + 25 + bobAmount);
      ctx.quadraticCurveTo(catX + CONSTANTS.CAT_WIDTH/2, catY + 30 + bobAmount, catX + CONSTANTS.CAT_WIDTH - 15, catY + 25 + bobAmount);
      ctx.stroke();
      
      // Whiskers that move slightly
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      
      // Left whiskers
      const whiskerAngle = Math.sin(elapsedTime * 0.002) * 0.1;
      
      // Draw 3 whiskers on each side with animation
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(catX + 5, catY + 20 + i * 2 + bobAmount);
        ctx.rotate(-0.2 + whiskerAngle + i * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-15, (i - 1) * 3);
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.translate(catX + CONSTANTS.CAT_WIDTH - 5, catY + 20 + i * 2 + bobAmount);
        ctx.rotate(0.2 - whiskerAngle - i * 0.2);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(15, (i - 1) * 3);
        ctx.stroke();
        ctx.restore();
      }
      
      // Cat shadow that follows movement
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(catX + CONSTANTS.CAT_WIDTH/2, Utils.getGroundY(canvas) - 3, 
                  CONSTANTS.CAT_WIDTH * 0.4, 5 - bobAmount/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw the title with animation
    function drawTitle() {
      const titleY = canvas.height * 0.25;
      
      // Pulsing effect
      const pulse = Math.sin(elapsedTime * 0.002) * 0.05 + 0.95;
      
      ctx.save();
      ctx.translate(canvas.width / 2, titleY);
      ctx.scale(pulse, pulse);
      
      // Shadow for depth
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(-150, -40, 150, 40);
      gradient.addColorStop(0, "#FF5722");
      gradient.addColorStop(0.5, "#FFC107");
      gradient.addColorStop(1, "#F44336");
      
      ctx.fillStyle = gradient;
      ctx.font = "bold 72px 'Arial Rounded MT Bold', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Main title
      ctx.fillText("Cat Runner", 0, 0);
      
      // Outline
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 2;
      ctx.strokeText("Cat Runner", 0, 0);
      
      ctx.restore();
    }
    
    // Draw start button
    function drawStartButton() {
      const promptY = canvas.height * 0.6;
      
      // Pulsing effect for better visibility
      const pulseScale = 1.0 + Math.sin(elapsedTime * 0.005) * 0.05;
      
      ctx.save();
      ctx.translate(canvas.width / 2, promptY);
      ctx.scale(pulseScale, pulseScale);
      
      // Button shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      // Draw button background
      const buttonWidth = 200;
      const buttonHeight = 60;
      const buttonGradient = ctx.createLinearGradient(0, -buttonHeight/2, 0, buttonHeight/2);
      buttonGradient.addColorStop(0, "#4CAF50"); // Light green
      buttonGradient.addColorStop(1, "#388E3C"); // Dark green
      
      ctx.fillStyle = buttonGradient;
      ctx.beginPath();
      ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 15);
      ctx.fill();
      
      // Button border
      ctx.strokeStyle = "#81C784";
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Button text
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Play Game", 0, 0);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.restore();
      
      // Instructions
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.font = "18px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Press Space or Up Arrow to Jump", canvas.width / 2, promptY + 60);
      ctx.fillText("Tap the screen to jump on mobile", canvas.width / 2, promptY + 90);
      ctx.fillText("Press ESC or P to pause during game", canvas.width / 2, promptY + 120);
    }
    
    // Draw high score display
    function drawScore() {
      if (highScore > 0) {
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.font = "bold 24px Arial, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height * 0.43);
      }
    }
    
    // Add this function to create a more beautiful background
    function drawBackground(deltaTime) {
      // Create a gradient sunset/sunrise background
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.8);
      
      // Time-based color shifts for day/night cycle
      const timeOfDay = (Math.sin(elapsedTime * 0.0001) + 1) / 2; // 0 to 1 cycle
      
      if (timeOfDay < 0.3) { // Night
        skyGradient.addColorStop(0, '#0a1a40');
        skyGradient.addColorStop(0.4, '#283c80');
        skyGradient.addColorStop(1, '#4b548e');
      } else if (timeOfDay < 0.4) { // Sunrise/Sunset
        skyGradient.addColorStop(0, '#1e3c72');
        skyGradient.addColorStop(0.4, '#e05e3b');
        skyGradient.addColorStop(0.7, '#f8a678');
        skyGradient.addColorStop(1, '#ffecd2');
      } else { // Day
        skyGradient.addColorStop(0, '#4facfe');
        skyGradient.addColorStop(0.7, '#75d1ff');
        skyGradient.addColorStop(1, '#aae9ff');
      }
      
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw stars at night
      if (timeOfDay < 0.35) {
        drawStars(timeOfDay);
      }
      
      // Draw distant mountains
      drawMountains();
    }
    
    // Draw animated start screen
    function animateStartScreen(timestamp) {
      // Calculate delta time for smooth animations
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      elapsedTime += deltaTime;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw beautiful background with day/night cycle
      drawBackground(deltaTime);
      
      // Draw animated elements
      ParticleSystem.update(particles, deltaTime, MAX_PARTICLES);
      ParticleSystem.draw(ctx, particles);
      Background.drawClouds(ctx, canvas, deltaTime, elapsedTime, 'startScreenClouds');
      Background.drawGround(ctx, canvas);
      drawCat();
      drawTitle();
      drawStartButton();
      drawScore();
      
      // Continue animation loop
      animationFrame = requestAnimationFrame(animateStartScreen);
    }
    
    // Handle click to navigate to game screen
    const handleStartClick = () => {
      console.log("Start game clicked");
      window.location.href = "/game";
    };
    
    // Initialize canvas and start animation
    setupCanvas();
    animationFrame = requestAnimationFrame(animateStartScreen);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      setupCanvas();
    });
    
    // Handle canvas click
    canvas.addEventListener('click', (event) => {
      event.preventDefault();
      handleStartClick();
    });
    
    // Handle touch events for mobile
    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault(); // Prevent scrolling
      handleStartClick();
    });
    
    // Handle keyboard
    window.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowUp' || event.key === ' ' || event.key === 'w' || event.key === 'W') {
        handleStartClick();
      }
    });
    
    // Clean up animation when component unmounts
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      // Clean up event listeners
      window.removeEventListener('resize', () => {});
      canvas.removeEventListener('click', () => {});
      canvas.removeEventListener('touchstart', () => {});
      window.removeEventListener('keydown', () => {});
    };
  }
}; 