import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Layout from './components/Layout';
import Home from './pages/Home';
import Advisor from './pages/Advisor';
import News from './pages/News';
import Contact from './pages/Contact';
import { RouterProvider, useLocation } from './lib/router';

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
            <Layout><Page /></Layout>
        </RouterProvider>
    </React.StrictMode>,
);
