## Maps (extended)

This is a fork of [obsidianmd/obsidian-maps](https://github.com/obsidianmd/obsidian-maps) that adds a few options to the map view. It is kept as a small set of commits on top of upstream. It installs under the plugin ID `maps-extended`, so don't enable it alongside the official Maps plugin.

**Marker list** and **Extra marker list** read a note property holding several markers, so one note can put many markers on the map. Each item is either a short list or an object:

```yaml
mapmarkers:
  - [book-open, [41.1476, -8.6134], Livraria Bertrand]   # icon, [lat, lng], name, optional color
  - name: "[[Cockburn's]]"                              # a wikilink name links the popup title to that note
    coordinates: [41.1335, -8.6182]
    icon: wine
    color: "#8b1a3a"
```

Icons are [Lucide](https://lucide.dev/icons/) names; an unknown name falls back to the note's icon, or a plain dot. Hovering a marker shows its name as the popup title, and clicking opens the note it came from.

**Zoom formula** overrides the default zoom slider, and **Bounds** fits the map to `[[south, west], [north, east]]` (or `[south, west, north, east]`), overriding center and zoom. Both are formulas, so a view embedded in many notes can read them from the embedding note, e.g. `this.zoom` and `this.bounds`.

**Map theme**, in the plugin settings, chooses whether map backgrounds follow the Obsidian theme (the default) or are always light or always dark. Open maps restyle as soon as the setting changes.

To build, run `npm install` and `npm run build`, then copy `main.js`, `manifest.json` and `styles.css` into `.obsidian/plugins/maps-extended/`.

To pick up upstream changes:

```bash
git fetch upstream
git rebase upstream/master
git push --force-with-lease
```

---

Adds a [map layout](https://obsidian.md/help/bases/views/map) to [Obsidian Bases](https://obsidian.md/help/bases) so you can display notes as an interactive map view.

![Map view for Obsidian Bases](/images/map-view.png)

- Dynamically display markers that match your filters.
- Use marker icons and colors defined by properties.
- Load custom background tiles.
- Define default zoom options.

## Installation

1. Open **Settings → Community plugins**.
2. Select **Browse**, then search for **Maps**.
3. Select **Install**, then **Enable**.

## Usage

Add a coordinates property to each note you want to appear on the map. Both a text property and a list property work:

```yaml
location: 34.13956, -118.38710
```

```yaml
location:
  - 34.13956
  - -118.38710
```

Then open a base, add a view, and set its type to **Map**. In the view options, set **Marker coordinates** to your property. Markers appear for every note matching the view's filters, and update as those filters change.

The remaining view options let you set the center coordinates, default zoom, and zoom limits, and choose properties to drive each marker's icon and color.

### Backgrounds

Maps use [OpenFreeMap](https://openfreemap.org) tiles by default. To use different tiles, go to **Settings → Maps** and add a background with a tile URL or style URL. You can set a separate URL for dark mode.

See the [full documentation](https://obsidian.md/help/bases/views/map) on the Obsidian Help site for examples, tips, and troubleshooting.
