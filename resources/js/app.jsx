import React, { Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '../css/app.css';
import Layout from './components/Layout';
import { RouterProvider, useLocation } from './lib/router';

const Home = lazy(() => import('./pages/Home'));
const Advisor = lazy(() => import('./pages/Advisor'));
const News = lazy(() => import('./pages/News'));
const Contact = lazy(() => import('./pages/Contact'));

function Page() {
    const { pathname } = useLocation();
    if (pathname === '/advisor') return <Advisor />;
    if (pathname === '/news') return <News />;
    if (pathname === '/contact') return <Contact />;
    return <Home />;
}

createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <RouterProvider>
            <Layout>
                <Suspense fallback={<div className="page-shell grid min-h-[55vh] place-items-center"><p className="text-sm font-bold text-forest-700">Loading Munda…</p></div>}>
                    <Page />
                </Suspense>
            </Layout>
        </RouterProvider>
    </React.StrictMode>,
);
