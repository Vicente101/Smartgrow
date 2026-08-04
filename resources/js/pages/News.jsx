import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Globe2, LoaderCircle, MapPin, Newspaper, RefreshCw, Search, ShieldCheck } from 'lucide-react';
import { formatDate, readStoredAdvice } from '../lib/api';
import { getAgricultureNews } from '../services/news';

const trustedResources = [
    { name: 'FAO Newsroom', detail: 'Global food and agriculture updates', url: 'https://www.fao.org/newsroom/en' },
    { name: 'ReliefWeb Agriculture', detail: 'Food security and climate reporting', url: 'https://reliefweb.int/topics/agriculture' },
    { name: 'NASA Harvest', detail: 'Satellite-based food security insights', url: 'https://www.nasaharvest.org/news' },
];

export default function News() {
    const stored = readStoredAdvice();
    const storedPlace = stored?.location?.country || stored?.location?.name;
    const [location, setLocation] = useState(storedPlace || 'Zambia');
    const [activeLocation, setActiveLocation] = useState(storedPlace || 'Zambia');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function loadNews(place) {
        setLoading(true);
        setError('');
        try {
            const news = await getAgricultureNews(place);
            setData(news);
            setActiveLocation(place);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadNews(activeLocation); }, []);

    function submit(event) {
        event.preventDefault();
        if (location.trim().length >= 2) loadNews(location.trim());
    }

    return (
        <>
            <section className="relative overflow-hidden bg-forest-950 py-16 text-white sm:py-20">
                <div className="absolute right-0 top-0 size-96 rounded-full bg-lime-300/8 blur-3xl" />
                <div className="page-shell relative grid gap-9 lg:grid-cols-[1fr_.8fr] lg:items-end">
                    <div>
                        <div className="eyebrow eyebrow-light"><Newspaper size={14} /> Local agricultural news</div>
                        <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[.98] tracking-[-0.06em] sm:text-6xl">What is changing around your market?</h1>
                        <p className="mt-5 max-w-xl text-base leading-8 text-white/58">Follow recent reporting on crops, weather, food systems, policy, and markets filtered to your selected location.</p>
                    </div>
                    <form onSubmit={submit} className="rounded-2xl border border-white/12 bg-white/8 p-2 backdrop-blur">
                        <label className="flex items-center gap-3 rounded-xl bg-white px-3" htmlFor="news-location">
                            <MapPin size={18} className="text-forest-700" />
                            <input id="news-location" value={location} onChange={(event) => setLocation(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold text-forest-950 outline-none" placeholder="Country or location" />
                            <button type="submit" className="grid size-9 shrink-0 place-items-center rounded-lg bg-lime-300 text-forest-950" aria-label="Search news"><Search size={17} /></button>
                        </label>
                    </form>
                </div>
            </section>

            <section className="page-shell py-10 sm:py-14">
                <div className="flex flex-col gap-4 border-b border-forest-950/8 pb-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-forest-700/60"><Globe2 size={14} /> Reporting related to</p>
                        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em] text-forest-950">{activeLocation}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                        <span className="flex items-center gap-1.5"><CalendarDays size={14} /> Last three months</span>
                        <span className="h-3 w-px bg-stone-200" />
                        <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> {data?.source || 'Verified news feeds'}</span>
                        <button type="button" onClick={() => loadNews(activeLocation)} className="grid size-8 place-items-center rounded-lg border border-stone-200 text-forest-700 hover:bg-sage-50" aria-label="Refresh news"><RefreshCw size={14} /></button>
                    </div>
                </div>

                {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
                {data?.status === 'search_fallback' && !loading && (
                    <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        The live headline feed is temporarily busy. These cards open current, location-filtered searches from established news sources instead.
                    </div>
                )}

                {loading ? <NewsSkeleton /> : data?.articles?.length > 0 ? (
                    <div className="mt-8 grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                        {data.articles.map((article, index) => <ArticleCard key={article.url} article={article} featured={index === 0} />)}
                    </div>
                ) : (
                    <div className="mt-8 rounded-[2rem] border border-forest-950/8 bg-sage-50 p-7 text-center sm:p-12">
                        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white text-forest-800 shadow-sm"><Newspaper size={24} /></span>
                        <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-forest-950">No fresh local headlines were returned.</h3>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-500">Try the country name or a larger nearby city. The news service may also be temporarily busy.</p>
                    </div>
                )}

                <div className="mt-16">
                    <div className="eyebrow"><Globe2 size={14} /> Trusted reading</div>
                    <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-forest-950">Broader agricultural sources</h2>
                    <div className="mt-7 grid gap-4 md:grid-cols-3">
                        {trustedResources.map((resource) => (
                            <a key={resource.name} href={resource.url} target="_blank" rel="noreferrer" className="premium-card group flex items-center justify-between gap-4 p-5">
                                <span><span className="block text-sm font-bold text-forest-950">{resource.name}</span><span className="mt-1 block text-xs text-stone-400">{resource.detail}</span></span>
                                <ArrowUpRight size={17} className="shrink-0 text-forest-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

function ArticleCard({ article, featured }) {
    const [imageFailed, setImageFailed] = useState(false);
    return (
        <article className={`premium-card group overflow-hidden ${featured ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
            <a href={article.url} target="_blank" rel="noreferrer" className="flex h-full flex-col">
                <div className="relative aspect-[16/9] overflow-hidden bg-sage-100">
                    {article.image && !imageFailed ? (
                        <img src={article.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" onError={() => setImageFailed(true)} />
                    ) : (
                        <div className="grid h-full place-items-center bg-gradient-to-br from-sage-100 to-lime-100 text-forest-700"><Newspaper size={32} strokeWidth={1.5} /></div>
                    )}
                    <span className="absolute right-3 top-3 grid size-9 place-items-center rounded-xl bg-white/90 text-forest-950 shadow-sm backdrop-blur"><ArrowUpRight size={16} /></span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-3 text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">
                        <span className="truncate">{article.domain}</span>
                        <span className="shrink-0">{formatDate(article.published_at, { year: undefined })}</span>
                    </div>
                    <h3 className="mt-3 line-clamp-3 font-display text-lg font-extrabold leading-snug tracking-[-0.025em] text-forest-950">{article.title}</h3>
                    <div className="mt-auto pt-5 text-xs font-bold text-forest-700">Read original report</div>
                </div>
            </a>
        </article>
    );
}

function NewsSkeleton() {
    return (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="overflow-hidden rounded-3xl border border-stone-100 bg-white">
                    <div className="skeleton aspect-[16/9]" />
                    <div className="p-5"><div className="skeleton h-3 w-1/3 rounded" /><div className="skeleton mt-4 h-5 rounded" /><div className="skeleton mt-2 h-5 w-4/5 rounded" /></div>
                </div>
            ))}
        </div>
    );
}
