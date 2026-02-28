CREATE DATABASE IF NOT EXISTS hotel_robles;
USE hotel_robles;

-- Guests Table
CREATE TABLE IF NOT EXISTS guests (
    id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    document_type ENUM('CC', 'CE', 'PA', 'TI') NOT NULL,
    document_number VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    country VARCHAR(100),
    UNIQUE(document_type, document_number)
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id VARCHAR(50) PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    floor INT NOT NULL,
    type ENUM('standard', 'deluxe', 'suite', 'presidential') NOT NULL,
    status ENUM('available', 'occupied', 'maintenance', 'cleaning') DEFAULT 'available',
    price_per_night DECIMAL(10, 2) NOT NULL,
    capacity INT NOT NULL,
    amenities TEXT -- Stored as comma-separated or JSON string
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id VARCHAR(50) PRIMARY KEY,
    guest_id VARCHAR(50) NOT NULL,
    room_id VARCHAR(50) NOT NULL,
    check_in DATETIME NOT NULL,
    check_out DATETIME NOT NULL,
    status ENUM('confirmed', 'checked-in', 'checked-out', 'cancelled') DEFAULT 'confirmed',
    total_amount DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (guest_id) REFERENCES guests(id),
    FOREIGN KEY (room_id) REFERENCES rooms(id)
);

-- Service Requests Table
CREATE TABLE IF NOT EXISTS service_requests (
    id VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    guest_name VARCHAR(200) NOT NULL,
    type ENUM('room-service', 'housekeeping', 'transport') NOT NULL,
    status ENUM('pending', 'in-progress', 'completed', 'cancelled') DEFAULT 'pending',
    details TEXT,
    priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50) NOT NULL,
    room_number VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    sender ENUM('guest', 'reception') NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(50) PRIMARY KEY,
    reservation_id VARCHAR(50),
    room_number VARCHAR(20),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'urgent') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reservation_id) REFERENCES reservations(id)
);

-- Service Catalog Table
CREATE TABLE IF NOT EXISTS service_catalog (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('room-service', 'housekeeping', 'transport') NOT NULL,
    category VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) DEFAULT 0.00,
    icon VARCHAR(50),
    available BOOLEAN DEFAULT TRUE
);

-- WiFi Zones Table
CREATE TABLE IF NOT EXISTS wifi_zones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    floor INT NOT NULL UNIQUE,
    ssid VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    location_description TEXT
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- In a real app, hash this
    role ENUM('reception', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
