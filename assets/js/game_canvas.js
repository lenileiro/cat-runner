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
      
        // Draw sky with day/night cycle
        Background.drawSky(ctx, canvas, game.dayNightCycle);
        
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
        const barWidth = 100;
        const barHeight = 8;
        const timeRatio = timeLeft / 10000;
        
        // Different colors for different power-ups
        let barColor;
        switch (type) {
          case 'speed': barColor = '#FF5722'; break;
          case 'magnet': barColor = '#673AB7'; break;
          case 'doubleJump': barColor = '#4CAF50'; break;
        }
        
        ctx.fillStyle = barColor;
        ctx.fillRect(
          game.catX + CONSTANTS.CAT_WIDTH/2 - barWidth/2,
          game.catY - 20,
          barWidth * timeRatio,
          barHeight
        );
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