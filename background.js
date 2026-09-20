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
    this.baseSpeed = 160; // Pixels per second at 1.0x speed
    this.speedMultiplier = 1.0;
    this.isPaused = false;
    this.showLeaves = true;
    this.showFog = true;
    this.showRunnerPreview = false;

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

    // Runner preview state (optional demo of runner silhouette)
    this.runnerAnimTime = 0;
    
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

    // Runner preview animation timer
    if (this.showRunnerPreview) {
      this.runnerAnimTime += deltaTime * 12 * Math.max(0.4, this.speedMultiplier);
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

    // 12. Runner Preview Silhouette (Optional demo mode)
    if (this.showRunnerPreview) {
      this.drawRunnerPreview(ctx);
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

  /**
   * Optional Runner Preview: Draws a sleek stylized silhouette character running along the ground
   * Helps developers immediately visualize collision height and movement dynamics
   */
  drawRunnerPreview(ctx) {
    const runnerX = Math.min(200, this.width * 0.2);
    const groundY = this.height * 0.82;
    const t = this.runnerAnimTime;

    // Running bounce
    const bounce = Math.abs(Math.sin(t)) * 8;
    const runnerY = groundY - bounce;

    ctx.save();
    ctx.fillStyle = '#260a03'; // Deep silhouette matching foreground palette
    ctx.strokeStyle = '#260a03';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(runnerX, runnerY - 38, 7, 0, Math.PI * 2);
    ctx.fill();

    // Torso (leaning forward into the autumn run)
    ctx.beginPath();
    ctx.moveTo(runnerX, runnerY - 31);
    ctx.lineTo(runnerX - 3, runnerY - 14);
    ctx.stroke();

    // Arms in running motion
    const armSwing = Math.sin(t) * 14;
    ctx.beginPath();
    // Back arm
    ctx.moveTo(runnerX - 1, runnerY - 26);
    ctx.lineTo(runnerX - 1 - armSwing, runnerY - 16);
    // Front arm
    ctx.moveTo(runnerX - 1, runnerY - 26);
    ctx.lineTo(runnerX - 1 + armSwing, runnerY - 16);
    ctx.stroke();

    // Legs in running stride
    const legSwing = Math.sin(t) * 16;
    ctx.beginPath();
    // Left leg
    ctx.moveTo(runnerX - 3, runnerY - 14);
    ctx.lineTo(runnerX - 3 + legSwing, runnerY - 6);
    ctx.lineTo(runnerX - 1 + legSwing * 1.2, runnerY);
    // Right leg
    ctx.moveTo(runnerX - 3, runnerY - 14);
    ctx.lineTo(runnerX - 3 - legSwing, runnerY - 6);
    ctx.lineTo(runnerX - 1 - legSwing * 1.2, runnerY);
    ctx.stroke();

    // Dynamic wind scarf fluttering behind runner
    ctx.fillStyle = '#ff8c42';
    ctx.beginPath();
    ctx.moveTo(runnerX - 3, runnerY - 29);
    ctx.quadraticCurveTo(runnerX - 16, runnerY - 32 + Math.sin(t * 1.5) * 4, runnerX - 28, runnerY - 28 + Math.cos(t * 2) * 5);
    ctx.lineTo(runnerX - 26, runnerY - 24 + Math.cos(t * 2) * 5);
    ctx.quadraticCurveTo(runnerX - 14, runnerY - 27, runnerX - 3, runnerY - 26);
    ctx.closePath();
    ctx.fill();

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

  toggleRunnerPreview() {
    this.showRunnerPreview = !this.showRunnerPreview;
    return this.showRunnerPreview;
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

// Attach to window or export for modules
if (typeof window !== 'undefined') {
  window.AutumnParallaxBackground = AutumnParallaxBackground;
}
