const WHATSAPP_TARGET = "+551535009695";
const WHATSAPP_MSG = "parabens-sms";

const els = {
  phone: null, btnSalvar: null, btnSettings: null, modal: null,
  cfgOwner: null, cfgRepo: null, cfgBranch: null, cfgPath: null, cfgToken: null, btnSaveCfg: null,
};
function $(sel){ return document.querySelector(sel); }
function loadCfg(){
  const cfg = JSON.parse(localStorage.getItem('promolight_cfg') || '{}');
  els.cfgOwner.value = cfg.owner || 'joaol-adm';
  els.cfgRepo.value = cfg.repo || 'PromoLight';
  els.cfgBranch.value = cfg.branch || 'main';
  els.cfgPath.value = cfg.path || 'logs/promo-log.csv';
  els.cfgToken.value = cfg.token || '';
}
function saveCfg(){
  const cfg = {
    owner: els.cfgOwner.value.trim(), repo: els.cfgRepo.value.trim(),
    branch: els.cfgBranch.value.trim(), path: els.cfgPath.value.trim(),
    token: els.cfgToken.value.trim(),
  };
  localStorage.setItem('promolight_cfg', JSON.stringify(cfg));
  return cfg;
}
async function init(){
  els.phone = $('#inputPhone'); els.btnSalvar = $('#btnSalvar');
  els.btnSettings = $('#btnSettings'); els.modal = $('#settingsModal');
  els.cfgOwner = $('#cfgOwner'); els.cfgRepo = $('#cfgRepo'); els.cfgBranch = $('#cfgBranch');
  els.cfgPath = $('#cfgPath'); els.cfgToken = $('#cfgToken'); els.btnSaveCfg = $('#btnSaveCfg');
  const savedPhone = localStorage.getItem('promolight_phone'); if(savedPhone){ els.phone.value = savedPhone; }
  els.btnSalvar.addEventListener('click', onSalvar);
  els.btnSettings.addEventListener('click', () => { loadCfg(); els.modal.showModal(); });
  els.btnSaveCfg.addEventListener('click', (ev) => { ev.preventDefault(); saveCfg(); els.modal.close(); });
}
async function onSalvar(){
  const userNumber = (els.phone.value || '').replace(/\s+/g, '');
  if(!userNumber){ alert('Informe o seu telefone com DDI + DDD para registro no log.'); els.phone.focus(); return; }
  localStorage.setItem('promolight_phone', userNumber);
  try{ await openWhatsApp(WHATSAPP_TARGET, WHATSAPP_MSG); }
  catch(err){ console.error('Falha ao abrir WhatsApp:', err); alert('Não foi possível abrir o WhatsApp automaticamente.'); }
  try{ await showLocalNotification('parabens-push'); } catch(_) {}
  try{
    const cfg = JSON.parse(localStorage.getItem('promolight_cfg') || '{}');
    if(cfg.owner && cfg.repo && cfg.branch && cfg.path && cfg.token){ await appendLogToGitHub(cfg, userNumber); }
  }catch(err){ console.error('Erro ao gravar log no GitHub:', err); }
}
async function openWhatsApp(toNumberRaw, text){
  const to = (toNumberRaw || '').replace(/\D/g,'');
  const encoded = encodeURIComponent(text);
  const deep = `whatsapp://send?phone=${to}&text=${encoded}`;
  const web = `https://wa.me/${to}?text=${encoded}`;
  await new Promise((resolve) => {
    const a = document.createElement('a'); a.href = deep; a.style.display = 'none'; document.body.appendChild(a);
    a.click();
    setTimeout(() => { window.location.href = web; a.remove(); resolve(); }, 600);
  });
}
async function showLocalNotification(text){
  if(!('Notification' in window)) return;
  let perm = Notification.permission; if(perm === 'default'){ perm = await Notification.requestPermission(); }
  if(perm !== 'granted') return;
  if('serviceWorker' in navigator && navigator.serviceWorker.controller){
    navigator.serviceWorker.controller.postMessage({type:'show-notification', title:text, body:'PromoLight'});
  }else if('serviceWorker' in navigator){
    const reg = await navigator.serviceWorker.ready;
    reg.showNotification(text, { body:'PromoLight', icon:'icon-192.png', badge:'icon-192.png', vibrate:[100,50,100] });
  }else{ new Notification(text); }
}
async function appendLogToGitHub(cfg, userNumber){
  const endpoint = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${cfg.path}`;
  const headers = { 'Accept':'application/vnd.github+json', 'Authorization': `token ${cfg.token}` };
  let sha = null, existing = ''; const getUrl = endpoint + `?ref=${encodeURIComponent(cfg.branch)}`;
  let res = await fetch(getUrl, { headers });
  if(res.status === 200){ const data = await res.json(); sha = data.sha; existing = atob(data.content.replace(/\n/g,'')); }
  else if(res.status !== 404){ throw new Error('Falha ao ler arquivo existente: ' + res.status); }
  const now = new Date().toISOString(); const ua = navigator.userAgent.replace(/\s+/g,' ');
  const line = `${now},${userNumber},"whatsapp:${WHATSAPP_TARGET}","parabens-push","${ua}"\n`;
  const content = existing + line;
  const b64 = btoa(unescape(encodeURIComponent(content)));
  const body = { message:`chore(log): append phone at ${now}`, content:b64, branch:cfg.branch }; if(sha) body.sha = sha;
  res = await fetch(endpoint, { method:'PUT', headers, body: JSON.stringify(body) });
  if(!res.ok){ const t = await res.text(); throw new Error('GitHub PUT falhou: ' + res.status + ' ' + t); }
}
document.addEventListener('DOMContentLoaded', init);