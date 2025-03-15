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
    
    // Set up the canvas
    function setupCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    
    // Get ground Y position
    const getGroundY = () => canvas.height - 10;
    
    // Animation particles system
    const particles = [];
    const MAX_PARTICLES = 50;
    
    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.7,
        size: Math.random() * 5 + 2,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 0.5 - 0.25,
        color: `hsla(${Math.random() * 60 + 40}, 80%, 80%, ${Math.random() * 0.5 + 0.2})`
      };
    }
    
    function updateParticles(deltaTime) {
      // Add new particles if needed
      while (particles.length < MAX_PARTICLES) {
        particles.push(createParticle());
      }
      
      // Update particle positions
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.speedX * deltaTime * 0.05;
        p.y += p.speedY * deltaTime * 0.05;
        
        // Remove particles that move off-screen
        if (p.x < -p.size || p.x > canvas.width + p.size || 
            p.y < -p.size || p.y > canvas.height + p.size) {
          particles.splice(i, 1);
        }
      }
    }
    
    function drawParticles() {
      particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    
    // Draw clouds in the background with animation
    function drawClouds(deltaTime) {
      // Create clouds array if it doesn't exist
      if (!window.startScreenClouds) {
        window.startScreenClouds = [];
        for (let i = 0; i < 5; i++) {
          window.startScreenClouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.5),
            width: Math.random() * 100 + 50,
            speed: Math.random() * 0.5 + 0.1
          });
        }
      }
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      
      // Draw and animate clouds
      window.startScreenClouds.forEach(cloud => {
        // Move cloud
        cloud.x += cloud.speed * deltaTime * 0.05;
        
        // Wrap around screen
        if (cloud.x > canvas.width + cloud.width) {
          cloud.x = -cloud.width;
          cloud.y = Math.random() * (canvas.height * 0.5);
          cloud.width = Math.random() * 100 + 50;
          cloud.speed = Math.random() * 0.5 + 0.1;
        }
        
        // Draw a fluffy cloud
        const cloudHeight = cloud.width * 0.6;
        const x = cloud.x;
        const y = cloud.y;
        
        ctx.beginPath();
        ctx.arc(x + cloudHeight/2, y + cloudHeight/2, cloudHeight/2, 0, Math.PI * 2);
        ctx.arc(x + cloud.width - cloudHeight/2, y + cloudHeight/2, cloudHeight/2, 0, Math.PI * 2);
        ctx.rect(x + cloudHeight/2, y, cloud.width - cloudHeight, cloudHeight);
        ctx.fill();
      });
    }
    
    // Draw the ground with some detail and more color
    function drawGround() {
      const groundY = getGroundY();
      
      // Draw sky-ground gradient for horizon effect
      const horizonGradient = ctx.createLinearGradient(0, groundY - 20, 0, groundY);
      horizonGradient.addColorStop(0, "rgba(135, 206, 235, 0)"); // Sky blue (transparent)
      horizonGradient.addColorStop(1, "rgba(124, 179, 66, 0.3)"); // Light green (semi-transparent)
      ctx.fillStyle = horizonGradient;
      ctx.fillRect(0, groundY - 20, canvas.width, 20);
      
      // Draw main ground line
      ctx.fillStyle = "#5D4037";
      ctx.fillRect(0, groundY, canvas.width, 2);
      
      // Draw soil below with gradient
      const soilGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
      soilGradient.addColorStop(0, "#8D6E63"); // Light brown
      soilGradient.addColorStop(1, "#5D4037"); // Dark brown
      ctx.fillStyle = soilGradient;
      ctx.fillRect(0, groundY + 2, canvas.width, canvas.height - groundY - 2);
      
      // Draw grass tufts with varying heights and colors
      for (let x = 0; x < canvas.width; x += 10) {
        const height = Math.random() * 6 + 2;
        const green = Math.floor(Math.random() * 40 + 120); // Random green shade
        ctx.fillStyle = `rgb(${Math.floor(green*0.4)}, ${green}, ${Math.floor(green*0.5)})`;
        ctx.fillRect(x, groundY - height, 2, height);
      }
    }
    
    // Draw an animated cat
    function drawCat(deltaTime) {
      const catX = canvas.width * 0.2;
      const catY = getGroundY() - CAT_HEIGHT;
      
      // Make cat bob up and down slightly
      const bobAmount = Math.sin(elapsedTime * 0.003) * 3;
      
      // Cat body
      const bodyGradient = ctx.createLinearGradient(catX, catY, catX + CAT_WIDTH, catY + CAT_HEIGHT);
      bodyGradient.addColorStop(0, "#FFCDD2"); // Light pink
      bodyGradient.addColorStop(1, "#EF9A9A"); // Darker pink
      ctx.fillStyle = bodyGradient;
      
      // Draw rounded body
      ctx.beginPath();
      ctx.moveTo(catX + CAT_WIDTH * 0.1, catY + CAT_HEIGHT);
      ctx.lineTo(catX + CAT_WIDTH * 0.9, catY + CAT_HEIGHT);
      ctx.quadraticCurveTo(catX + CAT_WIDTH, catY + CAT_HEIGHT, catX + CAT_WIDTH, catY + CAT_HEIGHT * 0.9);
      ctx.lineTo(catX + CAT_WIDTH, catY + CAT_HEIGHT * 0.1);
      ctx.quadraticCurveTo(catX + CAT_WIDTH, catY, catX + CAT_WIDTH * 0.9, catY);
      ctx.lineTo(catX + CAT_WIDTH * 0.1, catY);
      ctx.quadraticCurveTo(catX, catY, catX, catY + CAT_HEIGHT * 0.1);
      ctx.lineTo(catX, catY + CAT_HEIGHT * 0.9);
      ctx.quadraticCurveTo(catX, catY + CAT_HEIGHT, catX + CAT_WIDTH * 0.1, catY + CAT_HEIGHT);
      ctx.fill();
      
      // Cat ears
      ctx.fillStyle = "#FFCDD2";
      ctx.beginPath();
      ctx.moveTo(catX + 5, catY + 5);
      ctx.lineTo(catX - 5, catY - 10);
      ctx.lineTo(catX + 15, catY - 5);
      ctx.fill();
      
      ctx.beginPath();
      ctx.moveTo(catX + CAT_WIDTH - 5, catY + 5);
      ctx.lineTo(catX + CAT_WIDTH + 5, catY - 10);
      ctx.lineTo(catX + CAT_WIDTH - 15, catY - 5);
      ctx.fill();
      
      // Cat eyes
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      const eyeSize = 4;
      const blinkHeight = Math.floor(elapsedTime / 2000) % 8 === 0 ? 1 : eyeSize; // Blink every few seconds
      ctx.ellipse(catX + 12, catY + 15 + bobAmount/2, eyeSize, blinkHeight, 0, 0, Math.PI * 2);
      ctx.ellipse(catX + CAT_WIDTH - 12, catY + 15 + bobAmount/2, eyeSize, blinkHeight, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Cat mouth (smiling)
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(catX + 15, catY + 25 + bobAmount);
      ctx.quadraticCurveTo(catX + CAT_WIDTH/2, catY + 30 + bobAmount, catX + CAT_WIDTH - 15, catY + 25 + bobAmount);
      ctx.stroke();
      
      // Whiskers that move slightly
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 1;
      
      // Left whiskers
      const whiskerAngle = Math.sin(elapsedTime * 0.002) * 0.1;
      
      ctx.save();
      ctx.translate(catX + 5, catY + 20 + bobAmount);
      ctx.rotate(-0.2 + whiskerAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, -3);
      ctx.stroke();
      ctx.restore();
      
      ctx.save();
      ctx.translate(catX + 5, catY + 22 + bobAmount);
      ctx.rotate(0 + whiskerAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 0);
      ctx.stroke();
      ctx.restore();
      
      ctx.save();
      ctx.translate(catX + 5, catY + 24 + bobAmount);
      ctx.rotate(0.2 + whiskerAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-15, 3);
      ctx.stroke();
      ctx.restore();
      
      // Right whiskers
      ctx.save();
      ctx.translate(catX + CAT_WIDTH - 5, catY + 20 + bobAmount);
      ctx.rotate(0.2 - whiskerAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, -3);
      ctx.stroke();
      ctx.restore();
      
      ctx.save();
      ctx.translate(catX + CAT_WIDTH - 5, catY + 22 + bobAmount);
      ctx.rotate(0 - whiskerAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 0);
      ctx.stroke();
      ctx.restore();
      
      ctx.save();
      ctx.translate(catX + CAT_WIDTH - 5, catY + 24 + bobAmount);
      ctx.rotate(-0.2 - whiskerAngle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(15, 3);
      ctx.stroke();
      ctx.restore();
      
      // Cat shadow that follows movement
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(catX + CAT_WIDTH/2, getGroundY() - 3, CAT_WIDTH * 0.4, 5 - bobAmount/2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw score display
    function drawScore() {
      // Create a semi-transparent header area with gradient
      const headerGradient = ctx.createLinearGradient(0, 0, 0, 60);
      headerGradient.addColorStop(0, "rgba(33, 33, 33, 0.8)");
      headerGradient.addColorStop(1, "rgba(33, 33, 33, 0.4)");
      ctx.fillStyle = headerGradient;
      ctx.fillRect(0, 0, canvas.width, 60);
      
      // Draw high score with shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 24px 'Arial Rounded MT Bold', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`High Score: ${highScore}`, canvas.width/2, 35);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Draw animated title
    function drawTitle() {
      const titleY = canvas.height * 0.3;
      const titleScale = 1 + Math.sin(elapsedTime * 0.002) * 0.05; // Subtle pulsing
      
      ctx.save();
      ctx.translate(canvas.width / 2, titleY);
      ctx.scale(titleScale, titleScale);
      
      // Title shadow
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 4;
      ctx.shadowOffsetY = 4;
      
      // Outer stroke
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 52px 'Comic Sans MS', 'Marker Felt', fantasy";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("CAT RUNNER", 0, 0);
      
      // Inner text
      const titleGradient = ctx.createLinearGradient(0, -30, 0, 30);
      titleGradient.addColorStop(0, "#FF9800"); // Orange
      titleGradient.addColorStop(0.5, "#F44336"); // Red
      titleGradient.addColorStop(1, "#9C27B0"); // Purple
      
      ctx.fillStyle = titleGradient;
      ctx.font = "bold 50px 'Comic Sans MS', 'Marker Felt', fantasy";
      ctx.fillText("CAT RUNNER", 0, 0);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      ctx.restore();
    }
    
    // Draw start button with animation
    function drawStartButton() {
      const promptY = canvas.height * 0.5;
      const pulseScale = 1 + Math.sin(elapsedTime * 0.005) * 0.1; // More pronounced pulsing
      
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
    
    // Add twinkling stars for nighttime
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
      const groundY = getGroundY();
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
      updateParticles(deltaTime);
      drawParticles();
      drawClouds(deltaTime);
      drawGround();
      drawCat(deltaTime);
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
    
    // Clean up animation when component unmounts
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }
}; 