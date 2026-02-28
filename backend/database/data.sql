USE hotel_robles;

-- Rooms
REPLACE INTO rooms (id, number, floor, type, status, price_per_night, capacity, amenities) VALUES 
('101', '101', 1, 'standard', 'occupied', 150.00, 2, 'WiFi, TV, AC'),
('102', '102', 1, 'deluxe', 'available', 250.00, 2, 'WiFi, TV, AC, Minibar'),
('103', '103', 1, 'standard', 'available', 150.00, 2, 'WiFi, TV, AC'),
('201', '201', 2, 'suite', 'available', 450.00, 4, 'WiFi, TV, AC, Minibar, Jacuzzi'),
('301', '301', 3, 'presidential', 'available', 1200.00, 6, 'All Amenities, Private Pool');

-- Guests
REPLACE INTO guests (id, first_name, last_name, document_type, document_number, email, phone, country) VALUES 
('1', 'Juan', 'Pérez', 'CC', '1234567890', 'juan@example.com', '3001234567', 'Colombia'),
('2', 'Maria', 'Garcia', 'CE', '987654321', 'maria@example.com', '3109876543', 'España');

-- Reservations
REPLACE INTO reservations (id, guest_id, room_id, check_in, check_out, status, total_amount, notes) VALUES 
('res-123', '1', '101', NOW() - INTERVAL 1 DAY, NOW() + INTERVAL 2 DAY, 'checked-in', 450.00, 'Alergia a maní');

-- Notifications
INSERT INTO notifications (id, reservation_id, room_number, title, message, type, is_read) VALUES 
(UUID(), 'res-123', '101', 'Bienvenido', 'Gracias por elegir Hotel Robles.', 'info', FALSE),
(UUID(), 'res-123', '101', 'Oferta', '2x1 en cócteles en el bar.', 'success', FALSE),
(UUID(), NULL, NULL, 'General', 'Check-out es a las 11:00 AM.', 'info', FALSE);

-- Service Catalog
REPLACE INTO service_catalog (id, type, category, name, description, price, icon, available) VALUES
('rs-1', 'room-service', 'Desayunos', 'Continental', 'Café, jugo, pan y mermelada', 25000.00, 'utensils', TRUE),
('rs-2', 'room-service', 'Desayunos', 'Americano', 'Huevos, tocino, café y jugo', 32000.00, 'utensils', TRUE),
('rs-3', 'room-service', 'Almuerzos', 'Hamburguesa Robles', 'Angus, queso cheddar, cebolla caramelizada', 45000.00, 'pizza', TRUE),
('rs-4', 'room-service', 'Bebidas', 'Limonada Natural', 'Refrescante limonada frapé', 12000.00, 'drink', TRUE),
('hk-1', 'housekeeping', 'Limpieza', 'Limpieza Completa', 'Aseo profundo de toda la habitación', 0.00, 'cleaning', TRUE),
('hk-2', 'housekeeping', 'Suministros', 'Nuevas Toallas', 'Juego de toallas limpias', 0.00, 'towel', TRUE),
('hk-3', 'housekeeping', 'Suministros', 'Amenities Extra', 'Jabón, shampoo y cremas', 0.00, 'amenities', TRUE),
('tr-1', 'transport', 'Traslados', 'Aeropuerto', 'Servicio de recogida/entrega al aeropuerto', 80000.00, 'plane', TRUE),
('tr-2', 'transport', 'Ciudad', 'Taxi Privado', 'Transporte a cualquier punto de la ciudad', 35000.00, 'car', TRUE);

-- WiFi Zones
REPLACE INTO wifi_zones (floor, ssid, password, location_description) VALUES
(1, 'Robles_Lobby_Guest', 'HotelRobles2024*', 'Primer piso y lobby'),
(2, 'Robles_Guest_F2', 'Floor2Secure!', 'Segundo piso pasillos'),
(3, 'Robles_Guest_F3', 'Floor3Secure!', 'Tercer piso pasillos');

-- Service Requests (Sample active orders)
REPLACE INTO service_requests (id, reservation_id, room_number, guest_name, type, status, details, priority, created_at) VALUES
('req-1', 'res-123', '101', 'Juan Pérez', 'room-service', 'completed', '1x Americano, 1x Continental', 'medium', NOW() - INTERVAL 2 HOUR),
('req-2', 'res-123', '101', 'Juan Pérez', 'housekeeping', 'pending', 'Limpieza Completa, Nuevas Toallas', 'low', NOW() - INTERVAL 1 HOUR),
('req-3', 'res-123', '101', 'Juan Pérez', 'transport', 'in-progress', 'Taxi Privado - Hora: 14:30 - Destino: Centro Comercial', 'high', NOW() - INTERVAL 30 MINUTE);
