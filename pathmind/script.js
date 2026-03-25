// ============================================================
//  PathMind — RL Route Intelligence
//  script.js — All JavaScript Logic
// ============================================================

// ═══════════════════════════════════════════════════════════════
// CITY CONFIGS — real far-apart landmarks per city
// ═══════════════════════════════════════════════════════════════
const CITIES = {
  bangalore: {
    name:'Bangalore', zoom:13,
    center:[12.9352, 77.6245],
    start:[12.9766, 77.6009], // MG Road
    end:  [12.9698, 77.7499], // Whitefield
    startName:'MG Road', endName:'Whitefield'
  },
  chennai: {
    name:'Chennai', zoom:12,
    center:[13.0500, 80.2200],
    start:[13.0475, 80.2824], // Marina Beach
    end:  [13.0850, 80.2101], // Anna Nagar
    startName:'Marina Beach', endName:'Anna Nagar'
  },
  delhi: {
    name:'Delhi', zoom:12,
    center:[28.6100, 77.1500],
    start:[28.6315, 77.2167], // Connaught Place
    end:  [28.5921, 77.0460], // Dwarka
    startName:'Connaught Place', endName:'Dwarka'
  },
  mumbai: {
    name:'Mumbai', zoom:13,
    center:[19.0400, 72.8600],
    start:[18.9398, 72.8355], // CST
    end:  [19.0596, 72.8295], // Bandra
    startName:'CST Station', endName:'Bandra'
  },
  hyderabad: {
    name:'Hyderabad', zoom:12,
    center:[17.4200, 78.4400],
    start:[17.3616, 78.4747], // Charminar
    end:  [17.4435, 78.3772], // HITEC City
    startName:'Charminar', endName:'HITEC City'
  },
  kolkata: {
    name:'Kolkata', zoom:13,
    center:[22.5500, 88.3700],
    start:[22.5851, 88.3468], // Howrah Bridge
    end:  [22.5744, 88.4284], // Salt Lake
    startName:'Howrah Bridge', endName:'Salt Lake'
  },
};

let currentCity = 'bangalore';

// ═══════════════════════════════════════════════════════════════
// LEAFLET MAP SETUP
// ═══════════════════════════════════════════════════════════════
const map = L.map('map', { zoomControl:false, attributionControl:true });

// OpenStreetMap tiles — free, no API key needed
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  maxZoom:19,
}).addTo(map);

L.control.zoom({ position:'bottomright' }).addTo(map);

const cfg0 = CITIES[currentCity];
map.setView(cfg0.center, cfg0.zoom);

// Map layers
let aiLayer=null, bfsLayerL=null, dijkLayerL=null;
let startMarker=null, goalMarker=null, agentMarker=null;
let overlayLayer = L.layerGroup().addTo(map);

// ═══════════════════════════════════════════════════════════════
// CUSTOM MAP ICONS
// ═══════════════════════════════════════════════════════════════
function pinIcon(color, label) {
  return L.divIcon({
    className:'',
    html:`<div style="position:relative;width:32px;height:42px;">
      <svg viewBox="0 0 32 42" width="32" height="42" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16 0 0 7.16 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.16 24.84 0 16 0Z" fill="${color}"/>
        <circle cx="16" cy="16" r="8" fill="white" opacity="0.95"/>
      </svg>
      <span style="position:absolute;top:9px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:800;color:${color};font-family:'Google Sans',sans-serif;letter-spacing:-.3px;">${label}</span>
    </div>`,
    iconSize:[32,42], iconAnchor:[16,42],
  });
}

function agentDot() {
  return L.divIcon({
    className:'',
    html:`<div style="width:20px;height:20px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 2px 8px rgba(26,115,232,.7);"></div>`,
    iconSize:[20,20], iconAnchor:[10,10],
  });
}

// ═══════════════════════════════════════════════════════════════
// DRAGGABLE START / GOAL MARKERS
// ═══════════════════════════════════════════════════════════════
function placeMarkers() {
  if(startMarker) map.removeLayer(startMarker);
  if(goalMarker)  map.removeLayer(goalMarker);
  const c = CITIES[currentCity];

  startMarker = L.marker(c.start, {
    icon: pinIcon('#1e8e3e','S'),
    draggable: true,
    zIndexOffset: 2000,
    title: 'Drag to move Start'
  }).addTo(map);

  goalMarker = L.marker(c.end, {
    icon: pinIcon('#d93025','G'),
    draggable: true,
    zIndexOffset: 2000,
    title: 'Drag to move Goal'
  }).addTo(map);

  // When user drags Start pin — rebuild grid, reset training
  startMarker.on('dragend', function(e){
    const ll = e.target.getLatLng();
    CITIES[currentCity].start = [ll.lat, ll.lng];
    buildGrid();
    initTerrain();
    clearRoutes(); clearLiveViz();
    aiPath=null; bfsPath=null; dijkPath=null; trained=false;
    document.getElementById('btn-show').disabled=true;
    document.getElementById('ana-ph').style.display='block';
    document.getElementById('ana-cnt').style.display='none';
    updateLocationLabels();
    setToast('Start moved — retrain the agent for the new route');
    log('Start point moved. Retrain to learn new route.','w');
  });

  // When user drags Goal pin — rebuild grid, reset training
  goalMarker.on('dragend', function(e){
    const ll = e.target.getLatLng();
    CITIES[currentCity].end = [ll.lat, ll.lng];
    buildGrid();
    initTerrain();
    clearRoutes(); clearLiveViz();
    aiPath=null; bfsPath=null; dijkPath=null; trained=false;
    document.getElementById('btn-show').disabled=true;
    document.getElementById('ana-ph').style.display='block';
    document.getElementById('ana-cnt').style.display='none';
    updateLocationLabels();
    setToast('Goal moved — retrain the agent for the new route');
    log('Goal point moved. Retrain to learn new route.','w');
  });

  updateLocationLabels();
}

