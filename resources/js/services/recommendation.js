import { crops } from '../data/crops.js';

export function analyseCrops(location, forecast, climate, month, soilType = 'unknown', irrigation = 'none') {
    const baseline = climate.months?.find((item) => item.month === month);
    if (!baseline) throw new Error('There is not enough monthly climate data for this location.');

    const metrics = {
        temperature: Number(baseline.temperature ?? forecast?.current?.temperature ?? 0),
        temp_max: Number(baseline.temp_max ?? forecast?.summary?.average_high ?? 0),
        temp_min: Number(baseline.temp_min ?? forecast?.summary?.average_low ?? 0),
        rainfall: Number(baseline.rainfall ?? 0),
        rain_days: baseline.rain_days ?? null,
        humidity: Number(baseline.humidity ?? forecast?.current?.humidity ?? 60),
        wind: Number(baseline.wind ?? forecast?.current?.wind_speed ?? 0),
        et0: baseline.et0 ?? null,
    };
    const ranked = crops
        .map((crop) => scoreCrop(crop, metrics, forecast, month, soilType, irrigation))
        .sort((left, right) => right.score - left.score);

    return {
        generated_at: new Date().toISOString(),
        location,
        planting_month: {
            number: month,
            name: monthName(month),
            season: seasonLabel(month, Number(location.latitude), metrics.rainfall),
        },
        farm_profile: { soil_type: soilType, irrigation },
        weather: forecast,
        climate: { ...climate, selected_month: metrics },
        recommendations: ranked.slice(0, 8),
        alternative_count: Math.max(ranked.length - 8, 0),
        field_actions: fieldActions(metrics, forecast, soilType, irrigation),
        confidence: confidence(forecast, climate, soilType),
        methodology: {
            name: 'Munda agronomic suitability model',
            version: '3.0-static',
            type: 'explainable weighted scoring',
            signals: ['5-year monthly climate', '14-day forecast', 'crop tolerance bands', 'soil match', 'water access'],
            disclaimer: 'Decision support only. Confirm seed choice and planting dates with a local extension officer and a current soil test.',
        },
    };
}

function scoreCrop(crop, metrics, forecast, month, soilType, irrigation) {
    const effectiveRain = effectiveRainfall(metrics.rainfall, crop, irrigation);
    const temperatureScore = rangeScore(metrics.temperature, crop.temp_min, crop.temp_opt_min, crop.temp_opt_max, crop.temp_max);
    const rainfallScore = rangeScore(effectiveRain, crop.rainfall_min, crop.rainfall_opt_min, crop.rainfall_opt_max, crop.rainfall_max);
    const humidityScore = softRangeScore(metrics.humidity, crop.humidity_min, crop.humidity_max, 2.2);
    const soilScore = soilType === 'unknown' ? 76 : (crop.soil_types.includes(soilType) ? 100 : 48);
    const forecastScore = nearTermScore(crop, forecast, month, irrigation);
    const currentMonth = new Date().getMonth() + 1;
    const weighted = forecast && month === currentMonth
        ? temperatureScore * 0.31 + rainfallScore * 0.27 + humidityScore * 0.13 + soilScore * 0.12 + forecastScore * 0.17
        : temperatureScore * 0.38 + rainfallScore * 0.34 + humidityScore * 0.16 + soilScore * 0.12;
    const score = Math.round(clamp(weighted));
    const components = {
        temperature: Math.round(temperatureScore),
        rainfall: Math.round(rainfallScore),
        humidity: Math.round(humidityScore),
        soil: Math.round(soilScore),
        near_term: Math.round(forecastScore),
    };
    const [strengths, watchouts] = explain(crop, components, metrics, forecast, soilType, irrigation);

    return {
        id: crop.id,
        name: crop.name,
        slug: crop.slug,
        scientific_name: crop.scientific_name,
        category: crop.category,
        description: crop.description,
        score,
        rating: rating(score),
        components,
        strengths,
        watchouts,
        cycle_days: crop.cycle_days,
        water_need: crop.water_need,
        soil_types: crop.soil_types,
        planting_note: crop.planting_note,
        requirements: {
            temperature: [crop.temp_opt_min, crop.temp_opt_max],
            monthly_rainfall: [crop.rainfall_opt_min, crop.rainfall_opt_max],
            humidity: [crop.humidity_min, crop.humidity_max],
        },
    };
}

export function rangeScore(value, minimum, optimalMinimum, optimalMaximum, maximum) {
    if (value >= optimalMinimum && value <= optimalMaximum) return 100;
    if (value >= minimum && value < optimalMinimum) {
        return 55 + 45 * ((value - minimum) / Math.max(optimalMinimum - minimum, 0.1));
    }
    if (value > optimalMaximum && value <= maximum) {
        return 100 - 45 * ((value - optimalMaximum) / Math.max(maximum - optimalMaximum, 0.1));
    }
    const distance = value < minimum ? minimum - value : value - maximum;
    return clamp(55 - distance * 7.5);
}

function softRangeScore(value, minimum, maximum, penalty) {
    if (value >= minimum && value <= maximum) return 100;
    const distance = value < minimum ? minimum - value : value - maximum;
    return clamp(100 - distance * penalty);
}

function effectiveRainfall(rainfall, crop, irrigation) {
    if (irrigation === 'reliable') return Math.max(rainfall, crop.rainfall_opt_min);
    if (irrigation === 'supplemental') return Math.max(rainfall, crop.rainfall_min);
    return rainfall;
}

