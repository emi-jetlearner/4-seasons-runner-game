/**
 * Game Setup & Main Animation Loop
 * Autumn Parallax Background Showcase -> Autumn Forest Run
 */

document.addEventListener('DOMContentLoaded', () => {
  window.onerror = function(msg, url, lineNo, columnNo, error) {
    alert("Error: " + msg + "\nLine: " + lineNo);
    return false;
  };

  // Game State (declared at top to avoid any scoping issues)
  let score = 0;
  let highScore = localStorage.getItem('autumnHighScore') || 0;
  let gameTime = 0;
  let timeSinceLastScore = 0;
  let level3WarningTimer = 0;
  let hasShownWarning = false;
  let currentLevel = 1;
  let speedWarningTimer = 0;
  let isSpeedWarning = false;
  let currentSeason = 'Autumn'; // Default
  
  const seasonsOrder = ['Autumn', 'Winter', 'Spring', 'Summer'];
  let highestUnlockedIndex = 0;
  let isVictoryMode = false;
  let fireworks = [];
  
  let isGameOver = false;
  let isPaused = false;
  const maxScore = 300;

  const canvas = document.getElementById('game-canvas');
  const btnPause = document.getElementById('btn-pause');
  const scoreDisplay = document.getElementById('current-score');
  const highScoreDisplay = document.getElementById('high-score');
  
  highScoreDisplay.textContent = highScore;

  const overlay = document.getElementById('game-overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');
  const btnRestart = document.getElementById('btn-restart');
  const btnHome = document.getElementById('btn-home');
  const homeScreen = document.getElementById('home-screen');
  const levelBtns = document.querySelectorAll('.level-btn');

  function updateHomeButtons() {
    levelBtns.forEach((btn, index) => {
      if (index <= highestUnlockedIndex) {
        btn.classList.remove('locked');
      } else {
        btn.classList.add('locked');
      }
    });
  }

  levelBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      if (index <= highestUnlockedIndex) {
        currentSeason = btn.dataset.season;
        homeScreen.classList.add('hidden');
        restartGame();
      }
    });
  });

  btnHome.addEventListener('click', () => {
    overlay.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    updateHomeButtons();
    lastTime = performance.now();
    requestAnimationFrame(homeLoop);
  });

  btnHome.addEventListener('click', () => {
    overlay.classList.add('hidden');
    homeScreen.classList.remove('hidden');
    updateHomeButtons();
    lastTime = performance.now();
    requestAnimationFrame(homeLoop);
  });
  // Handle Retina & High-DPI screens for super sharp silhouettes
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    if (window.backgroundEngine) {
      window.backgroundEngine.resize(displayWidth, displayHeight);
    }
  }

  // Initial sizing
  const displayWidth = window.innerWidth;
  const displayHeight = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = displayWidth * dpr;
  canvas.height = displayHeight * dpr;
  canvas.style.width = displayWidth + 'px';
  canvas.style.height = displayHeight + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Initial dummy background for home screen
  let bg = new AutumnParallaxBackground(canvas, displayWidth, displayHeight);
  bg.ctx = ctx;
  window.backgroundEngine = bg;
  bg.speedMultiplier = 0.2; // slow movement on home screen

  // Only start loop, wait for button click to start game
  let lastTime = 0;
  requestAnimationFrame(homeLoop);
  
  function homeLoop(time) {
     const deltaTime = Math.min((time - lastTime) / 1000, 0.1);
     lastTime = time;
     if (!homeScreen.classList.contains('hidden')) {
         bg.update(deltaTime);
         bg.draw(ctx);
         requestAnimationFrame(homeLoop);
     }
  }

  // Initialize Game Entities
  let player = new BlackCat(canvas, bg);
  let obstacles = new ObstacleManager(canvas, bg);
  let collectibles = new CollectibleManager(canvas, bg);

  // Window resize handler
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 120);
  });

  // UI Controls: Pause / Play
  btnPause.addEventListener('click', () => {
    if (isGameOver) return;
    isPaused = !isPaused;
    bg.isPaused = isPaused;
    btnPause.innerHTML = isPaused ? '<span>▶</span>' : '<span>⏸</span>';
  });

  // Controls: Jump (Spacebar)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent scrolling
      if (!isPaused && !isGameOver) {
        player.jump();
      }
    }
  });

  // Restart Button
  btnRestart.addEventListener('click', () => {
    restartGame();
  });

  function restartGame() {
    score = 0;
    gameTime = 0;
    timeSinceLastScore = 0;
    level3WarningTimer = 0;
    hasShownWarning = false;
    currentLevel = 1;
    speedWarningTimer = 0;
    isSpeedWarning = false;
    scoreDisplay.textContent = score;
    isGameOver = false;
    isPaused = false;
    isVictoryMode = false;
    
    if (currentSeason === 'Autumn') bg = new AutumnParallaxBackground(canvas, displayWidth, displayHeight);
    else if (currentSeason === 'Winter') bg = new WinterParallaxBackground(canvas, displayWidth, displayHeight);
    else if (currentSeason === 'Spring') bg = new SpringParallaxBackground(canvas, displayWidth, displayHeight);
    else if (currentSeason === 'Summer') bg = new SummerParallaxBackground(canvas, displayWidth, displayHeight);
    
    bg.ctx = ctx;
    window.backgroundEngine = bg;
    
    bg.isPaused = false;
    btnPause.innerHTML = '<span>⏸</span>';
    overlay.classList.add('hidden');
    
    player = new BlackCat(canvas, bg);
    obstacles = new ObstacleManager(canvas, bg);
    collectibles = new CollectibleManager(canvas, bg);
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function gameOver(win) {
    isGameOver = true;
    bg.isPaused = true;
    
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('autumnHighScore', highScore);
      highScoreDisplay.textContent = highScore;
    }

    if (win) {
      overlayTitle.textContent = "Level Complete!";
      overlayMessage.textContent = "You survived all 4 seasons!";
    } else {
      overlayTitle.textContent = "Game Over";
      overlayMessage.textContent = `You scored ${score} points.`;
    }
    
    overlay.classList.remove('hidden');
  }

  // Animation Loop with delta-time calculation
  let lastTime = performance.now();

  function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
    lastTime = currentTime;

    if (!isPaused && !isGameOver) {
      if (isSpeedWarning) {
        speedWarningTimer -= deltaTime;
        if (speedWarningTimer <= 0) {
          isSpeedWarning = false;
        }
      } else {
        // Time-based scoring (20 points every 20 seconds)
        timeSinceLastScore += deltaTime;
        if (timeSinceLastScore >= 20) {
          score += 20;
          timeSinceLastScore -= 20;
          scoreDisplay.textContent = score;
        }

        // Check level up and warnings
        let newLevel = Math.floor(score / 100) + 1;
        if (newLevel > currentLevel) {
          currentLevel = newLevel;
          isSpeedWarning = true;
          speedWarningTimer = 1.0;
          
          if (currentLevel === 3) {
            hasShownWarning = true;
            level3WarningTimer = 3; 
            if (currentSeason === 'Winter') window.warningTextOverride = "Blue snowballs are poisonous!";
            else if (currentSeason === 'Spring') window.warningTextOverride = "Orange flowers are poisonous!";
            else if (currentSeason === 'Summer') window.warningTextOverride = "Flip flops are poisonous!";
            else window.warningTextOverride = "Red leaves are poisonous!";
          }
        }

        if (level3WarningTimer > 0) {
          level3WarningTimer -= deltaTime;
        }

        // 1. Update Game Entities
        
        // Update background (speed scales via obstacle manager logic)
        bg.speedMultiplier = obstacles.speedMultiplier;
        bg.update(deltaTime);

        player.update(deltaTime);
        obstacles.update(deltaTime, score, currentSeason);
        collectibles.update(deltaTime, obstacles.speedMultiplier);

        const playerHitbox = player.getHitbox();

        // Check Collectibles
        const collected = collectibles.checkCollection(playerHitbox);
        if (collected > 0) {
          score += collected * 20;
          scoreDisplay.textContent = score;
          
          if (score >= maxScore) {
            isGameOver = true;
            scoreDisplay.textContent = maxScore;
            
            let currentIndex = seasonsOrder.indexOf(currentSeason);
            
            if (currentIndex === 3) {
              // Smoothly transition to beach setting with fireworks
              bg = new SummerParallaxBackground(canvas, displayWidth, displayHeight);
              bg.ctx = ctx;
              bg.speedMultiplier = 0.5;
              isVictoryMode = true;
              btnPause.innerHTML = '';
            } else {
              if (highestUnlockedIndex < currentIndex + 1) {
                  highestUnlockedIndex = currentIndex + 1;
              }
              overlayTitle.textContent = "Level Complete!";
              overlayMessage.textContent = "Unlocking next season...";
              overlay.classList.remove('hidden');
              btnRestart.style.display = 'none';
              btnHome.style.display = 'none';
              
              setTimeout(() => {
                  overlay.classList.add('hidden');
                  homeScreen.classList.remove('hidden');
                  updateHomeButtons();
                  btnRestart.style.display = 'inline-flex';
                  btnHome.style.display = 'inline-flex';
                  lastTime = performance.now();
                  requestAnimationFrame(homeLoop);
              }, 2000);
            }
          }
        }

        // Check Obstacle Collisions
        if (!isGameOver && obstacles.checkCollision(playerHitbox)) {
          gameOver(false);
        }
      }
    }

    // 2. Draw Everything
    bg.draw(ctx);
    
    // Draw entities
    collectibles.draw(ctx, currentSeason);
    obstacles.draw(ctx);
    player.draw(ctx, currentSeason);

    // Draw speed warning text
    if (isSpeedWarning) {
      ctx.save();
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText("Speed Increase!", displayWidth / 2, displayHeight / 2 - 50);
      ctx.restore();
    }

    // Draw warning text
    if (level3WarningTimer > 0 && !isSpeedWarning) {
      ctx.save();
      ctx.fillStyle = '#ff3333';
      ctx.shadowColor = 'black';
      ctx.shadowBlur = 4;
      ctx.font = 'bold 36px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(window.warningTextOverride || "Red leaves are poisonous!", displayWidth / 2, displayHeight / 3);
      ctx.restore();
    }

    requestAnimationFrame(gameLoop);
  }

  // Loop starts when 'Play' is clicked (via restartGame)
});
