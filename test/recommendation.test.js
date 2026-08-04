import assert from 'node:assert/strict';
import test from 'node:test';
import { crops } from '../resources/js/data/crops.js';
import { analyseCrops, rangeScore } from '../resources/js/services/recommendation.js';
import { aggregateHistoricalClimate, conditionForCode } from '../resources/js/services/weather.js';

test('the static crop catalogue contains unique, complete profiles', () => {
    assert.equal(crops.length, 18);
    assert.equal(new Set(crops.map((crop) => crop.slug)).size, 18);
    assert.ok(crops.every((crop) => crop.soil_types.length && crop.planting_note));
});

test('range scoring rewards the optimum and reduces unsuitable values', () => {
    assert.equal(rangeScore(25, 10, 20, 30, 38), 100);
    assert.equal(Math.round(rangeScore(15, 10, 20, 30, 38)), 78);
    assert.ok(rangeScore(45, 10, 20, 30, 38) < 20);
});

test('the recommendation model returns a ranked explainable shortlist', () => {
    const months = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        label: new Date(2024, index, 1).toLocaleString('en', { month: 'long' }),
        temperature: 25,
        temp_max: 30,
        temp_min: 19,
        rainfall: 115,
        rain_days: 12,
        humidity: 68,
        wind: 10,
        et0: 4,
    }));
    const result = analyseCrops(
        { name: 'Ndola', label: 'Ndola, Copperbelt, Zambia', country: 'Zambia', latitude: -12.97, longitude: 28.64 },
        null,
        { source: 'Test climate', source_status: 'historical', period: '2021–2025', years: 5, months },
        11,
        'loamy',
        'none',
    );

    assert.equal(result.recommendations.length, 8);
    assert.ok(result.recommendations.every((crop) => crop.score >= 0 && crop.score <= 100));
    assert.ok(result.recommendations.every((crop) => crop.strengths.length && crop.watchouts.length));
    assert.deepEqual([...result.recommendations].sort((a, b) => b.score - a.score), result.recommendations);
    assert.equal(result.confidence.score, 3);
});

test('historical daily weather is aggregated into monthly climatology', () => {
    const months = aggregateHistoricalClimate({
        time: ['2024-01-01', '2024-01-02', '2025-01-01', '2025-01-02'],
        temperature_2m_mean: [20, 22, 24, 26],
        temperature_2m_max: [25, 27, 29, 31],
        temperature_2m_min: [15, 17, 19, 21],
        precipitation_sum: [10, 20, 30, 40],
        relative_humidity_2m_mean: [60, 70, 70, 80],
        wind_speed_10m_max: [8, 10, 12, 14],
        et0_fao_evapotranspiration: [3, 4, 5, 6],
    });

    assert.equal(months[0].temperature, 23);
    assert.equal(months[0].rainfall, 50);
    assert.equal(months[0].rain_days, 2);
    assert.equal(months[0].humidity, 70);
    assert.equal(months.length, 12);
});

test('weather codes are converted to readable conditions', () => {
    assert.equal(conditionForCode(0), 'Clear');
    assert.equal(conditionForCode(63), 'Rain');
    assert.equal(conditionForCode(95), 'Thunderstorm');
});
