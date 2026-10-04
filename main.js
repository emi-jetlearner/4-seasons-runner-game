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
  let isPopupOpen = true; // Popup starts open; gameplay frozen until a season is chosen
  let isFinishLineScene = false; // Dedicated ending celebration scene
  let finishCatX = -80;  // Black cat starts off-screen left
  let finishCrossed = false;
  let celebrationTime = 0;
  const maxScore = 300;

  // ---- AUDIO MANAGER ----
  const AudioManager = {
    bgAudios: {
      'Autumn': new Audio('autumn%20sound.mp3'),
      'Winter': new Audio('winter%20sound.mp3'),
      'Spring': new Audio('spring%20sound.mp3'),
      'Summer': new Audio('summer%20sound.mp3'),
      'FinishLine': new Audio('finish%20line%20sound.mp3'),
    },
    fxJump: new Audio('jump%20sound.mp3'),
    fxFish: new Audio('fish%20sound.mp3'),
    fxGameOver: new Audio('game%20over%20sound.mp3'),
    currentBgKey: null,
    init() {
      Object.values(this.bgAudios).forEach(a => {
        a.loop = true;
        a.volume = 0.2;
      });
      this.fxJump.loop = false;  this.fxJump.volume = 0.6;
      this.fxFish.loop = false;  this.fxFish.volume = 0.7;
      this.fxGameOver.loop = false; this.fxGameOver.volume = 0.7;
    },
    playBg(key) {
      if (this.currentBgKey === key) {
        // Already set — make sure it's actually playing (e.g. after pause)
        const audio = this.bgAudios[key];
        if (audio && audio.paused) audio.play().catch(() => {});
        return;
      }
      this.stopBg();
      if (!key) return;
      this.currentBgKey = key;
      const audio = this.bgAudios[key];
      if (audio) { audio.currentTime = 0; audio.play().catch(() => {}); }
    },
    stopBg() {
      if (this.currentBgKey && this.bgAudios[this.currentBgKey]) {
        this.bgAudios[this.currentBgKey].pause();
      }
      this.currentBgKey = null;
    },
    pauseBg() {
      if (this.currentBgKey && this.bgAudios[this.currentBgKey]) {
        this.bgAudios[this.currentBgKey].pause();
      }
    },
    resumeBg() {
      if (this.currentBgKey && this.bgAudios[this.currentBgKey]) {
        this.bgAudios[this.currentBgKey].play().catch(() => {});
      }
    },
    playFx(audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };
  AudioManager.init();
  // ---- END AUDIO MANAGER ----

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
    // Show/hide FINISH LINE button
    const finishBtn = document.getElementById('btn-finish-line');
    if (finishBtn) finishBtn.style.display = highestUnlockedIndex >= 4 ? 'block' : 'none';
  }

  // Bind click events manually to ensure no DOM querying issues
  const btnAutumn = document.getElementById('btn-autumn');
  const btnWinter = document.getElementById('btn-winter');
  const btnSpring = document.getElementById('btn-spring');
  const btnSummer = document.getElementById('btn-summer');

  const seasonBtns = [
    { el: btnAutumn, season: 'Autumn' },
    { el: btnWinter, season: 'Winter' },
    { el: btnSpring, season: 'Spring' },
    { el: btnSummer, season: 'Summer' }
  ];

  seasonBtns.forEach((item, index) => {
    if(item.el) {
      item.el.addEventListener('click', (e) => {
        e.preventDefault();
        if (index <= highestUnlockedIndex) {
          currentSeason = item.season;
          homeScreen.classList.add('hidden');
          isPopupOpen = false;
          isFinishLineScene = false;
          AudioManager.playBg(currentSeason);
          restartGame();
        }
      });
    }
  });

  // FINISH LINE button
  const finishLineBtn = document.getElementById('btn-finish-line');
  if (finishLineBtn) {
    finishLineBtn.addEventListener('click', () => {
      homeScreen.classList.add('hidden');
      isPopupOpen = false;
      isFinishLineScene = true;
      isGameOver = true; // Prevent normal gameplay
      finishCatX = -80;
      finishCrossed = false;
      celebrationTime = 0;
      AudioManager.playBg('FinishLine');
      // Set up summer beach background
      bg = new SummerParallaxBackground(canvas, displayWidth, displayHeight);
      bg.ctx = ctx;
      bg.speedMultiplier = 0.3;
      window.backgroundEngine = bg;
      fireworks = [];
      if (!isFinishLineScene) requestAnimationFrame(gameLoop); // loop already running
    });
  }

  // How to Play button
  const howToPlayBtn = document.getElementById('btn-how-to-play');
  const howToPlayPopup = document.getElementById('how-to-play-popup');
  const btnCloseHowToPlay = document.getElementById('btn-close-how-to-play');

  if (howToPlayBtn && howToPlayPopup && btnCloseHowToPlay) {
    howToPlayBtn.addEventListener('click', () => {
      howToPlayPopup.classList.remove('hidden');
    });
    btnCloseHowToPlay.addEventListener('click', () => {
      howToPlayPopup.classList.add('hidden');
    });
  }

  // Home button: opens the popup
  document.getElementById('btn-home-corner').addEventListener('click', () => {
    updateHomeButtons();
    homeScreen.classList.remove('hidden');
    isPopupOpen = true; // Freeze gameplay while popup is open
    AudioManager.pauseBg();
  });

  // Close popup button (X) — resume the SAME level, do not restart
  document.getElementById('btn-close-popup').addEventListener('click', () => {
    if (!isGameOver) {
      homeScreen.classList.add('hidden');
      isPopupOpen = false; // Unfreeze gameplay, resume current level
      AudioManager.playBg(currentSeason); // start/resume correct season sound
    }
  });

  // Overlay home button (game-over screen)
  btnHome.addEventListener('click', () => {
    overlay.classList.add('hidden');
    updateHomeButtons();
    homeScreen.classList.remove('hidden');
    isPopupOpen = true;
    AudioManager.stopBg();
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

  // Start with Autumn running immediately behind the popup
  let bg = new AutumnParallaxBackground(canvas, displayWidth, displayHeight);
  bg.ctx = ctx;
  window.backgroundEngine = bg;

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
    if (isPaused) AudioManager.pauseBg();
    else AudioManager.resumeBg();
  });

  // Controls: Jump (Spacebar)
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault(); // Prevent scrolling
      if (!isPaused && !isGameOver && !isPopupOpen) {
        player.jump();
        AudioManager.playFx(AudioManager.fxJump);
      }
    }
  });

  // Controls: Jump (Mouse click / Tap)
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (!isPaused && !isGameOver && !isPopupOpen) {
      player.jump();
      AudioManager.playFx(AudioManager.fxJump);
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
    
    // Start the correct seasonal sound (handles Restart button and season changes)
    // Only play if we're actually in gameplay (popup not open)
    if (!isPopupOpen) AudioManager.playBg(currentSeason);
    
    // Start game loop
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
  }

  function gameOver(win) {
    isGameOver = true;
    bg.isPaused = true;
    AudioManager.stopBg();
    if (!win) AudioManager.playFx(AudioManager.fxGameOver);
    
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

  // Auto-start Autumn on page load
  restartGame();

  function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms
    lastTime = currentTime;

    if (!isPaused && !isGameOver && !isPopupOpen) {
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
          AudioManager.playFx(AudioManager.fxFish);
          score += collected * 20;
          scoreDisplay.textContent = score;
          
          if (score >= maxScore) {
            isGameOver = true;
            scoreDisplay.textContent = maxScore;
            
            let currentIndex = seasonsOrder.indexOf(currentSeason);
            
            if (currentIndex === 3) {
              // Summer complete: return to popup, unlock FINISH LINE
              if (highestUnlockedIndex < 4) highestUnlockedIndex = 4;
              overlayTitle.textContent = "All Seasons Complete!";
              overlayMessage.textContent = "The Finish Line awaits...";
              overlay.classList.remove('hidden');
              btnRestart.style.display = 'none';
              btnHome.style.display = 'none';
              setTimeout(() => {
                overlay.classList.add('hidden');
                updateHomeButtons();
                homeScreen.classList.remove('hidden');
                isPopupOpen = true;
                btnRestart.style.display = 'inline-flex';
                btnHome.style.display = 'inline-flex';
              }, 2000);
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
                  updateHomeButtons();
                  homeScreen.classList.remove('hidden');
                  btnRestart.style.display = 'inline-flex';
                  btnHome.style.display = 'inline-flex';
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

    if (isFinishLineScene) {
      // ---- FINISH LINE CELEBRATION SCENE ----
      const dt = 1/60;
      celebrationTime += dt;
      const groundY = bg.getGroundY ? bg.getGroundY(displayWidth/2) : displayHeight * 0.82;
      const finishLineX = displayWidth * 0.72;

      // Move cat toward finish line
      if (!finishCrossed) {
        finishCatX += 180 * dt;
        if (finishCatX >= finishLineX - 30) finishCrossed = true;
      } else {
        finishCatX += 30 * dt;
      }

      // Celebrating side cats
      const catColors = ['#555', '#8B4513', '#aaa', '#666'];
      const eyeColors = ['#00008b', '#8b4513', '#006400', '#add8e6'];
      const catPoses = [
        { x: displayWidth * 0.82, jumpPhase: 0.0 },
        { x: displayWidth * 0.88, jumpPhase: 1.0 },
        { x: displayWidth * 0.94, jumpPhase: 2.1 },
        { x: displayWidth * 0.76, jumpPhase: 0.7 },
      ];
      catPoses.forEach((c, i) => {
        const bounce = Math.abs(Math.sin(celebrationTime * 2 + c.jumpPhase)) * 22;
        ctx.save();
        ctx.translate(c.x, groundY - bounce);
        
        ctx.fillStyle = catColors[i];
        // Body and head
        ctx.beginPath(); ctx.ellipse(0, 0, 16, 11, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(18, -8, 11, 0, Math.PI*2); ctx.fill();
        // Ears
        ctx.beginPath();
        ctx.moveTo(12,-16); ctx.lineTo(15,-22); ctx.lineTo(19,-16); ctx.fill();
        ctx.moveTo(22,-16); ctx.lineTo(25,-22); ctx.lineTo(28,-16); ctx.fill();
        
        // Eyes (solid colored circles per cat)
        ctx.fillStyle = eyeColors[i];
        ctx.beginPath(); ctx.arc(23, -10, 2.5, 0, Math.PI*2); ctx.fill(); // Front eye
        ctx.beginPath(); ctx.arc(17, -10, 2.5, 0, Math.PI*2); ctx.fill(); // Back eye

        // 4 Legs (dangling while jumping)
        ctx.strokeStyle = catColors[i]; ctx.lineWidth = 3.5;
        // Hind legs
        ctx.beginPath(); ctx.moveTo(-10, 8); ctx.lineTo(-10, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(-4, 20); ctx.stroke();
        // Front legs
        ctx.beginPath(); ctx.moveTo(4, 8); ctx.lineTo(4, 20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(10, 8); ctx.lineTo(10, 20); ctx.stroke();
        
        ctx.restore();
      });

      // Draw checkered ground line (flat on the road)
      ctx.save();
      ctx.fillStyle = '#1a1a1a';
      const roadDepth = displayHeight - groundY;
      ctx.fillRect(finishLineX - 20, groundY, 40, roadDepth); 
      ctx.fillStyle = '#fff';
      for (let dy = 0; dy < roadDepth; dy += 20) {
          for (let dx = 0; dx < 40; dx += 20) {
              if (((dx/20) + Math.floor(dy/20)) % 2 === 0) {
                  ctx.fillRect(finishLineX - 20 + dx, groundY + dy, 20, 20);
              }
          }
      }
      ctx.restore();

      // Draw finish line pole
      ctx.save();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(finishLineX, groundY - 180); ctx.lineTo(finishLineX, groundY); ctx.stroke();
      
      // Draw waving checkered flag
      const flagWidth = 120;
      const flagHeight = 60;
      const stripWidth = 10;
      for (let fx = 0; fx < flagWidth; fx += stripWidth) {
          const waveOffset = Math.sin(celebrationTime * 1.5 + (fx * 0.05)) * 10;
          const nextWaveOffset = Math.sin(celebrationTime * 1.5 + ((fx + stripWidth) * 0.05)) * 10;
          for (let fy = 0; fy < flagHeight; fy += 15) {
              ctx.fillStyle = (((fx/stripWidth) + (fy/15)) % 2 === 0) ? '#1a1a1a' : '#fff';
              ctx.beginPath();
              ctx.moveTo(finishLineX + fx, groundY - 180 + fy + waveOffset);
              ctx.lineTo(finishLineX + fx + stripWidth + 1, groundY - 180 + fy + nextWaveOffset);
              ctx.lineTo(finishLineX + fx + stripWidth + 1, groundY - 180 + fy + 15 + nextWaveOffset);
              ctx.lineTo(finishLineX + fx, groundY - 180 + fy + 15 + waveOffset);
              ctx.closePath();
              ctx.fill();
          }
      }
      ctx.restore();

      // Main black cat with sunglasses running
      ctx.save();
      ctx.translate(finishCatX, groundY - 4);
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath(); ctx.ellipse(0, 0, 20, 13, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(22, -10, 13, 0, Math.PI*2); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(15,-20); ctx.lineTo(18,-28); ctx.lineTo(22,-20); ctx.fill();
      ctx.moveTo(25,-20); ctx.lineTo(28,-28); ctx.lineTo(31,-20); ctx.fill();
      
      // User cat solid light-green eyes
      ctx.fillStyle = '#98ff98';
      ctx.beginPath(); ctx.arc(29, -10, 2.5, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(19, -10, 2.5, 0, Math.PI*2); ctx.fill();

      // Sunglasses over the eyes
      ctx.fillStyle = '#667788';
      ctx.fillRect(15,-15,8,5); ctx.fillRect(25,-15,8,5);
      ctx.fillStyle = '#99bbee';
      ctx.fillRect(16,-14,6,3); ctx.fillRect(26,-14,6,3);
      const legSwing = Math.sin(celebrationTime * 10) * 10;
      ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-5, 8); ctx.lineTo(-5+legSwing, 22); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5, 8); ctx.lineTo(5-legSwing, 22); ctx.stroke();
      ctx.restore();

      // Fireworks
      if (Math.random() < 0.04) {
        fireworks.push({
          x: Math.random() * displayWidth,
          y: displayHeight,
          targetY: displayHeight * 0.1 + Math.random() * displayHeight * 0.45,
          color: `hsl(${Math.floor(Math.random()*360)},100%,60%)`,
          speed: 180 + Math.random() * 120,
          particles: [], exploded: false
        });
      }
      for (let i = fireworks.length - 1; i >= 0; i--) {
        const fw = fireworks[i];
        if (!fw.exploded) {
          fw.y -= fw.speed * dt;
          ctx.fillStyle = fw.color;
          ctx.fillRect(fw.x - 3, fw.y - 3, 6, 6);
          if (fw.y <= fw.targetY) {
            fw.exploded = true;
            for (let p = 0; p < 60; p++) {
              const a = Math.random() * Math.PI * 2, s = Math.random()*220+80;
              fw.particles.push({ x:fw.x, y:fw.y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, life:1.0 });
            }
          }
        } else {
          for (let p = fw.particles.length - 1; p >= 0; p--) {
            const part = fw.particles[p];
            part.x += part.vx*dt; part.y += part.vy*dt;
            part.vy += 190*dt; part.life -= dt*1.1;
            if (part.life <= 0) { fw.particles.splice(p,1); continue; }
            ctx.globalAlpha = part.life; ctx.fillStyle = fw.color;
            ctx.fillRect(part.x - 4, part.y - 4, 8, 8);
            ctx.globalAlpha = 1;
          }
          if (fw.particles.length === 0) fireworks.splice(i, 1);
        }
      }

      // "Let's celebrate!" appears after cat crosses
      if (finishCrossed) {
        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#ff8800'; ctx.shadowBlur = 18;
        ctx.font = 'bold 62px Arial'; ctx.textAlign = 'center';
        ctx.fillText("Let's celebrate!", displayWidth/2, displayHeight*0.28 + Math.sin(celebrationTime*3)*5);
        ctx.restore();
      }

    } else {
      // Normal game drawing
      collectibles.draw(ctx, currentSeason);
      obstacles.draw(ctx);
      player.draw(ctx, currentSeason);

      if (isSpeedWarning) {
        ctx.save();
        ctx.fillStyle = '#ffcc00'; ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
        ctx.font = 'bold 48px Arial'; ctx.textAlign = 'center';
        ctx.fillText("Speed Increase!", displayWidth/2, displayHeight/2 - 50);
        ctx.restore();
      }

      if (level3WarningTimer > 0 && !isSpeedWarning) {
        ctx.save();
        ctx.fillStyle = '#ff3333'; ctx.shadowColor = 'black'; ctx.shadowBlur = 4;
        ctx.font = 'bold 36px Arial'; ctx.textAlign = 'center';
        ctx.fillText(window.warningTextOverride || "Red leaves are poisonous!", displayWidth/2, displayHeight/3);
        ctx.restore();
      }
    }

    requestAnimationFrame(gameLoop);
  }

  // Loop starts when 'Play' is clicked (via restartGame)
});
