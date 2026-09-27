/**
 * Game Entities & Logic
 */

class BlackCat {
  constructor(canvas, bgEngine) {
    this.canvas = canvas;
    this.bg = bgEngine;
    this.width = 60;
    this.height = 40;
    
    // Position (fixed X, variable Y based on ground and jumping)
    this.x = 120;
    this.y = 0;
    this.groundY = 0;
    
    // Physics
    this.velocityY = 0;
    this.gravity = 1800; // pixels per second squared
    this.jumpForce = -700; // pixels per second
    this.isJumping = false;
    this.canDoubleJump = false;
    
    // Animation state
    this.runTime = 0;
  }

  jump() {
    if (!this.isJumping) {
      this.velocityY = this.jumpForce;
      this.isJumping = true;
      this.canDoubleJump = true;
    } else if (this.canDoubleJump) {
      // Double jump is slightly weaker, but still very responsive
      this.velocityY = this.jumpForce * 0.85;
      this.canDoubleJump = false;
      // Restart animation time for a quick flip effect
      this.runTime = 0;
    }
  }

  update(deltaTime) {
    // Determine ground level at current X
    this.groundY = this.bg.getGroundY(this.x) - this.height;

    // Apply physics
    this.velocityY += this.gravity * deltaTime;
    this.y += this.velocityY * deltaTime;

    // Ground collision
    if (this.y >= this.groundY) {
      this.y = this.groundY;
      this.velocityY = 0;
      this.isJumping = false;
      this.canDoubleJump = false;
    }

    // Animation time (when jumping, use it for jump animation phases)
    if (!this.isJumping) {
      this.runTime += deltaTime * 12; // Running animation speed
    } else {
      this.runTime += deltaTime * 6; // Airborne animation progression
    }
  }

