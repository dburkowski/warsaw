/* Warsaw Memory Walks — Leaflet map.
   Markers encode two things at once:
     colour = theme (ghetto / uprising / prewar)
     form   = status (survives=solid, fragment=hollow ring, gone=dashed hollow)
   Data lives in data/walks.geojson. Add features there; no code changes needed. */

const THEME = { ghetto: "#8c3b4a", uprising: "#3f5e78", prewar: "#7a6a3c" };
const INK = "#211f1c";

const map = L.map("map", { zoomControl: true, scrollWheelZoom: true })
  .setView([52.2385, 20.9975], 14);

L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: "abcd",
  maxZoom: 20
}).addTo(map);

const stopLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);

let FEATURES = [];
let WALKS = {};

function markerStyle(theme, status) {
  const color = THEME[theme] || INK;
  const base = { radius: 8, color, weight: 2.5, fillColor: color };
  if (status === "survives") return { ...base, fillOpacity: 0.9 };
  if (status === "fragment") return { ...base, fillOpacity: 0.15 };
  return { ...base, fillOpacity: 0, dashArray: "3 4", opacity: 0.85 }; // gone
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, c =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function popupHtml(p) {
  const walkLabel = (WALKS[p.walk] && WALKS[p.walk].label) || p.walk || "";
  const img = p.then_photo
    ? `<img class="pop-img" src="${esc(p.then_photo)}" alt="Archive photo of ${esc(p.name)}" loading="lazy" />`
    : "";
  const link = p.source
    ? `<a class="pop-link" href="${esc(p.source)}" target="_blank" rel="noopener">Reference &rsaquo;</a>`
    : "";
  const statusTag = `<span class="tag status-${esc(p.status)}">${esc(p.status)}</span>`;
  return `
    <div class="pop">
      <div class="pop-order">${esc(walkLabel)}${p.order ? " · Stop " + esc(p.order) : ""}</div>
      <div class="pop-name">${esc(p.name)}</div>
      <div class="pop-tags"><span class="tag">${esc(p.theme)}</span>${statusTag}</div>
      ${img}
      <p class="pop-blurb">${esc(p.blurb)}</p>
      <p class="pop-date">${esc(p.date || "")}</p>
      ${link}
    </div>`;
}

function activeSet(cls) {
  return new Set(
    [...document.querySelectorAll("." + cls + ":checked")].map(i => i.value)
  );
}

function render() {
  stopLayer.clearLayers();
  routeLayer.clearLayers();

  const walkSel = document.getElementById("walk-select").value;
  const themes = activeSet("f-theme");
  const statuses = activeSet("f-status");
  const showRoutes = document.getElementById("f-routes").checked;

  const shown = FEATURES.filter(f => {
    const p = f.properties;
    if (walkSel !== "all" && p.walk !== walkSel) return false;
    if (!themes.has(p.theme)) return false;
    if (!statuses.has(p.status)) return false;
    return true;
  });

  // route lines: connect visible stops of each walk in order
  if (showRoutes) {
    const byWalk = {};
    shown.forEach(f => {
      const w = f.properties.walk;
      (byWalk[w] = byWalk[w] || []).push(f);
    });
    Object.entries(byWalk).forEach(([w, feats]) => {
      if (feats.length < 2) return;
      const pts = feats
        .slice()
        .sort((a, b) => (a.properties.order || 0) - (b.properties.order || 0))
        .map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);
      L.polyline(pts, {
        color: (WALKS[w] && WALKS[w].color) || INK,
        weight: 2,
        opacity: 0.5,
        dashArray: "1 6",
        lineCap: "round"
      }).addTo(routeLayer);
    });
  }

  // markers
  shown.forEach(f => {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;
    L.circleMarker([lat, lng], markerStyle(p.theme, p.status))
      .bindPopup(popupHtml(p), { maxWidth: 300 })
      .bindTooltip(p.name, { direction: "top", offset: [0, -6] })
      .addTo(stopLayer);
  });

  document.getElementById("count").textContent =
    shown.length + (shown.length === 1 ? " stop shown" : " stops shown");
}

fetch("data/walks.geojson")
  .then(r => {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  })
  .then(data => {
    FEATURES = data.features || [];
    WALKS = (data.metadata && data.metadata.walks) || {};
    document.getElementById("foot-count").textContent = FEATURES.length;
    render();
    const b = L.latLngBounds(
      FEATURES.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]])
    );
    if (b.isValid()) map.fitBounds(b, { padding: [50, 50] });
  })
  .catch(err => {
    document.getElementById("count").textContent =
      "Could not load data/walks.geojson — serve the folder over http (see README), not file://.";
    console.error("Load failed:", err);
  });

// wire controls
["change"].forEach(evt => {
  document.getElementById("walk-select").addEventListener(evt, render);
  document.querySelectorAll(".f-theme, .f-status, #f-routes")
    .forEach(el => el.addEventListener(evt, render));
});

// mobile panel
const app = document.getElementById("app");
document.getElementById("panel-toggle")
  .addEventListener("click", () => app.classList.toggle("panel-open"));
map.on("click", () => app.classList.remove("panel-open"));
