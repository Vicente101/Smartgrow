import React, { useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    ArrowRight,
    BarChart3,
    CalendarDays,
    Check,
    ChevronDown,
    ChevronRight,
    CloudRain,
    Crosshair,
    Database,
    Download,
    Droplets,
    FlaskConical,
    Gauge,
    LoaderCircle,
    MapPin,
    Navigation,
    RefreshCw,
    ShieldCheck,
    Sparkles,
    Sprout,
    ThermometerSun,
    Waves,
    Wind,
} from '../icons';
import { readStoredAdvice } from '../lib/api';
import { useLocation } from '../lib/router';
import { buildAdvice } from '../services/advisor';
import { searchLocations } from '../services/location';
import WeatherGlyph from '../components/WeatherGlyph';

const monthNames = Array.from({ length: 12 }, (_, index) => new Date(2024, index, 1).toLocaleString('en', { month: 'long' }));

export default function Advisor() {
    const routeLocation = useLocation();
    const initialLocation = new URLSearchParams(routeLocation.search).get('location') || '';
    const [form, setForm] = useState({
        location: initialLocation,
        month: new Date().getMonth() + 1,
        soil_type: 'unknown',
        irrigation: 'none',
    });
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [suggesting, setSuggesting] = useState(false);
    const [locating, setLocating] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(() => readStoredAdvice());
    const [saved, setSaved] = useState(false);
    const resultRef = useRef(null);

    useEffect(() => {
        if (form.location.trim().length < 2 || selectedLocation?.label === form.location) {
            setSuggestions([]);
            return undefined;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setSuggesting(true);
            try {
                const locations = await searchLocations(form.location.trim(), { signal: controller.signal });
                setSuggestions(locations);
            } catch (requestError) {
                if (requestError.name !== 'AbortError') setSuggestions([]);
            } finally {
                setSuggesting(false);
            }
        }, 350);

        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [form.location, selectedLocation]);

    function updateField(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
        if (field === 'location') setSelectedLocation(null);
    }

    function chooseLocation(location) {
        setSelectedLocation(location);
        setForm((current) => ({ ...current, location: location.label }));
        setSuggestions([]);
    }

    function useCurrentLocation() {
        setError('');
        if (!navigator.geolocation) {
            setError('This browser does not provide location access. Enter your nearest town instead.');
            return;
        }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const location = {
                    label: 'Current farm location',
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                };
                setSelectedLocation(location);
                setForm((current) => ({ ...current, location: location.label }));
                setLocating(false);
            },
            () => {
                setError('Location permission was not available. Enter your nearest town or district instead.');
                setLocating(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
        );
    }

    async function submit(event) {
        event.preventDefault();
        if (!form.location.trim() && !selectedLocation) {
            setError('Enter your town or use your current location first.');
            return;
        }

        setLoading(true);
        setError('');
        setSaved(false);

        try {
            const payload = {
                ...form,
                month: Number(form.month),
                ...(selectedLocation?.latitude != null
                    ? { latitude: selectedLocation.latitude, longitude: selectedLocation.longitude }
                    : {}),
            };
            const advice = await buildAdvice(payload);
            setResult(advice);
            localStorage.setItem('munda:last-advice', JSON.stringify(advice));
            setSaved(true);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <section className="overflow-hidden border-b border-forest-950/8 bg-sage-50">
                <div className="page-shell grid gap-10 py-14 lg:grid-cols-[.8fr_1.2fr] lg:items-end lg:py-18" data-reveal>
                    <div>
                        <div className="eyebrow"><Sparkles size={14} /> Crop advisor</div>
                        <h1 className="mt-5 font-display text-5xl font-extrabold leading-[.98] tracking-[-0.06em] text-forest-950 sm:text-6xl">Read your season.</h1>
                        <p className="mt-5 max-w-xl text-base leading-8 text-stone-600">Tell us where and when you plan to grow. We’ll compare the season against practical requirements for 18 crops.</p>
                    </div>
                    <div className="hidden items-center justify-end gap-6 text-xs font-bold uppercase tracking-[.12em] text-forest-800/55 sm:flex">
                        <span className="flex items-center gap-2"><Database size={15} /> Historical climate</span>
                        <span className="h-4 w-px bg-forest-950/12" />
                        <span className="flex items-center gap-2"><CloudRain size={15} /> Live forecast</span>
                        <span className="h-4 w-px bg-forest-950/12" />
                        <span className="flex items-center gap-2"><FlaskConical size={15} /> Explainable score</span>
                    </div>
                </div>
            </section>

            <section className="page-shell py-9 lg:py-12">
                <form onSubmit={submit} className="border border-forest-950/9 bg-white p-5 shadow-[0_18px_65px_rgba(30,67,50,.08)] sm:p-7" data-reveal>
                    <div className="grid gap-5 lg:grid-cols-[1.45fr_.65fr_.75fr_.75fr_auto] lg:items-end">
                        <div className="relative">
                            <label className="field-label" htmlFor="advisor-location">Farm location</label>
                            <div className="relative mt-2">
                                <MapPin size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700" />
                                <input
                                    id="advisor-location"
                                    className="field-input pl-10 pr-12"
                                    value={form.location}
                                    onChange={(event) => updateField('location', event.target.value)}
                                    placeholder="Town, district, or province"
                                    autoComplete="off"
                                />
                                <button type="button" className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center text-forest-700 transition-transform hover:scale-105" onClick={useCurrentLocation} aria-label="Use current location">
                                    {locating ? <LoaderCircle size={16} className="animate-spin" /> : <Crosshair size={16} />}
                                </button>
                            </div>
                            {(suggestions.length > 0 || suggesting) && (
                                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-forest-950/10 bg-white p-1.5 shadow-2xl">
                                    {suggesting && suggestions.length === 0 ? (
                                        <div className="flex items-center gap-2 px-3 py-3 text-xs font-medium text-stone-400"><LoaderCircle size={14} className="animate-spin" /> Finding places…</div>
                                    ) : suggestions.map((location) => (
                                        <button key={`${location.latitude}:${location.longitude}`} type="button" onClick={() => chooseLocation(location)} className="flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left hover:bg-sage-50">
                                            <Navigation size={15} className="mt-0.5 shrink-0 text-forest-700" />
                                            <span>
                                                <span className="block text-sm font-bold text-forest-950">{location.name}</span>
                                                <span className="mt-0.5 block text-xs text-stone-400">{[location.admin1, location.country].filter(Boolean).join(', ')}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <SelectField label="Planting month" id="month" value={form.month} onChange={(value) => updateField('month', value)} options={monthNames.map((name, index) => [index + 1, name])} />
                        <SelectField label="Soil type" id="soil" value={form.soil_type} onChange={(value) => updateField('soil_type', value)} options={[
                            ['unknown', 'Not sure'], ['sandy', 'Sandy'], ['loamy', 'Loamy'], ['clay', 'Clay'], ['silty', 'Silty'], ['peaty', 'Peaty'], ['chalky', 'Chalky'],
                        ]} />
                        <SelectField label="Water access" id="irrigation" value={form.irrigation} onChange={(value) => updateField('irrigation', value)} options={[
                            ['none', 'Rain-fed'], ['supplemental', 'Some irrigation'], ['reliable', 'Reliable irrigation'],
                        ]} />

                        <button type="submit" className="button button-dark h-[50px] justify-center whitespace-nowrap px-5" disabled={loading}>
                            {loading ? <><LoaderCircle size={17} className="animate-spin" /> Analysing</> : <>Analyse season <ArrowRight size={17} /></>}
                        </button>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button type="button" className="inline-flex items-center gap-2 text-left text-xs font-bold text-forest-700 hover:text-forest-950" onClick={useCurrentLocation}>
                            <Crosshair size={14} /> Use my device location
                        </button>
                        <p className="text-[0.7rem] text-stone-400">Coordinates are used only to fetch local climate data.</p>
                    </div>
                </form>

                {error && (
                    <div className="mt-5 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800" role="alert">
                        <AlertCircle size={18} className="mt-0.5 shrink-0" /> {error}
                    </div>
                )}
            </section>

            <div ref={resultRef}>
                {loading && <AnalysisSkeleton />}
                {!loading && result ? <Results result={result} saved={saved} rerun={() => window.scrollTo({ top: 0, behavior: 'smooth' })} /> : !loading && <AdvisorEmpty />}
            </div>
        </>
    );
}

function SelectField({ label, id, value, onChange, options }) {
    return (
        <div>
            <label className="field-label" htmlFor={id}>{label}</label>
            <div className="relative mt-2">
                <select id={id} className="field-input appearance-none pr-9" value={value} onChange={(event) => onChange(event.target.value)}>
                    {options.map(([optionValue, name]) => <option key={optionValue} value={optionValue}>{name}</option>)}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            </div>
        </div>
    );
}

function Results({ result, saved, rerun }) {
    const topCrop = result.recommendations?.[0];
    const forecast = result.weather;
    const climateMonth = result.climate.selected_month;

    function printReport() {
        window.print();
    }

    return (
        <section className="page-shell pb-10 print:pt-6">
            <div className="overflow-hidden bg-forest-950 text-white shadow-[0_26px_90px_rgba(17,53,39,.18)]" data-reveal>
                <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center lg:p-10">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="status-pill status-pill-lime"><MapPin size={13} /> {result.location.label}</span>
                            <span className="status-pill"><CalendarDays size={13} /> {result.planting_month.name}</span>
                            <span className="status-pill"><Gauge size={13} /> {result.confidence.level} confidence</span>
                        </div>
                        <p className="mt-7 text-xs font-bold uppercase tracking-[.17em] text-lime-200">Your strongest current match</p>
                        <h2 className="mt-2 font-display text-4xl font-extrabold tracking-[-0.055em] sm:text-5xl">{topCrop?.name || 'Season analysis'}</h2>
                        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">{topCrop?.description}</p>
                    </div>
                    <div className="flex items-center gap-5 lg:flex-col lg:items-end">
                        {topCrop && <ScoreRing score={topCrop.score} dark />}
                        <div className="flex gap-2 print:hidden">
                            <button type="button" className="icon-button-dark" onClick={printReport} aria-label="Print or save report"><Download size={17} /></button>
                            <button type="button" className="icon-button-dark" onClick={rerun} aria-label="Change inputs"><RefreshCw size={17} /></button>
                        </div>
                    </div>
                </div>
                <div className="grid border-t border-white/10 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric icon={ThermometerSun} label="Typical temperature" value={`${climateMonth.temperature}°C`} />
                    <Metric icon={Droplets} label="Typical monthly rain" value={`${climateMonth.rainfall} mm`} />
                    <Metric icon={Waves} label="Typical humidity" value={`${climateMonth.humidity}%`} />
                    <Metric icon={ShieldCheck} label="Data confidence" value={`${result.confidence.score}/${result.confidence.out_of}`} />
                </div>
            </div>

            {saved && <p className="mt-3 flex items-center justify-end gap-1.5 text-xs font-bold text-forest-700"><Check size={14} /> Report saved on this device</p>}

            {forecast ? <WeatherPanel forecast={forecast} location={result.location} /> : (
                <div className="mt-6 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">The live forecast was unavailable, so this report uses historical monthly climate only.</div>
            )}

            <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <div className="eyebrow"><Sprout size={14} /> Ranked crop shortlist</div>
                    <h2 className="mt-4 font-display text-3xl font-extrabold tracking-[-0.045em] text-forest-950 sm:text-4xl">Fit, trade-offs, and next steps.</h2>
                </div>
                <p className="max-w-md text-xs leading-6 text-stone-400">Scores compare this location and month with each crop’s climate, moisture, and soil requirements.</p>
            </div>

            <div className="mt-8 grid items-start gap-4 lg:grid-cols-2">
                {result.recommendations.map((crop, index) => <CropCard key={crop.id} crop={crop} rank={index + 1} defaultOpen={index === 0} />)}
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
                <ClimateChart months={result.climate.months} selectedMonth={result.planting_month.number} period={result.climate.period} />
                <div className="border border-forest-950/8 bg-sage-50 p-6 sm:p-7" data-reveal>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[.15em] text-forest-700/60">Practical checklist</p>
                            <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-forest-950">Before you plant</h3>
                        </div>
                        <Check size={29} weight="BoldDuotone" className="text-forest-700" />
                    </div>
                    <div className="mt-6 grid gap-3">
                        {result.field_actions.map((action, index) => (
                            <div key={action.title} className="border border-forest-950/7 bg-white p-4">
                                <div className="flex gap-3">
                                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-forest-950 text-[0.65rem] font-bold text-white">{index + 1}</span>
                                    <div>
                                        <p className="text-sm font-bold text-forest-950">{action.title}</p>
                                        <p className="mt-1 text-xs leading-5 text-stone-500">{action.detail}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-8 border border-forest-950/8 bg-white p-5 text-xs leading-6 text-stone-500" data-reveal>
                <span className="font-bold text-forest-900">How this was calculated:</span> {result.methodology.signals.join(', ')}. Data sources: {result.climate.source}{forecast ? ` and ${forecast.source}` : ''}. {result.methodology.disclaimer}
            </div>
        </section>
    );
}

function Metric({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 border-b border-white/10 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:px-7">
            <Icon size={25} weight="BoldDuotone" className="shrink-0 text-lime-200" />
            <div>
                <p className="text-[0.64rem] font-bold uppercase tracking-wider text-white/38">{label}</p>
                <p className="mt-1 font-display text-lg font-bold tracking-tight">{value}</p>
            </div>
        </div>
    );
}

function WeatherPanel({ forecast, location }) {
    const current = forecast.current;
    return (
        <div className="mt-6 overflow-hidden border border-forest-950/8 bg-white" data-reveal>
            <div className="grid lg:grid-cols-[.72fr_1.28fr]">
                <div className="flex items-center justify-between gap-6 bg-sage-50 p-6 sm:p-7">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[.15em] text-forest-700/55">Right now · {location.name}</p>
                        <div className="mt-3 flex items-center gap-4">
                            <WeatherGlyph code={current.weather_code} size={38} className="text-forest-800" />
                            <span className="font-display text-5xl font-extrabold tracking-[-0.06em] text-forest-950">{current.temperature}°</span>
                        </div>
                        <p className="mt-3 text-sm font-bold text-forest-800">{current.condition}</p>
                    </div>
                    <div className="grid gap-3 text-right text-xs text-stone-500">
                        <span className="flex items-center justify-end gap-2"><Waves size={14} /> {current.humidity}% humidity</span>
                        <span className="flex items-center justify-end gap-2"><Wind size={14} /> {current.wind_speed} km/h</span>
                        {current.soil_temperature != null && <span className="flex items-center justify-end gap-2"><ThermometerSun size={14} /> {current.soil_temperature}° soil</span>}
                    </div>
                </div>
                <div className="min-w-0 p-5 sm:p-6">
                    <div className="forecast-scroll flex gap-3 overflow-x-auto pb-2">
                        {forecast.daily.slice(0, 7).map((day, index) => (
                            <div key={day.date} className={`min-w-[112px] flex-1 p-3 text-center ${index === 0 ? 'bg-forest-950 text-white' : 'bg-stone-50 text-forest-950'}`}>
                                <p className={`text-[0.65rem] font-bold uppercase tracking-wider ${index === 0 ? 'text-white/50' : 'text-stone-400'}`}>{index === 0 ? 'Today' : new Date(`${day.date}T12:00:00`).toLocaleDateString('en', { weekday: 'short' })}</p>
                                <WeatherGlyph code={day.weather_code} size={22} className={`mx-auto mt-3 ${index === 0 ? 'text-lime-200' : 'text-forest-700'}`} />
                                <p className="mt-3 text-sm font-extrabold">{Math.round(day.temp_max)}° <span className={index === 0 ? 'text-white/45' : 'text-stone-300'}>{Math.round(day.temp_min)}°</span></p>
                                <p className={`mt-2 flex items-center justify-center gap-1 text-[0.65rem] font-bold ${index === 0 ? 'text-blue-200' : 'text-blue-600'}`}><Droplets size={11} /> {day.rainfall} mm</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function CropCard({ crop, rank, defaultOpen }) {
    const [open, setOpen] = useState(defaultOpen);
    const componentLabels = { temperature: 'Temperature', rainfall: 'Rainfall', humidity: 'Humidity', soil: 'Soil match', near_term: '14-day outlook' };
    const detailsId = `crop-details-${crop.id}`;

    return (
        <article className={`crop-card overflow-hidden border bg-white ${open ? 'is-open border-forest-800/18 shadow-[0_18px_55px_rgba(30,67,50,.09)]' : 'border-forest-950/8'}`} data-reveal>
            <button type="button" onClick={() => setOpen((value) => !value)} className="crop-toggle flex w-full items-center gap-4 p-5 text-left sm:p-6" aria-expanded={open} aria-controls={detailsId}>
                <span className="font-display text-sm font-extrabold text-stone-300">{String(rank).padStart(2, '0')}</span>
                <ScoreRing score={crop.score} small />
                <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="font-display text-xl font-extrabold tracking-tight text-forest-950">{crop.name}</span>
                        <span className={`rating-badge ${crop.score >= 70 ? 'rating-good' : crop.score >= 56 ? 'rating-care' : 'rating-risk'}`}>{crop.rating}</span>
                    </span>
                    <span className="mt-1 block truncate text-xs italic text-stone-400">{crop.scientific_name} · {crop.category}</span>
                </span>
                <span className="ml-1 flex shrink-0 items-center gap-2 text-[0.62rem] font-extrabold uppercase tracking-[.1em] text-stone-400">
                    <span className="hidden sm:inline">{open ? 'Close' : 'Details'}</span>
                    <ChevronDown size={19} className={`transition-transform duration-500 ease-out ${open ? 'rotate-180 text-forest-700' : ''}`} />
                </span>
            </button>

            <div id={detailsId} className={`crop-details-grid ${open ? 'is-open' : ''}`} aria-hidden={!open}>
                <div className="min-h-0 overflow-hidden">
                    <div className="crop-details-content border-t border-forest-950/7 px-5 pb-6 pt-5 sm:px-6">
                        <p className="text-sm leading-7 text-stone-600">{crop.description}</p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-5">
                            {Object.entries(crop.components).map(([key, score]) => (
                                <div key={key}>
                                    <div className="flex items-center justify-between gap-2 text-[0.64rem] font-bold uppercase tracking-wide text-stone-400">
                                        <span>{componentLabels[key]}</span><span>{score}</span>
                                    </div>
                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className="crop-score-bar h-full rounded-full bg-forest-700" style={{ '--score-width': `${score}%` }} /></div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                            <div className="bg-emerald-50 p-4">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-800"><Check size={14} /> Why it fits</p>
                                <ul className="mt-3 grid gap-2 text-xs leading-5 text-emerald-950/70">
                                    {crop.strengths.map((item) => <li key={item}>• {item}</li>)}
                                </ul>
                            </div>
                            <div className="bg-amber-50 p-4">
                                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800"><AlertCircle size={14} /> Watch closely</p>
                                <ul className="mt-3 grid gap-2 text-xs leading-5 text-amber-950/70">
                                    {crop.watchouts.map((item) => <li key={item}>• {item}</li>)}
                                </ul>
                            </div>
                        </div>
                        <div className="mt-5 grid gap-3 border border-forest-950/7 p-4 sm:grid-cols-[auto_auto_1fr]">
                            <MiniFact label="Crop cycle" value={`~${crop.cycle_days} days`} />
                            <MiniFact label="Water need" value={crop.water_need} />
                            <div className="sm:border-l sm:border-forest-950/8 sm:pl-4">
                                <p className="text-[0.63rem] font-bold uppercase tracking-wider text-stone-400">Planting guidance</p>
                                <p className="mt-1 text-xs leading-5 text-forest-900">{crop.planting_note}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
}

function MiniFact({ label, value }) {
    return <div><p className="text-[0.63rem] font-bold uppercase tracking-wider text-stone-400">{label}</p><p className="mt-1 text-sm font-bold capitalize text-forest-950">{value}</p></div>;
}

function ScoreRing({ score, small = false, dark = false }) {
    const size = small ? 'size-12' : 'size-24';
    return (
        <div className={`${size} relative grid shrink-0 place-items-center rounded-full`} style={{ background: `conic-gradient(#b9e65b ${score * 3.6}deg, ${dark ? 'rgba(255,255,255,.12)' : '#edf1ec'} 0deg)` }}>
            <div className={`grid place-items-center rounded-full ${small ? 'size-9' : 'size-[4.75rem]'} ${dark ? 'bg-forest-950' : 'bg-white'}`}>
                <span className={`${small ? 'text-sm' : 'text-2xl'} font-display font-extrabold ${dark ? 'text-white' : 'text-forest-950'}`}>{score}<span className={`${small ? 'hidden' : 'text-[.55rem] text-white/40'}`}>/100</span></span>
            </div>
        </div>
    );
}

function ClimateChart({ months, selectedMonth, period }) {
    const [metric, setMetric] = useState('rainfall');
    const [activeMonth, setActiveMonth] = useState(selectedMonth);
    const metricOptions = {
        rainfall: { label: 'Rainfall', unit: 'mm', icon: Droplets, color: 'bg-blue-600' },
        temperature: { label: 'Temperature', unit: '°C', icon: ThermometerSun, color: 'bg-lime-500' },
        humidity: { label: 'Humidity', unit: '%', icon: Waves, color: 'bg-forest-700' },
    };
    const selectedMetric = metricOptions[metric];
    const active = months.find((month) => month.month === activeMonth) || months[0];
    const maxValue = Math.max(...months.map((month) => Number(month[metric]) || 0), 1);

    useEffect(() => setActiveMonth(selectedMonth), [selectedMonth]);

    return (
        <div className="border border-forest-950/8 bg-white p-6 sm:p-7" data-reveal>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[.15em] text-forest-700/60">Historical context · {period}</p>
                    <h3 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-forest-950">Explore the local climate</h3>
                </div>
                <BarChart3 size={30} weight="BoldDuotone" className="shrink-0 text-blue-700" />
            </div>

            <div className="mt-6 flex flex-wrap gap-5 border-y border-forest-950/8 py-3" aria-label="Chart metric">
                {Object.entries(metricOptions).map(([key, option]) => {
                    const Icon = option.icon;
                    return (
                        <button key={key} type="button" onClick={() => setMetric(key)} className={`flex items-center gap-2 border-b-2 py-2 text-xs font-bold transition-colors ${metric === key ? 'border-forest-800 text-forest-950' : 'border-transparent text-stone-400 hover:text-forest-700'}`} aria-pressed={metric === key}>
                            <Icon size={17} weight="BoldDuotone" /> {option.label}
                        </button>
                    );
                })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-l-2 border-lime-400 pl-4 sm:grid-cols-3" aria-live="polite">
                <div><p className="chart-label">Selected month</p><p className="chart-value">{active?.label}</p></div>
                <div><p className="chart-label">{selectedMetric.label}</p><p className="chart-value">{active?.[metric]} {selectedMetric.unit}</p></div>
                <div><p className="chart-label">Rain days</p><p className="chart-value">{active?.rain_days ?? '—'}</p></div>
            </div>

            <div className="forecast-scroll mt-7 flex h-52 min-w-0 items-end gap-2 overflow-x-auto pb-2 sm:gap-3" role="list" aria-label={`${selectedMetric.label} by month`}>
                {months.map((month) => {
                    const isActive = month.month === activeMonth;
                    const value = Number(month[metric]) || 0;
                    const height = Math.max((value / maxValue) * 100, 3);
                    return (
                        <button
                            key={month.month}
                            type="button"
                            onClick={() => setActiveMonth(month.month)}
                            onMouseEnter={() => setActiveMonth(month.month)}
                            onFocus={() => setActiveMonth(month.month)}
                            className="chart-column flex h-full min-w-[32px] flex-1 flex-col items-center justify-end gap-2"
                            aria-label={`${month.label}: ${value} ${selectedMetric.unit}`}
                            aria-pressed={isActive}
                        >
                            <span className={`text-[0.58rem] font-extrabold ${isActive ? 'text-forest-700' : 'text-stone-300'}`}>{value}</span>
                            <span className="relative flex h-[75%] w-full items-end bg-sage-50">
                                <span className={`chart-bar block w-full ${isActive ? selectedMetric.color : 'bg-sage-200'}`} style={{ height: `${height}%` }} />
                            </span>
                            <span className={`text-[0.62rem] font-bold ${isActive ? 'text-forest-950' : 'text-stone-400'}`}>{month.label.slice(0, 1)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

function AdvisorEmpty() {
    return (
        <section className="page-shell pb-8">
            <div className="grid gap-5 border border-dashed border-forest-900/16 bg-sage-50 p-7 sm:p-10 lg:grid-cols-[auto_1fr_auto] lg:items-center" data-reveal>
                <Sprout size={38} weight="BoldDuotone" className="text-forest-800" />
                <div>
                    <h2 className="font-display text-2xl font-extrabold tracking-tight text-forest-950">Your crop shortlist will appear here.</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">Start with the nearest town. Adding soil type and water access increases the usefulness of your score.</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-forest-700"><ChevronRight size={16} /> Complete the fields above</div>
            </div>
        </section>
    );
}

function AnalysisSkeleton() {
    return (
        <section className="page-shell pb-8" aria-live="polite">
            <div className="bg-forest-950 p-8 text-white sm:p-10">
                <div className="flex items-center gap-3"><LoaderCircle size={22} className="animate-spin text-lime-300" /><span className="font-display text-xl font-bold">Reading local climate and ranking crops…</span></div>
                <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10"><div className="analysis-progress h-full w-1/2 rounded-full bg-lime-300" /></div>
                <p className="mt-4 text-xs text-white/45">This may take a few seconds on the first request; later results are cached.</p>
            </div>
        </section>
    );
}
