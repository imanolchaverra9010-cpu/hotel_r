import roomSuite from "@/assets/room-suite.jpg";
import roomDeluxe from "@/assets/room-deluxe.jpg";
import roomStandard from "@/assets/room-standard.jpg";

export interface Room {
  id: string;
  number: string;

  type: string;
  status: string;
  price_per_night: number;
  capacity: number;
  amenities: string;
  image?: string; // Optional for fallback
  gallery?: string[];
}

export interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  document_type: string;
  document_number: string;
  email?: string;
  phone?: string;
  country?: string;
}

export interface Reservation {
  id: string;
  guest_id: string;
  room_id: string;
  check_in: string;
  check_out: string;
  status: "confirmed" | "checked-in" | "checked-out" | "cancelled";
  total_amount: number;
  notes?: string;
  created_at: string;
}

export interface Venue {
  id: string;
  name: string;
  description: string;
  pricePerHour: number;
  capacity: number;
  size: number;
  features: string[];
  image: string;
  gallery?: string[];
}

// Static data for fallback
export const rooms: Room[] = [
  {
    id: "101",
    number: "101",

    type: "standard",
    status: "occupied",
    price_per_night: 150.00,
    capacity: 2,
    amenities: "WiFi, TV, AC",
    image: roomStandard,
    gallery: [roomDeluxe, roomSuite],
  },
  {
    id: "102",
    number: "102",

    type: "deluxe",
    status: "available",
    price_per_night: 250.00,
    capacity: 2,
    amenities: "WiFi, TV, AC, Minibar",
    image: roomDeluxe,
    gallery: [roomStandard, roomSuite],
  },
  {
    id: "301",
    number: "301",

    type: "presidential",
    status: "available",
    price_per_night: 1200.00,
    capacity: 6,
    amenities: "Todas las Comodidades, Piscina Privada",
    image: roomSuite,
    gallery: [roomStandard, roomDeluxe],
  },
];

export const venues = []; // Not present in the new schema
export const mockReservations: any[] = []; // Schema changed too much for simple mock mapping right now
