import { CONSTANTS, Utils } from './game/engine.js';
import { ParticleSystem, Background, CatRenderer, UI } from './game/renderers.js';
import { ObstacleSystem, CoinSystem, PowerupSystem } from './game/game_objects.js';
import { GameState } from './game/game_logic.js';

export const GameCanvas = {
  mounted() {
    console.log("GameCanvas hook mounted");
    try {
    const canvas = this.el;
    const ctx = canvas.getContext("2d");
      
      // Check if modules are properly loaded
      console.log("Module loading status:", {
        Utils: typeof Utils !== 'undefined',
        ParticleSystem: typeof ParticleSystem !== 'undefined',
        Background: typeof Background !== 'undefined',
        CatRenderer: typeof CatRenderer !== 'undefined',
        UI: typeof UI !== 'undefined'
      });
    
    // Check if LiveView is connected properly
    console.log("LiveView connection status:", {
      pushEventExists: typeof this.pushEvent === 'function',
      hookElement: this.el
    });
    
      // Set up the canvas
    function setupCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      console.log("Canvas dimensions set:", canvas.width, "x", canvas.height);
    }
    
    // Setup canvas first
    setupCanvas();
    
      // Initialize game state
      const game = new GameState(canvas, ctx, this);
      
      // Auto-start the game after a short delay
      setTimeout(() => {
        if (game.gameState === 'idle') {
          console.log("Auto-starting game...");
          game.startGame();
        }
      }, 500); // 500ms delay to ensure everything is loaded
      
      // Animation state
      let animationFrame;
      let lastTimestamp = 0;
      
      // Draw game screen
    function drawGameScreen(timestamp) {
      // Calculate delta time for smooth animations
      if (!lastTimestamp) lastTimestamp = timestamp;
      const deltaTime = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      game.elapsedTime += deltaTime;
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw complete background with enhanced effects
      Background.drawBackground(ctx, canvas, game.dayNightCycle, game.elapsedTime, game.isPaused);
      
      // Draw background particles
      ParticleSystem.update(game.particles, deltaTime, game.MAX_PARTICLES);
      ParticleSystem.draw(ctx, game.particles);
      
      // Draw animated clouds
      Background.drawClouds(ctx, canvas, deltaTime, game.elapsedTime, 'clouds', game.isPaused, game.gameState === 'playing');
      
      // Draw the ground
      Background.drawGround(ctx, canvas);
      
      // Draw obstacles
      game.obstacles.forEach(obstacle => {
        ObstacleSystem.draw(ctx, obstacle);
      });
      
      // Draw coins
      game.coins.forEach(coin => {
        CoinSystem.draw(ctx, coin, game.elapsedTime);
      });
      
      // Draw power-ups
      game.powerups.forEach(powerup => {
        PowerupSystem.draw(ctx, powerup, game.elapsedTime);
      });
      
      // Draw the cat character
      CatRenderer.draw(
        ctx, canvas, game.catX, game.catY, 
        game.elapsedTime, game.isJumping, 
        game.isPaused, game.gameState
      );
      
      // Draw UI elements
      UI.drawScore(ctx, canvas, game.score);
      
      // Draw power-up timer if active
      if (game.specialAbilityActive) {
        drawPowerupTimer(game.specialAbilityType, game.specialAbilityTimer);
      }
      
      // Draw combo counter
    drawCombo();
    
      // Draw HUD messages
      drawHUDMessages(deltaTime);
      
      // Draw pause or game over screen based on game state
      if (game.isPaused) {
        UI.drawPauseScreen(ctx, canvas, game.elapsedTime);
      } else if (game.gameState === 'game_over') {
        UI.drawGameOver(ctx, canvas, game.score, game.elapsedTime, game.newHighScore);
      }
      
      // Update game state if playing
      if (game.isPlaying) {
        game.updateGame(deltaTime);
      }
    
    // Continue animation loop
    animationFrame = requestAnimationFrame(drawGameScreen);
  }
  
    // Draw powerup timer
    function drawPowerupTimer(type, timeLeft) {
      const timeRatio = timeLeft / 10000;
      
      // Create a cleaner looking, more modern power-up indicator
      // Position it above the cat
      const indicatorX = game.catX + CONSTANTS.CAT_WIDTH / 2;
      const indicatorY = game.catY - 25;
      
      // Draw a clean pill-shaped background
      const pillWidth = 100;
      const pillHeight = 10;
      const radius = pillHeight / 2;
      
      // Background with slight transparency
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.moveTo(indicatorX - pillWidth/2 + radius, indicatorY - pillHeight/2);
      ctx.lineTo(indicatorX + pillWidth/2 - radius, indicatorY - pillHeight/2);
      ctx.arc(indicatorX + pillWidth/2 - radius, indicatorY, radius, -Math.PI/2, Math.PI/2);
      ctx.lineTo(indicatorX - pillWidth/2 + radius, indicatorY + pillHeight/2);
      ctx.arc(indicatorX - pillWidth/2 + radius, indicatorY, radius, Math.PI/2, -Math.PI/2);
      ctx.fill();
      
      // Different colors and icons for different power-ups
      let barColor, iconType;
      switch (type) {
        case 'speed': 
          barColor = '#FF5722'; // Orange
          iconType = "⚡"; // Lightning bolt
          break;
        case 'magnet': 
          barColor = '#673AB7'; // Purple
          iconType = "🧲"; // Magnet
          break;
        case 'doubleJump': 
          barColor = '#4CAF50'; // Green
          iconType = "↑↑"; // Double arrows
          break;
      }
      
      // Progress fill
      const fillWidth = Math.max(0, pillWidth * timeRatio - radius * 2);
      ctx.fillStyle = barColor;
      ctx.beginPath();
      ctx.moveTo(indicatorX - pillWidth/2 + radius, indicatorY - pillHeight/2 + 2);
      ctx.lineTo(indicatorX - pillWidth/2 + radius + fillWidth, indicatorY - pillHeight/2 + 2);
      ctx.lineTo(indicatorX - pillWidth/2 + radius + fillWidth, indicatorY + pillHeight/2 - 2);
      ctx.lineTo(indicatorX - pillWidth/2 + radius, indicatorY + pillHeight/2 - 2);
      ctx.arc(indicatorX - pillWidth/2 + radius, indicatorY, radius - 2, Math.PI/2, -Math.PI/2);
      ctx.fill();
      
      // Add a subtle glow effect at the end of the progress bar
      if (timeRatio > 0.05) {
        const glowPos = indicatorX - pillWidth/2 + radius + fillWidth;
        const gradient = ctx.createRadialGradient(
          glowPos, indicatorY, 0,
          glowPos, indicatorY, radius * 2
        );
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(glowPos, indicatorY, radius * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Draw power-up icon
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '14px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconType, indicatorX - pillWidth/2 - 18, indicatorY);
      
      // Add special effects for each power-up (without particles)
      switch (type) {
        case 'speed':
          // Speed lines around cat
          ctx.strokeStyle = `rgba(255, 87, 34, ${0.3 + 0.2 * Math.sin(game.elapsedTime * 0.01)})`;
          ctx.lineWidth = 2;
          
          // Draw speed lines
          for (let i = 0; i < 3; i++) {
            const lineLength = 15 + 5 * Math.sin(game.elapsedTime * 0.01 + i);
            ctx.beginPath();
            ctx.moveTo(game.catX - lineLength, game.catY + 10 + i * 10);
            ctx.lineTo(game.catX - 5, game.catY + 10 + i * 10);
            ctx.stroke();
          }
          break;
          
        case 'magnet':
          // Draw magnet effect around cat - pulse circle
          const radius = 120;
          const pulseSize = 20 * Math.sin(game.elapsedTime * 0.005);
          
          // Draw concentric circles with gradient
          const magnetGradient = ctx.createRadialGradient(
            game.catX + CONSTANTS.CAT_WIDTH/2, 
            game.catY + CONSTANTS.CAT_HEIGHT/2, 
            0,
            game.catX + CONSTANTS.CAT_WIDTH/2, 
            game.catY + CONSTANTS.CAT_HEIGHT/2, 
            radius + pulseSize
          );
          
          magnetGradient.addColorStop(0, 'rgba(103, 58, 183, 0)');
          magnetGradient.addColorStop(0.7, 'rgba(103, 58, 183, 0.1)');
          magnetGradient.addColorStop(0.9, 'rgba(103, 58, 183, 0.2)');
          magnetGradient.addColorStop(1, 'rgba(103, 58, 183, 0)');
          
          ctx.fillStyle = magnetGradient;
          ctx.beginPath();
          ctx.arc(
            game.catX + CONSTANTS.CAT_WIDTH/2, 
            game.catY + CONSTANTS.CAT_HEIGHT/2, 
            radius + pulseSize, 
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Add thin ring at edge
          ctx.strokeStyle = 'rgba(103, 58, 183, 0.3)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(
            game.catX + CONSTANTS.CAT_WIDTH/2, 
            game.catY + CONSTANTS.CAT_HEIGHT/2, 
            radius + pulseSize, 
            0, Math.PI * 2
          );
          ctx.stroke();
          
          // Pull nearby coins toward the cat (keep this functionality)
          game.coins.forEach(coin => {
            if (coin.collected) return;
            
            const dx = (game.catX + CONSTANTS.CAT_WIDTH/2) - coin.x;
            const dy = (game.catY + CONSTANTS.CAT_HEIGHT/2) - coin.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              coin.x += dx * 0.05;
              coin.y += dy * 0.05;
            }
          });
          break;
          
        case 'doubleJump':
          // Double jump indicator - arrow indicators
          if (game.isJumping) {
            const arrowY = game.catY + CONSTANTS.CAT_HEIGHT;
            const arrowOpacity = 0.3 + 0.2 * Math.sin(game.elapsedTime * 0.01);
            
            // Draw a double arrow under the cat
            ctx.fillStyle = `rgba(76, 175, 80, ${arrowOpacity})`;
            
            // First arrow
            ctx.beginPath();
            ctx.moveTo(game.catX + CONSTANTS.CAT_WIDTH/2, arrowY + 15);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 - 10, arrowY + 25);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 - 5, arrowY + 25);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 - 5, arrowY + 35);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 + 5, arrowY + 35);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 + 5, arrowY + 25);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 + 10, arrowY + 25);
            ctx.closePath();
            ctx.fill();
            
            // Second arrow (slightly below)
            ctx.beginPath();
            ctx.moveTo(game.catX + CONSTANTS.CAT_WIDTH/2, arrowY + 30);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 - 10, arrowY + 40);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 - 5, arrowY + 40);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 - 5, arrowY + 50);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 + 5, arrowY + 50);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 + 5, arrowY + 40);
            ctx.lineTo(game.catX + CONSTANTS.CAT_WIDTH/2 + 10, arrowY + 40);
            ctx.closePath();
            ctx.fill();
          }
          break;
      }
    }
    
    // Draw combo counter
    function drawCombo() {
      if (game.comboCount > 1) {
        const alpha = Math.min(1, game.comboTimer / 1000);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Combo: ${game.comboCount}x`, canvas.width * 0.5, 60);
        
        // Draw multiplier if active
        if (game.score_multiplier > 1) {
          ctx.fillStyle = game.score_multiplier >= 3 ? '#FFC107' : '#FF5722';
          ctx.font = 'bold 20px Arial, sans-serif';
          ctx.fillText(`${game.score_multiplier}x Score!`, canvas.width * 0.5, 90);
        }
      }
    }
    
    // Draw HUD messages
    function drawHUDMessages(deltaTime) {
      // Draw each active message
      for (let i = game.activeHUDMessages.length - 1; i >= 0; i--) {
        const msg = game.activeHUDMessages[i];
        
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
      
      // Add pause instruction that fades out after 5 seconds
      if (game.isPlaying && game.elapsedTime < 5000) {
        const alpha = Math.max(0, 1 - (game.elapsedTime / 5000));
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = '16px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Press ESC or P to pause', canvas.width/2, 40);
        ctx.restore();
      }
    }
    
    // Handle key press events
    function handleKeyDown(e) {
      if (game.gameState === 'game_over') {
        game.keyPressCount++;
        if (game.keyPressCount >= game.requiredKeyPresses) {
          game.startGame();
        }
            return;
        }
        
      // Movement controls
      switch (e.key) {
            case 'ArrowLeft':
            case 'a':
        case 'A':
          game.movingLeft = true;
            break;
            case 'ArrowRight':
            case 'd':
        case 'D':
          game.movingRight = true;
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
        case ' ': // space
          if (game.isPlaying && !game.isPaused) {
            game.jump();
          } else if (game.gameState === 'idle') {
            game.startGame();
          }
          break;
        case 'Escape':
        case 'p':
        case 'P':
          game.togglePause();
          break;
      }
    }
    
    function handleKeyUp(e) {
      // Movement controls
      switch (e.key) {
      case 'ArrowLeft':
      case 'a':
        case 'A':
          game.movingLeft = false;
        break;
      case 'ArrowRight':
      case 'd':
        case 'D':
          game.movingRight = false;
        break;
    }
    }
    
    // Handle canvas click for game control
    function handleCanvasClick(e) {
      if (game.gameState === 'game_over') {
        // Check if click is on menu button
        if (window.menuButtonBounds) {
      const rect = canvas.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const clickY = e.clientY - rect.top;
          
          if (
            clickX >= window.menuButtonBounds.x &&
            clickX <= window.menuButtonBounds.x + window.menuButtonBounds.width &&
            clickY >= window.menuButtonBounds.y &&
            clickY <= window.menuButtonBounds.y + window.menuButtonBounds.height
          ) {
            window.location.href = '/';
        return;
      }
    }
    
        game.keyPressCount++;
        if (game.keyPressCount >= game.requiredKeyPresses) {
          game.startGame();
        }
      } else if (game.gameState === 'idle') {
        game.startGame();
      } else if (game.isPlaying && !game.isPaused) {
        game.jump();
      }
    }
    
    // Handle window resize
    function handleResize() {
      setupCanvas();
      
      // Update boundary
      game.MAX_X = canvas.width - CONSTANTS.CAT_WIDTH - 10;
    }
    
    // Start animation loop
    animationFrame = requestAnimationFrame(drawGameScreen);
    
    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('resize', handleResize);
    
    // Add touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent scrolling
      
      if (game.isPlaying && !game.isPaused) {
        game.jump();
      } else if (game.gameState === 'idle') {
        game.startGame();
      } else if (game.gameState === 'game_over') {
        game.keyPressCount++;
        if (game.keyPressCount >= game.requiredKeyPresses) {
          game.startGame();
        }
      }
    });
    
    // Clean up when the component unmounts
    return () => {
      console.log("GameCanvas hook unmounting, cleaning up...");
      
      // Remove event listeners
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('resize', handleResize);
      
      // Cancel animation frame
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      // Remove any created HTML elements
      game.removeMenuButton();
    };
  } catch (error) {
    console.error("Error initializing game canvas:", error);
  }
}
}; 