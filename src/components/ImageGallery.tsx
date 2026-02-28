import * as React from "react";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { cn } from "@/lib/utils";

interface ImageGalleryProps {
    images?: string[];
    mainImage: string;
    title: string;
}

export function ImageGallery({ images = [], mainImage, title }: ImageGalleryProps) {
    const allImages = [mainImage, ...images].filter(Boolean);
    const [api, setApi] = React.useState<CarouselApi | null>(null);
    const [activeIndex, setActiveIndex] = React.useState(0);

    React.useEffect(() => {
        if (!api) return;
        const onSelect = () => setActiveIndex(api.selectedScrollSnap());
        onSelect();
        api.on("select", onSelect);
        api.on("reInit", onSelect);
        return () => {
            api.off("select", onSelect);
            api.off("reInit", onSelect);
        };
    }, [api]);

    return (
        <div className="space-y-4">
            <Carousel
                className="w-full"
                opts={{ loop: allImages.length > 1 }}
                setApi={(nextApi) => setApi(nextApi)}
            >
                <CarouselContent className="-ml-0">
                    {allImages.map((src, idx) => (
                        <CarouselItem key={src + idx} className="pl-0">
                            <div className="aspect-video rounded-2xl overflow-hidden shadow-elevated">
                                <img
                                    src={src}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>

            {allImages.length > 1 && (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {allImages.map((img, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={cn(
                                "aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                activeIndex === index ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"
                            )}
                        >
                            <img
                                src={img}
                                alt={`${title} view ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
