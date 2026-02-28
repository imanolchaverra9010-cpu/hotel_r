import { Guest, Room, Reservation, Message, ServiceRequest, Notification, StaffUser } from '@/types/hotel';

export const mockRooms: Room[] = [
  { id: '1', number: '101', floor: 1, type: 'standard', status: 'occupied', pricePerNight: 120, capacity: 2, amenities: ['WiFi', 'TV', 'AC'] },
  { id: '2', number: '102', floor: 1, type: 'standard', status: 'available', pricePerNight: 120, capacity: 2, amenities: ['WiFi', 'TV', 'AC'] },
  { id: '3', number: '103', floor: 1, type: 'deluxe', status: 'cleaning', pricePerNight: 180, capacity: 2, amenities: ['WiFi', 'TV', 'AC', 'Minibar'] },
  { id: '4', number: '201', floor: 2, type: 'deluxe', status: 'occupied', pricePerNight: 180, capacity: 3, amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Balcón'] },
  { id: '5', number: '202', floor: 2, type: 'suite', status: 'available', pricePerNight: 280, capacity: 4, amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Jacuzzi', 'Balcón'] },
  { id: '6', number: '203', floor: 2, type: 'suite', status: 'maintenance', pricePerNight: 280, capacity: 4, amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Jacuzzi', 'Balcón'] },
  { id: '7', number: '301', floor: 3, type: 'presidential', status: 'occupied', pricePerNight: 500, capacity: 6, amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Jacuzzi', 'Balcón', 'Sala', 'Cocina'] },
  { id: '8', number: '302', floor: 3, type: 'suite', status: 'available', pricePerNight: 280, capacity: 4, amenities: ['WiFi', 'TV', 'AC', 'Minibar', 'Jacuzzi'] },
  { id: '9', number: '401', floor: 4, type: 'deluxe', status: 'available', pricePerNight: 180, capacity: 3, amenities: ['WiFi', 'TV', 'AC', 'Minibar'] },
  { id: '10', number: '402', floor: 4, type: 'standard', status: 'available', pricePerNight: 120, capacity: 2, amenities: ['WiFi', 'TV', 'AC'] },
];

export const mockGuests: Guest[] = [
  { id: '1', firstName: 'Carlos', lastName: 'Rodríguez', documentType: 'CC', documentNumber: '1234567890', email: 'carlos@email.com', phone: '+57 300 123 4567', country: 'Colombia' },
  { id: '2', firstName: 'María', lastName: 'González', documentType: 'CC', documentNumber: '0987654321', email: 'maria@email.com', phone: '+57 301 234 5678', country: 'Colombia' },
  { id: '3', firstName: 'John', lastName: 'Smith', documentType: 'PA', documentNumber: 'US123456', email: 'john@email.com', phone: '+1 555 123 4567', country: 'Estados Unidos' },
];

export const mockReservations: Reservation[] = [
  { id: '1', guestId: '1', roomId: '1', checkIn: '2025-01-08', checkOut: '2025-01-15', status: 'checked-in', totalAmount: 840, createdAt: '2025-01-05', notes: 'Preferencia de habitación alta' },
  { id: '2', guestId: '2', roomId: '4', checkIn: '2025-01-09', checkOut: '2025-01-12', status: 'checked-in', totalAmount: 540, createdAt: '2025-01-06' },
  { id: '3', guestId: '3', roomId: '7', checkIn: '2025-01-07', checkOut: '2025-01-14', status: 'checked-in', totalAmount: 3500, createdAt: '2025-01-01', notes: 'VIP - Aniversario' },
];

export const mockMessages: Message[] = [
  { id: '1', reservationId: '1', roomNumber: '101', content: '¡Bienvenido al Hotel Paraíso! ¿En qué podemos ayudarle?', sender: 'reception', timestamp: '2025-01-08T14:00:00', read: true },
  { id: '2', reservationId: '1', roomNumber: '101', content: 'Gracias! ¿A qué hora es el desayuno?', sender: 'guest', timestamp: '2025-01-08T14:30:00', read: true },
  { id: '3', reservationId: '1', roomNumber: '101', content: 'El desayuno es de 6:30am a 10:00am en el restaurante del primer piso.', sender: 'reception', timestamp: '2025-01-08T14:32:00', read: true },
  { id: '4', reservationId: '2', roomNumber: '201', content: '¡Hola! Necesito toallas adicionales por favor.', sender: 'guest', timestamp: '2025-01-09T16:00:00', read: false },
  { id: '5', reservationId: '3', roomNumber: '301', content: '¿Pueden preparar una cena romántica para esta noche?', sender: 'guest', timestamp: '2025-01-09T10:00:00', read: false },
];

export const mockServiceRequests: ServiceRequest[] = [
  { id: '1', reservationId: '1', roomNumber: '101', guestName: 'Carlos Rodríguez', type: 'room-service', status: 'completed', details: 'Desayuno continental para 2 personas', priority: 'medium', createdAt: '2025-01-09T07:30:00', completedAt: '2025-01-09T08:00:00' },
  { id: '2', reservationId: '2', roomNumber: '201', guestName: 'María González', type: 'housekeeping', status: 'pending', details: 'Toallas adicionales y amenidades', priority: 'low', createdAt: '2025-01-09T16:05:00' },
  { id: '3', reservationId: '3', roomNumber: '301', guestName: 'John Smith', type: 'transport', status: 'in-progress', details: 'Taxi al aeropuerto mañana a las 6:00am', priority: 'high', createdAt: '2025-01-09T11:00:00' },
  { id: '4', reservationId: '1', roomNumber: '101', guestName: 'Carlos Rodríguez', type: 'room-service', status: 'pending', details: 'Botella de vino tinto y quesos', priority: 'medium', createdAt: '2025-01-09T18:00:00' },
];

export const mockNotifications: Notification[] = [
  { id: '1', roomNumber: '101', title: 'Bienvenido', message: '¡Bienvenido al Hotel Paraíso! Esperamos que disfrute su estancia.', type: 'info', read: true, createdAt: '2025-01-08T14:00:00' },
  { id: '2', roomNumber: '101', title: 'Servicio Completado', message: 'Su desayuno ha sido entregado. ¡Buen provecho!', type: 'success', read: true, createdAt: '2025-01-09T08:00:00' },
  { id: '3', roomNumber: '101', title: 'Recordatorio', message: 'Mañana es su último día. El checkout es hasta las 12:00pm.', type: 'warning', read: false, createdAt: '2025-01-09T10:00:00' },
  { id: '4', title: 'Mantenimiento Programado', message: 'El gimnasio estará cerrado mañana de 8am a 12pm por mantenimiento.', type: 'info', read: false, createdAt: '2025-01-09T09:00:00' },
];

export const mockStaffUsers: StaffUser[] = [
  { id: '1', name: 'Ana Martínez', email: 'ana@hotel.com', role: 'reception' },
  { id: '2', name: 'Pedro López', email: 'pedro@hotel.com', role: 'admin' },
];

// Menu items for room service
export const roomServiceMenu = [
  { id: '1', category: 'Desayunos', name: 'Desayuno Continental', price: 25000, description: 'Jugo, café, pan, mantequilla, mermelada, fruta' },
  { id: '2', category: 'Desayunos', name: 'Desayuno Americano', price: 35000, description: 'Huevos, tocino, pan, jugo, café, fruta' },
  { id: '3', category: 'Entradas', name: 'Ensalada César', price: 22000, description: 'Lechuga romana, crutones, queso parmesano' },
  { id: '4', category: 'Platos Fuertes', name: 'Filete de Res', price: 65000, description: 'Filete de 300g con papas y vegetales' },
  { id: '5', category: 'Platos Fuertes', name: 'Salmón a la Plancha', price: 55000, description: 'Salmón con arroz y espárragos' },
  { id: '6', category: 'Bebidas', name: 'Botella de Vino Tinto', price: 80000, description: 'Vino tinto de la casa' },
  { id: '7', category: 'Bebidas', name: 'Cerveza', price: 12000, description: 'Cerveza nacional o importada' },
  { id: '8', category: 'Postres', name: 'Torta de Chocolate', price: 18000, description: 'Porción de torta con helado' },
];

export const housekeepingOptions = [
  { id: '1', name: 'Toallas adicionales', icon: 'towel' },
  { id: '2', name: 'Limpieza de habitación', icon: 'cleaning' },
  { id: '3', name: 'Cambio de sábanas', icon: 'bed' },
  { id: '4', name: 'Amenidades (jabón, shampoo)', icon: 'amenities' },
  { id: '5', name: 'Almohadas adicionales', icon: 'pillow' },
  { id: '6', name: 'Cobijas extra', icon: 'blanket' },
];

export const transportOptions = [
  { id: '1', name: 'Taxi al aeropuerto', price: 50000, description: 'Servicio directo al aeropuerto' },
  { id: '2', name: 'Taxi a la ciudad', price: 25000, description: 'Traslado al centro de la ciudad' },
  { id: '3', name: 'Alquiler de auto', price: 150000, description: 'Auto con conductor por día' },
  { id: '4', name: 'Tour por la ciudad', price: 80000, description: 'Recorrido turístico de 4 horas' },
];
