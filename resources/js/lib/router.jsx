import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

function readHashLocation() {
    const value = window.location.hash.replace(/^#/, '') || '/';
    const url = new URL(value.startsWith('/') ? value : `/${value}`, window.location.origin);

    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : '/';
    return { pathname, search: url.search };
}

export function RouterProvider({ children }) {
    const [location, setLocation] = useState(readHashLocation);

    useEffect(() => {
        const onHashChange = () => setLocation(readHashLocation());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const value = useMemo(() => ({
        location,
        navigate(to, { replace = false } = {}) {
            const target = to.startsWith('/') ? to : `/${to}`;
            if (replace) {
                window.history.replaceState({}, '', `${window.location.pathname}${window.location.search}#${target}`);
                setLocation(readHashLocation());
            } else {
                window.location.hash = target;
            }
        },
    }), [location]);

    return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
}

export function useLocation() {
    return useContext(RouterContext).location;
}

export function useNavigate() {
    return useContext(RouterContext).navigate;
}

export function Link({ to, onClick, children, ...props }) {
    const navigate = useNavigate();
    function follow(event) {
        onClick?.(event);
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        event.preventDefault();
        navigate(to);
    }

    return <a href={`#${to}`} onClick={follow} {...props}>{children}</a>;
}

export function NavLink({ to, className, children, ...props }) {
    const { pathname } = useLocation();
    const isActive = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
    const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
    return <Link to={to} className={resolvedClassName} aria-current={isActive ? 'page' : undefined} {...props}>{children}</Link>;
}
