import React, { useState } from 'react';
import { ArrowRight, ArrowUpRight, CheckCircle2, Globe2, LoaderCircle, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from '../icons';

const contactEmail = 'vluhanga64@gmail.com';
const developerContactUrl = 'https://vicente101.github.io/Vincent-Luhanga/contact';

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
            if (form.website) return;
            const message = [
                `Name: ${form.name}`,
                `Reply email: ${form.email}`,
                `Location: ${form.location || 'Not supplied'}`,
                '',
                form.message,
            ].join('\n');
            const mailto = `mailto:${contactEmail}?subject=${encodeURIComponent(`[Munda] ${form.subject}`)}&body=${encodeURIComponent(message)}`;
            window.location.href = mailto;
            setSuccess('Your email draft has been opened. Review it in your email app and press Send.');
        } catch (requestError) {
            setError(requestError.message || `Could not open your email app. Email ${contactEmail} directly.`);
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="page-shell py-12 sm:py-18" data-reveal>
            <div className="grid overflow-hidden border border-forest-950/8 bg-white shadow-[0_24px_85px_rgba(30,67,50,.10)] lg:grid-cols-[.76fr_1.24fr]">
                <aside className="relative overflow-hidden bg-forest-950 p-7 text-white sm:p-10">
                    <div className="absolute -bottom-32 -left-20 size-96 rounded-full bg-lime-300/10 blur-3xl" />
                    <div className="relative">
                        <div className="eyebrow eyebrow-light"><MessageCircle size={16} weight="BoldDuotone" /> Let’s talk</div>
                        <h1 className="mt-6 font-display text-4xl font-extrabold leading-tight tracking-[-0.05em] sm:text-5xl">Help us make field decisions clearer.</h1>
                        <p className="mt-5 text-sm leading-7 text-white/58">Share feedback, report a data issue, or ask about adapting Munda for an agricultural programme.</p>

                        <div className="mt-10 divide-y divide-white/10 border-y border-white/10">
                            <ContactDetail icon={Mail} label="Email" value={contactEmail} href={`mailto:${contactEmail}`} />
                            <ContactDetail icon={MessageCircle} label="WhatsApp" value="+260 768 891 429" href="https://wa.me/260768891429" external />
                            <ContactDetail icon={Phone} label="Call" value="0963 659 222" href="tel:0963659222" />
                            <ContactDetail icon={Phone} label="Alternative line" value="0955 334 043" href="tel:0955334043" />
                            <ContactDetail icon={MapPin} label="Based in" value="Ndola, Zambia" />
                        </div>

                        <a href={developerContactUrl} target="_blank" rel="noreferrer" className="group mt-7 inline-flex items-center gap-3 border-b border-lime-300/50 pb-2 text-sm font-bold text-lime-200 transition-colors hover:text-white">
                            <Globe2 size={21} weight="BoldDuotone" /> Contact the developer <ArrowUpRight size={17} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </a>
                        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-white/42"><ShieldCheck size={17} weight="BoldDuotone" className="mt-0.5 shrink-0" /> We do not sell location or message data.</p>
                    </div>
                </aside>

                <div className="p-6 sm:p-10 lg:p-12">
                    <p className="text-xs font-bold uppercase tracking-[.15em] text-forest-700/60">Send a message</p>
                    <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-forest-950">What can we help with?</h2>

                    {success && <div className="mt-6 flex items-start gap-3 border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900"><CheckCircle2 size={20} weight="BoldDuotone" className="mt-0.5 shrink-0" /> {success}</div>}
                    {error && <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

                    <form onSubmit={submit} className="mt-7 grid gap-5 sm:grid-cols-2">
                        <Input label="Your name" id="name" value={form.name} onChange={(value) => update('name', value)} required placeholder="Full name" />
                        <Input label="Email address" id="email" type="email" value={form.email} onChange={(value) => update('email', value)} required placeholder="you@example.com" />
                        <Input label="Topic" id="subject" value={form.subject} onChange={(value) => update('subject', value)} required placeholder="Feedback, partnership, data issue…" />
                        <Input label="Location (optional)" id="contact-location" value={form.location} onChange={(value) => update('location', value)} placeholder="Town, country" />
                        <div className="hidden" aria-hidden="true"><input tabIndex="-1" autoComplete="off" value={form.website} onChange={(event) => update('website', event.target.value)} /></div>
                        <div className="sm:col-span-2">
                            <label className="field-label" htmlFor="message">Message</label>
                            <textarea id="message" rows="6" required minLength="10" maxLength="1500" className="field-input mt-2 h-auto resize-y py-3" value={form.message} onChange={(event) => update('message', event.target.value)} placeholder="Tell us what you noticed or what you are trying to achieve." />
                        </div>
                        <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs leading-5 text-stone-400">Your details stay in this browser. The button opens a draft in your email app.</p>
                            <button type="submit" className="button button-dark justify-center" disabled={loading}>
                                {loading ? <><LoaderCircle size={18} className="animate-spin" /> Preparing</> : <>Open email draft <ArrowRight size={18} /></>}
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

function ContactDetail({ icon: Icon, label, value, href, external = false }) {
    const content = (
        <>
            <Icon size={24} weight="BoldDuotone" className="mt-0.5 shrink-0 text-lime-200" />
            <span><span className="block text-[0.63rem] font-bold uppercase tracking-wider text-white/35">{label}</span><span className="mt-1 block text-sm font-medium text-white/78">{value}</span></span>
        </>
    );

    if (href) {
        return <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined} className="flex items-start gap-4 py-4 transition-colors hover:text-lime-200">{content}</a>;
    }

    return <div className="flex items-start gap-4 py-4">{content}</div>;
}
