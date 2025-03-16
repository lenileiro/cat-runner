import { CONSTANTS, Utils } from './engine.js';

// Particle system
export const ParticleSystem = {
  createParticle: () => {
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight * 0.7,
      size: Math.random() * 5 + 2,
      speedX: Math.random() * 1 - 0.5,
      speedY: Math.random() * 0.5 - 0.25,
      color: `hsla(${Math.random() * 60 + 40}, 80%, 80%, ${Math.random() * 0.5 + 0.2})`
    };
  },
  
  update: (particles, deltaTime, maxParticles) => {
    // Add new particles if needed
    while (particles.length < maxParticles) {
      particles.push(ParticleSystem.createParticle());
    }
    
    // Update particle positions
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.speedX * deltaTime * 0.05;
      p.y += p.speedY * deltaTime * 0.05;
      
      // Remove particles that move off-screen
      if (p.x < -p.size || p.x > window.innerWidth + p.size || 
          p.y < -p.size || p.y > window.innerHeight + p.size) {
        particles.splice(i, 1);
      }
    }
  },
  
  draw: (ctx, particles) => {
    particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }
};

// Background renderers
export const Background = {
  // Draw clouds in the background with animation
  drawClouds: (ctx, canvas, deltaTime, elapsedTime, cloudsArray = 'clouds', isPaused = false, isPlaying = true) => {
    // Create clouds array if it doesn't exist
    if (!window[cloudsArray]) {
      window[cloudsArray] = [];
      for (let i = 0; i < 5; i++) {
        window[cloudsArray].push({
          x: Math.random() * canvas.width,
          y: Math.random() * (canvas.height * 0.5),
          width: Math.random() * 100 + 50,
          speed: Math.random() * 0.2 + 0.05 // Reduced from 0.5 + 0.1
        });
      }
    }
    
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    
    // Draw and animate clouds
    window[cloudsArray].forEach(cloud => {
      // Move cloud only if not paused
      if (!isPaused && isPlaying) {
        cloud.x += cloud.speed * deltaTime * 0.05;
        
        // Wrap around screen
        if (cloud.x > canvas.width + cloud.width) {
          cloud.x = -cloud.width;
          cloud.y = Math.random() * (canvas.height * 0.5);
          cloud.width = Math.random() * 100 + 50;
          cloud.speed = Math.random() * 0.2 + 0.05;
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
  },
  
  // Draw the ground with some detail and more color
  drawGround: (ctx, canvas) => {
    const groundY = Utils.getGroundY(canvas);
    
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
  },
  
  // Updated Sky with day/night cycle
  drawSky: (ctx, canvas, dayNightCycle) => {
    // Draw sky gradient based on time of day
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    // Calculate time periods more precisely for smoother transitions
    if (dayNightCycle < 0.25) { // Night to dawn transition
      // Midnight to dawn transition
      const t = dayNightCycle * 4; // 0 to 1 during this phase
      skyGradient.addColorStop(0, Utils.interpolateColor('#0a1a33', '#1e3c72', t)); // Deep blue to dawn blue
      skyGradient.addColorStop(0.4, Utils.interpolateColor('#1a2a4d', '#c06060', t)); // Midnight to sunrise orange
      skyGradient.addColorStop(0.7, Utils.interpolateColor('#2d334d', '#d39c7e', t)); // Dark to warm transition
      skyGradient.addColorStop(1, Utils.interpolateColor('#2d334d', '#e0d2c0', t));   // Ground-level color
    } 
    else if (dayNightCycle < 0.5) { // Dawn to day
      const t = (dayNightCycle - 0.25) * 4; // 0 to 1 during this phase
      skyGradient.addColorStop(0, Utils.interpolateColor('#1e3c72', '#2980b9', t)); // Dawn blue to day blue
      skyGradient.addColorStop(0.4, Utils.interpolateColor('#c06060', '#6bb9e0', t)); // Sunrise orange to sky blue
      skyGradient.addColorStop(0.7, Utils.interpolateColor('#d39c7e', '#a1d6e6', t)); // Warm to cool transition
      skyGradient.addColorStop(1, Utils.interpolateColor('#e0d2c0', '#a1d6e6', t));   // Ground-level color
    } 
    else if (dayNightCycle < 0.75) { // Day to dusk
      const t = (dayNightCycle - 0.5) * 4; // 0 to 1 during this phase
      skyGradient.addColorStop(0, Utils.interpolateColor('#2980b9', '#1e3c72', t)); // Day blue to dusk blue
      skyGradient.addColorStop(0.4, Utils.interpolateColor('#6bb9e0', '#c06060', t)); // Sky blue to sunset orange
      skyGradient.addColorStop(0.7, Utils.interpolateColor('#a1d6e6', '#d39c7e', t)); // Cool to warm transition
      skyGradient.addColorStop(1, Utils.interpolateColor('#a1d6e6', '#e0d2c0', t));   // Ground-level color
    } 
    else { // Dusk to night
      const t = (dayNightCycle - 0.75) * 4; // 0 to 1 during this phase
      skyGradient.addColorStop(0, Utils.interpolateColor('#1e3c72', '#0a1a33', t)); // Dusk blue to deep blue
      skyGradient.addColorStop(0.4, Utils.interpolateColor('#c06060', '#1a2a4d', t)); // Sunset orange to midnight
      skyGradient.addColorStop(0.7, Utils.interpolateColor('#d39c7e', '#2d334d', t)); // Warm to dark transition
      skyGradient.addColorStop(1, Utils.interpolateColor('#e0d2c0', '#2d334d', t));   // Ground-level color
    }
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw celestial bodies (sun/moon) based on cycle
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
  },
  
  // Draw stars with twinkling effect
  drawStars: (ctx, canvas, elapsedTime, brightness) => {
    // Initialize stars if they don't exist
    if (!window.gameStars) {
      window.gameStars = [];
      for (let i = 0; i < 100; i++) {
        window.gameStars.push({
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
    window.gameStars.forEach(star => {
      const twinkle = (Math.sin(elapsedTime * star.twinkleSpeed + star.twinkleOffset) + 1) / 2;
      ctx.globalAlpha = (0.3 + twinkle * 0.7) * brightness;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;
  },
  
  // Draw mountains with parallax effect
  drawMountains: (ctx, canvas, elapsedTime, isPaused = false) => {
    const groundY = Utils.getGroundY(canvas);
    const mountainHeight = canvas.height * 0.25;
    
    // Parallax effect - different mountains move at different speeds
    // Only move if game is not paused
    const speed = isPaused ? 0 : 1;
    const farOffset = (elapsedTime * 0.005 * speed) % canvas.width;
    const midOffset = (elapsedTime * 0.01 * speed) % canvas.width;
    const nearOffset = (elapsedTime * 0.02 * speed) % canvas.width;
    
    // Far mountains (slowest moving)
    ctx.fillStyle = '#37465b';
    ctx.beginPath();
    ctx.moveTo(0, groundY - mountainHeight * 0.7);
    
    // Generate mountain range
    for (let x = 0; x < canvas.width + 100; x += 50) {
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
  },
  
  // Combined background drawing function
  drawBackground: (ctx, canvas, dayNightCycle, elapsedTime, isPaused = false) => {
    // Draw sky with proper day/night coloring
    Background.drawSky(ctx, canvas, dayNightCycle);
    
    // Draw stars at night (only during night phase)
    if (dayNightCycle > 0.75 || dayNightCycle < 0.25) {
      // Calculate star brightness based on time of day
      // Brightest at cycle 0 (midnight) and fades at dawn/dusk
      const starBrightness = dayNightCycle > 0.75 ? 
        (dayNightCycle - 0.75) * 4 : // Fade in at dusk
        1 - (dayNightCycle * 4);     // Fade out at dawn
        
      Background.drawStars(ctx, canvas, elapsedTime, starBrightness);
    }
    
    // Draw mountains with parallax effect
    Background.drawMountains(ctx, canvas, elapsedTime, isPaused);
  }
};

// Character renderer
export const CatRenderer = {
  draw: (ctx, canvas, catX, catY, elapsedTime = 0, isJumping = false, isPaused = false, gameState = 'idle') => {
    const isPlaying = gameState === 'playing';
    
    // Make cat bob up and down slightly when not jumping and not paused
    const bobAmount = (!isJumping && !isPaused && isPlaying) 
      ? Math.sin(elapsedTime * 0.003) * 3 
      : 0;
    
    // Cat body
    const bodyGradient = ctx.createLinearGradient(
      catX, catY, 
      catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT
    );
    bodyGradient.addColorStop(0, "#FFCDD2"); // Light pink
    bodyGradient.addColorStop(1, "#EF9A9A"); // Darker pink
    ctx.fillStyle = bodyGradient;
    
    // Draw rounded body
    ctx.beginPath();
    ctx.moveTo(catX + CONSTANTS.CAT_WIDTH * 0.1, catY + CONSTANTS.CAT_HEIGHT);
    ctx.lineTo(catX + CONSTANTS.CAT_WIDTH * 0.9, catY + CONSTANTS.CAT_HEIGHT);
    ctx.quadraticCurveTo(catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT, 
                         catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT * 0.9);
    ctx.lineTo(catX + CONSTANTS.CAT_WIDTH, catY + CONSTANTS.CAT_HEIGHT * 0.1);
    ctx.quadraticCurveTo(catX + CONSTANTS.CAT_WIDTH * 0.9, catY, 
                         catX + CONSTANTS.CAT_WIDTH * 0.1, catY);
    ctx.quadraticCurveTo(catX, catY, catX, catY + CONSTANTS.CAT_HEIGHT * 0.1);
    ctx.lineTo(catX, catY + CONSTANTS.CAT_HEIGHT * 0.9);
    ctx.quadraticCurveTo(catX, catY + CONSTANTS.CAT_HEIGHT, 
                         catX + CONSTANTS.CAT_WIDTH * 0.1, catY + CONSTANTS.CAT_HEIGHT);
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
    ctx.quadraticCurveTo(catX + CONSTANTS.CAT_WIDTH/2, catY + 30 + bobAmount, 
                         catX + CONSTANTS.CAT_WIDTH - 15, catY + 25 + bobAmount);
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
    ctx.translate(catX + CONSTANTS.CAT_WIDTH - 5, catY + 20 + bobAmount);
    ctx.rotate(0.2 - whiskerAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(15, -3);
    ctx.stroke();
    ctx.restore();
    
    ctx.save();
    ctx.translate(catX + CONSTANTS.CAT_WIDTH - 5, catY + 22 + bobAmount);
    ctx.rotate(0 - whiskerAngle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 0);
    ctx.stroke();
    ctx.restore();
    
    ctx.save();
    ctx.translate(catX + CONSTANTS.CAT_WIDTH - 5, catY + 24 + bobAmount);
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
      ctx.lineTo(catX + CONSTANTS.CAT_WIDTH - 15, catY + 22);
      ctx.stroke();
    } else if (isPaused) {
      // Surprised face when paused
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(catX + CONSTANTS.CAT_WIDTH/2, catY + 25, 5, 0, Math.PI * 2);
      ctx.stroke();
    } else if (!isPlaying && gameState === 'game_over') {
      // Sad face on game over
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(catX + 15, catY + 30);
      ctx.quadraticCurveTo(catX + CONSTANTS.CAT_WIDTH/2, catY + 20, 
                           catX + CONSTANTS.CAT_WIDTH - 15, catY + 30);
      ctx.stroke();
    }
    
    // Cat shadow that follows movement
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(catX + CONSTANTS.CAT_WIDTH/2, Utils.getGroundY(canvas) - 3, 
                CONSTANTS.CAT_WIDTH * 0.4, 5 - bobAmount/2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
};

// UI renderer components
export const UI = {
  // Draw score display
  drawScore: (ctx, canvas, score) => {
    // Apply a stronger shadow for visibility
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
  },
  
  // Draw game over message
  drawGameOver: (ctx, canvas, score, elapsedTime, newHighScore) => {
    // Semi-transparent overlay for better readability
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Game over text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for better visibility
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Main title with slight animation
    const textPulse = Math.sin(elapsedTime * 0.003) * 0.1 + 1;
    ctx.save();
    ctx.translate(canvas.width/2, canvas.height/2 - 100);
    ctx.scale(textPulse, textPulse);
    ctx.fillText('GAME OVER', 0, 0);
    ctx.restore();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Score display
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2 - 30);
    
    // Get current high score
    const highScore = localStorage.getItem('catRunnerHighScore') || 0;
    
    // High score display - always show with yellow glow
    ctx.save();
    
    ctx.font = 'bold 24px Arial, sans-serif';
    
    if (newHighScore) {
      // Yellow glow effect
      ctx.shadowColor = '#FFEB3B';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#FFEB3B'; // Glowing yellow
      // Show new high score message
      ctx.fillText(`NEW HIGH SCORE: ${score}`, canvas.width/2, canvas.height/2 + 20);
    } else {
      // Show current high score
      
      ctx.fillText(`High Score: ${highScore}`, canvas.width/2, canvas.height/2 + 20);
    }
    
    ctx.restore();
    
    // Instructions
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('Tap or press any key to play again', canvas.width/2, canvas.height/2 + 70);
    
    // Draw menu button (canvas-only, no HTML element)
    const menuButtonY = canvas.height/2 + 130;
    const buttonWidth = 200;
    const buttonHeight = 50;
    
    // Store button bounds for click handling
    window.menuButtonBounds = {
      x: canvas.width/2 - buttonWidth/2,
      y: menuButtonY - buttonHeight/2,
      width: buttonWidth,
      height: buttonHeight
    };
    
    // Button glow effect
    const glowAlpha = Math.sin(elapsedTime * 0.004) * 0.3 + 0.7;
    
    // Button shadow
    ctx.shadowColor = `rgba(63, 81, 181, ${glowAlpha * 0.5})`;
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw menu button with gradient
    const buttonGradient = ctx.createLinearGradient(
      window.menuButtonBounds.x, 
      window.menuButtonBounds.y, 
      window.menuButtonBounds.x, 
      window.menuButtonBounds.y + buttonHeight
    );
    buttonGradient.addColorStop(0, '#5C6BC0');
    buttonGradient.addColorStop(1, '#3F51B5');
    
    ctx.fillStyle = buttonGradient;
    ctx.beginPath();
    ctx.roundRect(
      window.menuButtonBounds.x,
      window.menuButtonBounds.y,
      buttonWidth,
      buttonHeight,
      10
    );
    ctx.fill();
    
    // Button border
    ctx.strokeStyle = '#7986CB';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Button text with shadow for legibility
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('Return to Menu', canvas.width/2, menuButtonY);
    
    // Reset shadow
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  },
  
  // Draw pause screen
  drawPauseScreen: (ctx, canvas, elapsedTime) => {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pause text
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 48px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2 - 30);
    
    // Instructions text with pulsing effect
    const alpha = 0.5 + 0.5 * Math.sin(elapsedTime * 0.005);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('Press ESC or P to resume', canvas.width/2, canvas.height/2 + 30);
    
    // Controls reminder
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '20px Arial, sans-serif';
    ctx.fillText('Controls:', canvas.width/2, canvas.height/2 + 90);
    ctx.font = '16px Arial, sans-serif';
    ctx.fillText('← → or A D : Move', canvas.width/2, canvas.height/2 + 120);
    ctx.fillText('↑ or W or SPACE : Jump', canvas.width/2, canvas.height/2 + 150);
  }
}; 