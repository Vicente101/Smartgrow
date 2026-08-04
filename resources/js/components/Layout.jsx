import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { Link, NavLink, useLocation } from '../lib/router';
import Brand from './Brand';

const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Crop advisor', to: '/advisor' },
    { label: 'Local news', to: '/news' },
    { label: 'Contact', to: '/contact' },
];

export default function Layout({ children }) {
    const [open, setOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setOpen(false);
        window.scrollTo({ top: 0, behavior: 'instant' });
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-canvas text-ink selection:bg-lime-200 selection:text-forest-950">
            <header className="sticky top-0 z-50 border-b border-forest-950/7 bg-canvas/90 backdrop-blur-xl">
                <div className="page-shell flex h-[76px] items-center justify-between">
                    <Link to="/" className="rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-700">
                        <Brand />
                    </Link>

                    <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="hidden md:block">
                        <Link to="/advisor" className="button button-dark group">
                            Check my season
                            <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    <button
                        type="button"
                        className="grid size-11 place-items-center rounded-xl border border-forest-950/10 bg-white md:hidden"
                        onClick={() => setOpen((value) => !value)}
                        aria-label={open ? 'Close navigation' : 'Open navigation'}
                        aria-expanded={open}
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {open && (
                    <nav className="page-shell border-t border-forest-950/8 py-4 md:hidden" aria-label="Mobile navigation">
                        <div className="grid gap-1">
                            {navItems.map((item) => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-link px-1 ${isActive ? 'nav-link-active' : ''}`}>
                                    {item.label}
                                </NavLink>
                            ))}
                            <Link to="/advisor" className="button button-dark mt-3 justify-center">Check my season <ArrowUpRight size={16} /></Link>
                        </div>
                    </nav>
                )}
            </header>

            <main>{children}</main>

            <footer className="mt-20 bg-forest-950 text-white">
                <div className="page-shell grid gap-10 py-14 lg:grid-cols-[1.25fr_.7fr_.7fr]">
                    <div className="max-w-md">
                        <Brand light />
                        <p className="mt-5 text-sm leading-7 text-white/58">
                            Clearer planting decisions from local climate history, live forecasts, and practical crop requirements.
                        </p>
                    </div>
                    <div>
                        <p className="footer-heading">Explore</p>
                        <div className="mt-4 grid gap-3 text-sm text-white/65">
                            <Link className="footer-link" to="/advisor">Crop advisor</Link>
                            <Link className="footer-link" to="/news">Agricultural news</Link>
                            <Link className="footer-link" to="/contact">Contact us</Link>
                        </div>
                    </div>
                    <div>
                        <p className="footer-heading">Data sources</p>
                        <div className="mt-4 grid gap-3 text-sm text-white/65">
                            <a className="footer-link" href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a>
                            <a className="footer-link" href="https://power.larc.nasa.gov/" target="_blank" rel="noreferrer">NASA POWER</a>
                            <a className="footer-link" href="https://www.gdeltproject.org/" target="_blank" rel="noreferrer">GDELT Project</a>
                            <a className="footer-link" href="https://news.google.com/" target="_blank" rel="noreferrer">Google News</a>
                        </div>
                    </div>
                </div>
                <div className="border-t border-white/10">
                    <div className="page-shell flex flex-col gap-2 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
                        <p>© {new Date().getFullYear()} Munda Crop Intelligence.</p>
                        <p>Decision support — always verify with local agronomic advice.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
