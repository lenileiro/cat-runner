import { CONSTANTS, Utils } from './engine.js';
import { ObstacleSystem, CoinSystem, PowerupSystem } from './game_objects.js';

export class GameState {
  constructor(canvas, ctx, hookContext) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.hookContext = hookContext;
    
    // Game state
    this.gameState = 'idle';
    this.isPlaying = false;
    this.isPaused = false;
    this.score = 0;
    
    // Animation state
    this.elapsedTime = 0;
    this.gameSpeed = 5;
    
    // Character state
    this.catX = canvas.width * 0.2;
    this.catY = Utils.getGroundY(canvas) - CONSTANTS.CAT_HEIGHT;
    this.catVelX = 0;
    this.isJumping = false;
    this.jumpForce = 0;
    this.movingLeft = false;
    this.movingRight = false;
    
    // Game objects
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.coins = [];
    this.powerups = [];
    this.particles = [];
    this.backgroundElements = [];
    this.activeHUDMessages = [];
    
    // Game mechanics
    this.comboCount = 0;
    this.comboTimer = 0;
    this.score_multiplier = 1;
    this.difficultyLevel = 1;
    this.dayNightCycle = 0;
    this.dayNightSpeed = 0.00002;
    
    // Special abilities
    this.specialAbilityActive = false;
    this.specialAbilityTimer = 0;
    this.specialAbilityType = null;
    
    // Game over state
    this.newHighScore = false;
    this.keyPressCount = 0;
    this.requiredKeyPresses = 3;
    
