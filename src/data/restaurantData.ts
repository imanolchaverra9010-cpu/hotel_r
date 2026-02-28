import restaurantMain from "@/assets/restaurant-main.jpg";
import dishGourmet from "@/assets/restaurant-main.jpg"; // Fallback
import barLounge from "@/assets/salon-private.jpg"; // Fallback

export interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: "entrante" | "principal" | "postre" | "bebida";
}

export interface DiningArea {
    id: string;
    name: string;
    description: string;
    image: string;
    schedule: string;
    features: string[];
}

export const diningAreas: DiningArea[] = [
    {
        id: "restaurante-principal",
        name: "Le Grand Restaurant",
        description: "Nuestra joya culinaria donde la alta cocina mediterránea se fusiona con técnicas vanguardistas. Dirigido por el chef estrella Michelin Carlos Mendoza.",
        image: restaurantMain,
        schedule: "13:00 - 16:00 / 20:00 - 23:30",
        features: ["Cocina de autor", "Maridaje de vinos", "Menú degustación", "Vista panorámica"],
    },
    {
        id: "bar-lounge",
        name: "The Golden Hour Bar",
        description: "Un sofisticado bar lounge donde la mixología artesanal se encuentra con un ambiente exclusivo. Cócteles de autor y una selección premium de whiskies y champagnes.",
        image: barLounge,
        schedule: "18:00 - 02:00",
        features: ["Cócteles de autor", "Música en vivo", "Terraza privada", "Carta de puros"],
    },
];

export const signatureDishes: MenuItem[] = [
    {
        id: "foie-gras",
        name: "Foie Gras Mi-Cuit",
        description: "Con reducción de Pedro Ximénez y pan de especias casero",
        price: 38,
        category: "entrante",
    },
    {
        id: "tartar-atun",
        name: "Tartar de Atún Rojo",
        description: "Aguacate, sésamo negro y emulsión de wasabi",
        price: 32,
        category: "entrante",
    },
    {
        id: "wagyu-a5",
        name: "Wagyu A5 Japonés",
        description: "Medallón de 150g con puré trufado y espárragos verdes",
        price: 95,
        category: "principal",
    },
    {
        id: "lubina-salvaje",
        name: "Lubina Salvaje",
        description: "A la sal con verduras de temporada y salsa de azafrán",
        price: 48,
        category: "principal",
    },
    {
        id: "solomillo-iberico",
        name: "Solomillo Ibérico",
        description: "Con foie a la plancha, reducción de oporto y patatas parisinas",
        price: 52,
        category: "principal",
    },
    {
        id: "soufle-chocolate",
        name: "Soufflé de Chocolate",
        description: "Con helado de vainilla Bourbon y crujiente de praliné",
        price: 18,
        category: "postre",
    },
];

export const dishImage = dishGourmet;