  draw(ctx, currentSeason) {
    ctx.save();
    ctx.fillStyle = '#111'; // Pure black cat
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Cat center
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    // Bounce effect when running
    const bounce = this.isJumping ? 0 : Math.abs(Math.sin(this.runTime)) * 4;
    const bodyY = cy - bounce;

    ctx.translate(cx, bodyY);
    // If double jumping, add a slight rotation flip effect based on runTime
    if (this.isJumping && !this.canDoubleJump) {
      const flip = Math.min(this.runTime * Math.PI * 2, Math.PI * 2);
      ctx.rotate(flip);
    } else if (this.isJumping) {
      // Just normal jump tilt
      ctx.rotate(-this.velocityY * 0.0003);
    }
    
    // Body (bean shape)
    ctx.beginPath();
    ctx.ellipse(0, 0, 24, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const headX = 18;
    const headY = -10;
    ctx.beginPath();
    ctx.arc(headX, headY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Pale green eye
    ctx.fillStyle = '#98ff98';
    ctx.beginPath();
    ctx.arc(headX + 4, headY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111'; // Back to black

    // Ears
    ctx.beginPath();
    ctx.moveTo(headX - 8, headY - 8);
    ctx.lineTo(headX - 4, headY - 20);
    ctx.lineTo(headX + 2, headY - 10);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(headX + 2, headY - 10);
    ctx.lineTo(headX + 12, headY - 18);
    ctx.lineTo(headX + 10, headY - 5);
    ctx.fill();

    // Tail (swaying or arched when jumping)
    const tailSway = this.isJumping ? -Math.PI / 2.5 : Math.sin(this.runTime * 0.8) * 0.5;
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#111';
    ctx.beginPath();
    ctx.moveTo(-20, -5);
    ctx.quadraticCurveTo(
      -35 + Math.cos(tailSway) * 10, 
      -25 + Math.sin(tailSway) * 10, 
      -40, 
      -15
    );
    ctx.stroke();

    // Legs
    ctx.lineWidth = 5;
    const legSwing = this.isJumping ? 0 : Math.sin(this.runTime) * 15;
    
    // Tucked legs for jumping
    const bTuckX = this.isJumping ? -10 : 0;
    const bTuckY = this.isJumping ? -8 : 0;
    const fTuckX = this.isJumping ? 12 : 0;
    const fTuckY = this.isJumping ? -6 : 0;
    
    // Back legs
    ctx.beginPath();
    ctx.moveTo(-15, 5);
    ctx.lineTo(-15 - legSwing + bTuckX, 20 + bTuckY); // Back leg 1
    ctx.moveTo(-10, 8);
    ctx.lineTo(-10 + legSwing + bTuckX, 20 + bTuckY); // Back leg 2
    ctx.stroke();

    // Front legs
    ctx.beginPath();
    ctx.moveTo(10, 8);
    ctx.lineTo(10 - legSwing + fTuckX, 20 + fTuckY); // Front leg 1
    ctx.moveTo(15, 5);
    ctx.lineTo(15 + legSwing + fTuckX, 20 + fTuckY); // Front leg 2
    ctx.stroke();

    // Draw accessories based on season
    if (currentSeason === 'Autumn') {
       // red scarf band around neck
       ctx.strokeStyle = '#e60000';
       ctx.lineWidth = 4;
       ctx.beginPath();
       ctx.moveTo(15, -4);
       ctx.lineTo(8, -2);
       ctx.stroke();

       // Line hanging out
       ctx.beginPath();
       ctx.moveTo(10, -2);
       ctx.lineTo(0, 4 + (this.isJumping ? -10 : Math.sin(this.runTime)*5));
       ctx.stroke();
       ctx.lineWidth = 1; // reset
    } else if (currentSeason === 'Winter') {
       // little jacket
       ctx.fillStyle = '#3366cc'; // blue jacket
       ctx.beginPath();
       ctx.ellipse(0, -2, 18, 12, 0, -Math.PI*0.3, Math.PI*1.3);
       ctx.fill();
       ctx.strokeStyle = '#fff'; // white trim
       ctx.lineWidth = 2;
       ctx.stroke();
    } else if (currentSeason === 'Spring') {
       // dandelion flower crown on head
       const headX = 18;
       const headY = -10;
       ctx.fillStyle = '#ffcc00'; // dandelion yellow
       for(let j=0; j<4; j++) {
          ctx.beginPath();
          ctx.arc(headX - 6 + j*4, headY - 12 + Math.abs(j-1.5)*1.5, 2.5, 0, Math.PI*2);
          ctx.fill();
       }
    } else if (currentSeason === 'Summer') {
       // sunglasses
       ctx.fillStyle = '#222'; // frame
       ctx.beginPath();
       ctx.rect(13, -13, 8, 5);
       ctx.rect(23, -13, 8, 5);
       ctx.fill();
       ctx.fillStyle = '#00ffff'; // lens reflection
       ctx.fillRect(14, -12, 6, 3);
       ctx.fillRect(24, -12, 6, 3);
       ctx.strokeStyle = '#222';
       ctx.lineWidth = 1.5;
       ctx.beginPath();
       ctx.moveTo(9, -11); // ear piece
       ctx.lineTo(13, -11);
       ctx.moveTo(21, -11); // bridge
       ctx.lineTo(23, -11);
       ctx.stroke();
    }

    ctx.restore();
  }

  getHitbox() {
    return {
      x: this.x + 10,
      y: this.y + 10,
      width: this.width - 20,
      height: this.height - 10
    };
  }
}

class ObstacleManager {
  constructor(canvas, bgEngine) {
    this.canvas = canvas;
    this.bg = bgEngine;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.spawnInterval = 2.0; // Seconds between spawns
    this.speedMultiplier = 1.0;
  }

  update(deltaTime, score, currentSeason) {
    // Difficulty scaling (discrete by level)
    const level = Math.floor(score / 100) + 1;
    this.speedMultiplier = 1.0 + (level - 1) * 0.3;
    this.spawnInterval = Math.max(0.8, 2.0 - (level - 1) * 0.4);

    this.spawnTimer -= deltaTime;
    if (this.spawnTimer <= 0) {
      this.spawn(score, currentSeason);
      this.spawnTimer = this.spawnInterval + Math.random() * 0.5;
    }

    const currentSpeed = this.bg.baseSpeed * this.speedMultiplier;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= currentSpeed * deltaTime;
      
      // Leaf/Snowball/Flower/Flipflop floating animation
      if (obs.type === 'leaf' || obs.type === 'snowball' || obs.type === 'flower' || obs.type === 'flipflop') {
        obs.animTime += deltaTime * 3;
        obs.y = this.bg.getGroundY(obs.x) - obs.yOffset + Math.sin(obs.animTime) * 15;
      }

      if (obs.x + obs.width < 0 || obs.y > this.canvas.height) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawn(score, currentSeason) {
    const level = Math.floor(score / 100) + 1;
    let isPoison = false;
    
    if (level === 3) {
      isPoison = Math.random() > 0.5;
    }

    if (isPoison) {
      const isFloatingHigh = Math.random() > 0.5;
      let obsType = 'leaf';
      if (currentSeason === 'Winter') obsType = 'snowball';
      else if (currentSeason === 'Spring') obsType = 'flower';
      else if (currentSeason === 'Summer') obsType = 'flipflop';

      this.obstacles.push({
        type: obsType,
        x: this.canvas.width + 50,
        yOffset: isFloatingHigh ? 130 : 30, // 130 is jumping altitude, 30 is near floor
        y: 0,
        width: 30,
        height: 30,
        animTime: Math.random() * Math.PI * 2,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 5
      });
    } else {
      const width = 40 + Math.random() * 30;
      this.obstacles.push({
        type: 'rock',
        x: this.canvas.width + 50,
        y: 0, // Will be set in draw based on groundY
        width: width,
        height: 30 + Math.random() * 15
      });
    }
  }

  draw(ctx) {
    ctx.save();
    for (const obs of this.obstacles) {
      if (obs.type === 'rock') {
        obs.y = this.bg.getGroundY(obs.x) - obs.height;
        ctx.fillStyle = '#22110b'; // Very dark brown/black rock
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width * 0.2, obs.y + obs.height * 0.2);
        ctx.lineTo(obs.x + obs.width * 0.5, obs.y);
        ctx.lineTo(obs.x + obs.width * 0.8, obs.y + obs.height * 0.3);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
      } else if (obs.type === 'leaf') {
        obs.rotation += obs.rotSpeed * 0.016; // Approx rotation
        ctx.save();
        ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
        ctx.rotate(obs.rotation);
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff1111'; // Bright red glowing leaf
        
        ctx.beginPath();
        ctx.moveTo(0, -obs.height/2);
        ctx.quadraticCurveTo(obs.width/2, 0, 0, obs.height/2);
        ctx.quadraticCurveTo(-obs.width/2, 0, 0, -obs.height/2);
        ctx.fill();
        ctx.restore();
      } else if (obs.type === 'snowball') {
        ctx.save();
        ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
        ctx.shadowColor = '#66ccff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#99ddff'; // Glowing blue snowball
        
        ctx.beginPath();
        ctx.arc(0, 0, obs.width/2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (obs.type === 'flower') {
        obs.rotation += obs.rotSpeed * 0.016; 
        ctx.save();
        ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
        ctx.rotate(obs.rotation);
        ctx.shadowColor = '#ff9900';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ffaa33'; // Glowing orange flower
        
        ctx.beginPath();
        for(let j=0; j<5; j++) {
            ctx.ellipse(0, 8, 4, 10, 0, 0, Math.PI*2);
            ctx.rotate((Math.PI*2)/5);
        }
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0,0, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.restore();
      } else if (obs.type === 'flipflop') {
        obs.rotation += obs.rotSpeed * 0.016;
        ctx.save();
        ctx.translate(obs.x + obs.width/2, obs.y + obs.height/2);
        ctx.rotate(obs.rotation);
        ctx.shadowColor = '#ff33aa';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#ff66cc'; // glowing pink flipflop base
        
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 16, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Straps
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-6, 2);
        ctx.lineTo(0, -10);
        ctx.lineTo(6, 2);
        ctx.stroke();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  checkCollision(playerHitbox) {
    for (const obs of this.obstacles) {
      let obsHitbox = { x: obs.x, y: obs.y, width: obs.width, height: obs.height };
      
      // Tighten rock hitbox slightly
      if (obs.type === 'rock') {
        obsHitbox.x += 10;
        obsHitbox.width -= 20;
        obsHitbox.y += 10;
        obsHitbox.height -= 10;
      }

      if (
        playerHitbox.x < obsHitbox.x + obsHitbox.width &&
        playerHitbox.x + playerHitbox.width > obsHitbox.x &&
        playerHitbox.y < obsHitbox.y + obsHitbox.height &&
        playerHitbox.y + playerHitbox.height > obsHitbox.y
      ) {
        return true;
      }
    }
    return false;
  }
}

class CollectibleManager {
  constructor(canvas, bgEngine) {
    this.canvas = canvas;
    this.bg = bgEngine;
    this.collectibles = [];
    this.spawnTimer = 1.0;
    this.spawnInterval = 3.0;
  }

  update(deltaTime, currentSpeedMultiplier) {
    this.spawnTimer -= deltaTime;
    if (this.spawnTimer <= 0) {
      this.spawn();
      this.spawnTimer = this.spawnInterval + Math.random() * 2.0;
    }

    const currentSpeed = this.bg.baseSpeed * currentSpeedMultiplier;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      item.x -= currentSpeed * deltaTime;
      item.animTime += deltaTime * 5;

      if (item.x + item.width < 0) {
        this.collectibles.splice(i, 1);
      }
    }
  }

  spawn() {
    // Spawn mostly jump-height, sometimes ground level
    const isHigh = Math.random() > 0.4;
    const yOffset = isHigh ? 120 + Math.random() * 60 : 40;
    
    this.collectibles.push({
      x: this.canvas.width + 50,
      yOffset: yOffset, // Offset from ground
      y: 0,
      width: 30,
      height: 20,
      animTime: 0
    });
  }

  draw(ctx, currentSeason) {
    ctx.save();
    for (const item of this.collectibles) {
      // Calculate actual Y based on ground
      const groundY = this.bg.getGroundY(item.x);
      item.y = groundY - item.yOffset + Math.sin(item.animTime) * 10; // Floating effect

      const cx = item.x + item.width / 2;
      const cy = item.y + item.height / 2;

      let glowColor = '#ffe066';
      let fillStyle = '#ffcc00';
      if (currentSeason === 'Winter') { glowColor = '#dce5f2'; fillStyle = '#eef4fa'; }
      else if (currentSeason === 'Spring') { glowColor = '#99ff99'; fillStyle = '#b3ffb3'; }
      else if (currentSeason === 'Summer') { glowColor = '#d9b3ff'; fillStyle = '#b366ff'; }

      // Glow
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = fillStyle;
      
      ctx.beginPath();
      // Simple fish shape
      ctx.ellipse(cx, cy, 15, 8, 0, 0, Math.PI * 2); // Body
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx - 20, cy - 8);
      ctx.lineTo(cx - 20, cy + 8);
      ctx.fill();
      
      ctx.shadowBlur = 0; // Reset shadow for eye
      ctx.fillStyle = '#333';
      ctx.beginPath();
      ctx.arc(cx + 8, cy - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  checkCollection(playerHitbox) {
    let collectedCount = 0;
    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const item = this.collectibles[i];
      if (
        playerHitbox.x < item.x + item.width &&
        playerHitbox.x + playerHitbox.width > item.x &&
        playerHitbox.y < item.y + item.height &&
        playerHitbox.y + playerHitbox.height > item.y
      ) {
        this.collectibles.splice(i, 1);
        collectedCount++;
      }
    }
    return collectedCount;
  }
}
