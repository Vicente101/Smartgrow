import React, { useEffect, useState } from 'react';
import { ArrowUpRight, CalendarDays, Globe2, LoaderCircle, MapPin, Newspaper, RefreshCw, Search, ShieldCheck } from '../icons';
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

    const featured = data?.articles?.[0];
    const remaining = data?.articles?.slice(1) || [];

    return (
        <>
            <section className="relative overflow-hidden bg-forest-950 py-16 text-white sm:py-20">
                <div className="absolute right-0 top-0 size-96 rounded-full bg-lime-300/8 blur-3xl" />
                <div className="page-shell relative grid gap-9 lg:grid-cols-[1fr_.8fr] lg:items-end" data-reveal>
                    <div>
                        <div className="eyebrow eyebrow-light"><Newspaper size={16} weight="BoldDuotone" /> Local agricultural news</div>
                        <h1 className="mt-6 max-w-3xl font-display text-5xl font-extrabold leading-[.98] tracking-[-0.06em] sm:text-6xl">What is changing around your market?</h1>
                        <p className="mt-5 max-w-xl text-base leading-8 text-white/58">Follow recent reporting on crops, weather, food systems, policy, and markets filtered to your selected location.</p>
                    </div>
                    <form onSubmit={submit} className="border border-white/12 bg-white/8 p-2 backdrop-blur">
                        <label className="flex items-center gap-3 bg-white px-3" htmlFor="news-location">
                            <MapPin size={21} weight="BoldDuotone" className="text-forest-700" />
                            <input id="news-location" value={location} onChange={(event) => setLocation(event.target.value)} className="h-12 min-w-0 flex-1 bg-transparent text-sm font-bold text-forest-950 outline-none" placeholder="Country or location" />
                            <button type="submit" className="grid size-9 shrink-0 place-items-center bg-transparent text-forest-950 transition-colors hover:text-forest-600" aria-label="Search news"><Search size={21} weight="BoldDuotone" /></button>
                        </label>
                    </form>
                </div>
            </section>

            <section className="page-shell py-10 sm:py-14">
                <div className="flex flex-col gap-4 border-b border-forest-950/8 pb-7 sm:flex-row sm:items-end sm:justify-between" data-reveal>
                    <div>
                        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-forest-700/60"><Globe2 size={16} weight="BoldDuotone" /> Reporting related to</p>
                        <h2 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em] text-forest-950">{activeLocation}</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-400">
                        <span className="flex items-center gap-1.5"><CalendarDays size={16} weight="BoldDuotone" /> Last three months</span>
                        <span className="h-3 w-px bg-stone-200" />
                        <span className="flex items-center gap-1.5"><ShieldCheck size={16} weight="BoldDuotone" /> {data?.source || 'Verified news feeds'}</span>
                        <button type="button" onClick={() => loadNews(activeLocation)} className="grid size-8 place-items-center bg-transparent text-forest-700 transition-transform hover:rotate-45" aria-label="Refresh news"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
                    </div>
                </div>

                <div className="mt-6 flex items-start gap-3 border-l-2 border-forest-700 bg-sage-50 px-5 py-4 text-sm leading-6 text-stone-600" data-reveal>
                    <Newspaper size={24} weight="BoldDuotone" className="mt-0.5 shrink-0 text-forest-700" />
                    <p><span className="font-bold text-forest-950">Complete reporting, correctly attributed.</span> Munda indexes the full headline and source details, then opens the complete report on the publisher’s website.</p>
                </div>

                {error && <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
                {data?.status === 'search_fallback' && !loading && (
                    <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                        The live headline feed is temporarily busy. These cards open current, location-filtered searches from established news sources instead.
                    </div>
                )}

                {loading ? <NewsSkeleton /> : featured ? (
                    <div className="mt-8" data-reveal>
                        <ArticleCard article={featured} featured />
                        {remaining.length > 0 && (
                            <div className="mt-6 grid gap-px border border-forest-950/8 bg-forest-950/8 sm:grid-cols-2 lg:grid-cols-3">
                                {remaining.map((article) => <ArticleCard key={article.url} article={article} />)}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mt-8 border border-forest-950/8 bg-sage-50 p-7 text-center sm:p-12" data-reveal>
                        <Newspaper size={40} weight="BoldDuotone" className="mx-auto text-forest-800" />
                        <h3 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-forest-950">No fresh local headlines were returned.</h3>
                        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-stone-500">Try the country name or a larger nearby city. The news service may also be temporarily busy.</p>
                    </div>
                )}

                <div className="mt-16" data-reveal>
                    <div className="eyebrow"><Globe2 size={16} weight="BoldDuotone" /> Trusted reading</div>
                    <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-forest-950">Broader agricultural sources</h2>
                    <div className="mt-7 grid gap-px border border-forest-950/8 bg-forest-950/8 md:grid-cols-3">
                        {trustedResources.map((resource) => (
                            <a key={resource.name} href={resource.url} target="_blank" rel="noreferrer" className="premium-card group flex items-center justify-between gap-4 border-0 p-5">
                                <span><span className="block text-sm font-bold text-forest-950">{resource.name}</span><span className="mt-1 block text-xs text-stone-400">{resource.detail}</span></span>
                                <ArrowUpRight size={19} className="shrink-0 text-forest-700 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            </a>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

function ArticleCard({ article, featured = false }) {
    const [imageFailed, setImageFailed] = useState(false);
    const sourceDetails = [article.source_country, article.language].filter(Boolean).join(' · ');

    if (featured) {
        return (
            <article className="premium-card group overflow-hidden">
                <a href={article.url} target="_blank" rel="noreferrer" className="grid min-h-[380px] lg:grid-cols-[1.12fr_.88fr]">
                    <ArticleImage article={article} imageFailed={imageFailed} setImageFailed={setImageFailed} featured />
                    <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
                        <p className="text-[0.66rem] font-bold uppercase tracking-[.14em] text-forest-700">Lead report · {formatDate(article.published_at)}</p>
                        <h3 className="mt-4 font-display text-3xl font-extrabold leading-[1.1] tracking-[-0.04em] text-forest-950 sm:text-4xl">{article.title}</h3>
                        <div className="mt-6 border-l-2 border-lime-400 pl-4 text-xs leading-6 text-stone-500">
                            <p className="font-bold text-forest-900">{article.domain}</p>
                            {sourceDetails && <p>{sourceDetails}</p>}
                        </div>
                        <span className="mt-8 inline-flex items-center gap-2 text-sm font-extrabold text-forest-700">Open full report at source <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                    </div>
                </a>
            </article>
        );
    }

    return (
        <article className="premium-card group overflow-hidden border-0">
            <a href={article.url} target="_blank" rel="noreferrer" className="flex h-full flex-col">
                <ArticleImage article={article} imageFailed={imageFailed} setImageFailed={setImageFailed} />
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center justify-between gap-3 text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">
                        <span className="truncate">{article.domain}</span>
                        <span className="shrink-0">{formatDate(article.published_at, { year: undefined })}</span>
                    </div>
                    <h3 className="mt-3 font-display text-lg font-extrabold leading-snug tracking-[-0.025em] text-forest-950">{article.title}</h3>
                    {sourceDetails && <p className="mt-3 text-[0.68rem] font-medium text-stone-400">{sourceDetails}</p>}
                    <span className="mt-auto flex items-center gap-2 pt-6 text-xs font-bold text-forest-700">Open full report <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></span>
                </div>
            </a>
        </article>
    );
}

function ArticleImage({ article, imageFailed, setImageFailed, featured = false }) {
    return (
        <div className={`relative overflow-hidden bg-sage-100 ${featured ? 'min-h-[260px]' : 'aspect-[16/9]'}`}>
            {article.image && !imageFailed ? (
                <img src={article.image} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.035]" onError={() => setImageFailed(true)} loading={featured ? 'eager' : 'lazy'} referrerPolicy="no-referrer" />
            ) : (
                <div className="grid h-full place-items-center bg-gradient-to-br from-sage-100 to-lime-100 text-forest-700"><Newspaper size={42} weight="BoldDuotone" /></div>
            )}
        </div>
    );
}

function NewsSkeleton() {
    return (
        <div className="mt-8 grid gap-px border border-stone-100 bg-stone-100 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
            {[1, 2, 3, 4, 5, 6].map((item) => (
                <div key={item} className="overflow-hidden bg-white">
                    <div className="skeleton aspect-[16/9]" />
                    <div className="p-5"><div className="skeleton h-3 w-1/3" /><div className="skeleton mt-4 h-5" /><div className="skeleton mt-2 h-5 w-4/5" /></div>
                </div>
            ))}
        </div>
    );
}
