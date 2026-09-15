import { Value, NumberValue, StringValue, ListValue } from 'obsidian';

/**
 * Converts a Value to coordinate tuple [lat, lng]
 */
export function coordinateFromValue(value: Value | null): [number, number] | null {
	let lat: number | null = null;
	let lng: number | null = null;

	// Handle list values (e.g., ["34.1395597", "-118.3870991"] or [34.1395597, -118.3870991])
	if (value instanceof ListValue) {
		if (value.length() >= 2) {
			lat = parseCoordinate(value.get(0));
			lng = parseCoordinate(value.get(1));
		}
	}
	// Handle string values (e.g., "34.1395597,-118.3870991" or "34.1395597, -118.3870991")
	else if (value instanceof StringValue) {
		// Split by comma and handle various spacing
		const parts = value.toString().trim().split(',');
		if (parts.length >= 2) {
			lat = parseCoordinate(parts[0].trim());
			lng = parseCoordinate(parts[1].trim());
		}
	}

	if (lat != null && lng != null && verifyLatLng(lat, lng)) {
		return [lat, lng];
	}

	return null;
}

/** One marker read from a marker list property. */
export interface MarkerListItem {
	coordinates: [number, number];
	name: string | null;
	icon: string | null;
	color: string | null;
}

/**
 * Reads a marker list from raw frontmatter. Each item may be:
 * - `[icon, [lat, lng], name?, color?]`
 * - `{ coordinates: [lat, lng], name?, icon?, color? }`
 * - `[lat, lng]` or `"lat, lng"`
 * Items that can't be parsed are skipped.
 */
export function markerListFromFrontmatter(value: unknown): MarkerListItem[] {
	if (!Array.isArray(value)) return [];

	const items: MarkerListItem[] = [];
	for (const raw of value) {
		const item = markerListItemFromFrontmatter(raw);
		if (item) items.push(item);
	}
	return items;
}

function markerListItemFromFrontmatter(raw: unknown): MarkerListItem | null {
	if (Array.isArray(raw)) {
		// [icon, [lat, lng], name?, color?]
		if (Array.isArray(raw[1])) {
			const coordinates = coordinateFromRaw(raw[1]);
			if (!coordinates) return null;
			return {
				coordinates,
				icon: stringFromRaw(raw[0]),
				name: stringFromRaw(raw[2]),
				color: stringFromRaw(raw[3]),
			};
		}
		// [lat, lng]
		const coordinates = coordinateFromRaw(raw);
		return coordinates && { coordinates, icon: null, name: null, color: null };
	}

	if (raw != null && typeof raw === 'object') {
		const obj = raw as Record<string, unknown>;
		const coordinates = coordinateFromRaw(obj.coordinates ?? obj.location);
		if (!coordinates) return null;
		return {
			coordinates,
			icon: stringFromRaw(obj.icon),
			name: stringFromRaw(obj.name),
			color: stringFromRaw(obj.color),
		};
	}

	const coordinates = coordinateFromRaw(raw);
	return coordinates && { coordinates, icon: null, name: null, color: null };
}

function coordinateFromRaw(raw: unknown): [number, number] | null {
	let parts: unknown[] | null = null;
	if (Array.isArray(raw)) parts = raw;
	else if (typeof raw === 'string') parts = raw.split(',');
	if (!parts || parts.length < 2) return null;

	const lat = parseCoordinate(typeof parts[0] === 'string' ? parts[0].trim() : parts[0]);
	const lng = parseCoordinate(typeof parts[1] === 'string' ? parts[1].trim() : parts[1]);
	return lat != null && lng != null && verifyLatLng(lat, lng) ? [lat, lng] : null;
}

function stringFromRaw(raw: unknown): string | null {
	if (typeof raw !== 'string' && typeof raw !== 'number') return null;
	return String(raw).trim() || null;
}

/**
 * Reads bounds as `[[lat, lng], [lat, lng]]` (any two opposite corners) or
 * `[south, west, north, east]`, returning `[[south, west], [north, east]]`.
 */
export function boundsFromValue(value: Value | null): [[number, number], [number, number]] | null {
	if (!(value instanceof ListValue)) return null;

	let a: [number, number] | null = null;
	let b: [number, number] | null = null;
	if (value.length() === 2) {
		a = coordinateFromValue(value.get(0));
		b = coordinateFromValue(value.get(1));
	}
	else if (value.length() === 4) {
		const [s, w, n, e] = [0, 1, 2, 3].map(i => parseCoordinate(value.get(i)));
		if (s != null && w != null && n != null && e != null && verifyLatLng(s, w) && verifyLatLng(n, e)) {
			a = [s, w];
			b = [n, e];
		}
	}
	if (!a || !b) return null;

	return [
		[Math.min(a[0], b[0]), Math.min(a[1], b[1])],
		[Math.max(a[0], b[0]), Math.max(a[1], b[1])],
	];
}

/**
 * Verifies that lat/lng values are within valid ranges
 */
export function verifyLatLng(lat: number, lng: number): boolean {
	return !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Parses a coordinate value from various formats
 */
export function parseCoordinate(value: unknown): number | null {
	if (value instanceof NumberValue) {
		const numData = Number(value.toString());
		return isNaN(numData) ? null : numData;
	}
	if (value instanceof StringValue) {
		const num = parseFloat(value.toString());
		return isNaN(num) ? null : num;
	}
	if (typeof value === 'string') {
		const num = parseFloat(value);
		return isNaN(num) ? null : num;
	}
	if (typeof value === 'number') {
		return isNaN(value) ? null : value;
	}
	return null;
}

/**
 * Converts a [lat, lng] coordinate to the [lng, lat] order MapLibre expects
 */
export function toLngLat([lat, lng]: [number, number]): [number, number] {
	return [lng, lat];
}

/**
 * Compares two coordinates, treating null (no coordinate) as its own value
 */
export function sameCoordinates(a: [number, number] | null, b: [number, number] | null): boolean {
	if (!a || !b) return a === b;
	return a[0] === b[0] && a[1] === b[1];
}

/**
 * Rounds a coordinate to roughly one metre of precision
 */
export function roundCoordinate(value: number): number {
	return Number(value.toFixed(5));
}

/**
 * Formats a coordinate pair for display or the clipboard. Values are used as
 * given, so callers echoing stored data keep its precision.
 */
export function formatCoordinates(lat: number, lng: number): string {
	return `${lat}, ${lng}`;
}

/**
 * Options shared by every geolocation request. `maximumAge` lets a recent cached
 * fix satisfy a request, which keeps continuous tracking from pinning the GPS.
 */
export const GEOLOCATION_OPTIONS: PositionOptions = {
	enableHighAccuracy: true,
	timeout: 10000,
	maximumAge: 5000
};

/**
 * Converts a geolocation failure into a user-facing message
 */
export function geolocationErrorMessage(error: GeolocationPositionError): string {
	switch (error.code) {
		case error.PERMISSION_DENIED:
			return 'Location permission denied';
		case error.POSITION_UNAVAILABLE:
			return 'Location information unavailable';
		case error.TIMEOUT:
			return 'Location request timed out';
		default:
			return 'Failed to get location';
	}
}

/**
 * Wrapper for Object.hasOwn which performs type narrowing
 */
export function hasOwnProperty<K extends PropertyKey>(o: unknown, v: K): o is Record<K, unknown> {
	return o != null && typeof o === 'object' && Object.hasOwn(o, v);
}

