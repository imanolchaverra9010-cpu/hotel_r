from sqlalchemy import Column, Integer, String, Text, DECIMAL, JSON, Enum, Date, DateTime, TIMESTAMP, text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
import enum
from .database import Base

class Guest(Base):
    __tablename__ = "guests"
    id = Column(String(50), primary_key=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    document_type = Column(String(10), nullable=False) # CC, CE, PA, TI
    document_number = Column(String(50), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    country = Column(String(100))

    reservations = relationship("Reservation", back_populates="guest")
    venue_reservations = relationship("VenueReservation", back_populates="guest")

class Room(Base):
    __tablename__ = "rooms"
    id = Column(String(50), primary_key=True)
    number = Column(String(20), nullable=False, unique=True)
    floor = Column(Integer, nullable=False)
    type = Column(String(50), nullable=False) # standard, deluxe, suite, presidential
    status = Column(String(50), default="available") # available, occupied, maintenance, cleaning
    price_per_night = Column(DECIMAL(10, 2), nullable=False)
    capacity = Column(Integer, nullable=False)
    amenities = Column(Text)
    image = Column(Text)  # Main image URL
    gallery = Column(Text)  # Comma-separated image URLs

    reservations = relationship("Reservation", back_populates="room")

class Venue(Base):
    __tablename__ = "venues"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price_per_hour = Column(DECIMAL(10, 2), nullable=False)
    capacity = Column(Integer, nullable=False)
    size = Column(Integer)
    features = Column(Text) # Comma separated
    image = Column(Text)
    gallery = Column(Text) # Comma separated URLs

    venue_reservations = relationship("VenueReservation", back_populates="venue")
    capacity_arrangements = relationship("VenueCapacityArrangement", back_populates="venue", cascade="all, delete-orphan")


class VenueCapacityArrangement(Base):
    """Capacidad del salón según tipo de acomodación (auditorio, mesa de trabajo, etc.) y distanciamiento social."""
    __tablename__ = "venue_capacity_arrangements"
    id = Column(String(50), primary_key=True)
    venue_id = Column(String(50), ForeignKey("venues.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)  # ej: "Auditorio", "Mesa De Trabajo"
    capacity = Column(Integer, nullable=False)
    layout_type = Column(String(50))  # auditorio | mesa_trabajo | mesa_junta | forma_u (para icono/esquema)
    layout_schema = Column(JSON)  # opcional: esquema custom ej. { "rows", "cols", "grid" }
    sort_order = Column(Integer, default=0)

    venue = relationship("Venue", back_populates="capacity_arrangements")

class Reservation(Base):
    __tablename__ = "reservations"
    id = Column(String(50), primary_key=True)
    guest_id = Column(String(50), ForeignKey("guests.id"), nullable=False)
    room_id = Column(String(50), ForeignKey("rooms.id"), nullable=False)
    check_in = Column(TIMESTAMP, nullable=False)
    check_out = Column(TIMESTAMP, nullable=False)
    status = Column(String(50), default="confirmed") # confirmed, checked-in, checked-out, cancelled
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    guest = relationship("Guest", back_populates="reservations")
    room = relationship("Room", back_populates="reservations")

class VenueReservation(Base):
    __tablename__ = "venue_reservations"
    id = Column(String(50), primary_key=True)
    guest_id = Column(String(50), ForeignKey("guests.id"), nullable=False)
    venue_id = Column(String(50), ForeignKey("venues.id"), nullable=False)
    check_in = Column(DateTime, nullable=False)
    check_out = Column(DateTime, nullable=False)
    status = Column(String(50), default="confirmed") # confirmed, checked-in, checked-out, cancelled
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    notes = Column(Text)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

    guest = relationship("Guest", back_populates="venue_reservations")
    venue = relationship("Venue", back_populates="venue_reservations")

class ServiceCatalog(Base):
    __tablename__ = "service_catalog"
    id = Column(String(50), primary_key=True)
    type = Column(String(50), nullable=False) # room-service, housekeeping, transport
    category = Column(String(100))
    name = Column(String(255), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10, 2), default=0.00)
    icon = Column(String(50))
    available = Column(Boolean, default=True)

class ServiceRequest(Base):
    __tablename__ = "service_requests"
    id = Column(String(50), primary_key=True)
    reservation_id = Column(String(50), ForeignKey("reservations.id"), nullable=False)
    room_number = Column(String(20), nullable=False)
    guest_name = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # room-service, housekeeping, transport
    status = Column(String(50), default="pending") # pending, in-progress, completed, cancelled
    details = Column(Text)
    priority = Column(String(20), default="medium") # low, medium, high
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(DECIMAL(10, 2), nullable=False)
    category = Column(String(50), nullable=False) # entradas, platos-fuertes, bebidas, postres
    image = Column(Text)
    available = Column(Boolean, default=True)
    completed_at = Column(TIMESTAMP)

class DiningArea(Base):
    __tablename__ = "dining_areas"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    image = Column(Text)
    schedule = Column(String(100))
    features = Column(Text) # Comma separated


class RestaurantGalleryImage(Base):
    """Galería de imágenes del restaurante (sección en la página Restaurante)."""
    __tablename__ = "restaurant_gallery_images"
    id = Column(String(50), primary_key=True)
    image_url = Column(Text, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class Staff(Base):
    __tablename__ = "staff"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False) # reception, admin
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String(50), primary_key=True)
    reservation_id = Column(String(50), ForeignKey("reservations.id"))
    room_number = Column(String(20))
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(20), default="info") # info, warning, success, urgent
    is_read = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class Message(Base):
    __tablename__ = "messages"
    id = Column(String(50), primary_key=True)
    reservation_id = Column(String(50), ForeignKey("reservations.id"), nullable=False)
    room_number = Column(String(20), nullable=False)
    content = Column(Text, nullable=False)
    sender = Column(String(20), nullable=False) # guest, reception
    timestamp = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
    is_read = Column(Boolean, default=False)

class WifiZone(Base):
    __tablename__ = "wifi_zones"
    id = Column(Integer, primary_key=True, autoincrement=True)
    floor = Column(Integer, nullable=False, unique=True)
    ssid = Column(String(100), nullable=False)
    password = Column(String(100), nullable=False)
    location_description = Column(Text)

class HeroCarouselImage(Base):
    __tablename__ = "hero_carousel_images"
    id = Column(String(50), primary_key=True)
    image_url = Column(Text, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class GalleryImage(Base):
    __tablename__ = "gallery_images"
    id = Column(String(50), primary_key=True)
    image_url = Column(Text, nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))

class ContactMessage(Base):
    __tablename__ = "contact_messages"
    id = Column(String(50), primary_key=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    whatsapp = Column(String(50), nullable=False)
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))


