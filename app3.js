function startScanner(){
  if(typeof Html5Qrcode==='undefined'){alert('Scanner library loading… try again in 2 sec');return;}
  const box=document.getElementById('scannerBox');
  if(!box)return;
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
function onScanSuccess(decodedText){
  stopScanner();
  processCheckin(decodedText);
}
function processCheckin(code){
  const id=(code||'').trim();
  if(!id)return;
  let a=assets.find(x=>x.id===id);
  const box=document.getElementById('scanResult');
  if(!a){
    if(box){box.classList.remove('hidden');box.innerHTML=`<div class="info-box"><strong>Not found:</strong> ${id}<br><button class="btn btn-primary btn-sm" onclick="addFromScan('${id.replace(/'/g,"\\'")}')">Add as new asset</button></div>`;}
    return;
  }
  a.lastScan=new Date().toLocaleString();
  if(lastGps.lat){a.lat=lastGps.lat;a.lng=lastGps.lng;}
  const u=userById(a.userId);
  checkins.unshift({time:a.lastScan,assetId:a.id,type:a.type,userName:u?u.name:'—',lat:a.lat,lng:a.lng});
  logs.unshift({time:a.lastScan,assetId:a.id,user:a.userId||'',userName:u?u.name:'—',action:'Scan check-in',lat:a.lat,lng:a.lng});
  if(checkins.length>200)checkins.length=200;
  if(logs.length>500)logs.length=500;
  saveData();
  if(box){box.classList.remove('hidden');box.innerHTML=`<div class="info-box success"><strong>${a.id}</strong> · ${a.type}<br>Location: ${a.loc||'—'} · User: ${u?u.name:'—'}<br>GPS: ${a.lat?a.lat.toFixed(5)+', '+a.lng.toFixed(5):'—'}<br><button class="btn btn-ghost btn-sm" onclick="openAssign(${assets.indexOf(a)})">Assign user</button> <button class="btn btn-ghost btn-sm" onclick="editAsset(${assets.indexOf(a)})">Edit</button></div>`;}
  renderTodayScans();
  if(getSettings().offerLock==='yes'&&lastGps.lat&&!a.locationLocked){
    if(confirm('Lock GPS location for this asset?'))lockAssetLocation(assets.indexOf(a));
  }
}
function addFromScan(id){
  showView('add');
  document.getElementById('f_id').value=id;
}
function manualCheckin(){
  const id=prompt('Enter Asset ID');
  if(id)processCheckin(id);
}
function renderTodayScans(){
  const tb=document.getElementById('todayScansBody');
  if(!tb)return;
  const list=checkins.slice(0,30);
  tb.innerHTML=list.length?list.map(c=>`<tr><td>${c.time||''}</td><td>${c.assetId||''}</td><td>${c.type||''}</td><td>${c.userName||'—'}</td><td>${typeof mapsLink==='function'?mapsLink(c.lat,c.lng):(c.lat||'—')}</td></tr>`).join(''):'<tr><td colspan="5" class="empty">No scans yet</td></tr>';
}
function renderLabels(){
  const grid=document.getElementById('labelsGrid');
  if(!grid)return;
  const ft=document.getElementById('labelFilterType')?.value||'';
  const fs=document.getElementById('labelFilterStatus')?.value||'';
  let list=assets.filter(a=>{
    if(ft&&a.type!==ft)return false;
    if(fs&&a.status!==fs)return false;
    return true;
  });
  grid.innerHTML=list.map((a,i)=>`<div class="label-card"><div class="label-id">${a.id}</div><div class="label-type">${a.type||''}</div><div class="label-loc">${a.loc||''}</div><svg id="bc_${i}"></svg></div>`).join('')||'<p class="empty">No assets</p>';
  list.forEach((a,i)=>{try{if(typeof JsBarcode!=='undefined')JsBarcode('#bc_'+i,a.id,{format:'CODE128',width:1.1,height:28,displayValue:false,margin:2});}catch(e){}});
}
function exportCSV(){
  const headers=['Asset ID','Type','Location','User ID','User Name','IP','MAC','Status','Serial','GPS Lat','GPS Lng','Locked','Last Scan'];
  const rows=assets.map(a=>{const u=userById(a.userId);return [a.id,a.type,a.loc,a.userId,u?.name||'',a.ip,a.mac,a.status,a.serial,a.lat,a.lng,a.locationLocked?'Yes':'No',a.lastScan].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',');});
  const blob=new Blob([[headers.join(',')].concat(rows).join('\n')],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='THQ_IT_Assets.csv';a.click();
}
function exportUsersCSV(){
  const headers=['User ID','Name','Designation','Department','Contact','CNIC','Email','Type','Status'];
  const rows=users.map(u=>[u.id,u.name,u.desig,u.dept,u.contact,u.cnic,u.email,u.type,u.status].map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(','));
  const blob=new Blob([[headers.join(',')].concat(rows).join('\n')],{type:'text/csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='THQ_IT_Users.csv';a.click();
}

checkSession();
