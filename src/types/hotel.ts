// Hotel Management System Types

export type DocumentType = 'CC' | 'CE' | 'PA' | 'TI';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning';

export type RoomType = 'standard' | 'deluxe' | 'suite' | 'presidential';

export type ServiceType = 'room-service' | 'housekeeping' | 'transport';

export type ServiceStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

export type UserRole = 'guest' | 'reception' | 'admin';

export type NotificationType = 'info' | 'warning' | 'success' | 'urgent';

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  documentType: DocumentType;
  documentNumber: string;
  email?: string;
  phone?: string;
  country?: string;
}

export interface Room {
  id: string;
  number: string;
  floor: number;
  type: RoomType;
  status: RoomStatus;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
}

export interface Reservation {
  id: string;
  guestId: string;
  guest?: Guest;
  roomId: string;
  roomNumber?: string;
  roomFloor?: number;
  room?: Room;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'checked-in' | 'checked-out' | 'cancelled';
  totalAmount: number;
  notes?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  reservationId: string;
  roomNumber: string;
  content: string;
  sender: 'guest' | 'reception';
  timestamp: string;
  read: boolean;
}

export interface ServiceRequest {
  id: string;
  reservationId: string;
  roomNumber: string;
  guestName: string;
  type: ServiceType;
  status: ServiceStatus;
  details: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  completedAt?: string;
}

export interface Notification {
  id: string;
  reservationId?: string;
  roomNumber?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  type: ServiceType;
  category: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  available: boolean;
}

export interface WiFiInfo {
  ssid: string;
  password: string;
}

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: 'reception' | 'admin';
}
