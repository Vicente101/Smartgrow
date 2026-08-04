import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
    const [location, setLocation] = useState(() => ({ pathname: window.location.pathname, search: window.location.search }));

    useEffect(() => {
        const onPopState = () => setLocation({ pathname: window.location.pathname, search: window.location.search });
        window.addEventListener('popstate', onPopState);
        return () => window.removeEventListener('popstate', onPopState);
    }, []);

    const value = useMemo(() => ({
        location,
        navigate(to, { replace = false } = {}) {
            if (replace) window.history.replaceState({}, '', to);
            else window.history.pushState({}, '', to);
            setLocation({ pathname: window.location.pathname, search: window.location.search });
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

    return <a href={to} onClick={follow} {...props}>{children}</a>;
}

export function NavLink({ to, className, children, ...props }) {
    const { pathname } = useLocation();
    const isActive = to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);
    const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
    return <Link to={to} className={resolvedClassName} aria-current={isActive ? 'page' : undefined} {...props}>{children}</Link>;
}
