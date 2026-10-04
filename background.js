/**
 * Atmospheric Autumn Parallax Background Engine
 * Designed for HTML5 / JavaScript Endless Running Games
 * 
 * Features:
 * - 6 distinct parallax depth layers with seamless infinite wrapping
 * - Monochromatic & harmonious foggy orange autumn palette
 * - Minimalist, stylized tree silhouettes (clean vector art aesthetic)
 * - Multi-depth drifting volumetric fog bands
 * - Atmospheric floating & tumbling autumn leaves
 * - Ground altitude helper for player positioning
 * - High-DPI crisp rendering with offscreen canvas caching for 60+ FPS
 */

class AutumnParallaxBackground {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    
    // Core motion states
    this.baseSpeed = 320; // Pixels per second at 1.0x speed
    this.speedMultiplier = 1.0;
    this.isPaused = false;
    this.showLeaves = true;
    this.showFog = true;

    // Viewport dimensions (logical screen units)
    this.width = logicalWidth || (canvas ? (canvas.clientWidth || canvas.width) : window.innerWidth);
    this.height = logicalHeight || (canvas ? (canvas.clientHeight || canvas.height) : window.innerHeight);
    this.groundY = this.height * 0.82; // Baseline for running ground

    // Offscreen cached layers for seamless 60fps scrolling
    this.chunkWidth = Math.max(1920, Math.floor(this.width * 1.25));
    this.layers = [];
    
    // Ambient falling leaves particles
    this.leaves = [];
    this.leafCount = 45;
    
    // Ambient fog waves
    this.fogOffset1 = 0;
    this.fogOffset2 = 0;
    this.fogOffset3 = 0;
    
