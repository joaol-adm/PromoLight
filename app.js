// PromoLight v4.1 - Cache-busting aplicado; log/telefone ocultos; WhatsApp + notificação
const WHATSAPP_TARGET = "+551535009695"; // altere aqui uma vez só
const WHATSAPP_MSG = "Salvar MINHA PROMOCAO";
const ASSET_VER = "v=4-1";

const els = { btnEnviar: null, btnSettings: null, modal: null };

function $(sel){ return document.querySelector(sel); }

async function init(){
  els.btnEnviar = $('#btnEnviar');
  els.btnSettings = $('#btnSettings');
  els.modal = $('#settingsModal');

  const wt = $('#whatsTarget'); if(wt) wt.textContent = WHATSAPP_TARGET;

  if(els.btnEnviar){ els.btnEnviar.addEventListener('click', onEnviar); }
  if(els.btnSettings && !els.btnSettings.hasAttribute('hidden')){
    els.btnSettings.addEventListener('click', () => { if(els.modal) els.modal.showModal(); });
  }

  await resolveImagesAnyExt();
  setupVideoAutoplayOnFullView();
}

async function onEnviar(){
  try{ await openWhatsApp(WHATSAPP_TARGET, WHATSAPP_MSG); }
  catch(err){ console.error('Falha ao abrir WhatsApp:', err); alert('Não foi possível abrir o WhatsApp automaticamente.'); }
  try{ await showLocalNotification('parabens-push'); }catch(err){}
}

/* ---------- WhatsApp ---------- */
async function openWhatsApp(toNumberRaw, text){
  const to = (toNumberRaw || '').replace(/\D/g,'');
  const encoded = encodeURIComponent(text);
  const deep = `whatsapp://send?phone=${to}&text=${encoded}`;
  const web = `https://wa.me/${to}?text=${encoded}`;
  await new Promise((resolve) => {
    const a = document.createElement('a'); a.href = deep; a.style.display = 'none'; document.body.appendChild(a);
    a.click(); setTimeout(() => { window.location.href = web; a.remove(); resolve(); }, 600);
  });
}

/* ---------- Notificação local ---------- */
async function showLocalNotification(text){
  if(!('Notification' in window)) return;
  let perm = Notification.permission; if(perm === 'default'){ perm = await Notification.requestPermission(); }
  if(perm !== 'granted') return;
  if('serviceWorker' in navigator && navigator.serviceWorker.controller){
    navigator.serviceWorker.controller.postMessage({type:'show-notification', title:text, body:'PromoLight'});
  }else if('serviceWorker' in navigator){
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(text, { body:'PromoLight', icon:`icon-192-v4-1.png`, badge:`icon-192-v4-1.png`, vibrate:[100,50,100] });
  }else{ new Notification(text); }
}

/* ---------- Imagens: .svg, .png, .jpg automaticamente (com versionamento) ---------- */
function withVer(url){ return url.includes('?') ? url + '&' + ASSET_VER : url + '?' + ASSET_VER; }
async function firstExisting(paths){
  for(const p of paths){
    const url = withVer(p);
    try{ const r = await fetch(url, { method:'HEAD', cache:'no-store' }); if(r.ok) return url; }catch(e){}
  }
  return null;
}
async function resolveImagesAnyExt(){
  const items = [
    { el: document.getElementById('img1'), base: 'assets/images/img1' },
    { el: document.getElementById('img2'), base: 'assets/images/img2' },
    { el: document.getElementById('img3'), base: 'assets/images/img3' },
  ];
  for(const {el, base} of items){
    if(!el) continue;
    const src = await firstExisting([`${base}.svg`, `${base}.png`, `${base}.jpg`, `${base}.jpeg`]);
    if(src) el.src = src;
  }
}

/* ---------- Autoplay do vídeo quando ~100% visível ---------- */
function setupVideoAutoplayOnFullView(){
  const video = document.getElementById('promoVideo');
  if(!video) return;
  video.muted = true;
  const observer = new IntersectionObserver((entries) => {
    for(const entry of entries){
      if(entry.target !== video) continue;
      if(entry.isIntersecting && entry.intersectionRatio >= 0.98){
        const p = video.play();
        if(p && typeof p.then === 'function'){ p.catch(()=>{}); }
      }else{ video.pause(); }
    }
  }, { threshold: [0.25, 0.5, 0.75, 0.98, 1.0] });
  observer.observe(video);
  document.addEventListener('visibilitychange', ()=>{ if(document.hidden) video.pause(); });
}

document.addEventListener('DOMContentLoaded', init);
