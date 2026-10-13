// 山梨地域バスロケーション：リアルタイム表示のみ（PHP・ログ保存なし）
const API_BASE = "https://api.buskita.com";
const SITE_ID = 12;
const UPDATE_INTERVAL = 30000; // 30秒ごとに更新

const map = L.map("map").setView([35.6639, 138.5683], 12);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19, attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);
const busLayer = L.layerGroup().addTo(map);
const stopLayer = L.layerGroup().addTo(map);
const markers = {};
const vehicleMap = {};

async function loadVehicleMaster() {
  try {
    const r = await fetch("data/vehicle.csv");
    if (!r.ok) throw new Error("vehicle.csv HTTP " + r.status);
    const lines = (await r.text()).replace(/^\uFEFF/, "").trim().split(/\r?\n/);
    lines.slice(1).forEach(line => {
      const c = line.split(",");
      if (c.length < 9 || !c[0]) return;
      vehicleMap[c[0]] = {uid:c[0], fleetNo:c[1], plateNo:c[2], office:c[3],
        company:c[4], icon:c[5], enabled:c[6] === "1", carType:c[7], model:c[8]};
    });
  } catch(e) { console.warn("車両マスタ読込失敗", e); }
}

async function postApi(path, payload) {
  const response = await fetch(API_BASE + path, {
    method: "POST",
    headers: {"Content-Type":"application/json", "Accept":"application/json"},
    body: JSON.stringify(payload),
    cache: "no-store"
  });
  if (!response.ok) throw new Error(path + " HTTP " + response.status);
  return response.json();
}

async function loadBusData() {
  const status = document.getElementById("updateTime");
  status.textContent = "更新：取得中…";
  try {
    const data = await postApi("/get-buses", {siteId:SITE_ID});
    if (!Array.isArray(data.buses)) throw new Error("API応答に buses がありません");
    drawBuses(data.buses);
    document.getElementById("busCount").textContent = "表示車両数：" + Object.keys(markers).length + "台";
    status.textContent = "更新：" + new Date().toLocaleTimeString("ja-JP");
  } catch(e) {
    console.error("リアルタイムバス取得失敗", e);
    status.textContent = "取得失敗：APIのCORS設定・通信状況を確認してください";
  }
}

function drawBuses(buses) {
  busLayer.clearLayers();
  Object.keys(markers).forEach(k => delete markers[k]);
  buses.forEach(bus => {
    const pos = bus.position || {};
    const lat = Number(pos.latitude), lng = Number(pos.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const uid = String(bus.device_uid || "");
    const v = vehicleMap[uid] || null;
    if (v && !v.enabled) return;
    const fleetNo = v ? (v.fleetNo || "未登録") : "未登録";
    const plateNo = v ? (v.plateNo || "----") : "----";
    const iconFile = v && v.icon ? v.icon : "bus.png";
    const delay = formatDelay(bus.delayMinutes);
    const icon = L.divIcon({
      html:`<div class="bus-icon"><img src="img/${escapeAttr(iconFile)}"><div class="bus-number">${escapeHtml(fleetNo)}</div><div class="bus-delay">${escapeHtml(delay)}</div></div>`,
      className:"", iconSize:[60,60], iconAnchor:[30,30]
    });
    const marker = L.marker([lat,lng], {icon}).addTo(busLayer);
    const route = (bus.routeNames && (bus.routeNames["1"] || bus.routeNames[1])) || "不明";
    marker.bindPopup(`<b>${escapeHtml(fleetNo)}</b><br>ナンバー：${escapeHtml(plateNo)}<br>営業所：${escapeHtml(v ? v.office : "未登録")}<br>会社：${escapeHtml(v ? v.company : (bus.companyNo || "-"))}<br>路線：${escapeHtml(route)}<br>遅れ：${escapeHtml(delay)}<br>UID：${escapeHtml(uid)}`);
    markers[uid] = marker;
  });
}

function formatDelay(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "定刻";
  return n > 0 ? "+" + n + "分" : n + "分";
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function escapeAttr(value) { return String(value ?? "").replace(/[^a-zA-Z0-9_.-]/g, ""); }

document.getElementById("searchButton").addEventListener("click", searchBus);
document.getElementById("searchBox").addEventListener("keydown", e => {if(e.key === "Enter") searchBus();});
document.getElementById("clearButton").addEventListener("click", () => {
  document.getElementById("searchBox").value = "";
  map.setView([35.6639,138.5683],12);
  Object.values(markers).forEach(m => m.closePopup());
});
function searchBus() {
  const key = document.getElementById("searchBox").value.trim().toUpperCase();
  if (!key) return;
  const entry = Object.entries(vehicleMap).find(([uid,v]) =>
    String(v.fleetNo).toUpperCase() === key || String(v.plateNo).toUpperCase() === key);
  if (!entry) { alert("車両マスタに登録されていません。"); return; }
  const marker = markers[entry[0]];
  if (!marker) { alert("この車両は現在のリアルタイムデータにありません。"); return; }
  map.setView(marker.getLatLng(),17);
  marker.openPopup();
}

window.addEventListener("load", async () => {
  await loadVehicleMaster();
  await loadBusData();
  setInterval(loadBusData, UPDATE_INTERVAL);
});