function nearTermScore(crop, forecast, month, irrigation) {
    if (!forecast || month !== new Date().getMonth() + 1) return 75;
    const summary = forecast.summary;
    const days = Math.max(Number(summary.days || 14), 1);
    const temperature = (Number(summary.average_high) + Number(summary.average_low)) / 2;
    const projectedRain = effectiveRainfall(Number(summary.rainfall_total) * (30 / days), crop, irrigation);
    return rangeScore(temperature, crop.temp_min, crop.temp_opt_min, crop.temp_opt_max, crop.temp_max) * 0.55
        + rangeScore(projectedRain, crop.rainfall_min, crop.rainfall_opt_min, crop.rainfall_opt_max, crop.rainfall_max) * 0.45;
}

function explain(crop, components, metrics, forecast, soilType, irrigation) {
    const strengths = [];
    const watchouts = [];

    if (components.temperature >= 85) strengths.push('Monthly temperatures sit in this crop’s preferred band.');
    else if (components.temperature < 55) watchouts.push(metrics.temperature < crop.temp_min ? 'The month is likely too cool for reliable establishment.' : 'Heat stress could reduce establishment or flowering.');

    if (components.rainfall >= 85) strengths.push(irrigation === 'none' ? 'Expected monthly rainfall is well aligned.' : 'Your water access closes the expected rainfall gap.');
    else if (components.rainfall < 55) watchouts.push(metrics.rainfall < crop.rainfall_min ? 'Expected rain is below this crop’s normal requirement.' : 'Excess moisture and drainage may be a concern.');

    if (soilType !== 'unknown' && components.soil >= 85) strengths.push(`${capitalise(soilType)} soil is a good structural match.`);
    else if (soilType !== 'unknown' && components.soil < 60) watchouts.push('The selected soil type is not an ideal match; improve structure or choose a better field.');

    if (forecast?.summary?.heavy_rain_days > 0) watchouts.push('Heavy rain is possible in the next two weeks; protect drainage and delay field work on saturated soil.');
    if (!strengths.length) strengths.push('This crop remains possible with careful field management.');
    if (!watchouts.length) watchouts.push('No major climate mismatch detected; still confirm soil fertility and seed availability.');
    return [strengths.slice(0, 3), watchouts.slice(0, 3)];
}

function fieldActions(metrics, forecast, soilType, irrigation) {
    const actions = [];
    if (soilType === 'unknown') actions.push({ title: 'Test the soil first', detail: 'A pH and N-P-K test can materially change crop and fertiliser choices.', priority: 'high' });
    if (metrics.rainfall < 40 && irrigation === 'none') actions.push({ title: 'Plan for moisture stress', detail: 'Prioritise drought-tolerant crops, mulch, and plant only after an effective soaking rain.', priority: 'high' });
    if (forecast?.summary?.heavy_rain_days > 0) actions.push({ title: 'Open drainage channels', detail: 'The forecast contains at least one heavy-rain signal in the next 14 days.', priority: 'medium' });
    if (metrics.et0 !== null && metrics.rainfall < Number(metrics.et0) * 25) actions.push({ title: 'Reduce evaporation losses', detail: 'Use residue cover, minimum tillage, and early weed control to conserve water.', priority: 'medium' });
    actions.push({ title: 'Confirm locally', detail: 'Check seed variety, disease pressure, and the district planting calendar with an extension officer.', priority: 'standard' });
    return actions.slice(0, 4);
}

function confidence(forecast, climate, soilType) {
    let score = 0;
    const reasons = [];
    if (climate.source_status === 'historical') {
        score += 2;
        reasons.push('five years of location-specific climate history');
    } else {
        score += 1;
        reasons.push('long-term satellite climatology fallback');
    }
    if (forecast) {
        score += 2;
        reasons.push('live 14-day forecast');
    }
    if (soilType !== 'unknown') {
        score += 1;
        reasons.push('farmer-supplied soil type');
    } else reasons.push('soil type not supplied');
    return { level: score >= 5 ? 'high' : (score >= 3 ? 'moderate' : 'limited'), score, out_of: 5, reasons };
}

function rating(score) {
    if (score >= 82) return 'Excellent fit';
    if (score >= 70) return 'Strong fit';
    if (score >= 56) return 'Possible with care';
    return 'Higher risk';
}

function seasonLabel(month, latitude, rainfall) {
    const southern = latitude < 0;
    let season;
    if (southern) {
        if ([12, 1, 2].includes(month)) season = 'summer';
        else if ([3, 4, 5].includes(month)) season = 'autumn';
        else if ([6, 7, 8].includes(month)) season = 'winter';
        else season = 'spring';
    } else if ([12, 1, 2].includes(month)) season = 'winter';
    else if ([3, 4, 5].includes(month)) season = 'spring';
    else if ([6, 7, 8].includes(month)) season = 'summer';
    else season = 'autumn';
    const moisture = rainfall >= 90 ? 'wet' : (rainfall >= 40 ? 'transition' : 'dry');
    return `${capitalise(season)} · ${moisture} signal`;
}

function monthName(month) {
    return new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, month - 1, 1)));
}

function capitalise(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function clamp(value, minimum = 0, maximum = 100) {
    return Math.max(minimum, Math.min(maximum, value));
}
