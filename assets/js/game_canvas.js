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
        case 'shield':
          barColor = '#2196F3'; // Blue
          iconType = "🛡️"; // Shield
          break;
        case 'slowmo':
          barColor = '#9C27B0'; // Purple/Pink
          iconType = "⏱️"; // Clock
          break;
        case 'minisize':
          barColor = '#00BCD4'; // Cyan
          iconType = "🔍"; // Magnifying glass
          break;
        case 'coinDoubler':
          barColor = '#FFC107'; // Gold/Yellow
          iconType = "💰"; // Money bag
          break;
        case 'timeFreezer':
          barColor = '#03A9F4'; // Light Blue
          iconType = "❄️"; // Snowflake
          break;
        case 'superDash':
          barColor = '#F44336'; // Red
          iconType = "🔥"; // Fire
          break;
        case 'flight':
          barColor = '#81D4FA'; // Sky Blue
          iconType = "🦅"; // Eagle
          break;
        case 'ghostMode':
          barColor = '#9C27B0'; // Purple
          iconType = "👻"; // Ghost
          break;
        case 'luckyBreak':
          barColor = '#FFC107'; // Gold
          iconType = "🍀"; // Clover
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
        case 'shield':
          // Shield effect - protective bubble around the cat
          const shieldPulse = 0.2 + 0.1 * Math.sin(game.elapsedTime * 0.01);
          const shieldRadius = (CONSTANTS.CAT_WIDTH + CONSTANTS.CAT_HEIGHT) / 2 + 8;
          
          // Draw shield bubble
          const shieldGradient = ctx.createRadialGradient(
            game.catX + CONSTANTS.CAT_WIDTH/2,
            game.catY + CONSTANTS.CAT_HEIGHT/2,
            0,
            game.catX + CONSTANTS.CAT_WIDTH/2,
            game.catY + CONSTANTS.CAT_HEIGHT/2,
            shieldRadius
          );
          
          shieldGradient.addColorStop(0, 'rgba(33, 150, 243, 0)');
          shieldGradient.addColorStop(0.7, `rgba(33, 150, 243, ${shieldPulse * 0.2})`);
          shieldGradient.addColorStop(1, `rgba(33, 150, 243, ${shieldPulse * 0.5})`);
          
          ctx.fillStyle = shieldGradient;
          ctx.beginPath();
          ctx.arc(
            game.catX + CONSTANTS.CAT_WIDTH/2,
            game.catY + CONSTANTS.CAT_HEIGHT/2,
            shieldRadius,
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Shield border
          ctx.strokeStyle = `rgba(33, 150, 243, ${shieldPulse * 0.8})`;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.arc(
            game.catX + CONSTANTS.CAT_WIDTH/2,
            game.catY + CONSTANTS.CAT_HEIGHT/2,
            shieldRadius,
            0, Math.PI * 2
          );
          ctx.stroke();
          ctx.setLineDash([]); // Reset line dash
          break;
        case 'slowmo':
          // Slow motion effect - time ripples
          const rippleCount = 3;
          const maxRippleRadius = 80;
          
          for (let i = 0; i < rippleCount; i++) {
            const rippleProgress = (game.elapsedTime * 0.0005 + i/rippleCount) % 1;
            const rippleRadius = rippleProgress * maxRippleRadius;
            const rippleOpacity = 0.5 * (1 - rippleProgress);
            
            ctx.strokeStyle = `rgba(156, 39, 176, ${rippleOpacity})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(
              game.catX + CONSTANTS.CAT_WIDTH/2,
              game.catY + CONSTANTS.CAT_HEIGHT/2,
              rippleRadius,
              0, Math.PI * 2
            );
            ctx.stroke();
          }
          
          // Add clock hand effect
          const clockX = game.catX + CONSTANTS.CAT_WIDTH/2;
          const clockY = game.catY + CONSTANTS.CAT_HEIGHT/2;
          const clockRadius = 15;
          
          // Clock face
          ctx.fillStyle = 'rgba(156, 39, 176, 0.2)';
          ctx.beginPath();
          ctx.arc(clockX, clockY, clockRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Clock hands
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.lineWidth = 1.5;
          
          // Hour hand
          const hourAngle = (game.elapsedTime * 0.001) % (Math.PI * 2);
          ctx.beginPath();
          ctx.moveTo(clockX, clockY);
          ctx.lineTo(
            clockX + Math.cos(hourAngle) * clockRadius * 0.5,
            clockY + Math.sin(hourAngle) * clockRadius * 0.5
          );
          ctx.stroke();
          
          // Minute hand
          const minuteAngle = (game.elapsedTime * 0.003) % (Math.PI * 2);
          ctx.beginPath();
          ctx.moveTo(clockX, clockY);
          ctx.lineTo(
            clockX + Math.cos(minuteAngle) * clockRadius * 0.7,
            clockY + Math.sin(minuteAngle) * clockRadius * 0.7
          );
          ctx.stroke();
          break;
        case 'minisize':
          // Minisize effect - scale outline around cat
          const scaleFrame = {
            x: game.catX - 5,
            y: game.catY - 5,
            width: CONSTANTS.CAT_WIDTH + 10,
            height: CONSTANTS.CAT_HEIGHT + 10
          };
          
          // Draw arrows pointing inward to indicate shrinking
          const arrowSize = 7;
          const arrowPulse = 0.6 + 0.4 * Math.sin(game.elapsedTime * 0.01);
          
          ctx.strokeStyle = `rgba(0, 188, 212, ${arrowPulse})`;
          ctx.lineWidth = 2;
          
          // Top arrows
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x + scaleFrame.width/4, scaleFrame.y);
          ctx.lineTo(scaleFrame.x + scaleFrame.width/4 + arrowSize, scaleFrame.y - arrowSize);
          ctx.lineTo(scaleFrame.x + scaleFrame.width/4 - arrowSize, scaleFrame.y - arrowSize);
          ctx.closePath();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x + scaleFrame.width*3/4, scaleFrame.y);
          ctx.lineTo(scaleFrame.x + scaleFrame.width*3/4 + arrowSize, scaleFrame.y - arrowSize);
          ctx.lineTo(scaleFrame.x + scaleFrame.width*3/4 - arrowSize, scaleFrame.y - arrowSize);
          ctx.closePath();
          ctx.stroke();
          
          // Bottom arrows
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x + scaleFrame.width/4, scaleFrame.y + scaleFrame.height);
          ctx.lineTo(scaleFrame.x + scaleFrame.width/4 + arrowSize, scaleFrame.y + scaleFrame.height + arrowSize);
          ctx.lineTo(scaleFrame.x + scaleFrame.width/4 - arrowSize, scaleFrame.y + scaleFrame.height + arrowSize);
          ctx.closePath();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x + scaleFrame.width*3/4, scaleFrame.y + scaleFrame.height);
          ctx.lineTo(scaleFrame.x + scaleFrame.width*3/4 + arrowSize, scaleFrame.y + scaleFrame.height + arrowSize);
          ctx.lineTo(scaleFrame.x + scaleFrame.width*3/4 - arrowSize, scaleFrame.y + scaleFrame.height + arrowSize);
          ctx.closePath();
          ctx.stroke();
          
          // Left arrows
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x, scaleFrame.y + scaleFrame.height/4);
          ctx.lineTo(scaleFrame.x - arrowSize, scaleFrame.y + scaleFrame.height/4 + arrowSize);
          ctx.lineTo(scaleFrame.x - arrowSize, scaleFrame.y + scaleFrame.height/4 - arrowSize);
          ctx.closePath();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x, scaleFrame.y + scaleFrame.height*3/4);
          ctx.lineTo(scaleFrame.x - arrowSize, scaleFrame.y + scaleFrame.height*3/4 + arrowSize);
          ctx.lineTo(scaleFrame.x - arrowSize, scaleFrame.y + scaleFrame.height*3/4 - arrowSize);
          ctx.closePath();
          ctx.stroke();
          
          // Right arrows
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x + scaleFrame.width, scaleFrame.y + scaleFrame.height/4);
          ctx.lineTo(scaleFrame.x + scaleFrame.width + arrowSize, scaleFrame.y + scaleFrame.height/4 + arrowSize);
          ctx.lineTo(scaleFrame.x + scaleFrame.width + arrowSize, scaleFrame.y + scaleFrame.height/4 - arrowSize);
          ctx.closePath();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(scaleFrame.x + scaleFrame.width, scaleFrame.y + scaleFrame.height*3/4);
          ctx.lineTo(scaleFrame.x + scaleFrame.width + arrowSize, scaleFrame.y + scaleFrame.height*3/4 + arrowSize);
          ctx.lineTo(scaleFrame.x + scaleFrame.width + arrowSize, scaleFrame.y + scaleFrame.height*3/4 - arrowSize);
          ctx.closePath();
          ctx.stroke();
          break;
          
        case 'coinDoubler':
          // Coin doubler effect - sparkles around coins and coin floating above cat
          const sparkleCount = 5;
          const sparkleRadius = 3;
          const sparkleOpacity = 0.5 + 0.5 * Math.sin(game.elapsedTime * 0.01);
          
          // Draw floating coin above cat
          const floatingCoinX = game.catX + CONSTANTS.CAT_WIDTH/2;
          const floatingCoinY = game.catY - 15 + 3 * Math.sin(game.elapsedTime * 0.005);
          const coinSize = 12;
          
          // Gold coin
          ctx.fillStyle = '#FFC107';
          ctx.beginPath();
          ctx.arc(floatingCoinX, floatingCoinY, coinSize, 0, Math.PI * 2);
          ctx.fill();
          
          // Coin highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
          ctx.beginPath();
          ctx.arc(
            floatingCoinX - coinSize * 0.3,
            floatingCoinY - coinSize * 0.3,
            coinSize * 0.4,
            0, Math.PI * 2
          );
          ctx.fill();
          
          // Draw "x2" text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('x2', floatingCoinX, floatingCoinY);
          
          // Draw sparkles around coins in view
          ctx.fillStyle = `rgba(255, 215, 0, ${sparkleOpacity})`;
          game.coins.forEach(coin => {
            if (coin.collected) return;
            if (coin.x < -50 || coin.x > canvas.width + 50) return;
            
            for (let i = 0; i < sparkleCount; i++) {
              const angle = (game.elapsedTime * 0.002 + i * (Math.PI * 2 / sparkleCount)) % (Math.PI * 2);
              const offsetX = Math.cos(angle) * (coin.size + 8);
              const offsetY = Math.sin(angle) * (coin.size + 8);
              
              ctx.beginPath();
              ctx.arc(coin.x + offsetX, coin.y + offsetY, sparkleRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          });
          break;
        case 'timeFreezer':
          // Time freeze effect - frozen obstacles
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = 'rgba(3, 169, 244, 0.1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.globalAlpha = 1.0;
          
          // Snowflake particles
          const snowflakeCount = 3;
          for (let i = 0; i < snowflakeCount; i++) {
            const snowX = game.catX + CONSTANTS.CAT_WIDTH/2 + Math.cos(game.elapsedTime * 0.001 + i * Math.PI * 2 / snowflakeCount) * 30;
            const snowY = game.catY + CONSTANTS.CAT_HEIGHT/2 + Math.sin(game.elapsedTime * 0.001 + i * Math.PI * 2 / snowflakeCount) * 30;
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            
            // Draw a simple snowflake
            for (let j = 0; j < 6; j++) {
              const angle = j * Math.PI / 3;
              ctx.beginPath();
              ctx.moveTo(snowX, snowY);
              ctx.lineTo(
                snowX + Math.cos(angle) * 10,
                snowY + Math.sin(angle) * 10
              );
              ctx.lineWidth = 2;
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.stroke();
            }
          }
          break;
        case 'superDash':
          // Flame trail effect
          const trailLength = 10;
          const positions = [];
          
          // Generate positions for the trail
          for (let i = 0; i < trailLength; i++) {
            positions.push({
              x: game.catX - i * 10 * (1 + Math.sin(game.elapsedTime * 0.01 + i) * 0.3),
              y: game.catY + CONSTANTS.CAT_HEIGHT/2 + Math.sin(game.elapsedTime * 0.05 + i) * 5
            });
          }
          
          // Draw flame particles
          for (let i = 0; i < positions.length; i++) {
            const alpha = 1 - i / positions.length;
            const size = (trailLength - i) * 3;
            
            // Flame gradient
            const gradient = ctx.createRadialGradient(
              positions[i].x, positions[i].y, 0,
              positions[i].x, positions[i].y, size
            );
            gradient.addColorStop(0, `rgba(255, 87, 34, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(255, 193, 7, ${alpha * 0.7})`);
            gradient.addColorStop(1, `rgba(255, 235, 59, ${alpha * 0.1})`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(positions[i].x, positions[i].y, size, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        case 'flight':
          // Flying effect - wings and updraft
          
          // Draw semi-transparent wings
          const wingSpan = CONSTANTS.CAT_WIDTH * 1.5;
          const wingHeight = CONSTANTS.CAT_HEIGHT * 0.6;
          const wingX = game.catX + CONSTANTS.CAT_WIDTH/2;
          const wingY = game.catY + CONSTANTS.CAT_HEIGHT/2;
          
          // Wing flapping intensity based on vertical movement
          let wingSpeed = 0.005;
          let wingAmplitude = 0.2;
          
          if (game.movingUp) {
            // Faster flapping when moving up
            wingSpeed = 0.015;
            wingAmplitude = 0.4;
          } else if (game.movingDown) {
            // Slower flapping when moving down
            wingSpeed = 0.003;
            wingAmplitude = 0.1;
          }
          
          const wingAngle = Math.sin(game.elapsedTime * wingSpeed) * wingAmplitude;
          
          // Left wing
          ctx.save();
          ctx.translate(wingX, wingY);
          ctx.rotate(wingAngle - Math.PI/4);
          
          const wingGradient = ctx.createLinearGradient(0, 0, -wingSpan, 0);
          wingGradient.addColorStop(0, 'rgba(129, 212, 250, 0.8)');
          wingGradient.addColorStop(1, 'rgba(129, 212, 250, 0)');
          
          ctx.fillStyle = wingGradient;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(
            -wingSpan/2, -wingHeight,
            -wingSpan, 0
          );
          ctx.quadraticCurveTo(
            -wingSpan/2, wingHeight * 0.5,
            0, 0
          );
          ctx.fill();
          ctx.restore();
          
          // Right wing
          ctx.save();
          ctx.translate(wingX, wingY);
          ctx.rotate(-wingAngle + Math.PI/4);
          
          const wingGradient2 = ctx.createLinearGradient(0, 0, wingSpan, 0);
          wingGradient2.addColorStop(0, 'rgba(129, 212, 250, 0.8)');
          wingGradient2.addColorStop(1, 'rgba(129, 212, 250, 0)');
          
          ctx.fillStyle = wingGradient2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(
            wingSpan/2, -wingHeight,
            wingSpan, 0
          );
          ctx.quadraticCurveTo(
            wingSpan/2, wingHeight * 0.5,
            0, 0
          );
          ctx.fill();
          ctx.restore();
          
          // Updraft particles - more intense when moving up
          const particleCount = game.movingUp ? 5 : 3;
          for (let i = 0; i < particleCount; i++) {
            const particleX = game.catX + CONSTANTS.CAT_WIDTH * Math.random();
            const particleY = game.catY + CONSTANTS.CAT_HEIGHT + 10 + i * 5;
            const particleSize = 5 - i;
            
            ctx.fillStyle = `rgba(225, 245, 254, ${0.7 - i * 0.2})`;
            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Add direction indicator
          if (game.movingUp || game.movingDown) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            
            if (game.movingUp) {
              // Up arrow
              ctx.moveTo(wingX, wingY - 25);
              ctx.lineTo(wingX - 10, wingY - 15);
              ctx.lineTo(wingX + 10, wingY - 15);
            } else {
              // Down arrow
              ctx.moveTo(wingX, wingY + 25);
              ctx.lineTo(wingX - 10, wingY + 15);
              ctx.lineTo(wingX + 10, wingY + 15);
            }
            
            ctx.closePath();
            ctx.fill();
          }
          break;
        case 'ghostMode':
          // Ghost effect - semi-transparent cat and ectoplasm trail
          
          // Apply a ghost overlay to the cat
          const ghostX = game.catX + CONSTANTS.CAT_WIDTH/2;
          const ghostY = game.catY + CONSTANTS.CAT_HEIGHT/2;
          const ghostRadius = Math.max(CONSTANTS.CAT_WIDTH, CONSTANTS.CAT_HEIGHT) * 0.7;
          
          const ghostGlow = ctx.createRadialGradient(
            ghostX, ghostY, 0,
            ghostX, ghostY, ghostRadius
          );
          ghostGlow.addColorStop(0, 'rgba(156, 39, 176, 0.1)');
          ghostGlow.addColorStop(0.7, 'rgba(156, 39, 176, 0.1)');
          ghostGlow.addColorStop(1, 'rgba(156, 39, 176, 0)');
          
          ctx.fillStyle = ghostGlow;
          ctx.beginPath();
          ctx.arc(ghostX, ghostY, ghostRadius, 0, Math.PI * 2);
          ctx.fill();
          
          // Ghostly afterimages
          const numAfterimages = 3;
          for (let i = 1; i <= numAfterimages; i++) {
            const alpha = 0.3 - (i * 0.07);
            const offsetX = -i * 15;
            
            ctx.fillStyle = `rgba(156, 39, 176, ${alpha})`;
            ctx.beginPath();
            ctx.roundRect(
              game.catX + offsetX,
              game.catY,
              CONSTANTS.CAT_WIDTH,
              CONSTANTS.CAT_HEIGHT,
              5
            );
            ctx.fill();
          }
          break;
        case 'luckyBreak':
          // Lucky effect - sparkles and shamrocks
          
          // Draw sparkles around the cat
          const sparklePositions = [
            { x: game.catX, y: game.catY },
            { x: game.catX + CONSTANTS.CAT_WIDTH, y: game.catY },
            { x: game.catX, y: game.catY + CONSTANTS.CAT_HEIGHT },
            { x: game.catX + CONSTANTS.CAT_WIDTH, y: game.catY + CONSTANTS.CAT_HEIGHT },
            { x: game.catX + CONSTANTS.CAT_WIDTH/2, y: game.catY - 10 }
          ];
          
          sparklePositions.forEach((pos, i) => {
            const pulseSize = 1 + 0.3 * Math.sin(game.elapsedTime * 0.01 + i);
            
            // Gold sparkle
            ctx.fillStyle = `rgba(255, 193, 7, ${0.6 + 0.4 * Math.sin(game.elapsedTime * 0.01 + i)})`;
            ctx.beginPath();
            
            // Star shape
            const starPoints = 4;
            const outerRadius = 6 * pulseSize;
            const innerRadius = 2 * pulseSize;
            
            for (let j = 0; j < starPoints * 2; j++) {
              const radius = j % 2 === 0 ? outerRadius : innerRadius;
              const angle = (j * Math.PI) / starPoints + game.elapsedTime * 0.002;
              const x = pos.x + Math.cos(angle) * radius;
              const y = pos.y + Math.sin(angle) * radius;
              
              if (j === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            
            ctx.closePath();
            ctx.fill();
          });
          
          // Floating clover
          const cloverX = game.catX + CONSTANTS.CAT_WIDTH/2;
          const cloverY = game.catY - 15 + 3 * Math.sin(game.elapsedTime * 0.005);
          
          // Draw four-leaf clover
          ctx.fillStyle = '#4CAF50';
          
          for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            ctx.save();
            ctx.translate(cloverX, cloverY);
            ctx.rotate(angle + game.elapsedTime * 0.001);
            ctx.beginPath();
            ctx.arc(
              5, 0,
              5,
              0, Math.PI * 2
            );
            ctx.fill();
            ctx.restore();
          }
          
          // Stem
          ctx.strokeStyle = '#4CAF50';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cloverX, cloverY);
          ctx.lineTo(cloverX, cloverY + 8);
          ctx.stroke();
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
          // If in flight mode, move upward
          if (game.specialAbilityActive && game.specialAbilityType === 'flight') {
            game.movingUp = true;
          } else if (game.isPlaying && !game.isPaused) {
            game.jump();
          } else if (game.gameState === 'idle') {
            game.startGame();
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          // If in flight mode, move downward
          if (game.specialAbilityActive && game.specialAbilityType === 'flight') {
            game.movingDown = true;
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
        case 'ArrowUp':
        case 'w':
        case 'W':
          game.movingUp = false;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          game.movingDown = false;
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