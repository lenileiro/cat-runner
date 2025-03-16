import { CONSTANTS, Utils } from './game/engine.js';
import { ParticleSystem, Background } from './game/renderers.js';

// Game dimensions
const CAT_WIDTH = 40;
const CAT_HEIGHT = 40;

// Add this near the top with other state variables
let dayNightCycle = 0;
const dayNightSpeed = 0.00002; // Same speed as in game

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
    
    // Decorative elements
    let decorativeElements = [];
    
    // Set up the canvas
    function setupCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    // Draw stars at night
    function drawStars(brightness) {
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
      
      // Draw each star with twinkling effect
      ctx.fillStyle = 'white';
      window.stars.forEach(star => {
        const twinkle = (Math.sin(elapsedTime * star.twinkleSpeed + star.twinkleOffset) + 1) / 2;
        ctx.globalAlpha = (0.3 + twinkle * 0.7) * brightness;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.globalAlpha = 1;
    }
    
    // Draw majestic mountains in the distance with parallax effect
    function drawMountains() {
      const groundY = Utils.getGroundY(canvas);
      const mountainHeight = canvas.height * 0.25;
      
      // Parallax effect - different mountains move at different speeds
      const farOffset = (elapsedTime * 0.005) % canvas.width;
      const midOffset = (elapsedTime * 0.01) % canvas.width;
      const nearOffset = (elapsedTime * 0.02) % canvas.width;
      
      // Far mountains (slowest moving)
      ctx.fillStyle = '#37465b';
      ctx.beginPath();
      ctx.moveTo(0, groundY - mountainHeight * 0.7);
      
      // Generate mountain range
      for (let x = 0; x < canvas.width + 100; x += 50) {
        // Use perlin noise or similar function for more natural mountains
        // Here we're using a simplified sine-based approach
        const height = mountainHeight * 0.5 * 
                      (0.7 + 0.3 * Math.sin((x + farOffset) * 0.01 + 435) + 
                      0.2 * Math.sin((x + farOffset) * 0.02 + 123));
        ctx.lineTo(x, groundY - height);
      }
      
      ctx.lineTo(canvas.width, groundY - mountainHeight * 0.3);
      ctx.lineTo(canvas.width, groundY);
      ctx.lineTo(0, groundY);
      ctx.closePath();
      ctx.fill();
      
      // Middle mountains
      ctx.fillStyle = '#2b3848';
      ctx.beginPath();
      ctx.moveTo(0, groundY - mountainHeight * 0.5);
      
      for (let x = 0; x < canvas.width + 100; x += 30) {
        const height = mountainHeight * 0.8 * 
                      (0.6 + 0.4 * Math.sin((x + midOffset) * 0.015 + 789) + 
                      0.3 * Math.sin((x + midOffset) * 0.03 + 456));
        ctx.lineTo(x, groundY - height);
      }
      
      ctx.lineTo(canvas.width, groundY - mountainHeight * 0.4);
      ctx.lineTo(canvas.width, groundY);
      ctx.lineTo(0, groundY);
      ctx.closePath();
      ctx.fill();
      
      // Nearest mountains (fastest moving)
      ctx.fillStyle = '#1a2530';
      ctx.beginPath();
      ctx.moveTo(0, groundY - mountainHeight * 0.3);
      
      for (let x = 0; x < canvas.width + 100; x += 20) {
        const height = mountainHeight * 0.5 * 
                      (0.5 + 0.3 * Math.sin((x + nearOffset) * 0.025 + 123) + 
                      0.2 * Math.sin((x + nearOffset) * 0.04 + 456));
        ctx.lineTo(x, groundY - height);
      }
      
      ctx.lineTo(canvas.width, groundY - mountainHeight * 0.2);
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
      
      // Minimal pulsing
      const pulse = Math.sin(elapsedTime * 0.001) * 0.02 + 0.98;
      
      ctx.save();
      ctx.translate(canvas.width / 2, titleY);
      ctx.scale(pulse, pulse);
      
      // Apply a stronger shadow for visibility (matching game UI)
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Use same gradient style as in-game UI
      const gradient = ctx.createLinearGradient(-150, -40, 150, 40);
      gradient.addColorStop(0, "#3F51B5"); // Matching in-game UI colors
      gradient.addColorStop(0.5, "#5C6BC0");
      gradient.addColorStop(1, "#3F51B5");
      
      // Use the same font as the score display in game
      ctx.font = "bold 72px 'Arial Rounded MT Bold', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Title with outline for better visibility
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.strokeText("CAT RUNNER", 0, 0);
      ctx.fillStyle = gradient;
      ctx.fillText("CAT RUNNER", 0, 0);
      
      ctx.restore();
    }
    
    // Draw start button with game-consistent styling
    function drawStartButton() {
      const promptY = canvas.height * 0.6;
      const pulseScale = 1.0 + Math.sin(elapsedTime * 0.003) * 0.03;
      
      ctx.save();
      ctx.translate(canvas.width / 2, promptY);
      ctx.scale(pulseScale, pulseScale);
      
      // Match the game UI shadow settings
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Draw button background - use UI.drawGameOver button style from renderers.js
      const buttonWidth = 220;
      const buttonHeight = 60;
      
      // Use the blue color from the game UI
      ctx.fillStyle = '#3F51B5';
      ctx.beginPath();
      ctx.roundRect(-buttonWidth/2, -buttonHeight/2, buttonWidth, buttonHeight, 10);
      ctx.fill();
      
      // Button text - match in-game UI fonts
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px 'Arial Rounded MT Bold', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("START GAME", 0, 0);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.restore();
      
      // Instructions - match in-game text style
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.font = "16px 'Arial Rounded MT Bold', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Press Space or Up Arrow to Jump", canvas.width / 2, promptY + 60);
      ctx.fillText("Tap the screen to jump on mobile", canvas.width / 2, promptY + 90);
      ctx.fillText("Press ESC or P to pause during game", canvas.width / 2, promptY + 120);
    }
    
    // Draw high score display to match in-game UI
    function drawScore() {
      if (highScore > 0) {
        // Apply same shadow as in-game UI
        ctx.shadowColor = "rgba(0,0,0,0.8)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        
        // Use consistent score display styling with game UI
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.textAlign = "center";
        ctx.font = "bold 24px 'Arial Rounded MT Bold', Arial, sans-serif";
        
        // Draw with outline for visibility (matching game UI)
        ctx.strokeText(`High Score: ${highScore}`, canvas.width / 2, canvas.height * 0.43);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(`High Score: ${highScore}`, canvas.width / 2, canvas.height * 0.43);
        
        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
    }
    
    // Draw background with day/night cycle
    function drawBackground(deltaTime) {
      // Update day/night cycle
      dayNightCycle += dayNightSpeed * deltaTime;
      if (dayNightCycle > 1) dayNightCycle = 0;

      // Use the same sky drawing function as the game
      Background.drawSky(ctx, canvas, dayNightCycle);
      
      // Draw stars at night (only during night phase)
      if (dayNightCycle > 0.75 || dayNightCycle < 0.25) {
        // Calculate star brightness based on time of day
        // Brightest at cycle 0 (midnight) and fades at dawn/dusk
        const starBrightness = dayNightCycle > 0.75 ? 
          (dayNightCycle - 0.75) * 4 : // Fade in at dusk
          1 - (dayNightCycle * 4);     // Fade out at dawn
          
        drawStars(starBrightness);
      }
      
      // Draw sun or moon based on time of day
      const celestialX = canvas.width * 0.8;
      const celestialY = canvas.height * 0.2;
      
      if (dayNightCycle < 0.75 && dayNightCycle > 0.25) {
        // Sun - visible during day and transitions
        const sunAlpha = dayNightCycle < 0.5 ? 
          Math.min(1, (dayNightCycle - 0.25) * 4) : // Fade in
          Math.max(0, 1 - ((dayNightCycle - 0.5) * 4)); // Fade out
        
        const sunGlow = ctx.createRadialGradient(
          celestialX, celestialY, 0,
          celestialX, celestialY, 60
        );
        sunGlow.addColorStop(0, `rgba(255, 240, 150, ${sunAlpha * 0.6})`);
        sunGlow.addColorStop(0.5, `rgba(255, 210, 100, ${sunAlpha * 0.2})`);
        sunGlow.addColorStop(1, 'rgba(255, 210, 0, 0)');
        
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = `rgba(255, 238, 88, ${sunAlpha})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 25, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Moon - visible during night and transitions
        const moonAlpha = dayNightCycle > 0.75 ? 
          Math.min(1, (dayNightCycle - 0.75) * 4) : // Fade in
          Math.max(0, 1 - (dayNightCycle * 4));      // Fade out
        
        // Moon glow
        ctx.fillStyle = `rgba(255, 255, 255, ${moonAlpha * 0.1})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 28, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon body
        ctx.fillStyle = `rgba(224, 224, 224, ${moonAlpha})`;
        ctx.beginPath();
        ctx.arc(celestialX, celestialY, 25, 0, Math.PI * 2);
        ctx.fill();
        
        // Moon craters - only visible when moon is visible
        if (moonAlpha > 0.3) {
          ctx.fillStyle = `rgba(200, 200, 200, ${moonAlpha * 0.2})`;
          ctx.beginPath();
          ctx.arc(celestialX - 8, celestialY - 5, 6, 0, Math.PI * 2);
          ctx.arc(celestialX + 10, celestialY + 8, 4, 0, Math.PI * 2);
          ctx.arc(celestialX + 3, celestialY - 10, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Draw distant mountains with parallax effect
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