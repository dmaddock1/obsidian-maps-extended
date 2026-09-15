import { BasesEntry, BasesPropertyId } from 'obsidian';

/** Resolved view configuration driving how the map and its markers render. */
export interface MapConfig {
	coordinatesProp: BasesPropertyId | null;
	markerIconProp: BasesPropertyId | null;
	markerColorProp: BasesPropertyId | null;
	/** Note property holding a list of extra markers for each entry. */
	markerListProp: BasesPropertyId | null;
	/** A second marker list property, read alongside the first. */
	extraMarkerListProp: BasesPropertyId | null;
	mapHeight: number;
	defaultZoom: number;
	/** Zoom from the zoom formula, overriding the default zoom slider when set. */
	zoomOverride: number | null;
	/** [[south, west], [north, east]] from the bounds formula, overriding center and zoom. */
	bounds: [[number, number], [number, number]] | null;
	/** null when no center is configured, which is distinct from a center of [0, 0]. */
	center: [number, number] | null;
	maxZoom: number;
	minZoom: number;
	mapTiles: string[];
	mapTilesDark: string[];
	currentTileSetId: string | null;
}

export interface MapMarker {
	entry: BasesEntry;
	coordinates: [number, number];
	/** Name from a marker list item, shown as the popup title. */
	label: string | null;
	/** Lucide icon name, or null for a plain dot. */
	icon: string | null;
	color: string;
	/** Key of the composite image combining icon and color. */
	imageKey: string;
}

export interface MapMarkerProperties {
	entryIndex: number;
	icon: string; // Composite image key combining icon and color
}

