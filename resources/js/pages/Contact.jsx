import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, LoaderCircle, Mail, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '', location: '', website: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    function update(field, value) {
        setForm((current) => ({ ...current, [field]: value }));
    }

    async function submit(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await api('/api/contact', { method: 'POST', body: JSON.stringify(form) });
            setSuccess(response.message);
            setForm({ name: '', email: '', subject: '', message: '', location: '', website: '' });
        } catch (requestError) {
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="page-shell py-12 sm:py-18">
            <div className="grid overflow-hidden rounded-[2rem] border border-forest-950/8 bg-white shadow-[0_24px_85px_rgba(30,67,50,.10)] lg:grid-cols-[.72fr_1.28fr]">
                <aside className="relative overflow-hidden bg-forest-950 p-7 text-white sm:p-10">
                    <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-lime-300/10 blur-3xl" />
                    <div className="relative">
                        <div className="eyebrow eyebrow-light"><MessageCircle size={14} /> Let’s talk</div>
                        <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-5xl">Help us make field decisions clearer.</h1>
                        <p className="mt-5 text-sm leading-7 text-white/58">Share feedback, report a data issue, or ask about adapting Munda for an agricultural programme.</p>

                        <div className="mt-10 grid gap-4">
                            <ContactDetail icon={Mail} label="Email" value="croprecommendation@gmail.com" />
                            <ContactDetail icon={MapPin} label="Based in" value="Ndola, Zambia" />
                            <ContactDetail icon={ShieldCheck} label="Data note" value="We do not sell location or message data." />
                        </div>
                    </div>
                </aside>

                <div className="p-6 sm:p-10 lg:p-12">
                    <p className="text-xs font-bold uppercase tracking-[.15em] text-forest-700/60">Send a message</p>
                    <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-forest-950">What can we help with?</h2>

                    {success && <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900"><CheckCircle2 size={18} className="mt-0.5 shrink-0" /> {success}</div>}
                    {error && <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

                    <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
                        <Input label="Your name" id="name" value={form.name} onChange={(value) => update('name', value)} required placeholder="Full name" />
                        <Input label="Email address" id="email" type="email" value={form.email} onChange={(value) => update('email', value)} required placeholder="you@example.com" />
                        <Input label="Topic" id="subject" value={form.subject} onChange={(value) => update('subject', value)} required placeholder="Feedback, partnership, data issue…" />
                        <Input label="Location (optional)" id="contact-location" value={form.location} onChange={(value) => update('location', value)} placeholder="Town, country" />
                        <div className="hidden" aria-hidden="true"><input tabIndex="-1" autoComplete="off" value={form.website} onChange={(event) => update('website', event.target.value)} /></div>
                        <div className="sm:col-span-2">
                            <label className="field-label" htmlFor="message">Message</label>
                            <textarea id="message" rows="6" required minLength="10" maxLength="5000" className="field-input mt-2 h-auto resize-y py-3" value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="Tell us what you noticed or what you are trying to achieve." />
                        </div>
                        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-stone-400">Messages are stored securely in the application database.</p>
                            <button type="submit" className="button button-dark justify-center" disabled={loading}>
                                {loading ? <><LoaderCircle size={17} className="animate-spin" /> Sending</> : <>Send message <ArrowRight size={17} /></>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </section>
    );
}

function Input({ label, id, type = 'text', value, onChange, ...props }) {
    return <div><label className="field-label" htmlFor={id}>{label}</label><input id={id} type={type} className="field-input mt-2" value={value} onChange={(event) => onChange(event.target.value)} {...props} /></div>;
}

function ContactDetail({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-lime-300/12 text-lime-200"><Icon size={17} /></span>
            <div><p className="text-[0.63rem] font-bold uppercase tracking-wider text-white/35">{label}</p><p className="mt-1 text-sm font-medium text-white/78">{value}</p></div>
        </div>
    );
}
