const CACHE_PREFIX = 'munda:cache:';

export async function fetchJson(url, options = {}) {
    const {
        timeout = 15000,
        signal,
        headers = {},
        ...fetchOptions
    } = options;
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort(signal?.reason);
    const timer = window.setTimeout(() => controller.abort('timeout'), timeout);

    if (signal?.aborted) abortFromCaller();
    signal?.addEventListener('abort', abortFromCaller, { once: true });

    try {
        const response = await fetch(url, {
            ...fetchOptions,
            headers: { Accept: 'application/json', ...headers },
            signal: controller.signal,
        });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(payload.reason || payload.message || `The data provider returned HTTP ${response.status}.`);
        }

        return payload;
    } catch (error) {
        if (signal?.aborted) throw new DOMException('The request was cancelled.', 'AbortError');
        if (controller.signal.aborted) throw new Error('The data provider took too long to respond. Please try again.');
        throw error;
    } finally {
        window.clearTimeout(timer);
        signal?.removeEventListener('abort', abortFromCaller);
    }
}

export async function cached(key, lifetimeMs, loader, { allowStale = true } = {}) {
    const record = readCache(key);
    if (record?.expiresAt > Date.now()) return record.value;

    try {
        const value = await loader();
        writeCache(key, { value, expiresAt: Date.now() + lifetimeMs });
        return value;
    } catch (error) {
        if (allowStale && record?.value) return record.value;
        throw error;
    }
}

function readCache(key) {
    try {
        return JSON.parse(localStorage.getItem(`${CACHE_PREFIX}${key}`));
    } catch {
        return null;
    }
}

function writeCache(key, value) {
    try {
        localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
    } catch {
        // Private browsing and storage limits should never block live analysis.
    }
}

export function formatDate(value, options = {}) {
    if (!value) return 'Recently';
    return new Intl.DateTimeFormat('en', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        ...options,
    }).format(new Date(value));
}

export function readStoredAdvice() {
    try {
        return JSON.parse(localStorage.getItem('munda:last-advice'));
    } catch {
        return null;
    }
}
