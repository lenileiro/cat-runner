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
  
  // Sky with day/night cycle
  drawSky: (ctx, canvas, dayNightCycle) => {
    // Draw sky gradient based on time of day
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    
    // Morning colors
    if (dayNightCycle < 0.25) {
      const t = dayNightCycle * 4; // 0 to 1 during this phase
      skyGradient.addColorStop(0, Utils.interpolateColor('#0C1445', '#6EC6FF', t));
      skyGradient.addColorStop(1, Utils.interpolateColor('#1A237E', '#E3F2FD', t));
    } 
    // Day colors
    else if (dayNightCycle < 0.5) {
      skyGradient.addColorStop(0, '#6EC6FF');
      skyGradient.addColorStop(1, '#E3F2FD');
    } 
    // Evening colors
    else if (dayNightCycle < 0.75) {
      const t = (dayNightCycle - 0.5) * 4; // 0 to 1 during this phase
      skyGradient.addColorStop(0, Utils.interpolateColor('#6EC6FF', '#FF9800', t));
      skyGradient.addColorStop(1, Utils.interpolateColor('#E3F2FD', '#FF5722', t));
    } 
    // Night colors
    else {
      const t = (dayNightCycle - 0.75) * 4; // 0 to 1 during this phase
      skyGradient.addColorStop(0, Utils.interpolateColor('#FF9800', '#0C1445', t));
      skyGradient.addColorStop(1, Utils.interpolateColor('#FF5722', '#1A237E', t));
    }
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
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
    
    // High score with special highlight for new high score
    const highScore = localStorage.getItem('catRunnerHighScore') || 0;
    
    if (newHighScore) {
      // Draw "New High Score!" text with glow effect
      ctx.save();
      ctx.shadowColor = '#FFEB3B';
      ctx.shadowBlur = 15;
      ctx.fillStyle = '#FFEB3B';
      ctx.font = 'bold 36px Arial, sans-serif';
      ctx.fillText('New High Score!', canvas.width/2, canvas.height/2 + 60);
      ctx.restore();
    } else {
      // Regular high score display
      ctx.fillText(`High Score: ${highScore}`, canvas.width/2, canvas.height/2 + 60);
    }
    
    // Restart prompt
    const alpha = 0.5 + 0.5 * Math.sin(elapsedTime * 0.005);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.font = '24px Arial, sans-serif';
    ctx.fillText('Click or press any key to restart', canvas.width/2, canvas.height/2 + 120);
    
    // Store button bounds for click handling
    const menuButtonY = canvas.height/2 + 180;
    const buttonWidth = 200;
    const buttonHeight = 50;
    window.menuButtonBounds = {
      x: canvas.width/2 - buttonWidth/2,
      y: menuButtonY - buttonHeight/2,
      width: buttonWidth,
      height: buttonHeight
    };
    
    // Draw menu button
    ctx.fillStyle = '#3F51B5';
    ctx.beginPath();
    ctx.roundRect(
      window.menuButtonBounds.x,
      window.menuButtonBounds.y,
      buttonWidth,
      buttonHeight,
      10
    );
    ctx.fill();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText('Return to Menu', canvas.width/2, menuButtonY);
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