    // Initialize graphics
    this.initLayers();
    this.initLeaves();
  }

  /**
   * Resize handler: re-adjusts viewport and regenerates layer caches
   */
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = this.height * 0.82;
    this.chunkWidth = Math.max(1600, Math.floor(this.width * 1.25));
    this.initLayers();
  }

  /**
   * Initializes all parallax layers with offscreen canvases for silky-smooth performance
   */
  initLayers() {
    this.layers = [
      // Layer 0: Deep Distant Misty Mountain Ridges (Speed: 0.06x)
      new ParallaxLayer({
        speedRatio: 0.06,
        width: this.chunkWidth,
        height: this.height,
        renderFn: (ctx, w, h) => this.renderDistantMountains(ctx, w, h)
      }),

      // Layer 1: Far Foggy Tree Horizon & Soft Hills (Speed: 0.16x)
      new ParallaxLayer({
        speedRatio: 0.16,
        width: this.chunkWidth,
        height: this.height,
        renderFn: (ctx, w, h) => this.renderFarTreeLine(ctx, w, h)
      }),

      // Layer 2: Mid-distance Autumn Woods & Rolling Slopes (Speed: 0.36x)
      new ParallaxLayer({
        speedRatio: 0.36,
        width: this.chunkWidth,
        height: this.height,
        renderFn: (ctx, w, h) => this.renderMidForest(ctx, w, h)
      }),

      // Layer 3: Closer Autumn Forest & Slender Trunks (Speed: 0.68x)
      new ParallaxLayer({
        speedRatio: 0.68,
        width: this.chunkWidth,
        height: this.height,
        renderFn: (ctx, w, h) => this.renderNearForest(ctx, w, h)
      }),

      // Layer 4: Immediate Ground & Running Path with Autumn Details (Speed: 1.0x)
      new ParallaxLayer({
        speedRatio: 1.0,
        width: this.chunkWidth,
        height: this.height,
        renderFn: (ctx, w, h) => this.renderForegroundGround(ctx, w, h)
      })
    ];
  }

  /* ----------------------------------------------------
   * LAYER RENDERERS (Offscreen Pre-renders for zero lag)
   * ---------------------------------------------------- */

  /**
   * Layer 0: Distant Mountain Ridges shrouded in misty peach/orange fog
   */
  renderDistantMountains(ctx, w, h) {
    const horizon = h * 0.72;
    
    // Distant ridge silhouette
    ctx.fillStyle = 'rgba(235, 142, 88, 0.42)';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, horizon - 120);

    const peaks = [
      { x: w * 0.15, y: horizon - 170 },
      { x: w * 0.32, y: horizon - 110 },
      { x: w * 0.48, y: horizon - 190 },
      { x: w * 0.68, y: horizon - 130 },
      { x: w * 0.85, y: horizon - 180 },
      { x: w * 1.00, y: horizon - 120 }
    ];

    let prevX = 0;
    let prevY = horizon - 120;
    for (const p of peaks) {
      const midX = (prevX + p.x) / 2;
      ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + p.y) / 2);
      prevX = p.x;
      prevY = p.y;
    }
    ctx.lineTo(w, prevY);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Fog haze overlay blending into horizon
    const fogGrad = ctx.createLinearGradient(0, horizon - 200, 0, h);
    fogGrad.addColorStop(0, 'rgba(252, 215, 182, 0)');
    fogGrad.addColorStop(0.65, 'rgba(248, 178, 126, 0.45)');
    fogGrad.addColorStop(1, 'rgba(238, 148, 92, 0.8)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, horizon - 200, w, h - (horizon - 200));
  }

  /**
   * Layer 1: Far Autumn Forest Line (Soft burnt-orange silhouettes)
   */
  renderFarTreeLine(ctx, w, h) {
    const baseY = h * 0.76;
    ctx.fillStyle = 'rgba(206, 105, 50, 0.58)';

    // Rolling hill base
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY - 40);

    const step = 80;
    const count = Math.ceil(w / step);

    for (let i = 0; i <= count; i++) {
      const curX = i * step;
      // Procedural pseudo-random heights that seamlessly loop at w
      const phase = (i / count) * Math.PI * 4;
      const hillOffset = Math.sin(phase) * 24 + Math.cos(phase * 2) * 12;
      const treeHeight = 45 + ((i * 37) % 28);
      
      const targetY = baseY + hillOffset - treeHeight;
      ctx.lineTo(curX, targetY);

      // Clean stylized tree crowns (soft rounded triangles and pines)
      if (i % 2 === 0) {
        ctx.lineTo(curX + step * 0.4, targetY - 14);
      }
    }

    ctx.lineTo(w, baseY - 40);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Misty gradient at base
    const mist = ctx.createLinearGradient(0, baseY - 80, 0, h);
    mist.addColorStop(0, 'rgba(247, 168, 114, 0)');
    mist.addColorStop(0.5, 'rgba(238, 145, 88, 0.35)');
    mist.addColorStop(1, 'rgba(224, 122, 60, 0.7)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, baseY - 80, w, h - (baseY - 80));
  }

  /**
   * Layer 2: Mid-ground Autumn Woods & Rolling Hills (Terracotta / warm rust)
   */
  renderMidForest(ctx, w, h) {
    const baseY = h * 0.78;
    ctx.fillStyle = 'rgba(168, 68, 28, 0.82)';

    // Continuous rolling terrain
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);

    const numTrees = Math.floor(w / 70);
    const treeSpacing = w / numTrees;

    for (let i = 0; i <= numTrees; i++) {
      const x = i * treeSpacing;
      const hillY = baseY + Math.sin((i / numTrees) * Math.PI * 6) * 18;

      ctx.lineTo(x, hillY);

      // Draw stylized minimalist autumn trees along the hill
      const treeH = 65 + ((i * 47) % 35);
      const canopyR = 24 + ((i * 23) % 16);
      
      // Slender minimalist trunk
      ctx.fillRect(x - 3, hillY - treeH, 6, treeH);

      // Soft rounded autumn canopy
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, hillY - treeH, canopyR, 0, Math.PI * 2);
      // Secondary overlapping puff for natural stylized silhouette
      ctx.arc(x + canopyR * 0.4, hillY - treeH - canopyR * 0.3, canopyR * 0.7, 0, Math.PI * 2);
      ctx.arc(x - canopyR * 0.4, hillY - treeH - canopyR * 0.2, canopyR * 0.65, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.lineTo(w, baseY);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Subtle atmospheric glow layer to create depth separation
    const mist = ctx.createLinearGradient(0, baseY - 60, 0, h);
    mist.addColorStop(0, 'rgba(245, 150, 92, 0)');
    mist.addColorStop(1, 'rgba(215, 102, 45, 0.45)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, baseY - 60, w, h - (baseY - 60));
  }

  /**
   * Layer 3: Near Forest (Deeper warm chestnut tones, slender birch/maple trunks)
   */
  renderNearForest(ctx, w, h) {
    const baseY = h * 0.81;
    ctx.fillStyle = '#872f13';

    // Gentle terrain profile
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY);

    const hillPoints = 12;
    for (let i = 0; i <= hillPoints; i++) {
      const x = (i / hillPoints) * w;
      const y = baseY + Math.sin((i / hillPoints) * Math.PI * 4) * 12;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Elegant stylized autumn trees with branches
    const treeCount = Math.floor(w / 140);
    const spacing = w / treeCount;

    for (let i = 0; i < treeCount; i++) {
      const x = i * spacing + ((i * 31) % 40);
      const hillY = baseY + Math.sin((x / w) * Math.PI * 4) * 12;
      const height = 110 + ((i * 53) % 45);
      const topY = hillY - height;

      // Clean tapered trunk
      ctx.beginPath();
      ctx.moveTo(x - 5, hillY);
      ctx.lineTo(x - 2.5, topY);
      ctx.lineTo(x + 2.5, topY);
      ctx.lineTo(x + 5, hillY);
      ctx.fill();

      // Stylized gentle branches
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#872f13';
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(x, topY + height * 0.4);
      ctx.quadraticCurveTo(x - 18, topY + height * 0.3, x - 26, topY + height * 0.22);
      ctx.moveTo(x, topY + height * 0.3);
      ctx.quadraticCurveTo(x + 20, topY + height * 0.2, x + 30, topY + height * 0.12);
      ctx.stroke();

      // Soft cluster canopies (warm russet leaves)
      ctx.beginPath();
      ctx.arc(x, topY - 12, 34, 0, Math.PI * 2);
      ctx.arc(x - 22, topY + 10, 24, 0, Math.PI * 2);
      ctx.arc(x + 24, topY + 8, 26, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Layer 4: Foreground Running Ground & Path (Deepest warm autumn brown #421509)
   */
  renderForegroundGround(ctx, w, h) {
    const groundY = h * 0.82;
    ctx.fillStyle = '#421509';

    // Solid running path ground
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, groundY);

    // Subtle natural undulations (gentle slopes suitable for a runner)
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * w;
      const y = groundY + Math.sin((i / segments) * Math.PI * 2) * 5;
      ctx.lineTo(x, y);
    }

    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Top highlight rim along the running path (warm earthy gold edge)
    ctx.strokeStyle = 'rgba(255, 160, 90, 0.4)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * w;
      const y = groundY + Math.sin((i / segments) * Math.PI * 2) * 5;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Minimalist autumn tufts and leaf cushions along the path
    ctx.fillStyle = '#421509';
    for (let x = 15; x < w; x += 45) {
      const y = groundY + Math.sin((x / w) * Math.PI * 2) * 5;
      // Stylized grass blade pair
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x - 3, y - 10, x - 7, y - 12);
      ctx.lineTo(x - 1, y);
      ctx.moveTo(x + 2, y);
      ctx.quadraticCurveTo(x + 4, y - 13, x + 9, y - 14);
      ctx.lineTo(x + 4, y);
      ctx.fill();

      // Fallen leaf silhouette mound
      if (x % 90 === 0) {
        ctx.beginPath();
        ctx.ellipse(x + 18, y - 2, 8, 3, 0.15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  /* ----------------------------------------------------
   * ATMOSPHERIC ELEMENTS (Leaves & Fog)
   * ---------------------------------------------------- */

  /**
   * Initializes floating autumn leaves with varied depth, flutter speed, and warm tones
   */
  initLeaves() {
    this.leaves = [];
    const colors = [
      'rgba(255, 140, 66, 0.85)', // Radiant orange
      'rgba(235, 100, 35, 0.80)', // Burnt amber
      'rgba(245, 175, 75, 0.85)', // Golden ochre
      'rgba(195, 60, 20, 0.75)',  // Deep terracotta
      'rgba(255, 190, 110, 0.90)' // Peach highlight leaf
    ];

    for (let i = 0; i < this.leafCount; i++) {
      this.leaves.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 5 + Math.random() * 9,
        speedX: - (30 + Math.random() * 50), // Drifting left with wind
        speedY: 20 + Math.random() * 35,    // Falling downward
        oscillationSpeed: 1.5 + Math.random() * 2.5,
        oscillationAmplitude: 25 + Math.random() * 35,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        phase: Math.random() * Math.PI * 2,
        depth: 0.5 + Math.random() * 0.8 // Depth factor (0.5 = farther, 1.3 = close foreground)
      });
    }
  }

  /**
   * Updates state of background, layers, leaves, and fog
   * @param {number} deltaTime - Time in seconds since last frame
   */
  update(deltaTime) {
    if (this.isPaused) return;

    const currentSpeed = this.baseSpeed * this.speedMultiplier;

    // Update parallax layers
    for (const layer of this.layers) {
      layer.update(deltaTime, currentSpeed);
    }

    // Update fog mist offsets
    this.fogOffset1 = (this.fogOffset1 + currentSpeed * 0.25 * deltaTime) % (this.width * 2);
    this.fogOffset2 = (this.fogOffset2 + currentSpeed * 0.55 * deltaTime) % (this.width * 2);
    this.fogOffset3 = (this.fogOffset3 + currentSpeed * 0.85 * deltaTime) % (this.width * 2);

    // Update falling leaves
    if (this.showLeaves) {
      for (const leaf of this.leaves) {
        leaf.phase += leaf.oscillationSpeed * deltaTime;
        leaf.rotation += leaf.rotationSpeed * deltaTime;

        // Leaf velocity is influenced by game movement + natural wind
        const driftX = (leaf.speedX - currentSpeed * leaf.depth * 0.6) * deltaTime;
        const driftY = (leaf.speedY + Math.sin(leaf.phase) * leaf.oscillationAmplitude * 0.4) * deltaTime;

        leaf.x += driftX;
        leaf.y += driftY;

        // Wrap leaves around when drifting off screen
        if (leaf.x < -40) {
          leaf.x = this.width + 30 + Math.random() * 50;
          leaf.y = Math.random() * (this.height * 0.8);
        }
        if (leaf.y > this.height + 20) {
          leaf.y = -20;
          leaf.x = Math.random() * (this.width + 100);
        }
      }
    }
  }

  /**
   * Main draw call: renders sky, layers, fog, leaves, and optional runner
   */
  draw(targetCtx) {
    const ctx = targetCtx || this.ctx;
    if (!ctx) return;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Foggy Sky Gradient (Uniform Warm Autumn Palette)
    this.drawSky(ctx, w, h);

    // 2. Diffused Glowing Sun low in the fog
    this.drawSun(ctx, w, h);

    // 3. Layer 0: Distant Mountains (0.06x)
    this.layers[0].draw(ctx, w);

    // 4. Background Fog Veil 1
    if (this.showFog) {
      this.drawFogBand(ctx, w, h * 0.62, 120, this.fogOffset1, 'rgba(252, 215, 185, 0.22)');
    }

    // 5. Layer 1: Far Tree Line (0.16x)
    this.layers[1].draw(ctx, w);

    // 6. Layer 2: Mid Forest & Hills (0.36x)
    this.layers[2].draw(ctx, w);

    // 7. Midground Fog Veil 2
    if (this.showFog) {
      this.drawFogBand(ctx, w, h * 0.74, 90, this.fogOffset2, 'rgba(247, 180, 130, 0.28)');
    }

    // 8. Layer 3: Near Forest & Trunks (0.68x)
    this.layers[3].draw(ctx, w);

    // 9. Layer 4: Foreground Running Ground & Grass (1.0x)
    this.layers[4].draw(ctx, w);

    // 10. Low Ground Mist (Soft rolling fog directly over running path)
    if (this.showFog) {
      this.drawGroundMist(ctx, w, h);
    }

    // 11. Dynamic Falling Autumn Leaves
    if (this.showLeaves) {
      this.drawLeaves(ctx);
    }
  }

  /**
   * Renders the atmospheric autumn sky gradient
   */
  drawSky(ctx, w, h) {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#fde8d7');    // Soft pale apricot mist top
    skyGrad.addColorStop(0.35, '#f8be8e'); // Warm peach fog
    skyGrad.addColorStop(0.68, '#ee8b4e'); // Glowing autumn amber horizon
    skyGrad.addColorStop(1, '#cb5822');    // Deep warm base
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);
  }

  /**
   * Renders the glowing autumn sun diffused through heavy fog
   */
  drawSun(ctx, w, h) {
    const sunX = w * 0.72;
    const sunY = h * 0.42;
    const radius = Math.min(w, h) * 0.28;

    // Diffused radial glow
    const glow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, radius);
    glow.addColorStop(0, 'rgba(255, 248, 235, 0.95)');
    glow.addColorStop(0.2, 'rgba(255, 225, 185, 0.65)');
    glow.addColorStop(0.5, 'rgba(255, 185, 120, 0.3)');
    glow.addColorStop(1, 'rgba(255, 160, 90, 0)');

    ctx.save();
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Soft core sun orb
    ctx.fillStyle = 'rgba(255, 252, 245, 0.88)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renders a soft horizontal drifting fog band
   */
  drawFogBand(ctx, w, y, height, offset, color) {
    ctx.save();
    ctx.fillStyle = color;

    // Soft sinusoidal fog ribbon
    ctx.beginPath();
    ctx.moveTo(0, y);
    
    for (let x = 0; x <= w; x += 40) {
      const wave = Math.sin((x + offset) * 0.006) * 14 + Math.cos((x - offset * 0.5) * 0.012) * 8;
      ctx.lineTo(x, y + wave);
    }
    
    ctx.lineTo(w, y + height);
    ctx.lineTo(0, y + height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Renders mysterious low ground mist hovering just above the running path
   */
  drawGroundMist(ctx, w, h) {
    const groundY = h * 0.82;
    const mistGrad = ctx.createLinearGradient(0, groundY - 45, 0, groundY + 15);
    mistGrad.addColorStop(0, 'rgba(255, 205, 165, 0)');
    mistGrad.addColorStop(0.6, 'rgba(250, 180, 130, 0.26)');
    mistGrad.addColorStop(1, 'rgba(240, 150, 95, 0)');

    ctx.fillStyle = mistGrad;
    ctx.fillRect(0, groundY - 45, w, 60);
  }

  /**
   * Renders falling autumn leaves with organic teardrop/maple shapes
   */
  drawLeaves(ctx) {
    ctx.save();
    for (const leaf of this.leaves) {
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.rotation);
      ctx.fillStyle = leaf.color;

      // Stylized leaf shape (organic pointed oval)
      const s = leaf.size * leaf.depth;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.quadraticCurveTo(s * 0.75, -s * 0.3, s * 0.6, s * 0.8);
      ctx.lineTo(0, s * 1.1); // Leaf tip / stem
      ctx.quadraticCurveTo(-s * 0.6, s * 0.8, -s * 0.75, -s * 0.3);
      ctx.closePath();
      ctx.fill();

      // Subtle leaf vein line
      ctx.strokeStyle = 'rgba(255, 240, 220, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.7);
      ctx.lineTo(0, s * 0.8);
      ctx.stroke();

      ctx.restore();
    }
    ctx.restore();
  }


  /* ----------------------------------------------------
   * API & CONTROL METHODS
   * ---------------------------------------------------- */

  setSpeed(multiplier) {
    this.speedMultiplier = Math.max(0, Math.min(4.0, multiplier));
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  toggleLeaves() {
    this.showLeaves = !this.showLeaves;
    return this.showLeaves;
  }

  toggleFog() {
    this.showFog = !this.showFog;
    return this.showFog;
  }

  /**
   * Helper function for endless runners: returns exact Y coordinate of the running path
   */
  getGroundY(x = 0) {
    return this.height * 0.82 + Math.sin((x / this.chunkWidth) * Math.PI * 2) * 5;
  }
}

/**
 * Helper class for an individual seamless repeating Parallax Layer
 */
class ParallaxLayer {
  constructor({ speedRatio, width, height, renderFn }) {
    this.speedRatio = speedRatio;
    this.width = width;
    this.height = height;
    this.x = 0;

    // Offscreen canvas pre-rendering
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = width;
    this.offscreenCanvas.height = height;
    const offCtx = this.offscreenCanvas.getContext('2d');

    renderFn(offCtx, width, height);
  }

  update(deltaTime, currentSpeed) {
    // Shift layer to the left based on its individual speed ratio
    this.x -= currentSpeed * this.speedRatio * deltaTime;

    // Wrap around smoothly once a full chunk has moved past
    if (this.x <= -this.width) {
      this.x += this.width;
    }
  }

  draw(ctx, screenWidth) {
    const targetW = screenWidth || (ctx.canvas ? ctx.canvas.width : 1920);
    let drawX = this.x;
    while (drawX < targetW) {
      ctx.drawImage(this.offscreenCanvas, Math.floor(drawX), 0);
      drawX += this.width;
    }
  }
}

class WinterParallaxBackground {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.baseSpeed = 320;
    this.speedMultiplier = 1.0;
    this.isPaused = false;
    this.showLeaves = true;
    this.width = logicalWidth || (canvas ? (canvas.clientWidth || canvas.width) : window.innerWidth);
    this.height = logicalHeight || (canvas ? (canvas.clientHeight || canvas.height) : window.innerHeight);
    this.groundY = this.height * 0.82;
    this.chunkWidth = Math.max(1920, Math.floor(this.width * 1.25));
    this.layers = [];
    this.leaves = [];
    this.leafCount = 120;
    this.initLayers();
    this.initLeaves();
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = this.height * 0.82;
    this.chunkWidth = Math.max(1600, Math.floor(this.width * 1.25));
    this.initLayers();
  }
  initLayers() {
    this.layers = [
      new ParallaxLayer({ speedRatio: 0.06, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderDistantMountains(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.16, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderFarTreeLine(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.36, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderMidForest(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.68, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderNearForest(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 1.0, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderForegroundGround(ctx, w, h) })
    ];
  }
  renderDistantMountains(ctx, w, h) {
    const horizon = h * 0.72;
    ctx.fillStyle = 'rgba(160, 180, 200, 0.5)';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, horizon - 120);
    const peaks = [ { x: w * 0.15, y: horizon - 170 }, { x: w * 0.32, y: horizon - 110 }, { x: w * 0.48, y: horizon - 190 }, { x: w * 0.68, y: horizon - 130 }, { x: w * 0.85, y: horizon - 180 }, { x: w * 1.00, y: horizon - 120 } ];
    let prevX = 0, prevY = horizon - 120;
    for (const p of peaks) {
      const midX = (prevX + p.x) / 2;
      ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + p.y) / 2);
      prevX = p.x; prevY = p.y;
    }
    ctx.lineTo(w, prevY); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    const fogGrad = ctx.createLinearGradient(0, horizon - 200, 0, h);
    fogGrad.addColorStop(0, 'rgba(230, 240, 255, 0)');
    fogGrad.addColorStop(1, 'rgba(180, 200, 220, 0.8)');
    ctx.fillStyle = fogGrad; ctx.fillRect(0, horizon - 200, w, h - (horizon - 200));
  }
  renderFarTreeLine(ctx, w, h) {
    const baseY = h * 0.76;
    ctx.fillStyle = 'rgba(120, 140, 160, 0.6)';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, baseY - 40);
    const step = 60, count = Math.ceil(w / step);
    for (let i = 0; i <= count; i++) {
      const curX = i * step;
      const targetY = baseY - 40 - (30 + ((i * 37) % 20));
      ctx.lineTo(curX, targetY);
      if (i % 2 === 0) ctx.lineTo(curX + step * 0.5, targetY - 20);
    }
    ctx.lineTo(w, baseY - 40); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  renderMidForest(ctx, w, h) {
    const baseY = h * 0.78;
    ctx.fillStyle = 'rgba(90, 110, 130, 0.8)';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, baseY);
    const numTrees = Math.floor(w / 70), treeSpacing = w / numTrees;
    for (let i = 0; i <= numTrees; i++) {
      const x = i * treeSpacing;
      const hillY = baseY + Math.sin((i / numTrees) * Math.PI * 6) * 18;
      ctx.lineTo(x, hillY);
      const treeH = 65 + ((i * 47) % 35);
      ctx.fillRect(x - 2, hillY - treeH, 4, treeH);
      ctx.beginPath();
      ctx.moveTo(x - 20, hillY - treeH * 0.2);
      ctx.lineTo(x, hillY - treeH - 20);
      ctx.lineTo(x + 20, hillY - treeH * 0.2);
      ctx.fill();
    }
    ctx.lineTo(w, baseY); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  renderNearForest(ctx, w, h) {
    const baseY = h * 0.81;
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, baseY);
    const hillPoints = 12;
    for (let i = 0; i <= hillPoints; i++) ctx.lineTo((i / hillPoints) * w, baseY + Math.sin((i / hillPoints) * Math.PI * 4) * 12);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    const treeCount = Math.floor(w / 140), spacing = w / treeCount;
    for (let i = 0; i < treeCount; i++) {
      const x = i * spacing + ((i * 31) % 40);
      const hillY = baseY + Math.sin((x / w) * Math.PI * 4) * 12;
      const height = 110 + ((i * 53) % 45);
      ctx.beginPath(); ctx.moveTo(x - 4, hillY); ctx.lineTo(x - 1.5, hillY - height);
      ctx.lineTo(x + 1.5, hillY - height); ctx.lineTo(x + 4, hillY); ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#2c3e50';
      ctx.beginPath();
      ctx.moveTo(x, hillY - height * 0.6); ctx.lineTo(x - 20, hillY - height * 0.8);
      ctx.moveTo(x, hillY - height * 0.7); ctx.lineTo(x + 25, hillY - height * 0.9);
      ctx.stroke();
    }
  }
  renderForegroundGround(ctx, w, h) {
    const groundY = h * 0.82;
    ctx.fillStyle = '#e0eaf5';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, groundY);
    const segments = 24;
    for (let i = 0; i <= segments; i++) ctx.lineTo((i / segments) * w, groundY + Math.sin((i / segments) * Math.PI * 2) * 5);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * w, y = groundY + Math.sin((i / segments) * Math.PI * 2) * 5;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  initLeaves() {
    this.leaves = [];
    for (let i = 0; i < this.leafCount; i++) {
      this.leaves.push({
        x: Math.random() * this.width, y: Math.random() * this.height,
        size: 2 + Math.random() * 4,
        speedX: - (10 + Math.random() * 30), speedY: 40 + Math.random() * 50,
        oscillationSpeed: 1 + Math.random() * 2, oscillationAmplitude: 10 + Math.random() * 20,
        phase: Math.random() * Math.PI * 2, depth: 0.5 + Math.random() * 0.8
      });
    }
  }
  update(deltaTime) {
    if (this.isPaused) return;
    const currentSpeed = this.baseSpeed * this.speedMultiplier;
    for (const layer of this.layers) layer.update(deltaTime, currentSpeed);
    if (this.showLeaves) {
      for (const leaf of this.leaves) {
        leaf.phase += leaf.oscillationSpeed * deltaTime;
        const driftX = (leaf.speedX - currentSpeed * leaf.depth * 0.6) * deltaTime;
        const driftY = (leaf.speedY + Math.sin(leaf.phase) * leaf.oscillationAmplitude * 0.4) * deltaTime;
        leaf.x += driftX; leaf.y += driftY;
        if (leaf.x < -40) { leaf.x = this.width + 30; leaf.y = -20; }
        if (leaf.y > this.height + 20) { leaf.y = -20; leaf.x = Math.random() * this.width; }
      }
    }
  }
  draw(targetCtx) {
    const ctx = targetCtx || this.ctx;
    if (!ctx) return;
    const w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#dbe9f4'); skyGrad.addColorStop(0.5, '#b9d3e8'); skyGrad.addColorStop(1, '#8ca8c4');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath(); ctx.arc(w * 0.72, h * 0.42, 30, 0, Math.PI * 2); ctx.fill();

    this.layers[0].draw(ctx, w);
    this.layers[1].draw(ctx, w);
    this.layers[2].draw(ctx, w);
    this.layers[3].draw(ctx, w);
    this.layers[4].draw(ctx, w);

    if (this.showLeaves) {
      ctx.fillStyle = 'white';
      for (const leaf of this.leaves) {
        ctx.beginPath(); ctx.arc(leaf.x, leaf.y, leaf.size * leaf.depth, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  setSpeed(multiplier) { this.speedMultiplier = Math.max(0, Math.min(4.0, multiplier)); }
  togglePause() { this.isPaused = !this.isPaused; return this.isPaused; }
  getGroundY(x = 0) { return this.height * 0.82 + Math.sin((x / this.chunkWidth) * Math.PI * 2) * 5; }
}

class SpringParallaxBackground {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.baseSpeed = 320;
    this.speedMultiplier = 1.0;
    this.isPaused = false;
    this.showLeaves = true;
    this.width = logicalWidth || (canvas ? (canvas.clientWidth || canvas.width) : window.innerWidth);
    this.height = logicalHeight || (canvas ? (canvas.clientHeight || canvas.height) : window.innerHeight);
    this.groundY = this.height * 0.82;
    this.chunkWidth = Math.max(1920, Math.floor(this.width * 1.25));
    this.layers = [];
    this.leaves = [];
    this.leafCount = 80;
    this.initLayers();
    this.initLeaves();
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = this.height * 0.82;
    this.chunkWidth = Math.max(1600, Math.floor(this.width * 1.25));
    this.initLayers();
  }
  initLayers() {
    this.layers = [
      new ParallaxLayer({ speedRatio: 0.06, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderDistantMountains(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.16, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderFarTreeLine(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.36, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderMidForest(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.68, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderNearForest(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 1.0, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderForegroundGround(ctx, w, h) })
    ];
  }
  renderDistantMountains(ctx, w, h) {
    const horizon = h * 0.72;
    ctx.fillStyle = 'rgba(210, 160, 180, 0.5)';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, horizon - 120);
    const peaks = [ { x: w * 0.15, y: horizon - 170 }, { x: w * 0.32, y: horizon - 110 }, { x: w * 0.48, y: horizon - 190 }, { x: w * 0.68, y: horizon - 130 }, { x: w * 0.85, y: horizon - 180 }, { x: w * 1.00, y: horizon - 120 } ];
    let prevX = 0, prevY = horizon - 120;
    for (const p of peaks) {
      const midX = (prevX + p.x) / 2;
      ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + p.y) / 2);
      prevX = p.x; prevY = p.y;
    }
    ctx.lineTo(w, prevY); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    const fogGrad = ctx.createLinearGradient(0, horizon - 200, 0, h);
    fogGrad.addColorStop(0, 'rgba(255, 230, 240, 0)');
    fogGrad.addColorStop(1, 'rgba(240, 180, 200, 0.8)');
    ctx.fillStyle = fogGrad; ctx.fillRect(0, horizon - 200, w, h - (horizon - 200));
  }
  renderFarTreeLine(ctx, w, h) {
    const baseY = h * 0.76;
    ctx.fillStyle = 'rgba(160, 200, 160, 0.6)';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, baseY - 40);
    const step = 60, count = Math.ceil(w / step);
    for (let i = 0; i <= count; i++) {
      const curX = i * step;
      const targetY = baseY - 40 - (30 + ((i * 37) % 20));
      ctx.lineTo(curX, targetY);
      if (i % 2 === 0) ctx.lineTo(curX + step * 0.5, targetY - 20);
    }
    ctx.lineTo(w, baseY - 40); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  renderMidForest(ctx, w, h) {
    const baseY = h * 0.78;
    ctx.fillStyle = 'rgba(120, 180, 120, 0.8)';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, baseY);
    const numTrees = Math.floor(w / 70), treeSpacing = w / numTrees;
    for (let i = 0; i <= numTrees; i++) {
      const x = i * treeSpacing;
      const hillY = baseY + Math.sin((i / numTrees) * Math.PI * 6) * 18;
      ctx.lineTo(x, hillY);
      const treeH = 65 + ((i * 47) % 35);
      ctx.fillRect(x - 2, hillY - treeH, 4, treeH);
      ctx.beginPath();
      ctx.arc(x, hillY - treeH, 24, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.lineTo(w, baseY); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  renderNearForest(ctx, w, h) {
    const baseY = h * 0.81;
    ctx.fillStyle = '#4a3b32';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, baseY);
    const hillPoints = 12;
    for (let i = 0; i <= hillPoints; i++) ctx.lineTo((i / hillPoints) * w, baseY + Math.sin((i / hillPoints) * Math.PI * 4) * 12);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    const treeCount = Math.floor(w / 140), spacing = w / treeCount;
    for (let i = 0; i < treeCount; i++) {
      const x = i * spacing + ((i * 31) % 40);
      const hillY = baseY + Math.sin((x / w) * Math.PI * 4) * 12;
      const height = 110 + ((i * 53) % 45);
      ctx.beginPath(); ctx.moveTo(x - 4, hillY); ctx.lineTo(x - 1.5, hillY - height);
      ctx.lineTo(x + 1.5, hillY - height); ctx.lineTo(x + 4, hillY); ctx.fill();
      ctx.fillStyle = 'rgba(255, 183, 197, 0.9)';
      ctx.beginPath();
      ctx.arc(x, hillY - height, 45, 0, Math.PI * 2);
      ctx.arc(x - 25, hillY - height + 15, 35, 0, Math.PI * 2);
      ctx.arc(x + 25, hillY - height + 15, 35, 0, Math.PI * 2);
      ctx.arc(x, hillY - height - 20, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#4a3b32';
    }
  }
  renderForegroundGround(ctx, w, h) {
    const groundY = h * 0.82;
    ctx.fillStyle = '#7bc04b';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, groundY);
    const segments = 24;
    for (let i = 0; i <= segments; i++) ctx.lineTo((i / segments) * w, groundY + Math.sin((i / segments) * Math.PI * 2) * 5);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a4e575';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * w, y = groundY + Math.sin((i / segments) * Math.PI * 2) * 5;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  initLeaves() {
    this.leaves = [];
    for (let i = 0; i < this.leafCount; i++) {
      this.leaves.push({
        x: Math.random() * this.width, y: Math.random() * this.height,
        size: 2 + Math.random() * 3,
        speedX: - (30 + Math.random() * 30), speedY: 30 + Math.random() * 50,
        oscillationSpeed: 2 + Math.random() * 2, oscillationAmplitude: 5 + Math.random() * 15,
        phase: Math.random() * Math.PI * 2, depth: 0.5 + Math.random() * 0.8
      });
    }
  }
  update(deltaTime) {
    if (this.isPaused) return;
    const currentSpeed = this.baseSpeed * this.speedMultiplier;
    for (const layer of this.layers) layer.update(deltaTime, currentSpeed);
    if (this.showLeaves) {
      for (const leaf of this.leaves) {
        leaf.phase += leaf.oscillationSpeed * deltaTime;
        const driftX = (leaf.speedX - currentSpeed * leaf.depth * 0.6) * deltaTime;
        const driftY = (leaf.speedY + Math.sin(leaf.phase) * leaf.oscillationAmplitude * 0.4) * deltaTime;
        leaf.x += driftX; leaf.y += driftY;
        if (leaf.x < -40) { 
          leaf.x = this.width + 30; 
          leaf.y = Math.random() * this.height; 
        }
        if (leaf.y > this.height + 20) { 
          // 50% chance to spawn way up high, 50% chance to spawn at tree level (mid-to-low screen)
          leaf.y = Math.random() > 0.5 ? -20 : this.height * 0.5 + Math.random() * (this.height * 0.25); 
          leaf.x = Math.random() * this.width; 
        }
      }
    }
  }
  draw(targetCtx) {
    const ctx = targetCtx || this.ctx;
    if (!ctx) return;
    const w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#e8f0fe'); skyGrad.addColorStop(0.5, '#cce0ff'); skyGrad.addColorStop(1, '#ffebf0');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = 'rgba(255, 255, 220, 0.8)';
    ctx.beginPath(); ctx.arc(w * 0.72, h * 0.42, 30, 0, Math.PI * 2); ctx.fill();

    this.layers[0].draw(ctx, w);
    this.layers[1].draw(ctx, w);
    this.layers[2].draw(ctx, w);
    this.layers[3].draw(ctx, w);
    this.layers[4].draw(ctx, w);

    if (this.showLeaves) {
      ctx.fillStyle = '#ffb7c5';
      for (const leaf of this.leaves) {
        ctx.beginPath(); ctx.arc(leaf.x, leaf.y, leaf.size * leaf.depth, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  setSpeed(multiplier) { this.speedMultiplier = Math.max(0, Math.min(4.0, multiplier)); }
  togglePause() { this.isPaused = !this.isPaused; return this.isPaused; }
  getGroundY(x = 0) { return this.height * 0.82 + Math.sin((x / this.chunkWidth) * Math.PI * 2) * 5; }
}

class SummerParallaxBackground {
  constructor(canvas, logicalWidth, logicalHeight) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
    this.baseSpeed = 320;
    this.speedMultiplier = 1.0;
    this.isPaused = false;
    this.width = logicalWidth || (canvas ? (canvas.clientWidth || canvas.width) : window.innerWidth);
    this.height = logicalHeight || (canvas ? (canvas.clientHeight || canvas.height) : window.innerHeight);
    this.groundY = this.height * 0.82;
    this.chunkWidth = Math.max(1920, Math.floor(this.width * 1.25));
    this.layers = [];
    this.initLayers();
  }
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = this.height * 0.82;
    this.chunkWidth = Math.max(1600, Math.floor(this.width * 1.25));
    this.initLayers();
  }
  initLayers() {
    this.layers = [
      new ParallaxLayer({ speedRatio: 0.05, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderSkyClouds(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.15, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderDistantIslands(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.35, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderOcean(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 0.65, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderWaves(ctx, w, h) }),
      new ParallaxLayer({ speedRatio: 1.0, width: this.chunkWidth, height: this.height, renderFn: (ctx, w, h) => this.renderBeach(ctx, w, h) })
    ];
  }
  renderSkyClouds(ctx, w, h) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    const numClouds = 5;
    for (let i = 0; i < numClouds; i++) {
        let x = (i / numClouds) * w + 100;
        let y = h * 0.2 + ((i * 37) % 50);
        ctx.beginPath();
        ctx.arc(x, y, 40, 0, Math.PI * 2);
        ctx.arc(x + 30, y - 20, 50, 0, Math.PI * 2);
        ctx.arc(x + 60, y, 40, 0, Math.PI * 2);
        ctx.fill();
    }
  }
  renderDistantIslands(ctx, w, h) {
    const horizon = h * 0.55;
    ctx.fillStyle = '#66cc99';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, horizon);
    for (let i = 0; i < 4; i++) {
        let cx = w * (0.1 + i*0.3);
        ctx.quadraticCurveTo(cx - 100, horizon, cx - 50, horizon - 30);
        ctx.quadraticCurveTo(cx, horizon - 80, cx + 50, horizon - 30);
        ctx.quadraticCurveTo(cx + 100, horizon, cx + 150, horizon);
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  renderOcean(ctx, w, h) {
    const horizon = h * 0.55;
    ctx.fillStyle = '#00aaff';
    ctx.fillRect(0, horizon, w, h - horizon);
  }
  renderWaves(ctx, w, h) {
    const horizon = h * 0.72;
    ctx.fillStyle = '#80d4ff';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, horizon);
    const wavePoints = 12;
    for (let i = 0; i <= wavePoints; i++) {
        let px = (i / wavePoints) * w;
        let py = horizon + Math.sin(i * Math.PI) * 15;
        ctx.lineTo(px, py);
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  renderBeach(ctx, w, h) {
    const groundY = h * 0.82;
    ctx.fillStyle = '#ffdf80';
    ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, groundY);
    const segments = 24;
    for (let i = 0; i <= segments; i++) {
        let px = (i / segments) * w;
        let py = groundY + Math.sin((i / segments) * Math.PI * 2) * 5;
        ctx.lineTo(px, py);
    }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  update(deltaTime) {
    if (this.isPaused) return;
    const currentSpeed = this.baseSpeed * this.speedMultiplier;
    for (const layer of this.layers) layer.update(deltaTime, currentSpeed);
  }
  draw(targetCtx) {
    const ctx = targetCtx || this.ctx;
    if (!ctx) return;
    const w = this.width, h = this.height;
    ctx.clearRect(0, 0, w, h);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h*0.55);
    skyGrad.addColorStop(0, '#33bbff'); skyGrad.addColorStop(1, '#ccf2ff');
    ctx.fillStyle = skyGrad; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath(); ctx.arc(w * 0.8, h * 0.2, 50, 0, Math.PI * 2); ctx.fill();
    this.layers[0].draw(ctx, w);
    this.layers[1].draw(ctx, w);
    this.layers[2].draw(ctx, w);
    this.layers[3].draw(ctx, w);
    this.layers[4].draw(ctx, w);
  }
  setSpeed(multiplier) { this.speedMultiplier = Math.max(0, Math.min(4.0, multiplier)); }
  togglePause() { this.isPaused = !this.isPaused; return this.isPaused; }
  getGroundY(x = 0) { return this.height * 0.82 + Math.sin((x / this.chunkWidth) * Math.PI * 2) * 5; }
}

// Attach to window or export for modules
if (typeof window !== 'undefined') {
  window.AutumnParallaxBackground = AutumnParallaxBackground;
  window.WinterParallaxBackground = WinterParallaxBackground;
  window.SpringParallaxBackground = SpringParallaxBackground;
  window.SummerParallaxBackground = SummerParallaxBackground;
}