class HotelInfo(Base):
    """Información de contacto y redes del hotel (una sola fila, editable desde el panel)."""
    __tablename__ = "hotel_info"
    id = Column(Integer, primary_key=True, default=1)
    phone = Column(String(50))
    email = Column(String(255))
    address = Column(Text)
    whatsapp = Column(String(50))
    facebook_url = Column(Text)
    instagram_url = Column(Text)
    twitter_url = Column(Text)
    opening_hours = Column(String(255))


class Review(Base):
    """Reseñas de huéspedes (moderadas: is_approved)."""
    __tablename__ = "reviews"
    id = Column(String(50), primary_key=True)
    guest_name = Column(String(200), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(Text, nullable=False)
    is_approved = Column(Boolean, default=False)
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))


class WebBooking(Base):
    """Reservas desde la web (formulario público). Se envía confirmación por correo."""
    __tablename__ = "web_bookings"
    id = Column(String(50), primary_key=True)
    guest_name = Column(String(200), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50))
    type = Column(String(20), nullable=False)  # room | venue
    item_id = Column(String(50), nullable=False)
    item_name = Column(String(200), nullable=False)
    check_in = Column(String(20), nullable=False)  # yyyy-MM-dd
    check_out = Column(String(20), nullable=False)
    guests = Column(Integer, nullable=False)
    total_price = Column(DECIMAL(12, 2), nullable=False)
    status = Column(String(20), default="confirmed")
    created_at = Column(TIMESTAMP, server_default=text('CURRENT_TIMESTAMP'))
