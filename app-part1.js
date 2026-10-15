
/* ===== PWA Manifest + Service Worker ===== */
const MANIFEST = {
  name: 'THQ Sillanwali IT Assets',
  short_name: 'THQ IT',
  description: 'IT Asset Management System — THQ Hospital Sillanwali',
  start_url: '.',
  display: 'standalone',
  background_color: '#0f766e',
  theme_color: '#0d9488',
  orientation: 'any',
  icons: [{
    src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect fill='%230d9488' width='512' height='512' rx='96'/%3E%3Ctext x='256' y='320' font-size='200' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EIT%3C/text%3E%3C/svg%3E",
    sizes: '512x512',
    type: 'image/svg+xml',
    purpose: 'any maskable'
  }]
};
(function registerPWA() {
  const blob = new Blob([JSON.stringify(MANIFEST)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('link');
  link.rel = 'manifest';
  link.href = url;
  document.head.appendChild(link);

  const swCode = `
    const CACHE = 'thq-it-v1';
    self.addEventListener('install', e => {
      self.skipWaiting();
      e.waitUntil(caches.open(CACHE).then(c => c.addAll([])));
    });
    self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
    self.addEventListener('fetch', e => {
      e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
      );
    });
  `;
  if ('serviceWorker' in navigator) {
    const swBlob = new Blob([swCode], { type: 'application/javascript' });
    const swUrl = URL.createObjectURL(swBlob);
    navigator.serviceWorker.register(swUrl).catch(() => {});
  }
})();

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('btnInstall');
  const ban = document.getElementById('installBanner');
  if (btn) btn.style.display = 'inline-flex';
  if (ban) ban.classList.add('show');
});
function installPWA() {
  if (!deferredPrompt) {
    alert('Install: use browser menu → "Add to Home Screen" or "Install app".');
    return;
  }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(() => { deferredPrompt = null; });
}

/* ===== PIN AUTH ===== */
const ADMIN_PIN = '786';
let pinBuffer = '';
let currentRole = null;

function getStaffPin() {
  try {
    const s = JSON.parse(localStorage.getItem('thq_it_settings') || '{}');
    return s.staffPin || '1234';
  } catch(e) { return '1234'; }
}

function pinPress(d) {
  if (pinBuffer.length >= 8) return;
  pinBuffer += d;
  updatePinDisplay();
  document.getElementById('loginError').textContent = '';
}
function pinClear() {
  pinBuffer = '';
  updatePinDisplay();
  document.getElementById('loginError').textContent = '';
}
function updatePinDisplay() {
  const el = document.getElementById('pinDisplay');
  if (!pinBuffer.length) el.textContent = '••••';
  else el.textContent = '•'.repeat(pinBuffer.length);
}
function pinSubmit() {
  const err = document.getElementById('loginError');
  if (!pinBuffer) { err.textContent = 'Enter PIN'; return; }
  if (pinBuffer === ADMIN_PIN) {
    loginSuccess('admin');
  } else if (pinBuffer === getStaffPin()) {
    loginSuccess('staff');
  } else {
    err.textContent = 'Incorrect PIN';
    pinBuffer = '';
    updatePinDisplay();
  }
}
function loginSuccess(role) {
  currentRole = role;
  sessionStorage.setItem('thq_role', role);
  sessionStorage.setItem('thq_auth', '1');
  pinBuffer = '';
  updatePinDisplay();
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('appShell').style.display = 'flex';
  applyRoleUI();
  loadData();
  renderDashboard();
  autoFetchOnLogin();
}
function logout() {
  sessionStorage.removeItem('thq_role');
  sessionStorage.removeItem('thq_auth');
  currentRole = null;
  stopScanner();
  document.getElementById('appShell').style.display = 'none';
  document.getElementById('loginScreen').classList.remove('hidden');
  pinClear();
}
function applyRoleUI() {
  const isAdmin = currentRole === 'admin';
  document.querySelectorAll('.admin-only').forEach(el => {
    el.style.display = isAdmin ? '' : 'none';
  });
  const roleLabel = isAdmin ? 'Admin' : 'Staff';
  document.getElementById('sessionRole').textContent = roleLabel;
  document.getElementById('topRoleBadge').innerHTML = isAdmin
    ? '<span class="badge badge-admin">Admin</span>'
    : '<span class="badge badge-staff">Staff</span>';
}
function checkSession() {
  if (sessionStorage.getItem('thq_auth') === '1') {
    currentRole = sessionStorage.getItem('thq_role') || 'staff';
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('appShell').style.display = 'flex';
    applyRoleUI();
    loadData();
    renderDashboard();
    autoFetchOnLogin();
  }
}
document.addEventListener('keydown', (e) => {
  if (document.getElementById('loginScreen').classList.contains('hidden')) return;
  if (e.key >= '0' && e.key <= '9') pinPress(e.key);
  else if (e.key === 'Enter') pinSubmit();
  else if (e.key === 'Backspace') {
    pinBuffer = pinBuffer.slice(0, -1);
    updatePinDisplay();
  }
});