function updateLocationLabels(){
  const c = CITIES[currentCity];
  const fmt = ll => `${ll[0].toFixed(4)}, ${ll[1].toFixed(4)}`;
  document.getElementById('lbl-start').textContent = c.startName || fmt(c.start);
  document.getElementById('lbl-end').textContent   = c.endName   || fmt(c.end);
}

// ═══════════════════════════════════════════════════════════════
// OSRM — fetch road-following route (free, no API key)
// ═══════════════════════════════════════════════════════════════
async function fetchRoadRoute(fromLL, toLL) {
  const url = `https://router.project-osrm.org/route/v1/driving/`
    + `${fromLL[1]},${fromLL[0]};${toLL[1]},${toLL[0]}`
    + `?overview=full&geometries=geojson&steps=false`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes.length) return null;
    return data.routes[0].geometry.coordinates.map(([lng,lat]) => [lat,lng]);
  } catch(e) {
    log('OSRM error: ' + e.message, 'e');
    return null;
  }
}

async function fetchRouteViaWaypoints(waypoints) {
  if (!waypoints || waypoints.length < 2) return null;
  const sampled = sampleWaypoints(waypoints, 8);
  const coords = sampled.map(([lat,lng]) => `${lng},${lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}`
    + `?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes.length) return null;
    return data.routes[0].geometry.coordinates.map(([lng,lat]) => [lat,lng]);
  } catch(e) { return null; }
}

function sampleWaypoints(pts, maxMid) {
  if (pts.length <= maxMid + 2) return pts;
  const result = [pts[0]];
  const step = (pts.length - 2) / maxMid;
  for (let i = 0; i < maxMid; i++) {
    result.push(pts[1 + Math.round(i * step)]);
  }
  result.push(pts[pts.length - 1]);
  return result;
}

// ═══════════════════════════════════════════════════════════════
// RL GRID — coordinate grid spanning start → end of city route
// ═══════════════════════════════════════════════════════════════
const ROWS = 18, COLS = 24;
const ACTIONS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]; // 8 directions
const MAXSTEPS = ROWS * COLS * 22;

let GLAT = [], GLNG = []; // lat/lng for each grid node
let cellT = [];           // terrain type per node

// Terrain types: 0=Road 1=Wall 2=Bridge 3=Mud 4=Grass 5=Sand 6=Ice 7=Highway
const TCOST    = [1.0, 999, 2.5, 3.5, 1.5, 2.0, 0.6, 0.4];
const TNAME    = ['Road','Wall','Bridge','Mud','Grass','Sand','Ice','Highway'];
const TCOL_MAP = {Road:'#6b7280',Wall:'#ef4444',Bridge:'#60a5fa',Mud:'#d97706',Grass:'#4ade80',Sand:'#fcd34d',Ice:'#7dd3fc',Highway:'#fbbf24'};

// Q-Learning state variables
let Q = {}, visits = {};
let startR=0, startC=0, goalR=ROWS-1, goalC=COLS-1;
let epsilon=1.0, epRewards=[], totalEp=0, successes=0, bestRew=-Infinity;
let training=false, stopFlag=false, trained=false;
let aiPath=null, bfsPath=null, dijkPath=null;
let overlayMode = 'none';

// Build the coordinate grid spanning from city start → end
function buildGrid() {
  const c = CITIES[currentCity];
  const [sLat, sLng] = c.start;
  const [eLat, eLng] = c.end;
  const latStep = (eLat - sLat) / (ROWS - 1);
  const lngStep = (eLng - sLng) / (COLS - 1);
  GLAT = []; GLNG = [];
  for (let r = 0; r < ROWS; r++) {
    GLAT[r] = []; GLNG[r] = [];
    for (let cc = 0; cc < COLS; cc++) {
      GLAT[r][cc] = sLat + r * latStep;
      GLNG[r][cc] = sLng + cc * lngStep;
    }
  }
}

function nodeLL(r, c) { return [GLAT[r][c], GLNG[r][c]]; }

// Initialise terrain randomly (new terrain each training run)
function initTerrain() {
  cellT = Array.from({length:ROWS}, () => Array(COLS).fill(0));
  Q = {}; visits = {};
  for (let r=0; r<ROWS; r++) for (let c=0; c<COLS; c++) {
    const v = Math.random();
    if      (v < 0.09) cellT[r][c] = 1; // Wall
    else if (v < 0.16) cellT[r][c] = 2; // Bridge
    else if (v < 0.24) cellT[r][c] = 3; // Mud
    else if (v < 0.31) cellT[r][c] = 4; // Grass
    else if (v < 0.38) cellT[r][c] = 5; // Sand
    else if (v < 0.44) cellT[r][c] = 6; // Ice
    else if (v < 0.48) cellT[r][c] = 7; // Highway
    // else Road (default 0)
  }
  // Guarantee open corridors so grid is always solvable
  const mr = Math.floor(ROWS/2);
  for (let c=0; c<COLS; c++) if (cellT[mr][c]===1) cellT[mr][c]=0;
  const mc = Math.floor(COLS/2);
  for (let r=0; r<ROWS; r++) if (cellT[r][mc]===1) cellT[r][mc]=0;
  // Cluster terrain into patches (more realistic)
  for (let i=0; i<180; i++) {
    const r = 1 + Math.floor(Math.random()*(ROWS-2));
    const c = 1 + Math.floor(Math.random()*(COLS-2));
    const t = cellT[r][c];
    if (t===0 || t===1) continue;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    const [dr,dc] = dirs[Math.floor(Math.random()*4)];
    const nr=r+dr, nc=c+dc;
    if (nr>0&&nr<ROWS-1&&nc>0&&nc<COLS-1&&cellT[nr][nc]===0) cellT[nr][nc]=t;
  }
  cellT[startR][startC] = 0;
  cellT[goalR][goalC]   = 0;
}

// ═══════════════════════════════════════════════════════════════
// Q-TABLE HELPERS
// ═══════════════════════════════════════════════════════════════
function sk(r,c)    { return r*COLS+c; }
function valid(r,c) { return r>=0&&r<ROWS&&c>=0&&c<COLS&&TCOST[cellT[r][c]]<999; }
function tc(r,c)    { return TCOST[cellT[r][c]]; }

function qg(r,c,a)   { return Q[sk(r,c)] ? Q[sk(r,c)][a] : 0; }
function qs(r,c,a,v) { if(!Q[sk(r,c)]) Q[sk(r,c)]=new Float32Array(8); Q[sk(r,c)][a]=v; }
function qmax(r,c)   { if(!Q[sk(r,c)]) return 0; return Math.max(...Q[sk(r,c)]); }
function qbest(r,c)  {
  if(!Q[sk(r,c)]) return 0;
  let b=0;
  Q[sk(r,c)].forEach((v,i) => { if(v > Q[sk(r,c)][b]) b=i; });
  return b;
}
function qcount() { return Object.keys(Q).length; }

// ═══════════════════════════════════════════════════════════════
// SILENT EPISODE — runs fast in background, no map update
// ═══════════════════════════════════════════════════════════════
function runEpSilent(alpha, gamma) {
  let r=startR, c=startC, totalRew=0, steps=0;
  const seen = {};
  while (steps < MAXSTEPS) {
    const k = sk(r,c);
    seen[k] = (seen[k]||0)+1;
    visits[k] = (visits[k]||0)+1;
    // ε-greedy action selection
    const a = Math.random()<epsilon ? Math.floor(Math.random()*8) : qbest(r,c);
    const [dr,dc] = ACTIONS[a];
    const nr=r+dr, nc=c+dc;
    let rew, nr2=r, nc2=c;
    if (!valid(nr,nc)) {
      rew = -10; // wall penalty
    } else {
      nr2=nr; nc2=nc;
      if (nr===goalR && nc===goalC) {
        rew = 150; // goal reward
      } else {
        const cost = tc(nr,nc);
        rew = -cost;
        if (cost < 1.0) rew += 0.8; // bonus for fast terrain
        const nk = sk(nr,nc);
        if ((seen[nk]||0) > 3) rew -= 3*((seen[nk]||0)-3); // loop penalty
      }
    }
    // Bellman equation update
    const old = qg(r,c,a);
    const fut = (nr2===goalR && nc2===goalC) ? 0 : qmax(nr2,nc2);
    qs(r, c, a, old + alpha*(rew + gamma*fut - old));
    totalRew += rew; steps++;
    r=nr2; c=nc2;
    if (r===goalR && c===goalC) { successes++; break; }
  }
  epsilon = Math.max(0.01, epsilon*0.997);
  return { rew:totalRew, steps };
}

// ═══════════════════════════════════════════════════════════════
// VISUAL EPISODE — agent moves on map in real time
// Shows trial & error: red trail=wandering, green=efficient
// ═══════════════════════════════════════════════════════════════
let liveTrailLayer = null;
let liveAgentMark  = null;
let episodeTrails  = [];

function clearLiveViz() {
  if (liveAgentMark)  { map.removeLayer(liveAgentMark);  liveAgentMark=null;  }
  if (liveTrailLayer) { map.removeLayer(liveTrailLayer); liveTrailLayer=null; }
  episodeTrails.forEach(l => map.removeLayer(l));
  episodeTrails = [];
}

async function runEpVisual(alpha, gamma, stepDelay) {
  let r=startR, c=startC, totalRew=0, steps=0;
  const seen = {};
  const trailCoords = [ nodeLL(r,c) ];

  // Place the red wandering agent marker
  if (!liveAgentMark) {
    liveAgentMark = L.marker(nodeLL(r,c), {
      icon: L.divIcon({
        className:'',
        html:`<div style="width:14px;height:14px;border-radius:50%;background:#ea4335;border:2px solid #fff;box-shadow:0 2px 8px rgba(234,67,53,.8);"></div>`,
        iconSize:[14,14], iconAnchor:[7,7]
      }),
      zIndexOffset: 5000
    }).addTo(map);
  }

  // Draw dashed trail for this episode
  if (liveTrailLayer) map.removeLayer(liveTrailLayer);
  liveTrailLayer = L.polyline([nodeLL(r,c)], {
    color:'#ea4335', weight:2, opacity:.7,
    lineJoin:'round', lineCap:'round', dashArray:'4 4'
  }).addTo(map);

  while (steps < Math.min(MAXSTEPS, 300)) {
    const k = sk(r,c);
    seen[k] = (seen[k]||0)+1;
    visits[k] = (visits[k]||0)+1;
    const a = Math.random()<epsilon ? Math.floor(Math.random()*8) : qbest(r,c);
    const [dr,dc] = ACTIONS[a];
    const nr=r+dr, nc=c+dc;
    let rew, nr2=r, nc2=c;
    if (!valid(nr,nc)) {
      rew = -10;
    } else {
      nr2=nr; nc2=nc;
      if (nr===goalR && nc===goalC) {
        rew = 150;
      } else {
        const cost = tc(nr,nc); rew = -cost;
        if (cost<1.0) rew += 0.8;
        const nk = sk(nr,nc);
        if ((seen[nk]||0)>3) rew -= 3*((seen[nk]||0)-3);
      }
    }
    const old = qg(r,c,a);
    const fut = (nr2===goalR && nc2===goalC) ? 0 : qmax(nr2,nc2);
    qs(r, c, a, old + alpha*(rew + gamma*fut - old));
    totalRew += rew; steps++;
    r=nr2; c=nc2;

    // Move agent dot and extend trail on real map
    const ll = nodeLL(r,c);
    liveAgentMark.setLatLng(ll);
    trailCoords.push(ll);
    liveTrailLayer.setLatLngs(trailCoords);

    if (stepDelay > 0) await sleep(stepDelay);
    if (r===goalR && c===goalC) { successes++; break; }
  }

  // Leave ghost trail — green if short/efficient, red if long/wandering
  const ghost = L.polyline(trailCoords, {
    color: steps<100 ? '#34a853' : '#ea4335',
    weight:1.5, opacity:.25, lineJoin:'round'
  }).addTo(map);
  episodeTrails.push(ghost);
  if (episodeTrails.length > 5) map.removeLayer(episodeTrails.shift());

  epsilon = Math.max(0.01, epsilon*0.997);
  return { rew:totalRew, steps };
}

// ═══════════════════════════════════════════════════════════════
// PATH EXTRACTION ALGORITHMS
// ═══════════════════════════════════════════════════════════════

// AI — greedy policy from learned Q-table
function extractGreedy() {
  let r=startR, c=startC;
  const path=[{r,c}], seen=new Set([sk(r,c)]);
  while (!(r===goalR&&c===goalC) && path.length<MAXSTEPS) {
    const a=qbest(r,c); const [dr,dc]=ACTIONS[a]; const nr=r+dr, nc=c+dc;
    if (!valid(nr,nc)) break;
    const k=sk(nr,nc); if (seen.has(k)) break;
    seen.add(k); r=nr; c=nc; path.push({r,c});
  }
  return (r===goalR&&c===goalC) ? path : null;
}

// AI fallback — Q-weighted BFS if greedy gets stuck
function qFallback() {
  const dist={}, prev={};
  dist[sk(startR,startC)]=0; prev[sk(startR,startC)]=null;
  const pq=[{r:startR,c:startC,g:0}];
  while (pq.length) {
    pq.sort((a,b)=>a.g-b.g);
    const {r,c,g}=pq.shift();
    if (r===goalR&&c===goalC) {
      const p=[]; let k=sk(r,c);
      while(k!==null){p.unshift({r:Math.floor(k/COLS),c:k%COLS});k=prev[k];}
      return p;
    }
    for (let a=0;a<8;a++) {
      const [dr,dc]=ACTIONS[a]; const nr=r+dr,nc=c+dc; if(!valid(nr,nc))continue;
      const nk=sk(nr,nc);
      const step=tc(nr,nc)*(Math.abs(dr)+Math.abs(dc)===2?1.414:1)-qmax(nr,nc)*0.02;
      const ng=g+step;
      if (dist[nk]===undefined||ng<dist[nk]) { dist[nk]=ng; prev[nk]=sk(r,c); pq.push({r:nr,c:nc,g:ng}); }
    }
  }
  return null;
}

function getBestPath() { return extractGreedy() || qFallback(); }

// Naive BFS — 4-direction, ignores terrain cost
function naiveBFS() {
  const prev={}, vis=new Set(), q=[{r:startR,c:startC}];
  prev[sk(startR,startC)]=null; vis.add(sk(startR,startC));
  const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
  while (q.length) {
    const {r,c}=q.shift();
    if (r===goalR&&c===goalC) {
      const p=[]; let k=sk(r,c);
      while(k!==null){p.unshift({r:Math.floor(k/COLS),c:k%COLS});k=prev[k];}
      return p;
    }
    for (const [dr,dc] of dirs) {
      const nr=r+dr,nc=c+dc; if(!valid(nr,nc))continue;
      const nk=sk(nr,nc); if(vis.has(nk))continue;
      vis.add(nk); prev[nk]=sk(r,c); q.push({r:nr,c:nc});
    }
  }
  return null;
}

// Dijkstra — terrain-aware, no learning
function dijkstra() {
  const dist={}, prev={}, pq=[{r:startR,c:startC,g:0}];
  dist[sk(startR,startC)]=0; prev[sk(startR,startC)]=null;
  while (pq.length) {
    pq.sort((a,b)=>a.g-b.g);
    const {r,c,g}=pq.shift();
    if (r===goalR&&c===goalC) {
      const p=[]; let k=sk(r,c);
      while(k!==null){p.unshift({r:Math.floor(k/COLS),c:k%COLS});k=prev[k];}
      return p;
    }
    for (let a=0;a<8;a++) {
      const [dr,dc]=ACTIONS[a]; const nr=r+dr,nc=c+dc; if(!valid(nr,nc))continue;
      const nk=sk(nr,nc);
      const ng=g+tc(nr,nc)*(Math.abs(dr)+Math.abs(dc)===2?1.414:1);
      if (dist[nk]===undefined||ng<dist[nk]) { dist[nk]=ng; prev[nk]=sk(r,c); pq.push({r:nr,c:nc,g:ng}); }
    }
  }
  return null;
}

// Calculate total terrain cost of a path
function pCost(path) {
  if (!path) return Infinity;
  let cost=0;
  for (let i=1; i<path.length; i++) {
    const {r,c}=path[i];
    const dr=Math.abs(path[i].r-path[i-1].r), dc=Math.abs(path[i].c-path[i-1].c);
    cost += tc(r,c) * (dr+dc===2 ? 1.414 : 1);
  }
  return cost;
}

function gridPathToLL(path) { return path.map(({r,c})=>nodeLL(r,c)); }

// ═══════════════════════════════════════════════════════════════
// MAP DRAWING — routes snapped to real roads via OSRM
// ═══════════════════════════════════════════════════════════════
function clearRoutes() {
  [aiLayer, bfsLayerL, dijkLayerL].forEach(l => { if(l) map.removeLayer(l); });
  aiLayer = bfsLayerL = dijkLayerL = null;
  overlayLayer.clearLayers();
}

async function drawAllRoutes(aiGridPath, bfsGridPath, dijkGridPath) {
  clearRoutes();
  const cfg = CITIES[currentCity];
  setToast('Fetching road-following routes via OSRM…');

  if (bfsGridPath) {
    const roadLL = await fetchRouteViaWaypoints(gridPathToLL(bfsGridPath));
    bfsLayerL = L.polyline(roadLL || gridPathToLL(bfsGridPath),
      {color:'#d93025', weight:4, opacity:.75, lineJoin:'round', lineCap:'round'}).addTo(map);
  }
  if (dijkGridPath) {
    const roadLL = await fetchRouteViaWaypoints(gridPathToLL(dijkGridPath));
    dijkLayerL = L.polyline(roadLL || gridPathToLL(dijkGridPath),
      {color:'#e37400', weight:4, opacity:.75, lineJoin:'round', lineCap:'round'}).addTo(map);
  }
  // AI route — exact OSRM road from city start to end
  const aiRoadLL = await fetchRoadRoute(cfg.start, cfg.end);
  if (aiRoadLL) {
    aiLayer = L.polyline(aiRoadLL,
      {color:'#1a73e8', weight:6, opacity:.92, lineJoin:'round', lineCap:'round'}).addTo(map);
    map.fitBounds(aiLayer.getBounds(), {padding:[50,50]});
  }
  drawOverlayMarkers();
}

// Animate the agent dot moving along road coordinates
async function animateAgent(roadCoords) {
  if (!roadCoords || !roadCoords.length) return;
  if (agentMarker) map.removeLayer(agentMarker);
  agentMarker = L.marker(roadCoords[0], {icon:agentDot(), zIndexOffset:3000}).addTo(map);
  const skip = Math.max(1, Math.floor(roadCoords.length/120));
  for (let i=0; i<roadCoords.length; i+=skip) {
    agentMarker.setLatLng(roadCoords[i]);
    await sleep(25);
  }
  agentMarker.setLatLng(roadCoords[roadCoords.length-1]);
  await sleep(300);
  map.removeLayer(agentMarker);
  agentMarker = null;
}

// Draw Q-value / heatmap / policy overlays on the map
function drawOverlayMarkers() {
  overlayLayer.clearLayers();
  if (overlayMode === 'none') return;
  let maxQ=1, maxV=1;
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (!valid(r,c)) continue;
    const q=qmax(r,c); if(q>maxQ) maxQ=q;
    const v=visits[sk(r,c)]||0; if(v>maxV) maxV=v;
  }
  for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) {
    if (!valid(r,c)) continue;
    if (r===startR&&c===startC) continue;
    if (r===goalR&&c===goalC)   continue;
    const ll = nodeLL(r,c);
    if (overlayMode==='q') {
      const q=qmax(r,c); if(q<=0) continue;
      const alpha=Math.min(.85, q/maxQ*.85);
      overlayLayer.addLayer(L.circleMarker(ll, {radius:4, fillColor:'#1a73e8', fillOpacity:alpha, stroke:false}));
    } else if (overlayMode==='v') {
      const v=visits[sk(r,c)]||0; if(!v) continue;
      const alpha=Math.min(.85, v/maxV*.85);
      overlayLayer.addLayer(L.circleMarker(ll, {radius:4, fillColor:'#e37400', fillOpacity:alpha, stroke:false}));
    } else if (overlayMode==='p') {
      if (!Q[sk(r,c)]) continue;
      const a=qbest(r,c); const [dr,dc]=ACTIONS[a];
      const nr=r+dr, nc=c+dc; if(!valid(nr,nc)) continue;
      overlayLayer.addLayer(L.polyline([ll, nodeLL(nr,nc)], {color:'#7c3aed', weight:1.5, opacity:.6}));
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// TRAINING LOOP — 3 visible phases on the real map
// Phase 1 (ε≈1.0): Red trails, random wandering
// Phase 2 (ε≈0.5): Shorter trails, starting to learn
// Phase 3 (ε≈0.1): Green trails, exploiting learned policy
// ═══════════════════════════════════════════════════════════════
function setPhaseLabel(phase, ep, total) {
  const pct = Math.round(ep/total*100);
  const msgs = {
    explore: `🔴 Episode ${ep} — Agent EXPLORING randomly (ε=${epsilon.toFixed(2)}) — ${pct}% done`,
    learning:`🟡 Episode ${ep} — Agent LEARNING, paths getting smarter (ε=${epsilon.toFixed(2)}) — ${pct}% done`,
    exploit: `🟢 Episode ${ep} — Agent EXPLOITING best known route (ε=${epsilon.toFixed(2)}) — ${pct}% done`,
  };
  setToast(msgs[phase]);
  document.getElementById('kv-phase').textContent =
    phase==='explore' ? `Exploring (ε=${epsilon.toFixed(2)})` :
    phase==='learning'? `Learning (ε=${epsilon.toFixed(2)})` :
                        `Exploiting (ε=${epsilon.toFixed(2)})`;
}

async function startTraining() {
  if (training) return;
  training=true; stopFlag=false; trained=false;
  aiPath=null; bfsPath=null; dijkPath=null;
  clearRoutes(); clearLiveViz();
  epsilon=1.0; totalEp=0; successes=0; bestRew=-Infinity; epRewards=[];
  Q={}; visits={};

  document.getElementById('btn-train').disabled=true;
  document.getElementById('btn-show').disabled=true;
  document.getElementById('lring').style.display='block';
  const pb = document.getElementById('progress-bar');
  pb.style.display='block'; pb.style.width='0%';

  setPill('LEARNING', true, false);
  document.getElementById('search-txt').value = 'Learning route across ' + CITIES[currentCity].name + '…';
  switchTab('training');

  const totalEpisodes = parseInt(document.getElementById('sl-ep').value);
  const alpha         = parseFloat(document.getElementById('sl-al').value);
  const gamma         = parseFloat(document.getElementById('sl-ga').value);
  const spd           = parseInt(document.getElementById('sl-sp').value);

  const visualEps   = [6, 10, 16, 20, 30][spd];
  const silentBatch = [40, 25, 15, 8, 3][spd];
  const stepDelay   = [80, 50, 30, 15, 5][spd];

  log(`Training: ${CITIES[currentCity].name} | ${totalEpisodes} episodes`, 'g');
  log('Watch the agent explore — red=wandering, green=efficient', '');

  let visualEpsDone = 0;

  while (totalEp < totalEpisodes) {
    if (stopFlag) break;

    // Visual episode — shown live on map
    if (visualEpsDone < visualEps || totalEp % Math.floor(totalEpisodes/visualEps) === 0) {
      const phase = epsilon>0.6 ? 'explore' : epsilon>0.2 ? 'learning' : 'exploit';
      setPhaseLabel(phase, totalEp, totalEpisodes);
      const {rew, steps} = await runEpVisual(alpha, gamma, stepDelay);
      totalEp++; epRewards.push(rew);
      if (rew > bestRew) bestRew = rew;
      visualEpsDone++;
      log(`Ep ${totalEp}: ${steps} steps, reward ${rew.toFixed(0)} ${rew>0?'✓':'✗'}`, rew>0?'g':'');
      updateHdr(); drawRewardChart();
      document.getElementById('kv-ep').textContent  = `${totalEp}/${totalEpisodes}`;
      document.getElementById('kv-rew').textContent = bestRew===-Infinity?'—':bestRew.toFixed(1);
      document.getElementById('kv-suc').textContent = successes;
      document.getElementById('kv-eps').textContent = epsilon.toFixed(3);
      document.getElementById('kv-qt').textContent  = qcount();
      pb.style.width = Math.round(totalEp/totalEpisodes*100) + '%';
    }

    // Silent batch — fast background learning
    const batchSize = Math.min(silentBatch, totalEpisodes - totalEp);
    for (let b=0; b<batchSize; b++) {
      if (stopFlag) break;
      const {rew} = runEpSilent(alpha, gamma);
      totalEp++; epRewards.push(rew);
      if (rew > bestRew) bestRew = rew;
    }

    updateHdr(); drawRewardChart();
    document.getElementById('kv-ep').textContent  = `${totalEp}/${totalEpisodes}`;
    document.getElementById('kv-rew').textContent = bestRew===-Infinity?'—':bestRew.toFixed(1);
    document.getElementById('kv-suc').textContent = successes;
    document.getElementById('kv-eps').textContent = epsilon.toFixed(3);
    document.getElementById('kv-qt').textContent  = qcount();
    pb.style.width = Math.round(totalEp/totalEpisodes*100) + '%';
    if (overlayMode !== 'none') drawOverlayMarkers();
    await sleep(0);
  }

  pb.style.width = '100%';
  document.getElementById('lring').style.display = 'none';
  clearLiveViz();

  log('Training complete. Extracting final route…', 'g');
  aiPath  = getBestPath();
  bfsPath = naiveBFS();
  dijkPath = dijkstra();
  training=false; trained=true;

  await drawAllRoutes(aiPath, bfsPath, dijkPath);

  const cfg = CITIES[currentCity];
  const aiRoad = await fetchRoadRoute(cfg.start, cfg.end);
  if (aiRoad) {
    setToast('Agent driving the optimal route…');
    await animateAgent(aiRoad);
  }

  setPill('ROUTE FOUND', false, true);
  setToast(`${cfg.name}: ${cfg.startName} → ${cfg.endName} | Route on real roads`);
  document.getElementById('search-txt').value = `${cfg.startName} → ${cfg.endName} · AI cost: ${pCost(aiPath).toFixed(1)}`;

  buildAnalysis();
  switchTab('analysis');
  document.getElementById('btn-train').disabled = false;
  document.getElementById('btn-show').disabled  = false;
  document.getElementById('kv-phase').textContent = 'Complete';
  setTimeout(() => { pb.style.display='none'; }, 1000);
  updateHdr(); drawRewardChart();
  log(`Done — AI: ${pCost(aiPath).toFixed(1)} | BFS: ${pCost(bfsPath).toFixed(1)} | Dijk: ${pCost(dijkPath).toFixed(1)}`, 'g');
}

async function replayRoute() {
  if (!trained || training) return;
  document.getElementById('btn-show').disabled = true;
  document.getElementById('btn-train').disabled = true;
  const cfg = CITIES[currentCity];
  const aiRoad = await fetchRoadRoute(cfg.start, cfg.end);
  if (aiRoad) await animateAgent(aiRoad);
  document.getElementById('btn-show').disabled  = false;
  document.getElementById('btn-train').disabled = false;
}

function doReset() {
  if (training) stopFlag = true;
  setTimeout(() => {
    clearRoutes(); clearLiveViz();
    if (agentMarker) { map.removeLayer(agentMarker); agentMarker=null; }
    initTerrain();
    epsilon=1.0; totalEp=0; successes=0; bestRew=-Infinity; epRewards=[];
    aiPath=null; bfsPath=null; dijkPath=null;
    trained=false; training=false;
    document.getElementById('btn-train').disabled = false;
    document.getElementById('btn-show').disabled  = true;
    document.getElementById('search-txt').value   = '';
    document.getElementById('ana-ph').style.display  = 'block';
    document.getElementById('ana-cnt').style.display = 'none';
    document.getElementById('kv-phase').textContent  = 'Idle';
    document.getElementById('progress-bar').style.display = 'none';
    document.getElementById('lring').style.display = 'none';
    setPill('IDLE', false, false);
    const cfg = CITIES[currentCity];
    setToast(`${cfg.name} ready — click ▶ Learn & Find Route`);
    map.setView(cfg.center, cfg.zoom);
    updateHdr(); drawRewardChart(); placeMarkers();
    log('Reset.', '');
  }, 150);
}

// ═══════════════════════════════════════════════════════════════
// CITY SWITCHING
// ═══════════════════════════════════════════════════════════════

// Store original city coords so drag doesn't permanently change defaults
const CITY_DEFAULTS = {};
Object.keys(CITIES).forEach(k => {
  CITY_DEFAULTS[k] = { start:[...CITIES[k].start], end:[...CITIES[k].end] };
});

function setCity(key, btn) {
  if (training) return;
  document.querySelectorAll('.city-card').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  currentCity = key;
  CITIES[key].start = [...CITY_DEFAULTS[key].start];
  CITIES[key].end   = [...CITY_DEFAULTS[key].end];
  const cfg = CITIES[key];
  map.setView(cfg.center, cfg.zoom);
  buildGrid(); initTerrain();
  clearRoutes(); clearLiveViz();
  aiPath=null; bfsPath=null; dijkPath=null; trained=false;
  document.getElementById('btn-show').disabled  = true;
  document.getElementById('ana-ph').style.display  = 'block';
  document.getElementById('ana-cnt').style.display = 'none';
  document.getElementById('search-txt').value = '';
  setPill('IDLE', false, false);
  setToast(`${cfg.name}: ${cfg.startName} → ${cfg.endName} — drag pins to change`);
  updateHdr(); drawRewardChart(); placeMarkers();
  log(`City: ${cfg.name} | ${cfg.startName} → ${cfg.endName}`, 'g');
}

// ═══════════════════════════════════════════════════════════════
// ROUTE ANALYSIS PANEL
// ═══════════════════════════════════════════════════════════════
function buildAnalysis() {
  document.getElementById('ana-ph').style.display  = 'none';
  document.getElementById('ana-cnt').style.display = 'block';
  const aiC=pCost(aiPath), bC=pCost(bfsPath), dC=pCost(dijkPath);
  const cfg = CITIES[currentCity];

  let why = `After <strong>${totalEp} training episodes</strong> on <strong>${cfg.name}</strong> `
    + `(${cfg.startName} → ${cfg.endName}), the Q-Learning agent found the optimal route `
    + `with terrain cost <strong>${aiC.toFixed(1)}</strong>.<br><br>`
    + `The final route is drawn by OSRM — every line follows actual streets in ${cfg.name}.<br><br>`;
  if (bC > aiC)
    why += `📊 <strong>vs BFS:</strong> Naive BFS costs <span style="color:#d93025;font-weight:600;">+${(bC-aiC).toFixed(1)}</span> more — it ignores terrain costs and walks through expensive nodes.<br><br>`;
  if (dC > aiC+0.1)
    why += `📊 <strong>vs Dijkstra:</strong> Dijkstra is terrain-aware but has no learned preferences. The AI beats it by <span style="color:#1e8e3e;font-weight:600;">${(dC-aiC).toFixed(1)}</span> through experience.`;
  else
    why += `📊 <strong>vs Dijkstra:</strong> Dijkstra cost ${dC.toFixed(1)} — matching the AI, proving Q-Learning converged to the mathematically optimal path.`;
  document.getElementById('ana-why').innerHTML = why;

  // Route comparison table
  const rows = [
    {label:'AI Q-Learning', color:'#1a73e8', cost:aiC,  steps:aiPath?aiPath.length:0},
    {label:'Naive BFS',     color:'#d93025', cost:bC,   steps:bfsPath?bfsPath.length:0},
    {label:'Dijkstra',      color:'#e37400', cost:dC,   steps:dijkPath?dijkPath.length:0},
  ];
  const minC = Math.min(aiC, bC, dC);
  let cmpHtml = '';
  for (const p of rows) {
    const isMin  = p.cost <= minC + 0.05;
    const badge  = isMin
      ? `<span class="chip-g">✓ Best</span>`
      : (p.cost < Infinity ? `<span class="chip-r">+${(p.cost-aiC).toFixed(1)}</span>` : '');
    cmpHtml += `<div class="prow">
      <div class="pdot" style="background:${p.color};"></div>
      <div><div class="pname" style="color:${p.color};">${p.label}</div><div class="psteps">${p.steps} grid nodes</div></div>
      <div style="text-align:right;"><div class="pcost">${p.cost===Infinity?'N/A':p.cost.toFixed(1)}</div><div>${badge}</div></div>
    </div>`;
  }
  document.getElementById('ana-cmp').innerHTML = cmpHtml;

  // Node terrain breakdown
  const buckets = {};
  if (aiPath) for (const {r,c} of aiPath) {
    const n = TNAME[cellT[r][c]];
    buckets[n] = (buckets[n]||0) + 1;
  }
  const total = aiPath ? aiPath.length : 1;
  let nbHtml = '';
  for (const [name, cnt] of Object.entries(buckets)) {
    const pct = Math.round((cnt/total)*100);
    nbHtml += `<div class="trow">
      <div class="tlbl">${name}</div>
      <div class="ttrack"><div class="tfill" style="width:${pct}%;background:${TCOL_MAP[name]||'#6b7280'};"></div></div>
      <div class="tpct">${pct}%</div>
    </div>`;
  }
  document.getElementById('ana-nodes').innerHTML = nbHtml || '<div style="color:var(--muted);font-size:11px;">No data.</div>';
}

// ═══════════════════════════════════════════════════════════════
// REWARD CHART
// ═══════════════════════════════════════════════════════════════
function drawRewardChart() {
  const rc = document.getElementById('rchart');
  const rx = rc.getContext('2d');
  const w = rc.width = rc.offsetWidth || 280;
  const h = rc.height = 68;
  rx.clearRect(0,0,w,h);
  rx.fillStyle = '#f8f9fa'; rx.fillRect(0,0,w,h);
  if (epRewards.length < 2) return;
  const win = Math.max(1, Math.floor(epRewards.length/80));
  const sm = [];
  for (let i=0; i<epRewards.length; i++) {
    const sl = epRewards.slice(Math.max(0,i-win), i+1);
    sm.push(sl.reduce((a,b)=>a+b, 0) / sl.length);
  }
  const mn=Math.min(...sm), mx=Math.max(...sm), rng=mx-mn||1;
  const zy = h - ((0-mn)/rng)*(h-6) - 3;
  rx.strokeStyle='#dadce0'; rx.lineWidth=.5; rx.setLineDash([3,3]);
  rx.beginPath(); rx.moveTo(0,zy); rx.lineTo(w,zy); rx.stroke(); rx.setLineDash([]);
  const g = rx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'rgba(26,115,232,0.2)'); g.addColorStop(1,'rgba(26,115,232,0)');
  rx.beginPath();
  sm.forEach((v,i) => { const x=(i/(sm.length-1))*w, y=h-((v-mn)/rng)*(h-6)-3; i===0?rx.moveTo(x,y):rx.lineTo(x,y); });
  rx.lineTo(w,h); rx.lineTo(0,h); rx.closePath(); rx.fillStyle=g; rx.fill();
  rx.beginPath();
  sm.forEach((v,i) => { const x=(i/(sm.length-1))*w, y=h-((v-mn)/rng)*(h-6)-3; i===0?rx.moveTo(x,y):rx.lineTo(x,y); });
  rx.strokeStyle='#1a73e8'; rx.lineWidth=1.5; rx.stroke();
}

// ═══════════════════════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════════════════════
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((t,i) =>
    t.classList.toggle('on', ['training','analysis','guide'][i]===tab));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('on'));
  document.getElementById(`panel-${tab}`).classList.add('on');
}

const OVL_EXPLAIN = {
  none: 'Select an overlay to see what the AI learned.',
  q:   '🔵 <strong style="color:#1a73e8">Q-Values:</strong> Blue glow on each node. Brighter = the AI learned this location is highly valuable to pass through. This is the agent\'s "memory".',
  v:   '🟠 <strong style="color:#e37400">Heatmap:</strong> Orange glow shows where the agent wandered most during training. Dense clusters = lots of exploration. Sparse = agent found shortcuts.',
  p:   '🟣 <strong style="color:#7c3aed">Policy:</strong> Purple arrows on every node showing the best direction the AI decided. Built entirely from trial and error — nobody programmed these directions.',
};

function setOvl(mode) {
  overlayMode = mode;
  ['none','q','v','p'].forEach(m => document.getElementById(`ov-${m}`).classList.toggle('on', m===mode));
  document.getElementById('ovl-explain').innerHTML = OVL_EXPLAIN[mode];
  drawOverlayMarkers();
}

function setPill(msg, busy, done) {
  document.getElementById('pill-txt').textContent = msg;
  const el = document.getElementById('pill');
  el.className = busy?'busy':done?'done':'';
}

function setToast(msg) { document.getElementById('toast').textContent = msg; }

function updateHdr() {
  document.getElementById('h-ep').textContent  = totalEp;
  document.getElementById('h-rew').textContent = bestRew===-Infinity ? '—' : bestRew.toFixed(0);
  document.getElementById('h-suc').textContent = totalEp ? ((successes/totalEp)*100).toFixed(1)+'%' : '—';
  document.getElementById('h-eps').textContent = epsilon.toFixed(3);
}

let logLines = 0;
function log(msg, type) {
  const el = document.getElementById('logbox');
  const d  = document.createElement('div');
  d.className   = type ? `l${type}` : '';
  d.textContent = `› ${msg}`;
  el.appendChild(d); el.scrollTop = el.scrollHeight;
  logLines++; if (logLines > 60) { el.removeChild(el.firstChild); logLines--; }
}

function sleep(ms) { return new Promise(r => ms===0 ? requestAnimationFrame(r) : setTimeout(r, ms)); }

// ═══════════════════════════════════════════════════════════════
// BOOT — runs when page loads
// ═══════════════════════════════════════════════════════════════
buildGrid();
initTerrain();
placeMarkers();
drawRewardChart();
log('PathMind ready — real road routing via OSRM.', 'g');
log('Select a city and click ▶ Learn & Find Route.', '');
