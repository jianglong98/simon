(function(){
  // Turing Image Lab - offloads heavy iterations to a Web Worker
  const fileInput = document.getElementById('turingFile');
  const canvas = document.getElementById('turingCanvas');
  const ctx = canvas.getContext('2d');
  const startBtn = document.getElementById('turingStart');
  const stopBtn = document.getElementById('turingStop');
  const resetBtn = document.getElementById('turingReset');
  const saveBtn = document.getElementById('turingSave');
  const progress = document.getElementById('turingProgress');
  const iterationsInput = document.getElementById('turingIterations');
  const perFrameInput = document.getElementById('turingPerFrame');
  const sigmaInput = document.getElementById('turingSigma');
  const strengthInput = document.getElementById('turingStrength');

  let originalImage = null;
  let width = 0, height = 0;
  let luminance = null; // master copy on main thread
  let buffer = null; // Float32Array view, ownership will ping-pong with worker
  let worker = null;
  let iterCount = 0;
  let lastFrameImg = null;
  let cachedImageData = null;

  function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

  function drawPreviewFromBuffer(arr){
    if(!cachedImageData || cachedImageData.width !== width || cachedImageData.height !== height){ cachedImageData = ctx.createImageData(width, height); }
    const out = cachedImageData;
    for(let i=0, n=width*height;i<n;i++){
      const v = (clamp(arr[i],0,1)*255)|0;
      out.data[i*4+0] = v;
      out.data[i*4+1] = v;
      out.data[i*4+2] = v;
      out.data[i*4+3] = 255;
    }
    ctx.putImageData(out,0,0);
  }

  function loadImageFromFile(file){
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = ()=>{
      URL.revokeObjectURL(url);
      // downscale large images to keep processing fast
      const MAX_DIM = 512;
      const maxW = Math.min(MAX_DIM, window.innerWidth - 80);
      const maxH = MAX_DIM;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      width = Math.round(img.width * scale);
      height = Math.round(img.height * scale);
      canvas.width = width; canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      const id = ctx.getImageData(0,0,width,height);
      originalImage = id;
      cachedImageData = ctx.createImageData(width, height);
      luminance = new Float32Array(width*height);
      buffer = new Float32Array(width*height);
      for(let i=0;i<width*height;i++){
        const r = id.data[i*4+0];
        const g = id.data[i*4+1];
        const b = id.data[i*4+2];
        luminance[i] = (0.299*r + 0.587*g + 0.114*b)/255;
        buffer[i] = luminance[i];
      }
      iterCount = 0;
      progress.textContent = 'Image loaded. Ready.';
      drawPreviewFromBuffer(buffer);
    };
    img.src = url;
  }

  function ensureWorker(){
    if(worker) return;
    worker = new Worker('games/turing-worker.js');
    worker.onmessage = function(e){
      const msg = e.data;
      if(!msg) return;
      if(msg.type === 'frame'){
        iterCount = msg.iterCount || iterCount;
        const img = new Uint8ClampedArray(msg.image);
        // keep a copy of the last frame so we can restore the final result when done
        lastFrameImg = img.slice();
        if(!cachedImageData || cachedImageData.width !== msg.width || cachedImageData.height !== msg.height) cachedImageData = ctx.createImageData(msg.width, msg.height);
        const out = cachedImageData;
        for(let i=0, n=msg.width*msg.height;i<n;i++){
          const v = img[i];
          out.data[i*4+0] = v;
          out.data[i*4+1] = v;
          out.data[i*4+2] = v;
          out.data[i*4+3] = 255;
        }
        ctx.putImageData(out, 0, 0);
        progress.textContent = `Iter ${iterCount}/${iterationsInput.value}`;
        if(msg.done){ progress.textContent = `Done: ${iterCount} iterations`; return; }
      } else if(msg.type === 'done'){
        progress.textContent = `Done: ${msg.iterCount}`;
        // worker finished — terminate and restore main buffer from the final frame so the result persists
        try{ worker.terminate(); }catch(e){}
        worker = null;
        if(lastFrameImg){
          buffer = new Float32Array(width*height);
          for(let i=0;i<width*height;i++) buffer[i] = lastFrameImg[i]/255;
          drawPreviewFromBuffer(buffer);
          lastFrameImg = null;
        }
      } else if(msg.type === 'reset'){
        progress.textContent = 'Reset';
      }
    };
  }

  // controls
  fileInput?.addEventListener('change', (e)=>{
    const f = e.target.files && e.target.files[0];
    if(f){
      // if a worker is running, terminate it before loading a new image
      if(worker){ try{ worker.terminate(); }catch(e){} worker = null; }
      loadImageFromFile(f);
    }
  });

  startBtn?.addEventListener('click', ()=>{
    if(!originalImage){ progress.textContent='Load an image first'; return; }
    const total = parseInt(iterationsInput.value)||1000;
    const perFrame = parseInt(perFrameInput.value)||4;
    const sigma = parseFloat(sigmaInput.value)||1.6;
    const strength = parseFloat(strengthInput.value)||1.2;
    ensureWorker();
    // ensure we have a valid buffer (it may have been detached by a previous run)
    if(!buffer || !buffer.buffer || buffer.buffer.byteLength === 0){ buffer = new Float32Array(luminance); }
    try{
      worker.postMessage({cmd:'start', buffer: buffer.buffer, width, height, total, perBatch: perFrame, sigma, strength}, [buffer.buffer]);
    }catch(err){
      console.error('Failed to post start to worker', err);
      progress.textContent = 'Worker start failed';
    }
  });

  stopBtn?.addEventListener('click', ()=>{
    if(worker){ worker.terminate(); worker = null; }
    // restore local buffer so UI is immediately responsive
    if(luminance){ buffer = new Float32Array(luminance); drawPreviewFromBuffer(buffer); }
    progress.textContent='Stopped';
  });

  resetBtn?.addEventListener('click', ()=>{
    if(!originalImage) return;
    // terminate worker and reset local buffer to luminance
    if(worker){ worker.terminate(); worker=null; }
    buffer = new Float32Array(luminance);
    iterCount = 0; drawPreviewFromBuffer(buffer); progress.textContent='Reset';
  });

  saveBtn?.addEventListener('click', ()=>{
    const link = document.createElement('a');
    link.download = 'turing-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });

  // expose small helper for debugging
  window.turingLab = { loadImageFromFile };
})();