/* ===== DATA ===== */
const SEED_ASSETS = [
  {id:"THQ-IT-LAP-001",type:"Lenovo Laptop",cat:"LAP",loc:"IT Office",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-LAP-002",type:"Lenovo Laptop",cat:"LAP",loc:"ER Counter",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-LAP-003",type:"Lenovo Laptop",cat:"LAP",loc:"Finance department (Epads, procurement)",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-LAP-004",type:"Lenovo Laptop",cat:"LAP",loc:"Admin Office",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-005",type:"Desktop PC",cat:"PC",loc:"IT Office",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-006",type:"Desktop PC",cat:"PC",loc:"Admin (Officer)",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-007",type:"Desktop PC",cat:"PC",loc:"HR Office",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-008",type:"Desktop PC",cat:"PC",loc:"Audit Office",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-009",type:"Desktop PC",cat:"PC",loc:"TB",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-010",type:"Desktop PC",cat:"PC",loc:"NCD",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-011",type:"Desktop PC",cat:"PC",loc:"OPD Counter",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-012",type:"Desktop PC",cat:"PC",loc:"MLC Room",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-PC-013",type:"Desktop PC",cat:"PC",loc:"Main Store",brand:"",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-014",type:"Lenovo Tablet",cat:"TAB",loc:"Reception male counter",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-015",type:"Lenovo Tablet",cat:"TAB",loc:"NCD",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-016",type:"Lenovo Tablet",cat:"TAB",loc:"Laboratory",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-017",type:"Lenovo Tablet",cat:"TAB",loc:"IPD",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-018",type:"Lenovo Tablet",cat:"TAB",loc:"Labour room",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-019",type:"Lenovo Tablet",cat:"TAB",loc:"Gyaene Department",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-020",type:"Lenovo Tablet",cat:"TAB",loc:"EPI",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-021",type:"Lenovo Tablet",cat:"TAB",loc:"Peads OPD (Nutrition)",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-022",type:"Lenovo Tablet",cat:"TAB",loc:"Emergency pharmacy",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-023",type:"Lenovo Tablet",cat:"TAB",loc:"Emergency Reception",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null},
  {id:"THQ-IT-TAB-024",type:"Lenovo Tablet",cat:"TAB",loc:"Hepatitis clinic",brand:"Lenovo",ip:"",mac:"",status:"Functional",cond:"Good",serial:"",userId:"",issue:"",checked:"",purchase:"",warranty:"",remarks:"",tag:"Yes",lat:null,lng:null,lastScan:null,locationLocked:false,lockedAt:null}
];
const SEED_USERS = [
  {id:"USR-001",name:"IT Incharge",desig:"IT Officer",dept:"IT Office",contact:"",cnic:"",email:"",type:"Regular",status:"Active",remarks:"Primary IT contact"},
  {id:"USR-002",name:"",desig:"Medical Superintendent",dept:"MS Office",contact:"",cnic:"",email:"",type:"Regular",status:"Active",remarks:""},
  {id:"USR-003",name:"",desig:"PA to MS",dept:"MS Office",contact:"",cnic:"",email:"",type:"Regular",status:"Active",remarks:""}
];

let assets=[], users=[], checkins=[], logs=[];
let html5QrCode=null, lastGps={lat:null,lng:null,accuracy:null};
let myPublicIP=null, myLocalIP=null, assignAssetIdx=-1;

const DEFAULT_SETTINGS = {hospital:'THQ Hospital Sillanwali',defaultStatus:'Functional',autoIP:'yes',autoGPS:'yes',offerLock:'yes',operator:'IT Staff',staffPin:'1234',serverUrl:'',autoFetch:'yes',syncInterval:'0',syncMode:'pull'};
function getSettings(){try{return Object.assign({},DEFAULT_SETTINGS,JSON.parse(localStorage.getItem('thq_it_settings')||'{}'))}catch(e){return Object.assign({},DEFAULT_SETTINGS)}}
function saveSettings(){
  const s={
    hospital:document.getElementById('set_hospital').value.trim()||DEFAULT_SETTINGS.hospital,
    defaultStatus:document.getElementById('set_defaultStatus').value,
    autoIP:document.getElementById('set_autoIP').value,
    autoGPS:document.getElementById('set_autoGPS').value,
    offerLock:document.getElementById('set_offerLock').value,
    operator:document.getElementById('set_operator').value.trim()||'IT Staff',
    staffPin:document.getElementById('set_staffPin').value.trim()||'1234',
    serverUrl:(document.getElementById('set_serverUrl')?.value||'').trim().replace(/\/$/,''),
    autoFetch:document.getElementById('set_autoFetch')?.value||'yes',
    syncInterval:document.getElementById('set_syncInterval')?.value||'0',
    syncMode:document.getElementById('set_syncMode')?.value||'pull'
  };
  localStorage.setItem('thq_it_settings',JSON.stringify(s));
  setupAutoSync();
  updateServerStatusUI();
  alert('Settings saved.');
}
function loadSettingsUI(){
  const s=getSettings(),el=id=>document.getElementById(id);
  if(!el('set_hospital'))return;
  el('set_hospital').value=s.hospital;el('set_defaultStatus').value=s.defaultStatus;
  el('set_autoIP').value=s.autoIP;el('set_autoGPS').value=s.autoGPS;el('set_offerLock').value=s.offerLock;
  el('set_operator').value=s.operator;el('set_staffPin').value=s.staffPin||'1234';
  if(el('set_serverUrl')) el('set_serverUrl').value=s.serverUrl||'';
  if(el('set_autoFetch')) el('set_autoFetch').value=s.autoFetch||'yes';
  if(el('set_syncInterval')) el('set_syncInterval').value=s.syncInterval||'0';
  if(el('set_syncMode')) el('set_syncMode').value=s.syncMode||'pull';
  fillIPTargetSelects();updateIPBox();updateServerStatusUI();
}

