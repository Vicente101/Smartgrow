import React, { useState } from 'react';
import {
    ArrowRight,
    BarChart3,
    CalendarRange,
    Check,
    CloudSun,
    Database,
    Droplets,
    MapPin,
    ShieldCheck,
    Sparkles,
    Sprout,
} from 'lucide-react';
import { Link, useNavigate } from '../lib/router';

const steps = [
    {
        number: '01',
        icon: MapPin,
        title: 'Locate your field',
        text: 'Search any town or use your device location. No account is required.',
    },
    {
        number: '02',
        icon: CloudSun,
        title: 'Read the season',
        text: 'We combine a 14-day outlook with five years of monthly climate patterns.',
    },
    {
        number: '03',
        icon: BarChart3,
        title: 'Compare crop fit',
        text: 'See a ranked shortlist, the reasons behind every score, and field actions.',
    },
];

const months = [
    { label: 'Sep', rain: 10, tone: 'bg-sage-300' },
    { label: 'Oct', rain: 24, tone: 'bg-sage-400' },
    { label: 'Nov', rain: 68, tone: 'bg-lime-400' },
    { label: 'Dec', rain: 91, tone: 'bg-lime-500' },
    { label: 'Jan', rain: 100, tone: 'bg-forest-700' },
    { label: 'Feb', rain: 84, tone: 'bg-forest-600' },
];

