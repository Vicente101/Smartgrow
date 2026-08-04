import { cached, fetchJson } from '../lib/api.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const NASA_POWER_URL = 'https://power.larc.nasa.gov/api/temporal/climatology/point';
const FORECAST_LIFETIME = 45 * 60 * 1000;
const CLIMATE_LIFETIME = 30 * 24 * 60 * 60 * 1000;

export async function getForecast(latitude, longitude) {
    const key = coordinateKey(latitude, longitude);

    return cached(`forecast:${key}`, FORECAST_LIFETIME, async () => {
        const params = new URLSearchParams({
            latitude: String(latitude),
            longitude: String(longitude),
            timezone: 'auto',
            forecast_days: '14',
            current: [
                'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
                'precipitation', 'weather_code', 'wind_speed_10m', 'soil_temperature_6cm',
                'soil_moisture_9_to_27cm',
            ].join(','),
            daily: [
                'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
                'precipitation_probability_max', 'wind_speed_10m_max', 'et0_fao_evapotranspiration',
                'sunshine_duration',
            ].join(','),
        });
        const data = await fetchJson(`${FORECAST_URL}?${params}`, { timeout: 15000 });
        const current = data.current || {};
        const daily = data.daily || {};

        if (!Object.keys(current).length || !daily.time?.length) {
            throw new Error('The weather provider returned an incomplete forecast.');
        }

        const days = daily.time.map((date, index) => {
            const weatherCode = Number(daily.weather_code?.[index] || 0);
            return {
                date,
                weather_code: weatherCode,
                condition: conditionForCode(weatherCode),
                temp_max: round(daily.temperature_2m_max?.[index]),
                temp_min: round(daily.temperature_2m_min?.[index]),
                rainfall: round(daily.precipitation_sum?.[index]),
                rain_chance: Math.round(Number(daily.precipitation_probability_max?.[index] || 0)),
                wind_max: round(daily.wind_speed_10m_max?.[index]),
                et0: round(daily.et0_fao_evapotranspiration?.[index]),
                sunshine_hours: round(Number(daily.sunshine_duration?.[index] || 0) / 3600),
            };
        });
        const weatherCode = Number(current.weather_code || 0);

        return {
            source: 'Open-Meteo',
            source_status: 'live',
            timezone: data.timezone || 'UTC',
            updated_at: current.time || new Date().toISOString(),
            current: {
                temperature: round(current.temperature_2m),
                feels_like: round(current.apparent_temperature),
                humidity: Math.round(Number(current.relative_humidity_2m || 0)),
                wind_speed: round(current.wind_speed_10m),
                precipitation: round(current.precipitation),
                soil_temperature: nullableRound(current.soil_temperature_6cm),
                soil_moisture: nullableRound(current.soil_moisture_9_to_27cm, 3),
                weather_code: weatherCode,
                condition: conditionForCode(weatherCode),
                is_day: Boolean(current.is_day ?? true),
            },
            daily: days,
            summary: summariseForecast(days),
        };
    });
}

export async function getClimate(latitude, longitude) {
    const key = `${coordinateKey(latitude, longitude)}:${new Date().getFullYear()}`;
    return cached(`climate:${key}`, CLIMATE_LIFETIME, async () => {
        try {
            return await getOpenMeteoClimate(latitude, longitude);
        } catch {
            return getNasaClimate(latitude, longitude);
        }
    });
}

async function getOpenMeteoClimate(latitude, longitude) {
    const endYear = new Date().getFullYear() - 1;
    const startYear = endYear - 4;
    const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        start_date: `${startYear}-01-01`,
        end_date: `${endYear}-12-31`,
        timezone: 'auto',
        daily: [
            'temperature_2m_mean', 'temperature_2m_max', 'temperature_2m_min', 'precipitation_sum',
            'relative_humidity_2m_mean', 'wind_speed_10m_max', 'et0_fao_evapotranspiration',
        ].join(','),
    });
    const data = await fetchJson(`${ARCHIVE_URL}?${params}`, { timeout: 25000 });
    const daily = data.daily || {};
    if (!daily.time?.length) throw new Error('No historical climate records were returned.');

    return {
        source: 'Open-Meteo ERA5',
        source_status: 'historical',
        period: `${startYear}–${endYear}`,
        years: 5,
        months: aggregateHistoricalClimate(daily),
    };
}

