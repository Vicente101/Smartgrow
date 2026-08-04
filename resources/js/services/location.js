import { cached, fetchJson } from '../lib/api.js';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function searchLocations(query, { limit = 6, signal } = {}) {
    const name = query.trim();
    if (name.length < 2) return [];

    return cached(`locations:${name.toLowerCase()}:${limit}`, THIRTY_DAYS, async () => {
        const params = new URLSearchParams({ name, count: String(limit), language: 'en', format: 'json' });
        const payload = await fetchJson(`${GEOCODING_URL}?${params}`, { timeout: 10000, signal });
        return (payload.results || []).map(normaliseLocation);
    });
}

export async function reverseLocation(latitude, longitude) {
    const key = `${latitude.toFixed(2)}:${longitude.toFixed(2)}`;

    return cached(`reverse:${key}`, THIRTY_DAYS, async () => {
        const params = new URLSearchParams({
            lat: String(latitude),
            lon: String(longitude),
            format: 'jsonv2',
            zoom: '10',
            addressdetails: '1',
        });
        const payload = await fetchJson(`${REVERSE_URL}?${params}`, {
            timeout: 10000,
            headers: { 'Accept-Language': 'en' },
        });
        const address = payload.address || {};
        const name = address.city || address.town || address.village || address.county || 'Current location';
        const admin1 = address.state || address.region || null;
        const country = address.country || null;

        return {
            name,
            admin1,
            country,
            country_code: (address.country_code || '').toUpperCase(),
            latitude: round(latitude, 5),
            longitude: round(longitude, 5),
            timezone: null,
            label: [name, admin1, country].filter(Boolean).join(', '),
        };
    });
}

export async function resolveLocation({ location, latitude, longitude }) {
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        try {
            return await reverseLocation(latitude, longitude);
        } catch {
            return {
                name: location || 'Current location',
                admin1: null,
                country: null,
                country_code: null,
                latitude: round(latitude, 5),
                longitude: round(longitude, 5),
                timezone: null,
                label: location || 'Current location',
            };
        }
    }

    const result = (await searchLocations(String(location || ''), { limit: 1 }))[0];
    if (!result) throw new Error('We could not find that location. Try a nearby town or district.');
    return result;
}

export function normaliseLocation(item) {
    const parts = [...new Set([item.name, item.admin1, item.country].filter(Boolean))];
    return {
        name: item.name || 'Unknown location',
        admin1: item.admin1 || null,
        country: item.country || null,
        country_code: (item.country_code || '').toUpperCase(),
        latitude: Number(item.latitude || 0),
        longitude: Number(item.longitude || 0),
        timezone: item.timezone || null,
        label: parts.join(', '),
    };
}

function round(value, precision = 1) {
    const factor = 10 ** precision;
    return Math.round(Number(value) * factor) / factor;
}
