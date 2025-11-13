

let cam;                 
const vW = 320, vH = 240;
let prevFrame;           
let fog;               
let brushTex;           


let THRESH = 28;         
let STEP   = 5;          
let BRAD   = 70;         
let BSTR   = 42;         
let FADE   = 6;          
let MIRROR = true;       

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);

 
  cam = createCapture({ video: { width: vW, height: vH }, audio: false });
  cam.size(vW, vH);
  cam.hide();

  
  fog = createGraphics(width, height);
  fog.pixelDensity(1);
  makeBrush(256); 
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  fog = createGraphics(width, height);
  fog.pixelDensity(1);
  makeBrush(256);
  clearFog();
}

function draw() {

  background('#b9dcfd');
  noStroke();
  const hg = drawingContext.createLinearGradient(0, 0, 0, height * 0.28);
  hg.addColorStop(0, 'rgba(255,255,255,0.18)');
  hg.addColorStop(1, 'rgba(255,255,255,0.00)');
  drawingContext.fillStyle = hg;
  rect(0, 0, width, height * 0.28);


  cam.loadPixels();
  if (cam.pixels.length > 0) {
    const currGray = toGrayscale(cam.pixels, vW, vH);

    if (prevFrame) {

      for (let y = 0; y < vH; y += STEP) {
        for (let x = 0; x < vW; x += STEP) {
          const i = y * vW + x;
          const diff = Math.abs(currGray[i] - prevFrame[i]);
          if (diff > THRESH) {
      
            const nx = MIRROR ? (vW - x) / vW : x / vW;
            const ny = y / vH;
            const sx = nx * width;
            const sy = ny * height;

          
            const localAlpha = map(diff, THRESH, 255, BSTR * 0.35, BSTR, true);
            stampFog(sx, sy, BRAD, localAlpha);
          }
        }
      }
    }
    prevFrame = currGray; //
  }

  
  fog.erase(FADE, FADE);
  fog.rect(0, 0, width, height);
  fog.noErase();

 
  image(fog, 0, 0);
}


function toGrayscale(px, w, h) {
  const L = new Uint8Array(w * h);
  let j = 0;
  for (let i = 0; i < px.length; i += 4) {

    L[j++] = (px[i] + px[i + 1] + px[i + 2]) / 3;
  }
  return L;
}

function makeBrush(sz) {
  brushTex = createGraphics(sz, sz);
  brushTex.pixelDensity(1);
  brushTex.loadPixels();

  const stretchY = 1.6;
  const inner = 0.36;
  const outer = 0.98;
  const noiseScale = 2.2;
  const stripeFreq = 7.0;
  const stripeMix  = 0.10;


  noiseSeed(12345);
  for (let y = 0; y < sz; y++) {
    const v = y / (sz - 1) * 2 - 1;
    for (let x = 0; x < sz; x++) {
      const u = x / (sz - 1) * 2 - 1;
      const uu = u;
      const vv = v * stretchY;
      const r = Math.hypot(uu, vv);

      let t = (outer - r) / (outer - inner);
      t = constrain(t, 0, 1);
      t = t * t * (3 - 2 * t); // smoothstep

      const n = noise(u * noiseScale + 1.0, v * noiseScale + 2.0);
      let a = t * (0.80 + 0.20 * n);

      const stripe = 0.5 + 0.5 * sin(uu * stripeFreq + n * 2.0);
      a *= (1.0 - stripeMix) + stripeMix * stripe;

      const idx = (y * sz + x) * 4;
      brushTex.pixels[idx + 0] = 235;
      brushTex.pixels[idx + 1] = 240;
      brushTex.pixels[idx + 2] = 245;
      brushTex.pixels[idx + 3] = Math.round(255 * a);
    }
  }
  brushTex.updatePixels();
}

function stampFog(cx, cy, radius, alpha255) {
  const repeats = 3;
  const jitter = radius * 0.08;

  fog.push();
  for (let i = 0; i < repeats; i++) {
    const dx = random(-jitter, jitter);
    const dy = random(-jitter, jitter);
    const rot = random(-0.22, 0.22);
    const sx = radius * 2 * random(0.94, 1.06);
    const sy = radius * 2 * random(0.86, 1.14);

    fog.translate(cx + dx, cy + dy);
    fog.rotate(rot);

    // 用 tint 控制整体不透明度
    fog.tint(255, alpha255);
    fog.imageMode(CENTER);
    fog.image(brushTex, 0, 0, sx, sy);

    fog.resetMatrix();
  }
  fog.noTint();
  fog.pop();
}

function clearFog() {
  fog.clear();
}

function keyPressed() {
  if (key === 'R' || key === 'r') { clearFog(); return; }
  if (key === '[') { BRAD = max(10, BRAD - 6); return; }
  if (key === ']') { BRAD = min(300, BRAD + 6); return; }
  if (key === '+') { BSTR = constrain(BSTR + 4, 8, 160); return; }
  if (key === '-') { BSTR = constrain(BSTR - 4, 8, 160); return; }
  if (key === 'M' || key === 'm') { MIRROR = !MIRROR; return; }
}