    // Constants
    this.MAX_PARTICLES = 15;
    this.MIN_X = 10; // Left boundary
    this.MAX_X = canvas.width - CONSTANTS.CAT_WIDTH - 10; // Right boundary
    this.HUD_MESSAGE_DURATION = 3000; // 3 seconds for tooltips
  }
  
  // Game Logic Methods
  startGame() {
    console.log("Starting game locally");
    
    // Clean up any game over elements
    this.removeMenuButton();
    
    this.isPlaying = true;
    this.gameState = 'playing';
    this.isPaused = false;
    
    // Reset game variables
    this.score = 0;
    this.obstacles = [];
    this.obstacleTimer = 0;
    this.gameSpeed = 5;
    
    // Reset cat position
    this.catX = this.canvas.width * 0.2;
    this.catY = Utils.getGroundY(this.canvas) - CONSTANTS.CAT_HEIGHT;
    this.catVelX = 0;
    this.jumpForce = 0;
    this.isJumping = false;
    this.movingLeft = false;
    this.movingRight = false;
    
    // Reset elapsed time to show instructions again
    this.elapsedTime = 0;
  }
  
  handleGameOver() {
    if (this.gameState !== 'game_over') {
      console.log("Game over");
      this.gameState = 'game_over';
      this.isPlaying = false;
      
      // Update high score if needed
      const currentHighScore = localStorage.getItem('catRunnerHighScore') || 0;
      this.newHighScore = false; // Reset this flag to ensure it's false by default
      
      if (this.score > currentHighScore) {
        // Only set newHighScore to true if we actually beat the high score
        this.newHighScore = true;
        localStorage.setItem('catRunnerHighScore', this.score);
        console.log(`New high score: ${this.score}`);
      } else {
        console.log(`Score: ${this.score}, High score: ${currentHighScore}`);
      }
      
      // Prepare for restart
      this.keyPressCount = 0;
      this.requiredKeyPresses = 1;
      this.createMenuButton();
    }
  }
  
  togglePause() {
    if (this.gameState !== 'game_over') {
      this.isPaused = !this.isPaused;
      console.log(`Game ${this.isPaused ? 'paused' : 'resumed'}`);
    }
  }
  
  jump() {
    // Check if we can jump (on ground or have double jump powerup)
    if (!this.isJumping || (this.specialAbilityActive && this.specialAbilityType === 'doubleJump')) {
      // Always perform the jump locally first
      this.isJumping = true;
      this.jumpForce = CONSTANTS.JUMP_FORCE;
      
      // Create jump particles
      for (let i = 0; i < 10; i++) {
        this.particles.push({
          x: this.catX + Math.random() * CONSTANTS.CAT_WIDTH,
          y: this.catY + CONSTANTS.CAT_HEIGHT,
          size: Math.random() * 5 + 2,
          speedX: (Math.random() - 0.5) * 3,
          speedY: Math.random() * 2 + 2,
          color: '#BDBDBD',
          life: 20,
          type: 'jump'
        });
      }
      
      // Safely notify server (non-blocking)
      Utils.safeServerEvent(this.hookContext, "jump", {});
    }
  }
  
  // Update methods
  updateCatPosition(deltaTime) {
    // Apply horizontal velocity
    if (this.movingLeft) {
      this.catVelX = -CONSTANTS.MOVE_SPEED;
    } else if (this.movingRight) {
      this.catVelX = CONSTANTS.MOVE_SPEED;
    } else {
      // Apply friction/deceleration when not pressing movement keys
      this.catVelX *= 0.9;
      if (Math.abs(this.catVelX) < 0.1) this.catVelX = 0;
    }
    
    // Update horizontal position
    this.catX += this.catVelX;
    
    // Apply boundaries
    if (this.catX < this.MIN_X) this.catX = this.MIN_X;
    if (this.catX > this.MAX_X) this.catX = this.MAX_X;
    
    // Update vertical position (jumping)
    if (this.isJumping) {
      this.catY -= this.jumpForce;
      this.jumpForce -= CONSTANTS.GRAVITY * 0.8; // Reduced gravity effect for smoother jumps
      
      // Check if landed
      if (this.catY >= Utils.getGroundY(this.canvas) - CONSTANTS.CAT_HEIGHT) {
        this.catY = Utils.getGroundY(this.canvas) - CONSTANTS.CAT_HEIGHT;
        this.isJumping = false;
        this.jumpForce = 0;
      }
    }
  }
  
  updateObstacles(deltaTime) {
    if (!this.isPaused && this.isPlaying) {
      // Create new obstacles at intervals
      this.obstacleTimer += deltaTime;
      if (this.obstacleTimer > 1500) {
        this.obstacleTimer = 0;
        this.obstacles.push(ObstacleSystem.create(this.canvas));
      }
      
      // Update obstacle positions
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obstacle = this.obstacles[i];
        obstacle.x -= this.gameSpeed * (deltaTime * 0.1);
        
        // Remove if off screen
        if (obstacle.x < -obstacle.width) {
          this.obstacles.splice(i, 1);
          continue;
        }
        
        // Check for scoring
        if (!obstacle.passed && this.catX > obstacle.x + obstacle.width) {
          obstacle.passed = true;
          this.score++;
          Utils.safeServerEvent(this.hookContext, "score_update", { score: this.score });
          
          // Update high score
          const highScore = localStorage.getItem('catRunnerHighScore') || 0;
          if (this.score > highScore) {
            localStorage.setItem('catRunnerHighScore', this.score);
          }
        }
        
        // Collision detection
        if (!this.specialAbilityActive || this.specialAbilityType !== 'invisible') {
          const catCollisionMargin = 8;
          if (
            this.catX + catCollisionMargin < obstacle.x + obstacle.width &&
            this.catX + CONSTANTS.CAT_WIDTH - catCollisionMargin > obstacle.x &&
            this.catY + catCollisionMargin < obstacle.y + obstacle.height &&
            this.catY + CONSTANTS.CAT_HEIGHT - catCollisionMargin > obstacle.y
          ) {
            this.handleGameOver();
          }
        }
      }
    }
  }
  
  updateCoins(deltaTime) {
    // Generate new coins occasionally
    if (this.isPlaying && !this.isPaused && Math.random() < 0.01) {
      const newCoins = CoinSystem.create(this.canvas);
      this.coins = [...this.coins, ...newCoins];
    }
    
    // Update coin positions
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const coin = this.coins[i];
      coin.x -= this.gameSpeed * (deltaTime * 0.1);
      
      // Remove if off screen
      if (coin.x < -coin.size * 2) {
        this.coins.splice(i, 1);
        continue;
      }
      
      // Check for collection
      if (!coin.collected && this.isPlaying && !this.isPaused) {
        if (
          this.catX < coin.x + coin.size &&
          this.catX + CONSTANTS.CAT_WIDTH > coin.x - coin.size &&
          this.catY < coin.y + coin.size &&
          this.catY + CONSTANTS.CAT_HEIGHT > coin.y - coin.size
        ) {
          // Coin collected!
          coin.collected = true;
          
          // Add score based on value and multiplier
          this.score += coin.value * this.score_multiplier;
          
          // Update combo
          this.comboCount++;
          this.comboTimer = 2000; // Reset combo timer (2 seconds)
          
          // Set multiplier based on combo
          if (this.comboCount >= 10) this.score_multiplier = 3;
          else if (this.comboCount >= 5) this.score_multiplier = 2;
          else this.score_multiplier = 1;
          
          // Create collection particles
          for (let j = 0; j < 10; j++) {
            this.particles.push({
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
          if (Math.random() < 0.2 && this.comboCount >= 5) {
            this.powerups.push(PowerupSystem.create(this.canvas, coin.x, coin.y));
          }
        }
      }
    }
  }
  
  updatePowerups(deltaTime) {
    // Update power-up positions
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const powerup = this.powerups[i];
      powerup.x -= this.gameSpeed * (deltaTime * 0.1);
      
      // Remove if off screen
      if (powerup.x < -powerup.size * 2) {
        this.powerups.splice(i, 1);
        continue;
      }
      
      // Check for collection
      if (!powerup.collected && this.isPlaying && !this.isPaused) {
        if (
          this.catX < powerup.x + powerup.size &&
          this.catX + CONSTANTS.CAT_WIDTH > powerup.x - powerup.size &&
          this.catY < powerup.y + powerup.size &&
          this.catY + CONSTANTS.CAT_HEIGHT > powerup.y - powerup.size
        ) {
          // Power-up collected!
          powerup.collected = true;
          this.activatePowerup(powerup.type);
          
          // Create collection particles
          for (let j = 0; j < 15; j++) {
            let color;
            switch (powerup.type) {
              case 'speed': color = '#FF5722'; break;
              case 'magnet': color = '#673AB7'; break;
              case 'doubleJump': color = '#4CAF50'; break;
            }
            
            this.particles.push({
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
  
  activatePowerup(type) {
    // Only activate if no power-up is currently active
    if (!this.specialAbilityActive) {
      this.specialAbilityActive = true;
      this.specialAbilityType = type;
      this.specialAbilityTimer = 10000; // 10 seconds
      
      // Clear existing HUD messages
      this.activeHUDMessages = [];
      
      // Add tooltip message that lasts as long as the power-up
      let message;
      switch (type) {
        case 'speed':
          message = "Speed Boost: Move faster!";
          this.gameSpeed *= 1.5;
          break;
        case 'magnet':
          message = "Coin Magnet: Attract nearby coins!";
          break;
        case 'doubleJump':
          message = "Double Jump: Jump again in mid-air!";
          break;
      }
      
      this.activeHUDMessages.push({
        text: message,
        timer: this.specialAbilityTimer,
        y: 120
      });
    }
  }
  
  updateParticles(deltaTime) {
    // Add new particles if needed
    while (this.particles.length < this.MAX_PARTICLES) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.7,
        size: Math.random() * 5 + 2,
        speedX: Math.random() * 1 - 0.5,
        speedY: Math.random() * 0.5 - 0.25,
        color: `hsla(${Math.random() * 60 + 40}, 80%, 80%, ${Math.random() * 0.5 + 0.2})`,
        life: 100
      });
    }
    
    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.speedX * deltaTime * 0.05;
      p.y += p.speedY * deltaTime * 0.05;
      
      // Reduce life for particles that have it
      if (p.life !== undefined) {
        p.life -= deltaTime;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
      }
      
      // Remove particles that move off-screen
      if (p.x < -p.size || p.x > this.canvas.width + p.size || 
          p.y < -p.size || p.y > this.canvas.height + p.size) {
        this.particles.splice(i, 1);
      }
    }
  }
  
  updateHUDMessages(deltaTime) {
    // Update and remove expired messages
    for (let i = this.activeHUDMessages.length - 1; i >= 0; i--) {
      const msg = this.activeHUDMessages[i];
      msg.timer -= deltaTime;
      
      if (msg.timer <= 0) {
        this.activeHUDMessages.splice(i, 1);
      }
    }
  }
  
  updateGame(deltaTime) {
    // Update day/night cycle
    this.dayNightCycle += this.dayNightSpeed * deltaTime;
    if (this.dayNightCycle > 1) this.dayNightCycle = 0;
    
    // Only update game elements if not paused
    if (!this.isPaused) {
      // Update cat position when keys are pressed
      this.updateCatPosition(deltaTime);
      
      // Update combo timer
      if (this.comboTimer > 0) {
        this.comboTimer -= deltaTime;
        if (this.comboTimer <= 0) {
          this.comboCount = 0;
        }
      }
      
      // Update special ability timer
      if (this.specialAbilityActive && this.specialAbilityTimer > 0) {
        this.specialAbilityTimer -= deltaTime;
        if (this.specialAbilityTimer <= 0) {
          if (this.specialAbilityType === 'speed') {
            this.gameSpeed /= 1.5;
          }
          this.specialAbilityActive = false;
          this.specialAbilityType = null;
        }
      }
      
      // Update difficulty
      if (this.isPlaying) {
        this.difficultyLevel = Math.floor(this.score / 10) + 1;
      }
      
      // Update game elements
      this.updateParticles(deltaTime);
      this.updateObstacles(deltaTime);
      this.updateCoins(deltaTime);
      this.updatePowerups(deltaTime);
      this.updateHUDMessages(deltaTime);
      
      // Increase game speed gradually as score increases
      if (this.isPlaying) {
        this.gameSpeed = 5 + Math.floor((this.score / 10) / 10); // More gradual increase
      }
    }
  }
  
  // DOM interaction methods
  createMenuButton() {
    // Don't create an actual HTML button - just rely on the canvas button
    // and its click handler that's already in place
    console.log("Using canvas-only menu button");
  }
  
  removeMenuButton() {
    // No HTML button to remove
  }
} 