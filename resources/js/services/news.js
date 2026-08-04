import { cached, fetchJson } from '../lib/api.js';

const GDELT_URL = 'https://api.gdeltproject.org/api/v2/doc/doc';
const NEWS_LIFETIME = 30 * 60 * 1000;

export async function getAgricultureNews(location, limit = 18) {
    const place = cleanQuery(location) || 'Zambia';

    try {
        return await cached(`news:${place.toLowerCase()}:${limit}`, NEWS_LIFETIME, async () => {
            const query = `(agriculture OR farming OR crops OR harvest OR livestock) ${place}`;
            const params = new URLSearchParams({
                query,
                mode: 'ArtList',
                maxrecords: String(Math.min(Math.max(limit * 2, 20), 75)),
                format: 'json',
                sort: 'datedesc',
                timespan: '3months',
            });
            const payload = await fetchJson(`${GDELT_URL}?${params}`, { timeout: 22000 });
            const articles = normaliseArticles(payload.articles || [], limit);
            if (!articles.length) throw new Error('No matching English articles were returned.');

            return {
                status: 'live',
                source: 'GDELT Project',
                location: place,
                updated_at: new Date().toISOString(),
                articles,
            };
        });
    } catch {
        // Location-aware search links keep the page useful while GDELT is busy.
        return {
            status: 'search_fallback',
            source: 'Location-aware source searches',
            location: place,
            updated_at: new Date().toISOString(),
            articles: fallbackArticles(place),
        };
    }
}

function normaliseArticles(articles, limit) {
    const seen = new Set();
    return articles
        .filter((article) => article.title && validUrl(article.url))
        .filter((article) => ['english', 'eng'].includes(String(article.language || 'english').toLowerCase()))
        .map((article) => ({
            title: stripTags(article.title).trim(),
            url: article.url,
            image: validUrl(article.socialimage) ? article.socialimage : null,
            domain: article.domain || hostname(article.url) || 'News source',
            source_country: article.sourcecountry || null,
            language: article.language || 'English',
            published_at: parseGdeltDate(article.seendate),
        }))
        .filter((article) => {
            const key = article.url.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        })
        .slice(0, limit);
}

function fallbackArticles(place) {
    const query = encodeURIComponent(`agriculture farming crops ${place}`);
    return [
        {
            title: `Search recent agricultural reporting related to ${place}`,
            url: `https://news.google.com/search?q=${query}&hl=en`,
            image: null,
            domain: 'Google News search',
            source_country: null,
            language: 'English',
            published_at: null,
        },
        {
            title: `Find food security and agriculture updates for ${place}`,
            url: `https://reliefweb.int/updates?search=${query}`,
            image: null,
            domain: 'ReliefWeb search',
            source_country: null,
            language: 'English',
            published_at: null,
        },
    ];
}

function parseGdeltDate(value) {
    const match = String(value || '').match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
    return match ? `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z` : null;
}

function cleanQuery(value) {
    return String(value || '').replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim().slice(0, 100);
}

function stripTags(value) {
    return String(value || '').replace(/<[^>]*>/g, '');
}

function validUrl(value) {
    try {
        return ['http:', 'https:'].includes(new URL(value).protocol);
    } catch {
        return false;
    }
}

function hostname(value) {
    try {
        return new URL(value).hostname;
    } catch {
        return null;
    }
}
