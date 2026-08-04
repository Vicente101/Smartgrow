export async function api(path, options = {}) {
    const response = await fetch(path, {
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
        ...options,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        const validationMessage = payload.errors
            ? Object.values(payload.errors).flat().find(Boolean)
            : null;
        throw new Error(validationMessage || payload.message || 'Something went wrong. Please try again.');
    }

    return payload;
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
