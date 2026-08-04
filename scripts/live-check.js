import assert from 'node:assert/strict';

globalThis.window = globalThis;
const records = new Map();
globalThis.localStorage = {
    getItem: (key) => records.get(key) ?? null,
    setItem: (key, value) => records.set(key, value),
    removeItem: (key) => records.delete(key),
};

const [{ buildAdvice }, { getAgricultureNews }] = await Promise.all([
    import('../resources/js/services/advisor.js'),
    import('../resources/js/services/news.js'),
]);

const [advice, news] = await Promise.all([
    buildAdvice({
        location: 'Ndola, Zambia',
        month: new Date().getMonth() + 1,
        soil_type: 'loamy',
        irrigation: 'none',
    }),
    getAgricultureNews('Zambia', 3),
]);

assert.equal(advice.recommendations.length, 8);
assert.ok(advice.weather?.daily?.length >= 7);
assert.equal(advice.climate.months.length, 12);
assert.ok(news.articles.length > 0);

console.log(JSON.stringify({
    location: advice.location.label,
    forecast: advice.weather.source,
    climate: `${advice.climate.source} (${advice.climate.period})`,
    top_crop: `${advice.recommendations[0].name} (${advice.recommendations[0].score}/100)`,
    news: `${news.source}: ${news.articles.length} result(s)`,
}, null, 2));
