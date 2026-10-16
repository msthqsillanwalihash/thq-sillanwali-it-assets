function startScanner(){
  if(typeof Html5Qrcode==='undefined'){alert('Scanner library loading… try again in 2 sec');return;}
  document.getElementById('btnStartScan').style.display='none';
  document.getElementById('btnStopScan').style.display='inline-flex';
  if(!window.html5QrCode)window.html5QrCode=new Html5Qrcode('scannerBox');
  window.html5QrCode.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250}},onScanSuccess,()=>{}).catch(e=>{alert('Camera error: '+e);stopScanner();});
}
function stopScanner(){
  if(window.html5QrCode){try{window.html5QrCode.stop().then(()=>window.html5QrCode.clear()).catch(()=>{});}catch(e){}}
  const b1=document.getElementById('btnStartScan'),b2=document.getElementById('btnStopScan');
  if(b1)b1.style.display='inline-flex';if(b2)b2.style.display='none';
}
function onScanSuccess(decodedText){stopScanner();processCheckin(decodedText);}
function processCheckin(code){
  const id=(code||'').trim();if(!id)return;
  let a=assets.find(x=>x.id===id);
  const box=document.getElementById('scanResult');
  if(!a){
    if(box){box.classList.remove('hidden');box.innerHTML=`<div class="info-box"><strong>Not found:</strong> ${id}<br><button class="btn btn-primary btn-sm" onclick="addFromScan('${id.replace(/'/g,"\\'")}')">Add as new asset</button></div>`;}
    return;
  }
  a.lastScan=new Date().toLocaleString();
  if(lastGps&&lastGps.lat){a.lat=lastGps.lat;a.lng=lastGps.lng;}
  const u=userById(a.userId);
  checkins.unshift({time:a.lastScan,assetId:a.id,type:a.type,userName:u?u.name:'—',lat:a.lat,lng:a.lng});
  logs.unshift({time:a.lastScan,assetId:a.id,user:a.userId||'',userName:u?u.name:'—',action:'Scan check-in',lat:a.lat,lng:a.lng});
  if(checkins.length>200)checkins.length=200;if(logs.length>500)logs.length=500;
  saveData();
  if(box){box.classList.remove('hidden');box.innerHTML=`<div class="info-box"><strong>${a.id}</strong> · ${a.type}<br>Location: ${a.loc||'—'} · User: ${u?u.name:'—'}<br>GPS: ${a.lat?Number(a.lat).toFixed(5)+', '+Number(a.lng).toFixed(5):'—'}</div>`;}
  renderTodayScans();
}
function addFromScan(id){showView('add');document.getElementById('f_id').value=id;}
function manualCheckin(){const id=prompt('Enter Asset ID');if(id)processCheckin(id);}
function renderTodayScans(){
  const tb=document.getElementById('todayScansBody');if(!tb)return;
  const list=checkins.slice(0,30);
  tb.innerHTML=list.length?list.map(c=>`<tr><td>${c.time||''}</td><td>${c.assetId||''}</td><td>${c.type||''}</td><td>${c.userName||'—'}</td><td>${typeof mapsLink==='function'?mapsLink(c.lat,c.lng):(c.lat||'—')}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No scans yet</td></tr>';
}
function renderLabels(){
  const grid=document.getElementById('labelsGrid');if(!grid)return;
  const ft=document.getElementById('labelFilterType')?.value||'';
  const fs=document.getElementById('labelFilterStatus')?.value||'';
  let list=assets.filter(a=>{if(ft&&a.type!==ft)return false;if(fs&&a.status!==fs)return false;return true;});
  grid.innerHTML=list.map((a,i)=>`<div class="label-card"><div class="label-id">${a.id}</div><div class="label-type">${a.type||''}</div><div class="label-loc">${a.loc||''}</div><svg id="bc_${i}"></svg></div>`).join('')||'<p class="empty">No assets</p>';
  list.forEach((a,i)=>{try{if(typeof JsBarcode!=='undefined')JsBarcode('#bc_'+i,a.id,{format:'CODE128',width:1.1,height:28,displayValue:false,margin:2});}catch(e){}});
}
function exportCSV(){
  const headers=['Asset ID','Type','Location','User ID','IP','Status','Serial'];
  const rows=assets.map(a=>[a.id,a.type,a.loc,a.userId,a.ip,a.status,a.serial].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(','));
  const blob=new Blob([[headers.join(',')].concat(rows).join('\n')],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='THQ_IT_Assets.csv';a.click();
}
function exportUsersCSV(){
  const headers=['User ID','Name','Desig','Dept','Contact','Status'];
  const rows=users.map(u=>[u.id,u.name,u.desig,u.dept,u.contact,u.status].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(','));
  const blob=new Blob([[headers.join(',')].concat(rows).join('\n')],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='THQ_IT_Users.csv';a.click();
}

/* GPS */
if(typeof lastGps==='undefined')var lastGps={lat:null,lng:null,accuracy:null};
if(typeof myPublicIP==='undefined')var myPublicIP=null,myLocalIP=null;
function getGpsOnce(){
  const box=document.getElementById('gpsBox');
  if(!navigator.geolocation){if(box){box.classList.remove('hidden');box.textContent='GPS not supported';}return;}
  if(box){box.classList.remove('hidden');box.textContent='Getting GPS…';}
  navigator.geolocation.getCurrentPosition(pos=>{
    lastGps={lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:pos.coords.accuracy};
    if(box)box.innerHTML=`GPS: <strong>${lastGps.lat.toFixed(5)}, ${lastGps.lng.toFixed(5)}</strong> (±${Math.round(lastGps.accuracy)}m) · <a href="https://maps.google.com/?q=${lastGps.lat},${lastGps.lng}" target="_blank">Map</a>`;
  },err=>{if(box){box.classList.remove('hidden');box.textContent='GPS error: '+err.message;}},{enableHighAccuracy:true,timeout:15000});
}
function lockAssetLocation(i){if(i<0||!assets[i])return;if(!lastGps.lat){getGpsOnce();alert('Get GPS first, then lock');return;}assets[i].lat=lastGps.lat;assets[i].lng=lastGps.lng;assets[i].locationLocked=true;assets[i].lockedAt=new Date().toLocaleString();saveData();alert('Location locked');renderAssetTable();}
function unlockAssetLocation(i){if(i<0||!assets[i])return;assets[i].locationLocked=false;assets[i].lockedAt=null;saveData();renderAssetTable();}

/* IP */
function fetchMyIP(){
  fetch('https://api.ipify.org?format=json').then(r=>r.json()).then(d=>{myPublicIP=d.ip;updateIPBox();}).catch(()=>{});
  try{
    const pc=new RTCPeerConnection({iceServers:[]});
    pc.createDataChannel('');pc.createOffer().then(o=>pc.setLocalDescription(o));
    pc.onicecandidate=e=>{if(!e.candidate)return;const m=/([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate);if(m&&!m[1].startsWith('0.')){myLocalIP=m[1];updateIPBox();pc.close();}};
  }catch(e){}
}
function updateIPBox(){
  const msg=`Public: <code>${myPublicIP||'—'}</code>${myLocalIP?' · Local: <code>'+myLocalIP+'</code>':''}`;
  ['ipBox','ipBoxSettings','ipMenuStatus'].forEach(id=>{const b=document.getElementById(id);if(b){b.classList.remove('hidden');b.innerHTML=msg;}});
}
function copyIP(which){const v=which==='public'?myPublicIP:myLocalIP;if(!v){alert('Fetch IP first');return;}navigator.clipboard.writeText(v).then(()=>alert('Copied: '+v)).catch(()=>prompt('Copy:',v));}
function applyIPFromMenu(mode){
  const id=document.getElementById('ipTargetAsset')?.value;if(!id){alert('Select asset');return;}
  const a=assets.find(x=>x.id===id);if(!a)return;
  if(mode==='public'&&myPublicIP)a.ip=myPublicIP;else if(mode==='local'&&myLocalIP)a.ip=myLocalIP;else if(mode==='manual'){const v=prompt('IP address',a.ip||'');if(v!=null)a.ip=v;}else{alert('Fetch IP first');return;}
  saveData();alert('IP set to '+a.ip);
}
function openIPMenu(){fillIPTargetSelects&&fillIPTargetSelects();updateIPBox();document.getElementById('ipMenuModal')?.classList.add('show');}
function closeIPMenu(){document.getElementById('ipMenuModal')?.classList.remove('show');}
function refreshIPMenu(){updateIPBox();}
function applyIPFromIPMenu(mode){
  const id=document.getElementById('ipMenuAsset')?.value;if(!id){alert('Select asset');return;}
  const a=assets.find(x=>x.id===id);if(!a)return;
  if(mode==='public'&&myPublicIP)a.ip=myPublicIP;else if(mode==='manual'){const v=prompt('IP',a.ip||'');if(v!=null)a.ip=v;}else{alert('Fetch IP first');return;}
  saveData();alert('IP set');closeIPMenu();
}

/* Server sync */
function serverBase(){return (getSettings().serverUrl||'').replace(/\/$/,'');}
function updateServerStatusUI(msg){
  const el=document.getElementById('serverStatus');if(!el)return;
  if(msg){el.innerHTML=msg;return;}
  const u=serverBase();
  el.innerHTML=u?('Server: <strong>'+u+'</strong>'):('Server: <strong>not configured</strong>');
}
async function apiGet(path){const r=await fetch(serverBase()+path);if(!r.ok)throw new Error(r.status);return r.json();}
async function apiPost(path,body){const r=await fetch(serverBase()+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(r.status);return r.json();}
async function testServer(){
  try{updateServerStatusUI('Testing…');const j=await apiGet('/api/health');updateServerStatusUI('✅ OK · '+JSON.stringify(j.counts||{}));lastServerOk=true;}
  catch(e){updateServerStatusUI('❌ '+e.message);lastServerOk=false;}
}
async function pullFromServer(silent){
  try{if(!serverBase()){if(!silent)alert('Set Server URL first');return false;}
  if(!silent)updateServerStatusUI('Pulling…');
  const j=await apiGet('/api/sync');
  if(Array.isArray(j.assets))assets=j.assets;
  if(Array.isArray(j.users))users=j.users;
  if(Array.isArray(j.checkins))checkins=j.checkins;
  if(Array.isArray(j.logs))logs=j.logs;
  saveData();lastServerOk=true;
  if(!silent){updateServerStatusUI('✅ Pulled · '+(assets.length)+' assets');alert('Data downloaded.');renderDashboard();}
  return true;}catch(e){lastServerOk=false;if(!silent){updateServerStatusUI('❌ '+e.message);alert('Pull failed: '+e.message);}return false;}
}
async function pushToServer(silent){
  try{if(!serverBase()){if(!silent)alert('Set Server URL first');return false;}
  if(!silent)updateServerStatusUI('Pushing…');
  const j=await apiPost('/api/sync',{assets,users,checkins,logs});
  lastServerOk=true;
  if(!silent){updateServerStatusUI('✅ Pushed');alert('Data uploaded.');}
  return true;}catch(e){lastServerOk=false;if(!silent){updateServerStatusUI('❌ '+e.message);alert('Push failed: '+e.message);}return false;}
}
async function fullSync(){const mode=getSettings().syncMode||'pull';if(mode==='push')await pushToServer();else await pullFromServer();}
function setupAutoSync(){if(typeof syncTimer!=='undefined'&&syncTimer)clearInterval(syncTimer);const mins=parseInt(getSettings().syncInterval||'0',10);if(!mins||!serverBase())return;syncTimer=setInterval(()=>{const mode=getSettings().syncMode||'pull';if(mode==='push')pushToServer(true);else pullFromServer(true);},mins*60*1000);}
async function autoFetchOnLogin(){const s=getSettings();if(s.autoFetch==='yes'&&s.serverUrl)await pullFromServer(true);setupAutoSync();updateServerStatusUI();}

checkSession();
