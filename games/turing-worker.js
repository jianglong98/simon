(function(){
  // Turing Image Lab worker: performs blur/sharpen iterations on a Float32Array buffer
  let buffer = null;
  let blurred = null;
  let width = 0, height = 0;
  let total = 0, perBatch = 4, sigma = 1.6, strength = 1.2;
  let iterCount = 0;
  let running = false;
  let awaitingMain = false;
  let radius = 0;
  let tmp = null; // reuse temporary buffer for blur

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  // Fast box blur using sliding window (O(1) per pixel). Radius controls blur radius in pixels.
  function boxBlur(src, dst, w, h, r){
    if(r <= 0){ // copy
      for(let i=0, n=w*h;i<n;i++) dst[i]=src[i];
      return;
    }
    const ws = 2*r+1;
    if(!tmp || tmp.length !== w*h) tmp = new Float32Array(w*h);
    // horizontal pass -> tmp
    for(let y=0;y<h;y++){
      const row = y*w;
      let sum = 0;
      // initial sum for x=0
      for(let i=-r;i<=r;i++){ const xi = clamp(i,0,w-1); sum += src[row+xi]; }
      for(let x=0;x<w;x++){
        tmp[row+x] = sum / ws;
        const sub = x - r;
        const add = x + r + 1;
        // update sum using clamped indices
        const subIdx = clamp(sub,0,w-1);
        const addIdx = clamp(add,0,w-1);
        sum += src[row+addIdx] - src[row+subIdx];
      }
    }
    // vertical pass from tmp -> dst
    for(let x=0;x<w;x++){
      let sum = 0;
      // initial sum for y=0
      for(let i=-r;i<=r;i++){ const yi = clamp(i,0,h-1); sum += tmp[yi*w + x]; }
      for(let y=0;y<h;y++){
        dst[y*w + x] = sum / ws;
        const sub = y - r;
        const add = y + r + 1;
        const subIdx = clamp(sub,0,h-1);
        const addIdx = clamp(add,0,h-1);
        sum += tmp[addIdx*w + x] - tmp[subIdx*w + x];
      }
    }
  }

  function iterateStep(){
    // use box blur approximation for speed
    boxBlur(buffer, blurred, width, height, radius);
    // simplified sharpen step
    for(let i=0, n=width*height;i<n;i++){
      let val = buffer[i] + strength*(buffer[i] - blurred[i]);
      // gentler linear contrast tweak for smoother patterns
      val = 0.5 + (val - 0.5) * 1.01;
      buffer[i] = val < 0 ? 0 : val > 1 ? 1 : val;
    }
  }

  function processBatch(){
    if(!running) return;
    const doNow = Math.min(perBatch, total - iterCount);
    for(let j=0;j<doNow;j++){ iterateStep(); iterCount++; }
    // prepare a lightweight grayscale image (one byte per pixel) to send to main
    const img = new Uint8ClampedArray(width*height);
    for(let i=0;i<width*height;i++) img[i] = (buffer[i]*255)|0;
    const done = iterCount>=total;
    self.postMessage({type:'frame', image: img.buffer, width, height, iterCount, done}, [img.buffer]);
    if(done){ running = false; self.postMessage({type:'done', iterCount}); return; }
    // schedule next batch to yield to worker event loop
    setTimeout(processBatch, 0);
  }

  self.onmessage = function(e){
    const msg = e.data;
    if(!msg || !msg.cmd) return;
    if(msg.cmd === 'start'){
      // msg.buffer is an ArrayBuffer transferred in
      buffer = new Float32Array(msg.buffer);
      width = msg.width; height = msg.height;
      total = msg.total || 1000; perBatch = msg.perBatch || 4;
      sigma = msg.sigma || 1.6; strength = msg.strength || 1.2;
      blurred = new Float32Array(buffer.length);
      // prepare radius and tmp once
      radius = Math.max(1, Math.round(sigma));
      tmp = new Float32Array(width*height);
      iterCount = 0; running = true; awaitingMain = false;
      processBatch();
    } else if(msg.cmd === 'continue'){
      // deprecated in new flow; ignore
    } else if(msg.cmd === 'stop'){
      running = false;
    } else if(msg.cmd === 'reset'){
      // reset expects a fresh buffer
      buffer = new Float32Array(msg.buffer);
      blurred = new Float32Array(buffer.length);
      iterCount = 0; running = false; awaitingMain = false;
      self.postMessage({type:'reset'});
    } else if(msg.cmd === 'stop'){
      running = false;
    }
  };
})();
