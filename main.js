/**
 * Game Setup & Main Animation Loop
 * Autumn Parallax Background Showcase
 */

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('game-canvas');
  const speedSlider = document.getElementById('speed-slider');
  const speedValue = document.getElementById('speed-value');
  const btnPause = document.getElementById('btn-pause');
  const btnLeaves = document.getElementById('btn-leaves');
  const btnFog = document.getElementById('btn-fog');
  const btnRunner = document.getElementById('btn-runner');
  const btnInfo = document.getElementById('btn-info');
  const codeCard = document.getElementById('code-card');

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

  // Initialize Background Engine
  const bg = new AutumnParallaxBackground(canvas, displayWidth, displayHeight);
  bg.ctx = ctx;
  window.backgroundEngine = bg;

  // Window resize handler
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resizeCanvas, 120);
  });

  // UI Controls: Speed Slider
  speedSlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    bg.setSpeed(val);
    speedValue.textContent = val.toFixed(1) + 'x';
  });

  // UI Controls: Pause / Play
  btnPause.addEventListener('click', () => {
    const isPaused = bg.togglePause();
    btnPause.innerHTML = isPaused ? '<span>▶</span> Resume' : '<span>⏸</span> Pause';
    btnPause.classList.toggle('active', isPaused);
  });

  // UI Controls: Leaves Toggle
  btnLeaves.addEventListener('click', () => {
    const active = bg.toggleLeaves();
    btnLeaves.classList.toggle('active', active);
  });

  // UI Controls: Fog Toggle
  btnFog.addEventListener('click', () => {
    const active = bg.toggleFog();
    btnFog.classList.toggle('active', active);
  });

  // UI Controls: Runner Preview Toggle
  btnRunner.addEventListener('click', () => {
    const active = bg.toggleRunnerPreview();
    btnRunner.classList.toggle('active', active);
  });

  // UI Controls: Code Integration Info Toggle
  btnInfo.addEventListener('click', () => {
    codeCard.classList.toggle('open');
  });

  // Close info card when clicking outside
  document.addEventListener('click', (e) => {
    if (!codeCard.contains(e.target) && !btnInfo.contains(e.target)) {
      codeCard.classList.remove('open');
    }
  });

  // Animation Loop with delta-time calculation
  let lastTime = performance.now();

  function gameLoop(currentTime) {
    const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1); // Cap at 100ms to prevent huge jumps on tab switch
    lastTime = currentTime;

    bg.update(deltaTime);
    bg.draw();

    requestAnimationFrame(gameLoop);
  }

  requestAnimationFrame(gameLoop);
});
