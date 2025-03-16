import { CONSTANTS, Utils } from './engine.js';

// Obstacle system
export const ObstacleSystem = {
  // Create a new obstacle
  create: (canvas, type) => {
    // Randomize obstacle types if not specified
    const obstacleType = type || (Math.random() > 0.3 ? 'cactus' : 'bird');
    const obstacleHeight = obstacleType === 'cactus' ? 
      Math.random() * 20 + 30 : // Cactus heights
      Math.random() * 15 + 20;  // Bird heights
    
    // Get ground Y position
    const groundY = Utils.getGroundY(canvas);
    
    // Calculate y position for the obstacle
    let yPosition;
    
    if (obstacleType === 'cactus') {
      // Cactus on ground
      yPosition = groundY - obstacleHeight;
    } else {
      // Birds at various heights - with focus on coin areas
      const birdPositionRng = Math.random();
      
      if (birdPositionRng < 0.6) {
        // 60% chance to be at coin height (80-150px above ground)
        yPosition = groundY - obstacleHeight - 80 - Math.random() * 70;
      } else if (birdPositionRng < 0.85) {
        // 25% chance to be at low height (20-80px above ground)
        yPosition = groundY - obstacleHeight - 20 - Math.random() * 60;
      } else {
        // 15% chance to be at high height (150-200px above ground)
        yPosition = groundY - obstacleHeight - 150 - Math.random() * 50;
      }
    }
    
    return {
      x: canvas.width,
      y: yPosition,
      width: 30,
      height: obstacleHeight,
      type: obstacleType,
      passed: false
    };
  },
  
  // Draw an obstacle
  draw: (ctx, obstacle) => {
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
      // Draw bird with grey colors
      ctx.fillStyle = '#9E9E9E'; // Medium grey body
      
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
      
      // Get elapsed time for wing animation
      const elapsedTime = performance.now();
      
      // Wings animation based on time
      const wingUp = Math.sin(elapsedTime * 0.01) > 0;
      const wingHeight = obstacle.height * 0.6;
      const wingWidth = obstacle.width * 0.8;
      const wingY = wingUp ? 
        obstacle.y : 
        obstacle.y + obstacle.height * 0.2;
      
      // Draw wings with a darker grey
      ctx.fillStyle = '#616161'; // Darker grey wings
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
      ctx.fillStyle = '#FFC107'; // Keep yellow beak
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
};

// Coin system
export const CoinSystem = {
  // Create a new coin or coin pattern
  create: (canvas, patternType) => {
    const pattern = patternType || Math.floor(Math.random() * 4);
    const coins = [];
    let yPos;
    
    switch (pattern) {
      case 0: // Straight line
        yPos = Utils.getGroundY(canvas) - 50 - Math.random() * 100;
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
            y: Utils.getGroundY(canvas) - 50 - Math.sin(i * 0.6) * 100,
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
            y: Utils.getGroundY(canvas) - 40 - i * 40,
            size: 15,
            collected: false,
            value: 1
          });
        }
        break;
      case 3: // Special golden coin (worth more)
        coins.push({
          x: canvas.width + 30,
          y: Utils.getGroundY(canvas) - 100 - Math.random() * 50,
          size: 20,
          collected: false,
          value: 5,
          isGolden: true
        });
        break;
    }
    
    return coins;
  },
  
  // Draw a coin
  draw: (ctx, coin, elapsedTime) => {
    if (coin.collected) return;
    
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
};

// Power-up system
export const PowerupSystem = {
  // Create a power-up
  create: (canvas, x, y) => {
    const types = [
      'speed', 'magnet', 'doubleJump', 'shield', 'slowmo', 'minisize', 'coinDoubler',
      'timeFreezer', 'flight'
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    
    return {
      x: x || canvas.width + 50,
      y: y || Utils.getGroundY(canvas) - 100 - Math.random() * 50,
      type,
      size: 25,
      collected: false
    };
  },
  
  // Draw a power-up
  draw: (ctx, powerup, elapsedTime) => {
    if (powerup.collected) return;
    
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
        
      case 'timeFreezer':
        // Blue time freezer
        ctx.fillStyle = '#03A9F4';
        ctx.beginPath();
        ctx.arc(0, 0, powerup.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Snowflake icon
        ctx.fillStyle = '#E1F5FE';
        const spikes = 6;
        for (let i = 0; i < spikes; i++) {
          const angle = (i / spikes) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle) * powerup.size * 0.7, Math.sin(angle) * powerup.size * 0.7);
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#E1F5FE';
          ctx.stroke();
          
          // Small circles at the end of each spike
          ctx.beginPath();
          ctx.arc(
            Math.cos(angle) * powerup.size * 0.7,
            Math.sin(angle) * powerup.size * 0.7,
            powerup.size * 0.15,
            0, Math.PI * 2
          );
          ctx.fill();
        }
        break;
        
      case 'flight':
        // Sky blue flight powerup
        ctx.fillStyle = '#81D4FA';
        ctx.beginPath();
        ctx.arc(0, 0, powerup.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Wing design
        ctx.fillStyle = '#E1F5FE';
        
        // Left wing
        ctx.beginPath();
        ctx.moveTo(-powerup.size * 0.2, 0);
        ctx.quadraticCurveTo(
          -powerup.size * 0.8, -powerup.size * 0.5,
          -powerup.size * 1.0, 0
        );
        ctx.quadraticCurveTo(
          -powerup.size * 0.8, powerup.size * 0.2,
          -powerup.size * 0.2, 0
        );
        ctx.fill();
        
        // Right wing
        ctx.beginPath();
        ctx.moveTo(powerup.size * 0.2, 0);
        ctx.quadraticCurveTo(
          powerup.size * 0.8, -powerup.size * 0.5,
          powerup.size * 1.0, 0
        );
        ctx.quadraticCurveTo(
          powerup.size * 0.8, powerup.size * 0.2,
          powerup.size * 0.2, 0
        );
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
}; 