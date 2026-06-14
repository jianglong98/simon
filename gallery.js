(function(){
  const items = () => Array.from(document.querySelectorAll('.gallery-item'));
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const btnClose = () => lightbox.querySelector('.lightbox-close');
  const btnPrev = () => lightbox.querySelector('.lightbox-prev');
  const btnNext = () => lightbox.querySelector('.lightbox-next');
  let current = -1;

  function open(index){
    const a = items()[index];
    if(!a) return;
    const href = a.getAttribute('href');
    const alt = a.querySelector('img')?.alt || '';
    lbImg.src = href;
    lbImg.alt = alt;
    current = index;
    lightbox.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    focusFirst();
  }

  function close(){
    lightbox.setAttribute('aria-hidden','true');
    lbImg.src = '';
    current = -1;
    document.body.style.overflow = '';
  }

  function prev(){ if(current > 0) open(current - 1); }
  function next(){ if(current < items().length - 1) open(current + 1); }

  function focusFirst(){
    const focusable = Array.from(lightbox.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    if(focusable.length) focusable[0].focus();
  }

  function attach(){
    items().forEach((a,i)=>{
      a.addEventListener('click', e => { e.preventDefault(); open(i); });
      a.addEventListener('keydown', e => { if(e.key === 'Enter') { e.preventDefault(); open(i); } });
    });

    btnClose()?.addEventListener('click', close);
    btnPrev()?.addEventListener('click', prev);
    btnNext()?.addEventListener('click', next);

    lightbox.addEventListener('click', e => { if(e.target === lightbox) close(); });

    document.addEventListener('keydown', e => {
      if(lightbox.getAttribute('aria-hidden') === 'false'){
        if(e.key === 'Escape') close();
        if(e.key === 'ArrowLeft') prev();
        if(e.key === 'ArrowRight') next();
      }
    });

    // Observe DOM changes so future images added dynamically get handlers
    const observer = new MutationObserver(() => attach());
    observer.observe(document.body, { childList: true, subtree: true });
  }

  // Initialize on DOMContentLoaded
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', attach);
  else attach();
})();
