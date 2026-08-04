import { resolveLocation } from './location.js';
import { analyseCrops } from './recommendation.js';
import { getClimate, getForecast } from './weather.js';

export async function buildAdvice(input) {
    const month = Number(input.month || new Date().getMonth() + 1);
    if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Choose a valid planting month.');
    if (!input.location?.trim() && (!Number.isFinite(input.latitude) || !Number.isFinite(input.longitude))) {
        throw new Error('Enter a town or allow access to your current location.');
    }

    const location = await resolveLocation(input);
    const [forecastResult, climateResult] = await Promise.allSettled([
        getForecast(location.latitude, location.longitude),
        getClimate(location.latitude, location.longitude),
    ]);
    const forecast = forecastResult.status === 'fulfilled' ? forecastResult.value : null;

    if (climateResult.status === 'rejected') {
        throw new Error('Climate services are temporarily unavailable. Please check your connection and try again shortly.');
    }

    return analyseCrops(
        location,
        forecast,
        climateResult.value,
        month,
        input.soil_type || 'unknown',
        input.irrigation || 'none',
    );
}
