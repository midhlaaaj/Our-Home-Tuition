import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        // Scroll to top on route change
        window.scrollTo(0, 0);
    }, [pathname]);

    useEffect(() => {
        // Prevent browser from restoring scroll position on reload
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }

        // Force scroll to top on mount (initial load/reload)
        window.scrollTo(0, 0);

        return () => {
            if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'auto'; // Restore default behavior on unmount
            }
        };
    }, []);

    return null;
}
