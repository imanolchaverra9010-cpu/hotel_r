import { useState, useEffect } from "react";

export function useScrollProgress() {
    const [scrollProgress, setScrollProgress] = useState(0);
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;

            // Calculate scroll progress percentage
            const totalScrollableHeight = documentHeight - windowHeight;
            const progress = (scrollTop / totalScrollableHeight) * 100;

            setScrollProgress(Math.min(progress, 100));
            setScrollY(scrollTop);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial call

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return { scrollProgress, scrollY };
}