export default function Home() {
    const [location, setLocation] = useState('');
    const navigate = useNavigate();

    function startAdvice(event) {
        event.preventDefault();
        navigate(location.trim() ? `/advisor?location=${encodeURIComponent(location.trim())}` : '/advisor');
    }

    return (
        <>
            <section className="relative overflow-hidden bg-forest-950 text-white">
                <div className="absolute inset-0 opacity-20 grain" />
                <div className="absolute -right-28 -top-28 size-[34rem] rounded-full bg-lime-400/12 blur-3xl" />
                <div className="page-shell relative grid min-h-[690px] items-center gap-12 py-16 lg:grid-cols-[1.04fr_.96fr] lg:py-20">
                    <div className="relative z-10">
                        <div className="eyebrow eyebrow-light">
                            <Sparkles size={14} />
                            Climate-smart crop guidance
                        </div>
                        <h1 className="mt-7 max-w-3xl font-display text-[clamp(3.2rem,7vw,6.3rem)] font-extrabold leading-[.93] tracking-[-0.072em]">
                            Plant with the <span className="text-lime-300">season</span>, not against it.
                        </h1>
                        <p className="mt-7 max-w-xl text-base leading-8 text-white/66 sm:text-lg">
                            Turn local weather and long-term climate patterns into a practical crop shortlist you can understand, compare, and act on.
                        </p>

                        <form onSubmit={startAdvice} className="mt-9 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/25 sm:flex-row">
                            <label className="flex min-w-0 flex-1 items-center gap-3 px-3" htmlFor="home-location">
                                <MapPin size={19} className="shrink-0 text-forest-700" />
                                <span className="sr-only">Your town or district</span>
                                <input
                                    id="home-location"
                                    value={location}
                                    onChange={(event) => setLocation(event.target.value)}
                                    className="h-12 min-w-0 flex-1 bg-transparent text-sm font-medium text-ink outline-none placeholder:text-stone-400"
                                    placeholder="Enter your town or district"
                                />
                            </label>
                            <button className="button button-lime h-12 justify-center px-5" type="submit">
                                Check my season <ArrowRight size={17} />
                            </button>
                        </form>
                        <p className="mt-4 flex items-center gap-2 text-xs font-medium text-white/43">
                            <ShieldCheck size={14} /> Free to use · no API keys or sign-up required
                        </p>
                    </div>

                    <div className="relative mx-auto w-full max-w-[570px] lg:ml-auto">
                        <div className="relative aspect-[.91] overflow-hidden rounded-[2rem] border border-white/12 shadow-2xl shadow-black/30">
                            <img src={`${import.meta.env.BASE_URL}images/farm-hero.webp`} alt="Farm workers tending a green field" className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-forest-950/78 via-transparent to-white/5" />
                            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                                <div className="flex items-end justify-between gap-6">
                                    <div>
                                        <p className="text-[0.68rem] font-bold uppercase tracking-[.18em] text-lime-200">A clearer field decision</p>
                                        <p className="mt-2 max-w-[20rem] font-display text-2xl font-bold leading-tight tracking-tight">Climate context before seed goes into the ground.</p>
                                    </div>
                                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lime-300 text-forest-950">
                                        <Sprout size={23} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -left-5 top-10 rounded-2xl border border-white/70 bg-white/94 p-4 text-ink shadow-xl backdrop-blur sm:-left-12">
                            <div className="flex items-center gap-3">
                                <span className="grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600"><CloudSun size={20} /></span>
                                <div>
                                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-stone-400">Forecast window</p>
                                    <p className="mt-1 font-display text-lg font-extrabold tracking-tight">14 days</p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-5 right-4 rounded-2xl border border-white/10 bg-forest-800/95 p-4 shadow-xl backdrop-blur sm:-right-8 sm:bottom-9">
                            <div className="flex items-center gap-3 text-white">
                                <span className="grid size-10 place-items-center rounded-xl bg-lime-300/15 text-lime-200"><Database size={20} /></span>
                                <div>
                                    <p className="text-[0.65rem] font-bold uppercase tracking-wider text-white/45">Climate baseline</p>
                                    <p className="mt-1 font-display text-lg font-extrabold tracking-tight">5 local years</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="border-b border-forest-950/8 bg-white">
                <div className="page-shell grid divide-y divide-forest-950/8 py-2 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    {[
                        ['18', 'adapted crop profiles'],
                        ['5', 'years of climate context'],
                        ['100%', 'explainable scoring'],
                    ].map(([value, label]) => (
                        <div key={label} className="flex items-baseline justify-center gap-3 px-5 py-7">
                            <span className="font-display text-3xl font-extrabold tracking-[-0.05em] text-forest-900">{value}</span>
                            <span className="text-sm font-medium text-stone-500">{label}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="section-space">
                <div className="page-shell">
                    <div className="max-w-2xl">
                        <div className="eyebrow"><Sprout size={14} /> From coordinates to crop choice</div>
                        <h2 className="section-title mt-5">Good advice should show its working.</h2>
                        <p className="section-copy mt-5">Every recommendation is built from visible signals, so you can judge the trade-offs instead of trusting a mystery score.</p>
                    </div>
                    <div className="mt-12 grid gap-4 lg:grid-cols-3">
                        {steps.map(({ number, icon: Icon, title, text }) => (
                            <article key={number} className="premium-card group p-7 sm:p-8">
                                <div className="flex items-center justify-between">
                                    <span className="grid size-12 place-items-center rounded-2xl bg-sage-100 text-forest-800 transition-colors group-hover:bg-lime-300"><Icon size={21} /></span>
                                    <span className="font-display text-sm font-bold text-stone-300">{number}</span>
                                </div>
                                <h3 className="mt-10 font-display text-xl font-extrabold tracking-[-0.035em] text-forest-950">{title}</h3>
                                <p className="mt-3 text-sm leading-7 text-stone-500">{text}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section-space bg-sage-50">
                <div className="page-shell grid items-center gap-14 lg:grid-cols-[.9fr_1.1fr]">
                    <div>
                        <div className="eyebrow"><CalendarRange size={14} /> Season view</div>
                        <h2 className="section-title mt-5">See beyond today’s weather.</h2>
                        <p className="section-copy mt-5">A sunny afternoon does not define a planting month. Munda compares current conditions with the rainfall and temperature pattern your area normally receives.</p>
                        <div className="mt-8 grid gap-4">
                            {[
                                'Choose any planting month — not only today.',
                                'See temperature, rainfall, humidity, soil, and forecast subscores.',
                                'Adjust the result for your soil type and access to irrigation.',
                            ].map((item) => (
                                <div key={item} className="flex items-start gap-3 text-sm font-medium text-forest-900">
                                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lime-300"><Check size={12} strokeWidth={3} /></span>
                                    {item}
                                </div>
                            ))}
                        </div>
                        <Link to="/advisor" className="button button-dark mt-9">Explore the crop advisor <ArrowRight size={16} /></Link>
                    </div>

                    <div className="rounded-[2rem] border border-forest-950/8 bg-white p-5 shadow-[0_24px_80px_rgba(28,62,47,.10)] sm:p-8">
                        <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[.15em] text-stone-400">Season snapshot</p>
                                <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-forest-950">Rainfall pattern</h3>
                            </div>
                            <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700"><Droplets size={15} /> Monthly climate</div>
                        </div>
                        <div className="mt-8 flex h-56 items-end gap-3 sm:gap-5">
                            {months.map((item) => (
                                <div key={item.label} className="flex h-full flex-1 flex-col items-center justify-end gap-3">
                                    <span className="text-[0.65rem] font-bold text-stone-400">{item.rain}%</span>
                                    <div className={`w-full max-w-12 rounded-t-xl ${item.tone}`} style={{ height: `${item.rain}%` }} />
                                    <span className="text-xs font-bold text-stone-500">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 grid gap-3 sm:grid-cols-2">
                            <div className="rounded-2xl bg-forest-950 p-5 text-white">
                                <p className="text-xs font-bold uppercase tracking-wider text-white/45">Best signal</p>
                                <p className="mt-2 font-display text-xl font-bold">Rain onset</p>
                                <p className="mt-2 text-xs leading-5 text-white/55">Plant after dependable soil moisture, not the first isolated shower.</p>
                            </div>
                            <div className="rounded-2xl bg-lime-200 p-5 text-forest-950">
                                <p className="text-xs font-bold uppercase tracking-wider text-forest-800/55">Confidence</p>
                                <p className="mt-2 font-display text-xl font-bold">Evidence-led</p>
                                <p className="mt-2 text-xs leading-5 text-forest-800/65">The result states which data was live, historical, or missing.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section-space">
                <div className="page-shell">
                    <div className="relative overflow-hidden rounded-[2.25rem] bg-forest-900 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
                        <div className="absolute -left-16 -top-24 size-80 rounded-full bg-lime-300/10 blur-3xl" />
                        <div className="absolute -bottom-24 -right-20 size-80 rounded-full bg-sage-300/10 blur-3xl" />
                        <div className="relative mx-auto max-w-2xl">
                            <span className="mx-auto grid size-13 place-items-center rounded-2xl bg-lime-300 text-forest-950"><Sprout size={24} /></span>
                            <h2 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-5xl">Make the next planting decision with context.</h2>
                            <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/58 sm:text-base">Enter a location, choose a month, and receive a ranked, practical shortlist in under a minute.</p>
                            <Link to="/advisor" className="button button-lime mt-8">Build my crop shortlist <ArrowRight size={17} /></Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