function loadData(){
  try{assets=JSON.parse(localStorage.getItem('thq_it_assets')||'null')||JSON.parse(JSON.stringify(SEED_ASSETS))}catch(e){assets=JSON.parse(JSON.stringify(SEED_ASSETS))}
  try{users=JSON.parse(localStorage.getItem('thq_it_users')||'null')||JSON.parse(JSON.stringify(SEED_USERS))}catch(e){users=JSON.parse(JSON.stringify(SEED_USERS))}
  try{checkins=JSON.parse(localStorage.getItem('thq_it_checkins')||'[]')}catch(e){checkins=[]}
  try{logs=JSON.parse(localStorage.getItem('thq_it_logs')||'[]')}catch(e){logs=[]}
  assets.forEach(a=>{
    if(a.userId===undefined)a.userId=a.assigned||'';
    if(a.lat===undefined)a.lat=null;if(a.lng===undefined)a.lng=null;if(a.lastScan===undefined)a.lastScan=null;
    if(a.locationLocked===undefined)a.locationLocked=false;if(a.lockedAt===undefined)a.lockedAt=null;
  });
  if(!localStorage.getItem('thq_it_assets'))saveData();
}
function saveData(){
  localStorage.setItem('thq_it_assets',JSON.stringify(assets));
  localStorage.setItem('thq_it_users',JSON.stringify(users));
  localStorage.setItem('thq_it_checkins',JSON.stringify(checkins.slice(0,400)));
  localStorage.setItem('thq_it_logs',JSON.stringify(logs.slice(0,400)));
}

function userById(id){return users.find(u=>u.id===id)}
function userLabel(id){if(!id)return '—';const u=userById(id);if(!u)return id;return (u.name?u.name+' ':'')+'('+u.id+')'}
function statusBadge(s){
  if(s==='Functional'||s==='Active')return '<span class="badge badge-ok">'+s+'</span>';
  if(s==='Non-Functional'||s==='Resigned')return '<span class="badge badge-bad">'+s+'</span>';
  if(s==='Under Repair'||s==='Transferred')return '<span class="badge badge-warn">'+s+'</span>';
  return '<span class="badge badge-muted">'+(s||'—')+'</span>';
}
function mapsLink(lat,lng){if(lat==null||lng==null)return '—';return `<a href="https://maps.google.com/?q=${lat},${lng}" target="_blank">${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}</a>`}

const TITLES={dashboard:'Dashboard',assets:'Asset register',users:'Users & staff',scan:'Scan & check-in',add:'Add / edit asset',labels:'Barcode labels',settings:'Settings'};
function showView(name){
  if(name!=='scan')stopScanner();
  closeSidebar();
  if(!['dashboard','assets','scan','labels'].includes(name) && currentRole!=='admin'){
    alert('Admin access required');
    return;
  }
  ['dashboard','assets','users','scan','add','labels','settings'].forEach(v=>{
    const el=document.getElementById('view-'+v);if(el)el.classList.toggle('hidden',v!==name);
    const nav=document.getElementById('nav-'+v);if(nav)nav.classList.toggle('active',v===name);
  });
  document.getElementById('pageTitle').textContent=TITLES[name]||name;
  if(name==='dashboard')renderDashboard();
  if(name==='assets')renderAssetTable();
  if(name==='users')renderUsers();
  if(name==='scan'){document.getElementById('scanResult').classList.add('hidden');const st=getSettings();if(st.autoGPS==='yes')getGpsOnce();if(st.autoIP==='yes')fetchMyIP();renderTodayScans()}
  if(name==='add'){document.getElementById('formTitle').textContent='Add new asset';document.getElementById('editIndex').value=-1;document.getElementById('assetForm').reset();document.getElementById('f_status').value=getSettings().defaultStatus||'Functional';document.getElementById('f_cond').value='Good';document.getElementById('f_tag').value='Yes';fillUserSelect('f_userId');fillLocList()}
  if(name==='labels')renderLabels();
  if(name==='settings'){loadSettingsUI();fillIPTargetSelects()}
}
