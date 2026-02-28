import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageCarouselProps {
    images: string[];
    className?: string;
    imageClassName?: string;
    rounded?: boolean;
    autoplayMs?: number;
}

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
    images,
    className,
    imageClassName,
    rounded = true,
    autoplayMs,
}) => {
    const [current, setCurrent] = useState(0);
    if (!images || images.length === 0) return null;

    const prev = () => {
        setCurrent((prev) => (prev - 1 + images.length) % images.length);
    };
    const next = () => {
        setCurrent((prev) => (prev + 1) % images.length);
    };

    useEffect(() => {
        if (!autoplayMs || images.length <= 1) return;
        const t = setInterval(() => {
            setCurrent((prev) => (prev + 1) % images.length);
        }, autoplayMs);
        return () => clearInterval(t);
    }, [autoplayMs, images.length]);

    return (
        <div className={`relative w-full overflow-hidden ${rounded ? 'rounded-lg' : ''} ${className || ''}`.trim()}>
            {images.map((src, idx) => (
                <img
                    key={src + idx}
                    src={src}
                    alt={`Room image ${idx + 1}`}
                    loading={idx === current ? "eager" : "lazy"}
                    decoding="async"
                    className={
                        `absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
                            idx === current ? 'opacity-100' : 'opacity-0'
                        } ${imageClassName || ''}`.trim()
                    }
                />
            ))}
            {/* Navigation arrows */}
            <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1 hover:bg-black/50"
                aria-label="Previous image"
            >
                <ChevronLeft size={20} />
            </button>
            <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-1 hover:bg-black/50"
                aria-label="Next image"
            >
                <ChevronRight size={20} />
            </button>
            {/* Dots */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-1">
                {images.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-2 h-2 rounded-full ${idx === current ? 'bg-gold' : 'bg-white/50'} `}
                        aria-label={`Slide ${idx + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};
