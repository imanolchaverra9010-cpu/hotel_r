-- Información del hotel (contacto, redes). Una sola fila (id=1).
CREATE TABLE IF NOT EXISTS hotel_info (
    id INT PRIMARY KEY DEFAULT 1,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    whatsapp VARCHAR(50),
    facebook_url TEXT,
    instagram_url TEXT,
    twitter_url TEXT,
    opening_hours VARCHAR(255)
);

-- Insertar fila por defecto si no existe
-- MySQL:
-- INSERT IGNORE INTO hotel_info (id, phone, email, address, whatsapp, opening_hours)
-- VALUES (1, '310 437 4492', 'hotelroble@hotmail.com', 'Hotel Los Robles, Cl. 28 #314 a 3-174, Quibdó, Chocó', '+573104374492', '24 horas, 7 días a la semana');
-- PostgreSQL:
-- INSERT INTO hotel_info (id, phone, email, address, whatsapp, opening_hours)
-- VALUES (1, '310 437 4492', 'hotelroble@hotmail.com', 'Hotel Los Robles, Cl. 28 #314 a 3-174, Quibdó, Chocó', '+573104374492', '24 horas, 7 días a la semana')
-- ON CONFLICT (id) DO NOTHING;
-- Si no insertas la fila, el backend crea la fila al guardar desde el panel.
