from database import execute_query
import uuid
from datetime import datetime, timedelta

def seed_database():
    print("Ensuring tables exist...")
    
    # Ensure tables exist (specifically the new ones)
    execute_query("""
    CREATE TABLE IF NOT EXISTS staff (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('reception', 'admin') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    execute_query("""
    CREATE TABLE IF NOT EXISTS service_catalog (
        id VARCHAR(50) PRIMARY KEY,
        type ENUM('room-service', 'housekeeping', 'transport') NOT NULL,
        category VARCHAR(100),
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) DEFAULT 0.00,
        icon VARCHAR(50),
        available BOOLEAN DEFAULT TRUE
    )
    """)
    
    execute_query("""
    CREATE TABLE IF NOT EXISTS wifi_zones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        floor INT NOT NULL UNIQUE,
        ssid VARCHAR(100) NOT NULL,
        password VARCHAR(100) NOT NULL,
        location_description TEXT
    )
    """)

    print("Seeding database...")
    
    # 1. Add Guests
    guests = [
        ('1', 'Juan', 'Pérez', 'CC', '1234567890', 'juan@example.com', '3001234567', 'Colombia'),
        ('2', 'Maria', 'Garcia', 'CE', '987654321', 'maria@example.com', '3109876543', 'España'),
        ('3', 'John', 'Doe', 'PA', 'A1234567', 'john@example.com', '+15550001', 'USA'),
        ('4', 'Ana', 'Martinez', 'CC', '1020304050', 'ana@example.com', '3201112233', 'Colombia')
    ]
    for g in guests:
        execute_query("REPLACE INTO guests (id, first_name, last_name, document_type, document_number, email, phone, country) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", g)

    # 2. Add Rooms
    rooms = [
        ('101', '101', 1, 'standard', 'occupied', 150.00, 2, 'WiFi, TV, AC'),
        ('102', '102', 1, 'deluxe', 'available', 250.00, 2, 'WiFi, TV, AC, Minibar'),
        ('103', '103', 1, 'standard', 'cleaning', 150.00, 2, 'WiFi, TV, AC'),
        ('201', '201', 2, 'suite', 'available', 450.00, 4, 'WiFi, TV, AC, Minibar, Jacuzzi'),
        ('202', '202', 2, 'standard', 'maintenance', 150.00, 2, 'WiFi, TV'),
        ('301', '301', 3, 'presidential', 'available', 1200.00, 6, 'All Amenities, Private Pool')
    ]
    for r in rooms:
        execute_query("REPLACE INTO rooms (id, number, floor, type, status, price_per_night, capacity, amenities) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", r)

    # 3. Add Reservations
    res_data = [
        ('res-123', '1', '101', datetime.now() - timedelta(days=1), datetime.now() + timedelta(days=2), 'checked-in', 450.00, 'Allergic to peanuts'),
        ('res-456', '2', '201', datetime.now() - timedelta(days=5), datetime.now() - timedelta(days=1), 'checked-out', 1800.00, 'Stayed for business'),
        ('res-789', '4', '103', datetime.now() + timedelta(days=2), datetime.now() + timedelta(days=5), 'confirmed', 450.00, 'Anniversary trip')
    ]
    
    for rd in res_data:
        execute_query("""
            REPLACE INTO reservations (id, guest_id, room_id, check_in, check_out, status, total_amount, notes)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, rd)

    # 4. Add Service Requests
    services = [
        (str(uuid.uuid4()), 'res-123', '101', 'Juan Pérez', 'room-service', 'completed', 'Desayuno continental', 'medium', datetime.now() - timedelta(hours=5)),
        (str(uuid.uuid4()), 'res-123', '101', 'Juan Pérez', 'housekeeping', 'pending', 'Toallas extras', 'low', datetime.now() - timedelta(minutes=30))
    ]
    for s in services:
        execute_query("""
            INSERT INTO service_requests (id, reservation_id, room_number, guest_name, type, status, details, priority, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, s)

    # 5. Add initial notifications
    notifications = [
        (str(uuid.uuid4()), 'res-123', '101', 'Bienvenido', 'Gracias por elegir Hotel Robles. Disfrute su estadía.', 'info'),
        (str(uuid.uuid4()), 'res-123', '101', 'Cena Especial', 'Hoy tenemos 20% de descuento en el restaurante.', 'success'),
        (str(uuid.uuid4()), None, None, 'Mantenimiento de Piscina', 'La piscina estará cerrada mañana de 8am a 12pm por mantenimiento.', 'warning')
    ]
    for n in notifications:
        execute_query("INSERT INTO notifications (id, reservation_id, room_number, title, message, type) VALUES (%s, %s, %s, %s, %s, %s)", n)

    # 6. Some Messages
    messages = [
        (str(uuid.uuid4()), 'res-123', '101', 'Hola, ¿a qué hora cierra el gimnasio?', 'guest', datetime.now() - timedelta(hours=2), True),
        (str(uuid.uuid4()), 'res-123', '101', 'El gimnasio está abierto las 24 horas.', 'reception', datetime.now() - timedelta(hours=1, minutes=55), True)
    ]
    for m in messages:
        execute_query("""
            INSERT INTO messages (id, reservation_id, room_number, content, sender, timestamp, is_read)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, m)

    # 7. Add Service Catalog
    catalog = [
        # Room Service
        ('rs-1', 'room-service', 'Desayunos', 'Continental', 'Café, jugo, pan y mermelada', 25000.00, 'utensils', True),
        ('rs-2', 'room-service', 'Desayunos', 'Americano', 'Huevos, tocino, café y jugo', 32000.00, 'utensils', True),
        ('rs-3', 'room-service', 'Almuerzos', 'Hamburguesa Robles', 'Angus, queso cheddar, cebolla caramelizada', 45000.00, 'pizza', True),
        ('rs-4', 'room-service', 'Bebidas', 'Limonada Natural', 'Refrescante limonada frapé', 12000.00, 'drink', True),
        
        # Housekeeping
        ('hk-1', 'housekeeping', 'Limpieza', 'Limpieza Completa', 'Aseo profundo de toda la habitación', 0.00, 'cleaning', True),
        ('hk-2', 'housekeeping', 'Suministros', 'Nuevas Toallas', 'Juego de toallas limpias', 0.00, 'towel', True),
        ('hk-3', 'housekeeping', 'Suministros', 'Amenities Extra', 'Jabón, shampoo y cremas', 0.00, 'amenities', True),
        
        # Transport
        ('tr-1', 'transport', 'Traslados', 'Aeropuerto', 'Servicio de recogida/entrega al aeropuerto', 80000.00, 'plane', True),
        ('tr-2', 'transport', 'Ciudad', 'Taxi Privado', 'Transporte a cualquier punto de la ciudad', 35000.00, 'car', True)
    ]
    for c in catalog:
        execute_query("""
            REPLACE INTO service_catalog (id, type, category, name, description, price, icon, available)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, c)

    # 8. WiFi Zones
    wifi = [
        (1, 'Robles_Lobby_Guest', 'HotelRobles2024*', 'Primer piso y lobby'),
        (2, 'Robles_Guest_F2', 'Floor2Secure!', 'Segundo piso pasillos'),
        (3, 'Robles_Guest_F3', 'Floor3Secure!', 'Tercer piso pasillos')
    ]
    for w in wifi:
        execute_query("""
            REPLACE INTO wifi_zones (floor, ssid, password, location_description)
            VALUES (%s, %s, %s, %s)
        """, w)

    # 9. Staff
    staff = [
        ('st-1', 'Admin Robles', 'admin@robles.com', 'admin123', 'admin'),
        ('st-2', 'Recepcion 1', 'recepcion@robles.com', 'recepcion123', 'reception')
    ]
    for s in staff:
        execute_query("""
            REPLACE INTO staff (id, name, email, password, role)
            VALUES (%s, %s, %s, %s, %s)
        """, s)

    print("Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
