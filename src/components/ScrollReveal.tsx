import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
    children: React.ReactNode;
    animation?: "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "slide-right";
    delay?: number;
    duration?: number;
    className?: string;
    once?: boolean;
}

export function ScrollReveal({
    children,
    animation = "fade-up",
    delay = 0,
    duration = 700,
    className,
    once = true,
}: ScrollRevealProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    if (once) observer.unobserve(entry.target);
                } else if (!once) {
                    setIsVisible(false);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [once]);

    const getAnimationClass = () => {
        if (!isVisible) {
            switch (animation) {
                case "fade-up": return "opacity-0 translate-y-10";
                case "fade-down": return "opacity-0 -translate-y-10";
                case "fade-left": return "opacity-0 translate-x-10";
                case "fade-right": return "opacity-0 -translate-x-10";
                case "scale": return "opacity-0 scale-95";
                case "slide-right": return "opacity-0 -translate-x-full";
                default: return "opacity-0";
            }
        }
        return "opacity-100 translate-y-0 translate-x-0 scale-100";
    };

    return (
        <div
            ref={ref}
            style={{
                transitionDelay: `${delay}ms`,
                transitionDuration: `${duration}ms`,
            }}
            className={cn("transition-all ease-out", getAnimationClass(), className)}
        >
            {children}
        </div>
    );
}
