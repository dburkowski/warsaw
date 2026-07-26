# Warsaw Memory Walks

An interactive map of two on-foot routes through wartime Warsaw: the **Small Ghetto** (survivals and seams) and **Praga** (pre-war fabric that outlived the war). Built to grow — you add stops on site; the map redraws itself.

The map encodes two things at once:

- **Colour = theme** — ghetto (garnet), uprising (slate), pre-war (olive)
- **Form = what remains** — solid dot *survives*, hollow ring *fragment*, dashed hollow *gone, marked only*

## Run locally

The app fetches `data/walks.geojson`, so it must be served over http — opening `index.html` directly (`file://`) will fail on the data load.

```bash
cd warsaw-memory-walks
python3 -m http.server 8000
# open http://localhost:8000
```

## Deploy on GitHub Pages

1. Create a repo and push these files.
2. Settings → Pages → Source: `main` branch, `/ (root)`.
3. It serves at `https://<user>.github.io/<repo>/`. No build step; `.nojekyll` is included so nothing is stripped.

## Add or edit stops

Everything lives in `data/walks.geojson`. Copy a feature and edit it — no code changes. Coordinates are `[longitude, latitude]` (GeoJSON order — easy to swap by accident).

```json
{
  "type": "Feature",
  "geometry": { "type": "Point", "coordinates": [21.0000, 52.2400] },
  "properties": {
    "name": "Site name",
    "walk": "small-ghetto",       // small-ghetto | praga | (add your own in metadata.walks)
    "order": 8,                    // draw order along the route line
    "category": "stop",            // stop | tchorek | boundary
    "theme": "ghetto",             // ghetto | uprising | prewar
    "status": "survives",          // survives | fragment | gone
    "date": "1940",
    "blurb": "One or two sentences.",
    "place_id": null,              // optional Google place_id
    "source": "https://…",         // optional reference link
    "then_photo": null             // optional image URL; shows in the popup
  }
}
```

### Adding a new route

Add a key under `metadata.walks` with a `label` and `color`, then add an option to the `#walk-select` dropdown in `index.html`:

```json
"metadata": { "walks": {
  "uprising-srodmiescie": { "label": "Śródmieście — scars & captured buildings", "color": "#3f5e78" }
}}
```

### The collector threads

`category: "tchorek"` (Tchorek memorial plaques) and `category: "boundary"` (ghetto wall / border markers) are reserved for the two scavenger-hunt layers. They render like any stop today; add a category filter in `js/app.js` (`activeSet`/`render`) when you have enough of them to warrant a toggle.

## Files

```
index.html          structure, fonts, Leaflet CDN
css/style.css        palette, type, marker legend, responsive
js/app.js            data load, marker + route drawing, filters
data/walks.geojson   all content — edit this
.nojekyll            GitHub Pages: serve files as-is
```

## Credits

Basemap © OpenStreetMap contributors, © CARTO. Historical notes compiled from on-site memorial sources; verify specifics before publishing.