async function getNasaClimate(latitude, longitude) {
    const params = new URLSearchParams({
        parameters: 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,WS10M',
        community: 'AG',
        longitude: String(longitude),
        latitude: String(latitude),
        format: 'JSON',
    });
    const data = await fetchJson(`${NASA_POWER_URL}?${params}`, { timeout: 25000 });
    const values = data.properties?.parameter || {};
    if (!values.T2M) throw new Error('Climate baselines are temporarily unavailable.');

    const codes = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const months = codes.map((code, index) => {
        const month = index + 1;
        const rainfallPerDay = powerValue(values, 'PRECTOTCORR', code);
        return {
            month,
            label: monthName(month),
            temperature: powerValue(values, 'T2M', code),
            temp_max: powerValue(values, 'T2M_MAX', code),
            temp_min: powerValue(values, 'T2M_MIN', code),
            rainfall: round(rainfallPerDay * daysInMonth(month)),
            rain_days: null,
            humidity: powerValue(values, 'RH2M', code),
            wind: powerValue(values, 'WS10M', code),
            et0: null,
        };
    });

    return {
        source: 'NASA POWER',
        source_status: 'climatology_fallback',
        period: 'long-term climatology',
        years: null,
        months,
    };
}

export function aggregateHistoricalClimate(daily) {
    const buckets = new Map();

    (daily.time || []).forEach((date, index) => {
        const bucketKey = date.slice(0, 7);
        const month = Number(date.slice(5, 7));
        const bucket = buckets.get(bucketKey) || {
            month,
            temperature: [], temp_max: [], temp_min: [], humidity: [], wind: [], et0: [],
            rainfall: 0, rain_days: 0,
        };
        pushNumber(bucket.temperature, daily.temperature_2m_mean?.[index]);
        pushNumber(bucket.temp_max, daily.temperature_2m_max?.[index]);
        pushNumber(bucket.temp_min, daily.temperature_2m_min?.[index]);
        pushNumber(bucket.humidity, daily.relative_humidity_2m_mean?.[index]);
        pushNumber(bucket.wind, daily.wind_speed_10m_max?.[index]);
        pushNumber(bucket.et0, daily.et0_fao_evapotranspiration?.[index]);
        const rain = validNumber(daily.precipitation_sum?.[index]) ? Number(daily.precipitation_sum[index]) : 0;
        bucket.rainfall += rain;
        if (rain >= 1) bucket.rain_days += 1;
        buckets.set(bucketKey, bucket);
    });

    return Array.from({ length: 12 }, (_, index) => {
        const month = index + 1;
        const matching = [...buckets.values()].filter((bucket) => bucket.month === month);
        return {
            month,
            label: monthName(month),
            temperature: averageBuckets(matching, 'temperature'),
            temp_max: averageBuckets(matching, 'temp_max'),
            temp_min: averageBuckets(matching, 'temp_min'),
            rainfall: averageBuckets(matching, 'rainfall'),
            rain_days: averageBuckets(matching, 'rain_days'),
            humidity: averageBuckets(matching, 'humidity'),
            wind: averageBuckets(matching, 'wind'),
            et0: averageBuckets(matching, 'et0'),
        };
    });
}

function averageBuckets(buckets, key) {
    const values = buckets.map((bucket) => {
        if (Array.isArray(bucket[key])) return average(bucket[key]);
        return validNumber(bucket[key]) ? Number(bucket[key]) : null;
    }).filter(validNumber);
    return values.length ? round(average(values)) : null;
}

function summariseForecast(days) {
    return {
        days: days.length,
        rainfall_total: round(days.reduce((sum, day) => sum + day.rainfall, 0)),
        average_high: round(average(days.map((day) => day.temp_max))),
        average_low: round(average(days.map((day) => day.temp_min))),
        rain_days: days.filter((day) => day.rainfall >= 1).length,
        heavy_rain_days: days.filter((day) => day.rainfall >= 35).length,
    };
}

export function conditionForCode(code) {
    if (code === 0) return 'Clear';
    if ([1, 2].includes(code)) return 'Partly cloudy';
    if (code === 3) return 'Overcast';
    if ([45, 48].includes(code)) return 'Foggy';
    if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle';
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain';
    if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow';
    if ([95, 96, 99].includes(code)) return 'Thunderstorm';
    return 'Variable conditions';
}

function powerValue(values, parameter, month) {
    const value = Number(values[parameter]?.[month] || 0);
    return value <= -900 ? 0 : round(value);
}

function monthName(month) {
    return new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, month - 1, 1)));
}

function daysInMonth(month) {
    return new Date(Date.UTC(2024, month, 0)).getUTCDate();
}

function coordinateKey(latitude, longitude) {
    return `${Number(latitude).toFixed(2)}:${Number(longitude).toFixed(2)}`;
}

function pushNumber(target, value) {
    if (validNumber(value)) target.push(Number(value));
}

function validNumber(value) {
    return value !== null && value !== '' && Number.isFinite(Number(value));
}

function average(values) {
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function nullableRound(value, precision = 1) {
    return validNumber(value) ? round(value, precision) : null;
}

function round(value, precision = 1) {
    const factor = 10 ** precision;
    return Math.round(Number(value || 0) * factor) / factor;
}
