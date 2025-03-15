// Game dimensions
const CAT_WIDTH = 40;
const CAT_HEIGHT = 40;

export const GameCanvas = {
  mounted() {
    console.log("GameCanvas hook mounted");
    const canvas = this.el;
    const ctx = canvas.getContext("2d");
    
    // Check if LiveView is connected properly
    console.log("LiveView connection status:", {
      pushEventExists: typeof this.pushEvent === 'function',
      hookElement: this.el
    });
    
    // Game state - now supports multiple states
    let gameState = 'idle';
    
    // Track score (initially 0)
    let score = 0;
    
    // Animation state
    let animationFrame;
    let lastTimestamp = 0;
    let elapsedTime = 0;
    
    // Set up the canvas immediately
    function setupCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Canvas dimensions set:", canvas.width, "x", canvas.height);
    }
    
    // Get ground Y position
    const getGroundY = () => canvas.height - 10;
    
    // Setup canvas first
    setupCanvas();
    
    // Enhance with game mechanics - add these back after canvas is set up
    let isPlaying = false;
    let isPaused = false;
    let gameSpeed = 5;
    let obstacles = [];
    let obstacleTimer = 0;
    let jumpForce = 0;
    let isJumping = false;
    let catY = getGroundY() - CAT_HEIGHT;
    
    // Movement controls
    let catX = canvas.width * 0.2; // Initial position
    let catVelX = 0;
    let movingLeft = false;
    let movingRight = false;
    const MOVE_SPEED = 5;
    const MIN_X = 10; // Left boundary
    const MAX_X = canvas.width - CAT_WIDTH - 10; // Right boundary
    
    let gravity = 0.5;
    const JUMP_FORCE = 15;
    
    // Animation particles system
    const particles = [];
    const MAX_PARTICLES = 50;
    
    // Add these variables near the top with other game variables
    let powerups = [];
    let coins = [];
    let comboCount = 0;
    let comboTimer = 0;
    let dayNightCycle = 0; // 0 to 1 representing time of day
    let dayNightSpeed = 0.0001; // How fast day/night cycles
    let specialAbilityActive = false;
    let specialAbilityTimer = 0;
    let specialAbilityType = null;
    let score_multiplier = 1;
    let difficultyLevel = 1;
    let backgroundElements = [];
    let activeHUDMessages = [];
    const HUD_MESSAGE_DURATION = 3000; // 3 seconds for tooltips
    
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
      if (!window.clouds) {
        window.clouds = [];
        for (let i = 0; i < 5; i++) {
          window.clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * (canvas.height * 0.5),
            width: Math.random() * 100 + 50,
            speed: Math.random() * 0.5 + 0.1
          });
        }
      }
      
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      
      // Draw and animate clouds
      window.clouds.forEach(cloud => {
        // Move cloud only if not paused
        if (!isPaused && isPlaying) {
          cloud.x += cloud.speed * deltaTime * 0.05;
          
          // Wrap around screen
          if (cloud.x > canvas.width + cloud.width) {
            cloud.x = -cloud.width;
            cloud.y = Math.random() * (canvas.height * 0.5);
            cloud.width = Math.random() * 100 + 50;
            cloud.speed = Math.random() * 0.5 + 0.1;
          }
        }
        
        // Draw cloud
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
      // Use catX variable instead of CAT_X constant
      // const catX = CAT_X;  // Remove this line
      
      // Determine bob amount based on whether cat is jumping
      let bobAmount = 0;
      if (!isJumping) {
        bobAmount = Math.sin(elapsedTime * 0.003) * 3;
      }
      
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
      
      // Add facial expressions based on game state
      if (isJumping) {
        // Determined face while jumping
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(catX + 15, catY + 22);
        ctx.lineTo(catX + CAT_WIDTH - 15, catY + 22);
        ctx.stroke();
      } else if (isPaused) {
        // Surprised face when paused
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(catX + CAT_WIDTH/2, catY + 25, 5, 0, Math.PI * 2);
        ctx.stroke();
      } else if (!isPlaying && gameState === 'game_over') {
        // Sad face on game over
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(catX + 15, catY + 30);
        ctx.quadraticCurveTo(catX + CAT_WIDTH/2, catY + 20, catX + CAT_WIDTH - 15, catY + 30);
        ctx.stroke();
      }
      
      // Cat shadow that follows movement
      ctx.fillStyle = "rgba(0,0,0,0.1)";
      ctx.beginPath();
      ctx.ellipse(catX + CAT_WIDTH/2, getGroundY() - 3, CAT_WIDTH * 0.4, 5 - bobAmount/2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset global alpha
      ctx.globalAlpha = 1;
    }
    
    // Draw score display
    function drawScore() {
      // Apply a stronger shadow for visibility without the overlay
      ctx.shadowColor = "rgba(0,0,0,0.8)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Use a more visible text color with stroke for better contrast
      ctx.font = "bold 24px 'Arial Rounded MT Bold', Arial, sans-serif";
      
      // Left-aligned score with outline
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.textAlign = "left";
      ctx.strokeText(`Score: ${score}`, 20, 35);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`Score: ${score}`, 20, 35);
      
      // Right-aligned high score with outline
      const highScore = localStorage.getItem('catRunnerHighScore') || 0;
      ctx.textAlign = "right";
      ctx.strokeText(`High Score: ${highScore}`, canvas.width - 20, 35);
      ctx.fillText(`High Score: ${highScore}`, canvas.width - 20, 35);
      
      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Update cat position based on movement controls
    function updateCatPosition(deltaTime) {
      // Apply horizontal velocity
      if (movingLeft) {
        catVelX = -MOVE_SPEED;
      } else if (movingRight) {
        catVelX = MOVE_SPEED;
      } else {
        // Apply friction/deceleration when not pressing movement keys
        catVelX *= 0.8;
        if (Math.abs(catVelX) < 0.1) catVelX = 0;
      }
      
      // Update horizontal position
      catX += catVelX;
      
      // Apply boundaries
      if (catX < MIN_X) catX = MIN_X;
      if (catX > MAX_X) catX = MAX_X;
      
      // Update vertical position (jumping) with better debugging
      if (isJumping) {
        const oldY = catY;
        catY -= jumpForce;
        jumpForce -= gravity;
        
        
        // Check if landed
        if (catY >= getGroundY() - CAT_HEIGHT) {
          console.log("Landing detected");
          catY = getGroundY() - CAT_HEIGHT;
          isJumping = false;
          jumpForce = 0;
        }
      }
    }
    
    // Draw basic game screen
    function drawGameScreen(timestamp) {
      // Calculate delta time for smooth animations
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      elapsedTime += deltaTime;
      
      // Update day/night cycle
      dayNightCycle += dayNightSpeed * deltaTime;
      if (dayNightCycle > 1) dayNightCycle = 0;
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw sky gradient based on time of day
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      
      // Morning colors
      if (dayNightCycle < 0.25) {
        const t = dayNightCycle * 4; // 0 to 1 during this phase
        skyGradient.addColorStop(0, interpolateColor('#0C1445', '#6EC6FF', t));
        skyGradient.addColorStop(1, interpolateColor('#1A237E', '#E3F2FD', t));
      } 
      // Day colors
      else if (dayNightCycle < 0.5) {
        skyGradient.addColorStop(0, '#6EC6FF');
        skyGradient.addColorStop(1, '#E3F2FD');
      } 
      // Evening colors
      else if (dayNightCycle < 0.75) {
        const t = (dayNightCycle - 0.5) * 4; // 0 to 1 during this phase
        skyGradient.addColorStop(0, interpolateColor('#6EC6FF', '#FF9800', t));
        skyGradient.addColorStop(1, interpolateColor('#E3F2FD', '#FF5722', t));
      } 
      // Night colors
      else {
        const t = (dayNightCycle - 0.75) * 4; // 0 to 1 during this phase
        skyGradient.addColorStop(0, interpolateColor('#FF9800', '#0C1445', t));
        skyGradient.addColorStop(1, interpolateColor('#FF5722', '#1A237E', t));
      }
      
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Only update game elements if not paused
      if (!isPaused) {
          // Update cat position when keys are pressed
          updateCatPosition(deltaTime);
          
          // Update combo timer
          if (comboTimer > 0) {
              comboTimer -= deltaTime;
              if (comboTimer <= 0) {
                  comboCount = 0;
              }
          }
          
          // Update special ability timer
          if (specialAbilityActive && specialAbilityTimer > 0) {
              specialAbilityTimer -= deltaTime;
              if (specialAbilityTimer <= 0) {
                  specialAbilityActive = false;
                  specialAbilityType = null;
              }
          }
          
          // Update difficulty
          if (isPlaying) {
              difficultyLevel = Math.floor(score / 10) + 1;
          }
          
          // Update game elements
          updateBackgroundElements(deltaTime);
          updateParticles(deltaTime);
          updateCoins(deltaTime);
          updatePowerups(deltaTime);
          
          // Increase game speed gradually as score increases
          if (isPlaying) {
              gameSpeed = 5 + Math.floor((score / 5) / 10);
          }
      }
      
      // Draw all visual elements (these should still render when paused)
      drawBackgroundElements();
      drawParticles();
      drawClouds(deltaTime);
      drawGround();
      drawCoins();
      drawPowerups();
      
      // Draw and update obstacles
      if (isPlaying || gameState === 'game_over') {
          drawObstacles(deltaTime);
      }
      
      drawCat(deltaTime);
      drawScore();
      drawCombo();
      
      // Draw special ability effect
      if (specialAbilityActive) {
          drawSpecialAbilityEffect();
      }
      
      // Draw game over message if needed
      if (gameState === 'game_over') {
          drawGameOver();
      }
      
      // Add these lines before drawing the score
      if (isPlaying) {
          drawPowerupHUD();
          drawHUDMessages(deltaTime);
      }
      
      drawScore();
      
      // Continue animation loop
      animationFrame = requestAnimationFrame(drawGameScreen);
    }
    
    // Complete rewrite of the jump function to work locally first
    const jump = () => {
      // Check if we can jump (on ground or have double jump powerup)
      if (!isJumping || (specialAbilityActive && specialAbilityType === 'doubleJump')) {
        // Always perform the jump locally first
        isJumping = true;
        jumpForce = JUMP_FORCE;
        
        // Create jump particles
        for (let i = 0; i < 10; i++) {
          particles.push({
            x: catX + Math.random() * CAT_WIDTH,
            y: catY + CAT_HEIGHT,
            size: Math.random() * 5 + 2,
            speedX: (Math.random() - 0.5) * 3,
            speedY: Math.random() * 2 + 2,
            color: '#BDBDBD',
            life: 20,
            type: 'jump'
          });
        }
        
        // Safely notify server (non-blocking)
        safeServerEvent.call(this, "jump", {});
      }
    };
    
    // Complete rewrite of the handleStart function to make it work locally first
    const handleStart = () => {
      console.log("Handle start called");
      // Always start the game locally first
      startGame();
      
      // Then notify server as a non-blocking operation
      setTimeout(() => {
        safeServerEvent.call(this, "canvas_start", {});
      }, 0);
    };
    
    // Add a local game start function that doesn't rely on the server
    function startGame() {
      console.log("Starting game locally");
      
      // Clean up any game over elements
      removeMenuButton();
      
      isPlaying = true;
      gameState = 'playing';
      isPaused = false;  // Make sure game is unpaused when starting
      
      // Reset game variables
      score = 0;
      obstacles = [];
      obstacleTimer = 0;
      gameSpeed = 5;
      
      // Reset cat position
      catX = canvas.width * 0.2;
      catY = getGroundY() - CAT_HEIGHT;
      catVelX = 0;
      jumpForce = 0;
      isJumping = false;
      movingLeft = false;
      movingRight = false;
      
      // Force a redraw immediately
      if (!animationFrame) {
        animationFrame = requestAnimationFrame(drawGameScreen);
      }
    }
    
    // Initialize canvas and start animation immediately
    console.log("Starting initial animation frame");
    animationFrame = requestAnimationFrame(drawGameScreen);
    
    // Auto-start the game after a short delay if no interaction
    const autoStartTimeout = setTimeout(() => {
      console.log("Auto-starting game after timeout");
      if (!isPlaying) {
        handleStart();
      }
    }, 1000); // Try to auto-start after 1 second
    
    // Clear the timeout if user interacts before it fires
    const clearAutoStart = () => {
      if (autoStartTimeout) {
        clearTimeout(autoStartTimeout);
      }
    };
    
    // Add these event listeners to clear the auto-start timer on user interaction
    window.addEventListener('keydown', clearAutoStart);
    window.addEventListener('click', clearAutoStart);
    window.addEventListener('touchstart', clearAutoStart);
    
    // Handle window resize
    window.addEventListener('resize', () => {
      setupCanvas();
    });
    
    // Add keyboard controls
    window.addEventListener('keydown', (event) => {
      // Log key presses for debugging (only in development)
      // console.log("Key pressed:", event.key);
      
      // Handle game restart
      if (gameState === 'game_over') {
        handleStart();
        event.preventDefault();
        return;
      }
      
      // Handle game start separately
      if (!isPlaying && (event.key === 'ArrowUp' || event.key === 'w' || event.key === ' ')) {
        handleStart();
        event.preventDefault();
        return;
      }
      
      // Use the jump() function instead of directly setting variables
      if (isPlaying && !isPaused && (event.key === 'ArrowUp' || event.key === 'w' || event.key === ' ')) {
        // console.log("Jump key pressed");
        jump();  // Call the jump function instead of setting variables directly
        event.preventDefault();
        return;
      }
      
      // Handle movement keys
      switch(event.key) {
        case 'ArrowLeft':
        case 'a':
          movingLeft = true;
          movingRight = false;
          // No need to notify server about movement - keep this local
          break;
        case 'ArrowRight':
        case 'd':
          movingRight = true;
          movingLeft = false;
          // No need to notify server about movement - keep this local
          break;
      }
      
      // Prevent default behavior for all game control keys
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'a', 'w', 'd'].includes(event.key)) {
        event.preventDefault();
      }
    });
    
    window.addEventListener('keyup', (event) => {
      // Reduce console logging by commenting out verbose debug logs
      // console.log("Key released:", event.key);
      
      switch(event.key) {
        case 'ArrowLeft':
        case 'a':
          movingLeft = false;
          break;
        case 'ArrowRight':
        case 'd':
          movingRight = false;
          break;
      }
    });
    
    // Add touch controls
    let touchStartX = 0;
    let touchMoveX = 0;
    
    canvas.addEventListener('touchstart', (event) => {
      event.preventDefault(); // Prevent scrolling
      if (!isPlaying) {
        handleStart();
        return;
      }
      
      // Store initial touch position
      touchStartX = event.touches[0].clientX;
      
      // Jump on tap if already playing
      if (isPlaying && !isPaused) {
        jump();
      }
    });
    
    canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      if (isPlaying && !isPaused) {
        // Get current touch position
        touchMoveX = event.touches[0].clientX;
        
        // Determine movement based on touch direction
        if (touchMoveX < touchStartX - 30) {
          // Swipe left
          movingLeft = true;
          movingRight = false;
        } else if (touchMoveX > touchStartX + 30) {
          // Swipe right
          movingRight = true;
          movingLeft = false;
        } else {
          // Not swiping far enough in either direction
          movingLeft = false;
          movingRight = false;
        }
      }
    });
    
    canvas.addEventListener('touchend', () => {
      // Stop movement when touch ends
      movingLeft = false;
      movingRight = false;
    });
    
    // Make sure canvas has focus to receive keyboard events
    canvas.tabIndex = 1; // Make canvas focusable
    canvas.style.outline = "none"; // Remove the focus outline
    canvas.style.cursor = "pointer"; // Show pointer cursor

    // Set focus on canvas at key times
    document.addEventListener('DOMContentLoaded', () => {
      canvas.focus();
    });

    // Update the global click handler to properly handle the menu button
    window.addEventListener('click', (event) => {
      event.preventDefault();
      canvas.focus(); // Ensure canvas gets focus
      
      // Check if we're in game over state and the menu button exists
      if (gameState === 'game_over' && window.menuButtonBounds) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const b = window.menuButtonBounds;
        
        // Check if click is inside the menu button bounds
        if (
          x >= b.x && 
          x <= b.x + b.width &&
          y >= b.y && 
          y <= b.y + b.height
        ) {
          console.log("Menu button clicked, redirecting to home");
          // Force navigation to home page
          window.location.replace('/');
          return;
        }
      }
      
      // For all other clicks, handle normally
      if (!isPlaying || gameState === 'game_over') {
        handleStart();
      } else if (!isPaused) {
        jump();
      }
    });

    canvas.addEventListener('blur', () => {
      console.log("Canvas lost focus");
      // Stop movement when focus is lost
      movingLeft = false;
      movingRight = false;
    });
    
    // Handle server events
    this.handleEvent("start_game", () => {
      console.log("Server requested game start");
      startGame();
    });
    
    this.handleEvent("score_update", ({ score: newScore }) => {
      score = newScore;
      // Store high score
      const highScore = localStorage.getItem('catRunnerHighScore') || 0;
      if (newScore > highScore) {
        localStorage.setItem('catRunnerHighScore', newScore);
      }
    });
    
    // Clean up animation when component unmounts
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    // Add this helper function near the start of the mounted function
    // Safe server communication helper
    function safeServerEvent(eventName, payload = {}) {
      console.log(`Attempting to send ${eventName} event to server`);
      
      // Capture the proper context
      const self = this;
      
      // Use try-catch and setTimeout to make this non-blocking
      setTimeout(() => {
        try {
          if (self && typeof self.pushEvent === 'function') {
            self.pushEvent(eventName, payload);
            console.log(`Successfully sent ${eventName} to server`);
          } else {
            console.warn(`Could not send ${eventName}: pushEvent not available, running locally`);
          }
        } catch (error) {
          console.error(`Error sending ${eventName} to server:`, error);
        }
      }, 0);
    }

    // Draw obstacles with pause check
    function drawObstacles(deltaTime) {
        // Only create and move obstacles if game is not paused
        if (!isPaused && isPlaying) {
            // Create new obstacles at intervals
            obstacleTimer += deltaTime;
            if (obstacleTimer > 1500) { // Adjust timing as needed
                obstacleTimer = 0;
                
                // Randomize obstacle types
                const obstacleType = Math.random() > 0.3 ? 'cactus' : 'bird';
                const obstacleHeight = obstacleType === 'cactus' ? 
                    Math.random() * 20 + 30 : // Cactus heights
                    Math.random() * 15 + 20;  // Bird heights
                
                const yPosition = obstacleType === 'cactus' ?
                    getGroundY() - obstacleHeight : // Cactus on ground
                    getGroundY() - obstacleHeight - Math.random() * 50 - 20; // Birds at various heights
                
                obstacles.push({
                    x: canvas.width,
                    y: yPosition,
                    width: 30,
                    height: obstacleHeight,
                    type: obstacleType,
                    passed: false
                });
            }
            
            // Update obstacle positions
            for (let i = obstacles.length - 1; i >= 0; i--) {
                const obstacle = obstacles[i];
                obstacle.x -= gameSpeed * (deltaTime * 0.1);
                
                // Remove if off screen
                if (obstacle.x < -obstacle.width) {
                    obstacles.splice(i, 1);
                    continue;
                }
                
                // Check for collision and scoring only if game is active
                if (!obstacle.passed && catX > obstacle.x + obstacle.width) {
                    obstacle.passed = true;
                    score++;
                    safeServerEvent.call(this, "score_update", { score });
                    const highScore = localStorage.getItem('catRunnerHighScore') || 0;
                    if (score > highScore) {
                        localStorage.setItem('catRunnerHighScore', score);
                    }
                }
                
                // Collision detection
                if (!specialAbilityActive || specialAbilityType !== 'invisible') {
                    const catCollisionMargin = 8;
                    if (
                        catX + catCollisionMargin < obstacle.x + obstacle.width &&
                        catX + CAT_WIDTH - catCollisionMargin > obstacle.x &&
                        catY + catCollisionMargin < obstacle.y + obstacle.height &&
                        catY + CAT_HEIGHT - catCollisionMargin > obstacle.y
                    ) {
                        handleGameOver();
                    }
                }
            }
        }
        
        // Draw obstacles regardless of pause state
        obstacles.forEach(obstacle => drawObstacle(obstacle));
    }

    // Draw individual obstacle
    function drawObstacle(obstacle) {
      // Determine obstacle style based on type
      if (obstacle.type === 'cactus') {
        // Draw cactus
        const cactusGradient = ctx.createLinearGradient(
          obstacle.x, obstacle.y, 
          obstacle.x + obstacle.width, obstacle.y + obstacle.height
        );
        cactusGradient.addColorStop(0, '#2E7D32'); // Dark green
        cactusGradient.addColorStop(1, '#4CAF50'); // Light green
        
        ctx.fillStyle = cactusGradient;
        
        // Main cactus body
        ctx.beginPath();
        ctx.roundRect(
          obstacle.x, obstacle.y,
          obstacle.width, obstacle.height,
          [5, 5, 0, 0] // Rounded top corners
        );
        ctx.fill();
        
        // Add cactus arms/spikes
        const armWidth = obstacle.width * 0.4;
        const armHeight = obstacle.height * 0.25;
        
        // Left arm
        ctx.beginPath();
        ctx.roundRect(
          obstacle.x - armWidth/2, obstacle.y + obstacle.height * 0.3,
          armWidth, armHeight,
          5
        );
        ctx.fill();
        
        // Right arm
        ctx.beginPath();
        ctx.roundRect(
          obstacle.x + obstacle.width - armWidth/2, obstacle.y + obstacle.height * 0.5,
          armWidth, armHeight,
          5
        );
        ctx.fill();
        
        // Add cactus spikes
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
          // Left spikes
          ctx.beginPath();
          ctx.moveTo(obstacle.x, obstacle.y + obstacle.height * (0.2 + i * 0.15));
          ctx.lineTo(obstacle.x - 5, obstacle.y + obstacle.height * (0.15 + i * 0.15));
          ctx.stroke();
          
          // Right spikes
          ctx.beginPath();
          ctx.moveTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height * (0.2 + i * 0.15));
          ctx.lineTo(obstacle.x + obstacle.width + 5, obstacle.y + obstacle.height * (0.15 + i * 0.15));
          ctx.stroke();
        }
        
      } else if (obstacle.type === 'bird') {
        // Draw bird
        ctx.fillStyle = '#FF8A65'; // Orange bird
        
        // Bird body
        ctx.beginPath();
        ctx.ellipse(
          obstacle.x + obstacle.width/2, 
          obstacle.y + obstacle.height/2,
          obstacle.width/2, 
          obstacle.height/3,
          0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Wings animation based on time
        const wingUp = Math.sin(elapsedTime * 0.01) > 0;
        const wingHeight = obstacle.height * 0.6;
        const wingWidth = obstacle.width * 0.8;
        const wingY = wingUp ? 
          obstacle.y : 
          obstacle.y + obstacle.height * 0.2;
        
        // Draw wings
        ctx.beginPath();
        ctx.ellipse(
          obstacle.x + obstacle.width/2, 
          wingY,
          wingWidth/2, 
          wingHeight/4,
          0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Draw beak
        ctx.fillStyle = '#FFC107'; // Yellow beak
        ctx.beginPath();
        ctx.moveTo(obstacle.x + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.4);
        ctx.lineTo(obstacle.x + obstacle.width * 1.2, obstacle.y + obstacle.height * 0.5);
        ctx.lineTo(obstacle.x + obstacle.width * 0.8, obstacle.y + obstacle.height * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Draw eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(
          obstacle.x + obstacle.width * 0.7, 
          obstacle.y + obstacle.height * 0.4,
          2, 0, Math.PI * 2
        );
        ctx.fill();
      }
    }

    // Game over handling with proper cleanup
    function handleGameOver() {
      if (gameState === 'game_over') return; // Prevent multiple calls
      
      console.log("Game over triggered");
      isPlaying = false;
      gameState = 'game_over';
      isPaused = true; // Add this line to pause the game
      
      // Reset movement states
      movingLeft = false;
      movingRight = false;
      isJumping = false;
      catVelX = 0;
      jumpForce = 0;
      
      // Reset power-up state
      specialAbilityActive = false;
      specialAbilityTimer = 0;
      specialAbilityType = null;
      gameSpeed = 5; // Reset game speed in case speed power-up was active
      
      // Save high score locally
      const highScore = localStorage.getItem('catRunnerHighScore') || 0;
      if (score > highScore) {
        localStorage.setItem('catRunnerHighScore', score);
      }
      
      console.log(`Game over! Final score: ${score}`);
      
      // Try to notify server but don't rely on it
      try {
        if (this.pushEvent && typeof this.pushEvent === 'function') {
          this.pushEvent("game_over", { score });
        }
      } catch (e) {
        console.warn("Server notification failed, continuing locally");
      }
    }

    // Draw game over message with retry option
    function drawGameOver() {
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Game over text
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 48px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 50);
      
      // Score display
      ctx.font = 'bold 32px Arial, sans-serif';
      ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 + 10);
      
      // High score
      const highScore = localStorage.getItem('catRunnerHighScore') || 0;
      ctx.fillText(`High Score: ${highScore}`, canvas.width/2, canvas.height/2 + 60);
      
      // Restart prompt
      ctx.font = '24px Arial, sans-serif';
      
      // Make text pulse
      const alpha = 0.5 + 0.5 * Math.sin(elapsedTime * 0.005);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      
      ctx.fillText('Click or press any key to restart', canvas.width/2, canvas.height/2 + 120);
      
      // Create a DOM button that sits on top of the canvas for reliable navigation
      if (!document.getElementById('menuButton')) {
        // Create actual HTML button for more reliable click handling
        const button = document.createElement('button');
        button.id = 'menuButton';
        button.innerText = 'Return to Menu';
        button.style.position = 'absolute';
        button.style.zIndex = '1000';
        button.style.top = `${canvas.getBoundingClientRect().top + canvas.height/2 + 160}px`;
        button.style.left = '50%';
        button.style.transform = 'translateX(-50%)';
        button.style.padding = '10px 30px';
        button.style.fontSize = '18px';
        button.style.fontWeight = 'bold';
        button.style.backgroundColor = '#3F51B5';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        
        // Add direct event listener
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          console.log("Menu button clicked directly");
          
          // Use multiple navigation methods for redundancy
          try {
            window.location.href = '/';
          } catch(e) {
            console.error("Navigation failed, trying alternate method", e);
            try {
              document.location.href = '/';
            } catch(e2) {
              console.error("Second navigation attempt failed", e2);
              // Final fallback
              window.open('/', '_self');
            }
          }
        });
        
        // Append to document body
        document.body.appendChild(button);
        
        // Set up removal of button when game restarts
        window.addEventListener('keydown', removeMenuButton);
        canvas.addEventListener('click', function(e) {
          // Don't remove if clicking the button itself
          if (e.target !== button) {
            removeMenuButton();
          }
        });
      }
      
      // Still draw the button on canvas as a visual cue
      const menuButtonY = canvas.height/2 + 180;
      const buttonWidth = 200;
      const buttonHeight = 50;
      
      ctx.fillStyle = '#3F51B5';
      ctx.beginPath();
      ctx.roundRect(
        canvas.width/2 - buttonWidth/2,
        menuButtonY - buttonHeight/2,
        buttonWidth,
        buttonHeight,
        10
      );
      ctx.fill();
      
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText('Return to Menu', canvas.width/2, menuButtonY);
    }

    // Helper function to remove menu button
    function removeMenuButton() {
      const button = document.getElementById('menuButton');
      if (button) {
        button.removeEventListener('click', () => {});
        document.body.removeChild(button);
      }
    }

    // Add this function to create random background elements
    function createBackgroundElement() {
      const types = ['mountain', 'tree', 'bush', 'cloud'];
      const type = types[Math.floor(Math.random() * types.length)];
      let height, width;
      
      switch(type) {
        case 'mountain':
          height = Math.random() * 150 + 100;
          width = height * 1.5;
          break;
        case 'tree':
          height = Math.random() * 100 + 50;
          width = height * 0.4;
          break;
        case 'bush':
          height = Math.random() * 30 + 20;
          width = height * 2;
          break;
        case 'cloud':
          height = Math.random() * 40 + 20;
          width = height * 2;
          break;
      }
      
      return {
        type,
        x: canvas.width + width,
        y: type === 'cloud' ? 
           Math.random() * (canvas.height * 0.4) : 
           getGroundY() - height,
        width,
        height,
        speed: type === 'cloud' ? 
               Math.random() * 0.5 + 0.2 : 
               0.5 + (Math.random() * 0.3)
      };
    }

    // Update and draw background elements
    function updateBackgroundElements(deltaTime) {
        if (!isPaused && isPlaying) {
            // Add new background elements occasionally
            if (Math.random() < 0.005 * deltaTime * 0.1) {
                backgroundElements.push(createBackgroundElement());
            }
            
            // Update positions
            for (let i = backgroundElements.length - 1; i >= 0; i--) {
                const element = backgroundElements[i];
                element.x -= element.speed * deltaTime * 0.1;
                
                // Remove if off screen
                if (element.x < -element.width) {
                    backgroundElements.splice(i, 1);
                }
            }
        }
    }

    function drawBackgroundElements() {
      backgroundElements.forEach(element => {
        switch(element.type) {
          case 'mountain':
            drawMountain(element);
            break;
          case 'tree':
            drawTree(element);
            break;
          case 'bush':
            drawBush(element);
            break;
          case 'cloud':
            // Clouds are drawn elsewhere
            break;
        }
      });
    }

    function drawMountain(mountain) {
      // Draw mountain with gradients based on time of day
      const isDaytime = dayNightCycle >= 0.25 && dayNightCycle < 0.75;
      
      const mountainGradient = ctx.createLinearGradient(
        mountain.x, mountain.y, 
        mountain.x + mountain.width, mountain.y + mountain.height
      );
      
      if (isDaytime) {
        mountainGradient.addColorStop(0, '#5D4037');
        mountainGradient.addColorStop(0.7, '#795548');
        mountainGradient.addColorStop(1, '#8D6E63');
      } else {
        mountainGradient.addColorStop(0, '#263238');
        mountainGradient.addColorStop(0.7, '#37474F');
        mountainGradient.addColorStop(1, '#455A64');
      }
      
      ctx.fillStyle = mountainGradient;
      
      // Draw mountain shape
      ctx.beginPath();
      ctx.moveTo(mountain.x, getGroundY());
      ctx.lineTo(mountain.x + mountain.width * 0.3, mountain.y + mountain.height * 0.3);
      ctx.lineTo(mountain.x + mountain.width * 0.5, mountain.y);
      ctx.lineTo(mountain.x + mountain.width * 0.7, mountain.y + mountain.height * 0.4);
      ctx.lineTo(mountain.x + mountain.width, getGroundY());
      ctx.closePath();
      ctx.fill();
      
      // Add snow cap if it's a tall mountain
      if (mountain.height > 180) {
        ctx.fillStyle = isDaytime ? '#FFFFFF' : '#E0E0E0';
        ctx.beginPath();
        ctx.moveTo(mountain.x + mountain.width * 0.4, mountain.y + mountain.height * 0.2);
        ctx.lineTo(mountain.x + mountain.width * 0.5, mountain.y);
        ctx.lineTo(mountain.x + mountain.width * 0.6, mountain.y + mountain.height * 0.15);
        ctx.closePath();
        ctx.fill();
      }
    }

    function drawTree(tree) {
      // Draw tree trunk
      ctx.fillStyle = '#5D4037';
      ctx.fillRect(
        tree.x + tree.width * 0.4, 
        tree.y + tree.height * 0.6, 
        tree.width * 0.2, 
        tree.height * 0.4
      );
      
      // Draw tree foliage as triangle shapes
      const isDaytime = dayNightCycle >= 0.25 && dayNightCycle < 0.75;
      ctx.fillStyle = isDaytime ? '#2E7D32' : '#1B5E20';
      
      // Bottom triangle (largest)
      ctx.beginPath();
      ctx.moveTo(tree.x, tree.y + tree.height * 0.6);
      ctx.lineTo(tree.x + tree.width, tree.y + tree.height * 0.6);
      ctx.lineTo(tree.x + tree.width * 0.5, tree.y + tree.height * 0.3);
      ctx.closePath();
      ctx.fill();
      
      // Middle triangle
      ctx.beginPath();
      ctx.moveTo(tree.x + tree.width * 0.1, tree.y + tree.height * 0.3);
      ctx.lineTo(tree.x + tree.width * 0.9, tree.y + tree.height * 0.3);
      ctx.lineTo(tree.x + tree.width * 0.5, tree.y + tree.height * 0.1);
      ctx.closePath();
      ctx.fill();
      
      // Top triangle (smallest)
      ctx.beginPath();
      ctx.moveTo(tree.x + tree.width * 0.25, tree.y + tree.height * 0.1);
      ctx.lineTo(tree.x + tree.width * 0.75, tree.y + tree.height * 0.1);
      ctx.lineTo(tree.x + tree.width * 0.5, tree.y);
      ctx.closePath();
      ctx.fill();
    }

    function drawBush(bush) {
      const isDaytime = dayNightCycle >= 0.25 && dayNightCycle < 0.75;
      ctx.fillStyle = isDaytime ? '#388E3C' : '#1B5E20';
      
      // Draw a series of overlapping circles for a bush shape
      const centerX = bush.x + bush.width / 2;
      const bushTop = bush.y;
      
      // Main center bush
      ctx.beginPath();
      ctx.arc(
        centerX, 
        bushTop + bush.height * 0.5, 
        bush.width * 0.3, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Left side bush
      ctx.beginPath();
      ctx.arc(
        centerX - bush.width * 0.25, 
        bushTop + bush.height * 0.6, 
        bush.width * 0.25, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Right side bush
      ctx.beginPath();
      ctx.arc(
        centerX + bush.width * 0.25, 
        bushTop + bush.height * 0.6, 
        bush.width * 0.25, 
        0, Math.PI * 2
      );
      ctx.fill();
      
      // Top bush
      ctx.beginPath();
      ctx.arc(
        centerX, 
        bushTop + bush.height * 0.3, 
        bush.width * 0.2, 
        0, Math.PI * 2
      );
      ctx.fill();
    }

    // Add coin handling functions
    function updateCoins(deltaTime) {
      // Generate new coins occasionally
      if (isPlaying && !isPaused && Math.random() < 0.01) {
        // Different patterns for coins
        const patternType = Math.floor(Math.random() * 4);
        
        let yPos;
        switch (patternType) {
          case 0: // Straight line
            yPos = getGroundY() - 50 - Math.random() * 100;
            for (let i = 0; i < 5; i++) {
              coins.push({
                x: canvas.width + i * 30,
                y: yPos,
                size: 15,
                collected: false,
                value: 1
              });
            }
            break;
          case 1: // Arc
            for (let i = 0; i < 5; i++) {
              coins.push({
                x: canvas.width + i * 30,
                y: getGroundY() - 50 - Math.sin(i * 0.6) * 100,
                size: 15,
                collected: false,
                value: 1
              });
            }
            break;
          case 2: // Vertical line
            for (let i = 0; i < 3; i++) {
              coins.push({
                x: canvas.width + 30,
                y: getGroundY() - 40 - i * 40,
                size: 15,
                collected: false,
                value: 1
              });
            }
            break;
          case 3: // Special golden coin (worth more)
            coins.push({
              x: canvas.width + 30,
              y: getGroundY() - 100 - Math.random() * 50,
              size: 20,
              collected: false,
              value: 5,
              isGolden: true
            });
            break;
        }
      }
      
      // Update coin positions and check for collection
      for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        coin.x -= gameSpeed * (deltaTime * 0.1);
        
        // Remove if off screen
        if (coin.x < -coin.size * 2) {
          coins.splice(i, 1);
          continue;
        }
        
        // Check for collection
        if (!coin.collected && isPlaying && !isPaused) {
          if (
            catX < coin.x + coin.size &&
            catX + CAT_WIDTH > coin.x - coin.size &&
            catY < coin.y + coin.size &&
            catY + CAT_HEIGHT > coin.y - coin.size
          ) {
            // Coin collected!
            coin.collected = true;
            
            // Add score based on value and multiplier
            score += coin.value * score_multiplier;
            
            // Update combo
            comboCount++;
            comboTimer = 2000; // Reset combo timer (2 seconds)
            
            // Set multiplier based on combo
            if (comboCount >= 10) score_multiplier = 3;
            else if (comboCount >= 5) score_multiplier = 2;
            else score_multiplier = 1;
            
            // Create collection particles
            for (let j = 0; j < 10; j++) {
              particles.push({
                x: coin.x,
                y: coin.y,
                size: Math.random() * 3 + 1,
                speedX: (Math.random() - 0.5) * 3,
                speedY: (Math.random() - 0.5) * 3,
                color: coin.isGolden ? '#FFD700' : '#FFC107',
                life: 30,
                type: 'coin'
              });
            }
            
            // Chance to spawn a power-up after collecting coins
            if (Math.random() < 0.2 && comboCount >= 5) {
              spawnPowerup(coin.x, coin.y);
            }
          }
        }
      }
    }

    function drawCoins() {
      for (let i = 0; i < coins.length; i++) {
        const coin = coins[i];
        if (coin.collected) continue;
        
        // Coin animation - slight bobbing and rotation
        const bobAmount = Math.sin(elapsedTime * 0.005) * 3;
        
        // Draw the coin
        ctx.save();
        ctx.translate(coin.x, coin.y + bobAmount);
        
        // Make it appear to rotate by changing width
        const stretchFactor = 0.5 + 0.5 * Math.abs(Math.sin(elapsedTime * 0.003));
        
        // Coin gradient
        const coinGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, coin.size);
        
        if (coin.isGolden) {
          coinGradient.addColorStop(0, '#FFD700');
          coinGradient.addColorStop(0.7, '#FFC107');
          coinGradient.addColorStop(1, '#FF9800');
        } else {
          coinGradient.addColorStop(0, '#FFC107');
          coinGradient.addColorStop(0.7, '#FF9800');
          coinGradient.addColorStop(1, '#FF5722');
        }
        
        ctx.fillStyle = coinGradient;
        
        // Draw the coin as an ellipse to simulate rotation
        ctx.beginPath();
        ctx.ellipse(0, 0, coin.size * stretchFactor, coin.size, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add coin details
        ctx.strokeStyle = coin.isGolden ? '#FFE082' : '#FFE0B2';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, coin.size * 0.7 * stretchFactor, coin.size * 0.7, 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add star shape for golden coins
        if (coin.isGolden) {
          ctx.fillStyle = '#FFECB3';
          const starPoints = 5;
          const outerRadius = coin.size * 0.5;
          const innerRadius = coin.size * 0.2;
          
          ctx.beginPath();
          for (let j = 0; j < starPoints * 2; j++) {
            const radius = j % 2 === 0 ? outerRadius : innerRadius;
            const angle = (j * Math.PI) / starPoints;
            const x = Math.cos(angle) * radius * stretchFactor;
            const y = Math.sin(angle) * radius;
            
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
        }
        
        ctx.restore();
      }
    }

    // Add power-up handling
    function spawnPowerup(x, y) {
      const types = ['speed', 'magnet', 'doubleJump']; // Removed 'invisible'
      const type = types[Math.floor(Math.random() * types.length)];
      
      powerups.push({
        x: x || canvas.width + 50,
        y: y || getGroundY() - 100 - Math.random() * 50,
        type,
        size: 25,
        collected: false
      });
    }

    function updatePowerups(deltaTime) {
      // Update power-up positions
      for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.x -= gameSpeed * (deltaTime * 0.1);
        
        // Remove if off screen
        if (powerup.x < -powerup.size * 2) {
          powerups.splice(i, 1);
          continue;
        }
        
        // Check for collection
        if (!powerup.collected && isPlaying && !isPaused) {
          if (
            catX < powerup.x + powerup.size &&
            catX + CAT_WIDTH > powerup.x - powerup.size &&
            catY < powerup.y + powerup.size &&
            catY + CAT_HEIGHT > powerup.y - powerup.size
          ) {
            // Power-up collected!
            powerup.collected = true;
            activatePowerup(powerup.type);
            
            // Create collection particles
            for (let j = 0; j < 15; j++) {
              let color;
              switch (powerup.type) {
                case 'speed': color = '#FF5722'; break;
                case 'magnet': color = '#673AB7'; break;
                case 'doubleJump': color = '#4CAF50'; break;
              }
              
              particles.push({
                x: powerup.x,
                y: powerup.y,
                size: Math.random() * 4 + 2,
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                color,
                life: 40,
                type: 'powerup'
              });
            }
          }
        }
      }
    }

    function drawPowerups() {
      for (let i = 0; i < powerups.length; i++) {
        const powerup = powerups[i];
        if (powerup.collected) continue;
        
        // Power-up animation - bobbing
        const bobAmount = Math.sin(elapsedTime * 0.005) * 5;
        
        // Draw the power-up
        ctx.save();
        ctx.translate(powerup.x, powerup.y + bobAmount);
        
        // Rotate slightly
        ctx.rotate(Math.sin(elapsedTime * 0.003) * 0.2);
        
        // Draw power-up based on type
        switch (powerup.type) {
          case 'speed':
            // Orange speed boost
            ctx.fillStyle = '#FF5722';
            ctx.beginPath();
            ctx.arc(0, 0, powerup.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Speed lines
            ctx.strokeStyle = '#FFCCBC';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-powerup.size * 0.5, 0);
            ctx.lineTo(powerup.size * 0.5, 0);
            ctx.moveTo(powerup.size * 0.3, -powerup.size * 0.3);
            ctx.lineTo(powerup.size * 0.5, 0);
            ctx.lineTo(powerup.size * 0.3, powerup.size * 0.3);
            ctx.stroke();
            break;
            
          case 'magnet':
            // Purple magnet
            ctx.fillStyle = '#673AB7';
            ctx.beginPath();
            ctx.arc(0, 0, powerup.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Magnet poles
            ctx.fillStyle = '#D1C4E9';
            ctx.beginPath();
            ctx.moveTo(-powerup.size * 0.4, -powerup.size * 0.3);
            ctx.lineTo(-powerup.size * 0.4, powerup.size * 0.3);
            ctx.lineTo(-powerup.size * 0.1, powerup.size * 0.3);
            ctx.lineTo(-powerup.size * 0.1, -powerup.size * 0.3);
            ctx.closePath();
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(powerup.size * 0.4, -powerup.size * 0.3);
            ctx.lineTo(powerup.size * 0.4, powerup.size * 0.3);
            ctx.lineTo(powerup.size * 0.1, powerup.size * 0.3);
            ctx.lineTo(powerup.size * 0.1, -powerup.size * 0.3);
            ctx.closePath();
            ctx.fill();
            break;
            
          case 'doubleJump':
            // Green double jump
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.arc(0, 0, powerup.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Up arrows
            ctx.fillStyle = '#C8E6C9';
            
            // First arrow
            ctx.beginPath();
            ctx.moveTo(0, -powerup.size * 0.5);
            ctx.lineTo(powerup.size * 0.3, -powerup.size * 0.1);
            ctx.lineTo(-powerup.size * 0.3, -powerup.size * 0.1);
            ctx.closePath();
            ctx.fill();
            
            // Second arrow
            ctx.beginPath();
            ctx.moveTo(0, -powerup.size * 0.1);
            ctx.lineTo(powerup.size * 0.3, powerup.size * 0.3);
            ctx.lineTo(-powerup.size * 0.3, powerup.size * 0.3);
            ctx.closePath();
            ctx.fill();
            break;
        }
        
        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(255, 255, 255, 0.7)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, powerup.size * 1.1, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    function activatePowerup(type) {
      // Only activate if no power-up is currently active
      if (!specialAbilityActive) {
        specialAbilityActive = true;
        specialAbilityType = type;
        specialAbilityTimer = 10000; // 10 seconds
        
        console.log(`Activated power-up: ${type}`);
        
        // Clear existing HUD messages
        activeHUDMessages = [];
        
        // Add tooltip message that lasts as long as the power-up
        let message;
        switch (type) {
          case 'speed':
            message = "Speed Boost: Move faster!";
            break;
          case 'magnet':
            message = "Coin Magnet: Attract nearby coins!";
            break;
          case 'doubleJump':
            message = "Double Jump: Jump again in mid-air!";
            break;
        }
        
        activeHUDMessages.push({
          text: message,
          timer: specialAbilityTimer,
          y: 120
        });
        
        switch (type) {
          case 'speed':
            // Speed temporarily doubles game speed
            gameSpeed *= 1.5;
            break;
          case 'magnet':
            // Magnet attracts coins
            break;
          case 'doubleJump':
            // Double jump allows a second jump in the air
            break;
        }
      } else {
        console.log(`Cannot activate ${type}: ${specialAbilityType} is still active`);
      }
    }

    function drawSpecialAbilityEffect() {
      if (!specialAbilityActive) return;
      
      const timeLeft = specialAbilityTimer / 10000; // 0-1 range
      
      switch (specialAbilityType) {
        case 'speed':
          // Speed trail behind cat
          if (Math.random() < 0.3) {
            particles.push({
              x: catX,
              y: catY + CAT_HEIGHT * Math.random(),
              size: Math.random() * 5 + 3,
              speedX: -3,
              speedY: (Math.random() - 0.5) * 2,
              color: '#FF5722',
              life: 15,
              type: 'speed'
            });
          }
          break;
          
        case 'magnet':
          // Draw magnet effect around cat
          ctx.fillStyle = `rgba(103, 58, 183, ${0.1 + 0.1 * Math.sin(elapsedTime * 0.01)})`;
          ctx.beginPath();
          ctx.arc(
            catX + CAT_WIDTH/2, 
            catY + CAT_HEIGHT/2, 
            150, 
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Pull nearby coins toward the cat
          coins.forEach(coin => {
            if (coin.collected) return;
            
            const dx = (catX + CAT_WIDTH/2) - coin.x;
            const dy = (catY + CAT_HEIGHT/2) - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              coin.x += dx * 0.05;
              coin.y += dy * 0.05;
            }
          });
          break;
          
        case 'doubleJump':
          // Trail of green particles under cat when jumping
          if (isJumping && Math.random() < 0.2) {
            particles.push({
              x: catX + CAT_WIDTH * Math.random(),
              y: catY + CAT_HEIGHT,
              size: Math.random() * 4 + 2,
              speedX: (Math.random() - 0.5) * 2,
              speedY: Math.random() * 1 + 1,
              color: '#4CAF50',
              life: 20,
              type: 'doubleJump'
            });
          }
          break;
      }
      
      // Draw timer bar
      const barWidth = 100;
      const barHeight = 10;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(
        catX + CAT_WIDTH/2 - barWidth/2,
        catY - 20,
        barWidth,
        barHeight
      );
      
      // Choose color based on power-up type
      let barColor;
      switch (specialAbilityType) {
        case 'speed': barColor = '#FF5722'; break;
        case 'magnet': barColor = '#673AB7'; break;
        case 'doubleJump': barColor = '#4CAF50'; break;
      }
      
      ctx.fillStyle = barColor;
      ctx.fillRect(
        catX + CAT_WIDTH/2 - barWidth/2,
        catY - 20,
        barWidth * timeLeft,
        barHeight
      );
    }

    // Draw combo counter
    function drawCombo() {
      if (comboCount > 1) {
        const alpha = Math.min(1, comboTimer / 1000);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Combo: ${comboCount}x`, canvas.width * 0.5, 60);
        
        // Draw multiplier if active
        if (score_multiplier > 1) {
          ctx.fillStyle = score_multiplier >= 3 ? '#FFC107' : '#FF5722';
          ctx.font = 'bold 20px Arial, sans-serif';
          ctx.fillText(`${score_multiplier}x Score!`, canvas.width * 0.5, 90);
        }
      }
    }

    // Helper function to interpolate between colors
    function interpolateColor(color1, color2, factor) {
      // Convert hex to RGB
      const hex2rgb = (hex) => {
        const r = parseInt(hex.substring(1, 3), 16);
        const g = parseInt(hex.substring(3, 5), 16);
        const b = parseInt(hex.substring(5, 7), 16);
        return [r, g, b];
      };
      
      // Interpolate between two RGB values
      const interpolate = (a, b, factor) => {
        return Math.round(a + (b - a) * factor);
      };
      
      const rgb1 = hex2rgb(color1);
      const rgb2 = hex2rgb(color2);
      
      const r = interpolate(rgb1[0], rgb2[0], factor);
      const g = interpolate(rgb1[1], rgb2[1], factor);
      const b = interpolate(rgb1[2], rgb2[2], factor);
      
      return `rgb(${r}, ${g}, ${b})`;
    }

    // Add this function to draw the power-up HUD
    function drawPowerupHUD() {
      if (!specialAbilityActive) return;

      // Position for HUD element
      const hudX = 20;
      const hudY = 70;
      const iconSize = 40;
      
      // Draw icon background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(hudX, hudY, iconSize, iconSize, 8);
      ctx.fill();
      
      // Draw power-up icon
      ctx.save();
      ctx.translate(hudX + iconSize/2, hudY + iconSize/2);
      
      switch (specialAbilityType) {
        case 'speed':
          // Speed icon
          ctx.fillStyle = '#FF5722';
          ctx.beginPath();
          ctx.moveTo(-iconSize * 0.3, -iconSize * 0.3);
          ctx.lineTo(iconSize * 0.3, 0);
          ctx.lineTo(-iconSize * 0.3, iconSize * 0.3);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'magnet':
          // Magnet icon
          ctx.fillStyle = '#673AB7';
          ctx.beginPath();
          ctx.moveTo(-iconSize * 0.2, -iconSize * 0.3);
          ctx.lineTo(-iconSize * 0.2, iconSize * 0.1);
          ctx.lineTo(0, iconSize * 0.3);
          ctx.lineTo(iconSize * 0.2, iconSize * 0.1);
          ctx.lineTo(iconSize * 0.2, -iconSize * 0.3);
          ctx.closePath();
          ctx.fill();
          break;
          
        case 'doubleJump':
          // Double jump icon
          ctx.fillStyle = '#4CAF50';
          // First arrow
          ctx.beginPath();
          ctx.moveTo(0, -iconSize * 0.3);
          ctx.lineTo(iconSize * 0.2, -iconSize * 0.1);
          ctx.lineTo(-iconSize * 0.2, -iconSize * 0.1);
          ctx.closePath();
          ctx.fill();
          // Second arrow
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(iconSize * 0.2, iconSize * 0.2);
          ctx.lineTo(-iconSize * 0.2, iconSize * 0.2);
          ctx.closePath();
          ctx.fill();
          break;
      }
      ctx.restore();
      
      // Draw timer arc
      const timeLeft = specialAbilityTimer / 10000;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(
        hudX + iconSize/2,
        hudY + iconSize/2,
        iconSize * 0.45,
        -Math.PI/2,
        -Math.PI/2 + (Math.PI * 2 * timeLeft)
      );
      ctx.stroke();
    }

    // Add function to draw HUD messages
    function drawHUDMessages(deltaTime) {
      // Update and remove expired messages
      for (let i = activeHUDMessages.length - 1; i >= 0; i--) {
        const msg = activeHUDMessages[i];
        msg.timer -= deltaTime;
        
        if (msg.timer <= 0) {
          activeHUDMessages.splice(i, 1);
          continue;
        }
        
        // Fade out effect only in the last second
        const alpha = msg.timer <= 1000 ? msg.timer / 1000 : 1;
        
        // Draw message
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(msg.text, 70, msg.y);
        ctx.restore();
      }
    }
  }
}; 