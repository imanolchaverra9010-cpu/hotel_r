import React, { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ParallaxSectionProps {
    backgroundImage: string;
    speed?: number;
    overlayOpacity?: number;
    className?: string;
    children?: React.ReactNode;
}

export function ParallaxSection({
    backgroundImage,
    speed = 0.5,
    overlayOpacity = 0.4,
    className,
    children,
}: ParallaxSectionProps) {
    const [offset, setOffset] = useState(0);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const handleScroll = () => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const sectionTop = rect.top + scrollY;

            // Calculate offset based on scroll position relative to section
            const relativeScroll = scrollY - sectionTop;
            setOffset(relativeScroll * speed);
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [speed]);

    return (
        <section
            ref={sectionRef}
            className={cn("relative overflow-hidden", className)}
        >
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                    backgroundImage: `url(${backgroundImage})`,
                    transform: `translateY(${offset}px)`,
                    zIndex: -2,
                }}
            />
            <div
                className="absolute inset-0 bg-navy-dark"
                style={{ opacity: overlayOpacity, zIndex: -1 }}
            />
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </section>
    );
}
