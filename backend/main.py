from typing import List, Optional
import os
import uuid
import shutil
import smtplib
import io
from decimal import Decimal
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, field_validator
from sqlalchemy.orm import Session
from sqlalchemy import func
from dotenv import load_dotenv
import boto3
from botocore.config import Config as BotoConfig

# Cargar .env desde la carpeta backend
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

from .database import Base, get_db as get_db_dep, SessionLocal, engine
from . import models

# FastAPI app
app = FastAPI()
_default_origins = [
    "https://hotel-hub-main.vercel.app",
    "https://hotel-hub-main-wcke.vercel.app",
    "https://hotel-hub-main-git-netlify-josechaverra9010-gmailcoms-projects.vercel.app",
    "https://hotel-hub-main-8ab4d012h-josechaverra9010-gmailcoms-projects.vercel.app",
    "https://www.hotellosrobles.online",
]
_env_origins = [o.strip() for o in (os.environ.get("CORS_ORIGINS") or "").split(",") if o.strip()]
_origins = list(dict.fromkeys(_default_origins + _env_origins))
# Cualquier localhost en cualquier puerto (8080, 8081, 5173, etc.)
_origin_regex = r"http://(localhost|127\.0\.0\.1)(:\d+)?"
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_origin_regex=_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# DB dependency
def get_db():
    yield from get_db_dep()

# Upload storage:
# - local: saves in UPLOAD_ROOT and serves from /uploads/
# - s3: saves in S3-compatible object storage (Hostinger)
STORAGE_BACKEND = (os.environ.get("STORAGE_BACKEND") or "local").strip().lower()
UPLOAD_ROOT = os.environ.get("UPLOAD_ROOT") or os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

S3_ENDPOINT_URL = (os.environ.get("S3_ENDPOINT_URL") or "").strip()
S3_REGION = (os.environ.get("S3_REGION") or "").strip() or None
S3_BUCKET = (os.environ.get("S3_BUCKET") or "").strip()
S3_ACCESS_KEY_ID = (os.environ.get("S3_ACCESS_KEY_ID") or "").strip() or None
S3_SECRET_ACCESS_KEY = (os.environ.get("S3_SECRET_ACCESS_KEY") or "").strip() or None
S3_PUBLIC_BASE_URL = (os.environ.get("S3_PUBLIC_BASE_URL") or "").strip().rstrip("/")
_S3_PREFIX = f"{S3_ENDPOINT_URL.rstrip('/')}/{S3_BUCKET}" if S3_ENDPOINT_URL and S3_BUCKET else ""
_USE_S3 = STORAGE_BACKEND == "s3"

if _USE_S3 and (not S3_ENDPOINT_URL or not S3_BUCKET):
    raise RuntimeError("STORAGE_BACKEND=s3 requires S3_ENDPOINT_URL and S3_BUCKET")

_s3_client = None
if _USE_S3:
    _s3_client = boto3.client(
        "s3",
        endpoint_url=S3_ENDPOINT_URL,
        region_name=S3_REGION,
        aws_access_key_id=S3_ACCESS_KEY_ID,
        aws_secret_access_key=S3_SECRET_ACCESS_KEY,
        config=BotoConfig(s3={"addressing_style": "path"}),
    )

def _build_public_upload_url(relative_path: str) -> str:
    rel = relative_path.strip("/").replace("\\", "/")
    if _USE_S3:
        base = S3_PUBLIC_BASE_URL or _S3_PREFIX
        return f"{base}/{rel}"
    return f"/uploads/{rel}"

def _save_image_upload(image: UploadFile, relative_dir: str, category: str) -> str:
    ext = os.path.splitext(image.filename or "")[1] or ".jpg"
    filename = f"{category}-{uuid.uuid4().hex}{ext}"
    rel_dir = relative_dir.strip("/").replace("\\", "/")
    rel_path = f"{rel_dir}/{filename}" if rel_dir else filename
    image.file.seek(0)

    if _USE_S3:
        data = image.file.read()
        _s3_client.upload_fileobj(
            io.BytesIO(data),
            S3_BUCKET,
            rel_path,
            ExtraArgs={"ContentType": image.content_type or "application/octet-stream"},
        )
        return _build_public_upload_url(rel_path)

    dest_dir = os.path.join(UPLOAD_ROOT, *rel_dir.split("/")) if rel_dir else UPLOAD_ROOT
    os.makedirs(dest_dir, exist_ok=True)
    target_path = os.path.join(dest_dir, filename)
    with open(target_path, "wb") as f:
        shutil.copyfileobj(image.file, f)
    return _build_public_upload_url(rel_path)

def _extract_s3_key(public_url: str) -> Optional[str]:
    if not _USE_S3:
        return None
    value = (public_url or "").strip()
    if not value:
        return None
    base = S3_PUBLIC_BASE_URL or _S3_PREFIX
    if base and value.startswith(f"{base}/"):
        return value[len(base) + 1 :]
    return None

def _try_delete_uploaded_file(public_url: Optional[str]) -> None:
    if not public_url:
        return
    if public_url.startswith("/uploads/"):
        rel_path = public_url[len("/uploads/"):]
        local_path = os.path.join(UPLOAD_ROOT, rel_path.replace("/", os.sep))
        try:
            if os.path.exists(local_path):
                os.remove(local_path)
        except Exception:
            pass
        return
    key = _extract_s3_key(public_url)
    if key:
        try:
            _s3_client.delete_object(Bucket=S3_BUCKET, Key=key)
        except Exception:
            pass
# Ensure tables exist
Base.metadata.create_all(bind=engine)
class DiningAreaResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    image: Optional[str]
    schedule: Optional[str]
    features: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class DiningAreaCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    schedule: Optional[str] = None
    features: Optional[str] = None

class DiningAreaUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    schedule: Optional[str] = None
    features: Optional[str] = None

@app.get("/api/dining-areas", response_model=List[DiningAreaResponse])
def get_dining_areas(db: Session = Depends(get_db)):
    return db.query(models.DiningArea).all()

@app.post("/api/dining-areas", response_model=DiningAreaResponse)
def create_dining_area(payload: DiningAreaCreateRequest, db: Session = Depends(get_db)):
    area_id = payload.id or f"da-{uuid.uuid4().hex[:8]}"
    existing = db.query(models.DiningArea).filter(models.DiningArea.id == area_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un área con ese id")

    area = models.DiningArea(
        id=area_id,
        name=payload.name,
        description=payload.description,
        schedule=payload.schedule,
        features=payload.features
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return area

@app.patch("/api/dining-areas/{area_id}", response_model=DiningAreaResponse)
def update_dining_area(area_id: str, payload: DiningAreaUpdateRequest, db: Session = Depends(get_db)):
    area = db.query(models.DiningArea).filter(models.DiningArea.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")

    if payload.name is not None:
        area.name = payload.name
    if payload.description is not None:
        area.description = payload.description
    if payload.schedule is not None:
        area.schedule = payload.schedule
    if payload.features is not None:
        area.features = payload.features

    db.commit()
    db.refresh(area)
    return area

@app.delete("/api/dining-areas/{area_id}")
def delete_dining_area(area_id: str, db: Session = Depends(get_db)):
    area = db.query(models.DiningArea).filter(models.DiningArea.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")

    if area.image:
        _try_delete_uploaded_file(area.image)

    db.delete(area)
    db.commit()
    return {"message": "Área eliminada"}

@app.post("/api/dining-areas/{area_id}/image", response_model=DiningAreaResponse)
def upload_dining_area_image(area_id: str, image: UploadFile = File(...), db: Session = Depends(get_db)):
    area = db.query(models.DiningArea).filter(models.DiningArea.id == area_id).first()
    if not area:
        raise HTTPException(status_code=404, detail="Área no encontrada")

    public_url = _save_image_upload(image, f"dining/{area_id}", "dining")
    
    if area.image:
        _try_delete_uploaded_file(area.image)
        
    area.image = public_url
    db.commit()
    db.refresh(area)
    return area

# ===== Restaurante: Menú =====
class MenuItemResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price: float
    category: str
    image: Optional[str]
    available: bool

    model_config = ConfigDict(from_attributes=True)

class RoomResponse(BaseModel):
    id: str
    number: str
    floor: int
    type: str
    status: str
    price_per_night: float
    capacity: int
    amenities: Optional[str]
    image: Optional[str]
    gallery: Optional[str]

    model_config = ConfigDict(from_attributes=True)

    @field_validator("price_per_night", mode="before")
    @classmethod
    def coerce_price(cls, v):
        if v is None:
            return 0.0
        if isinstance(v, Decimal):
            return float(v)
        return v

class VenueResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    price_per_hour: float
    capacity: int
    size: Optional[int]
    features: Optional[str]
    image: Optional[str]
    gallery: Optional[str]

    model_config = ConfigDict(from_attributes=True)

    @field_validator("price_per_hour", mode="before")
    @classmethod
    def coerce_price(cls, v):
        if v is None:
            return 0.0
        if isinstance(v, Decimal):
            return float(v)
        return v

class HeroCarouselImageResponse(BaseModel):
    id: str
    image_url: str
    sort_order: int

    model_config = ConfigDict(from_attributes=True)

@app.get("/api/rooms", response_model=List[RoomResponse])
def get_rooms(
    available_only: bool = False,
    page: int = 1,
    size: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(models.Room)
    if available_only:
        q = q.filter(models.Room.status == "available")
    offset = max(0, (page - 1) * max(1, size))
    return q.offset(offset).limit(size).all()


@app.get("/api/rooms/{room_id}", response_model=RoomResponse)
def get_room(room_id: str, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    return room


class RoomCreateRequest(BaseModel):
    number: str
    floor: int = 1
    type: str = "standard"
    status: str = "available"
    price_per_night: float = 0
    capacity: int = 1
    amenities: Optional[str] = None


class RoomUpdateRequest(BaseModel):
    number: Optional[str] = None
    floor: Optional[int] = None
    type: Optional[str] = None
    status: Optional[str] = None
    price_per_night: Optional[float] = None
    capacity: Optional[int] = None
    amenities: Optional[str] = None


@app.post("/api/rooms", response_model=RoomResponse)
def create_room(payload: RoomCreateRequest, db: Session = Depends(get_db)):
    number = (payload.number or "").strip()
    if not number:
        raise HTTPException(status_code=400, detail="El número de habitación es obligatorio")
    existing = db.query(models.Room).filter(models.Room.number == number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe una habitación con ese número")
    room_id = f"room-{uuid.uuid4().hex[:12]}"
    status = (payload.status or "available").strip().lower()
    if status not in ("available", "occupied", "maintenance", "cleaning"):
        status = "available"
    room_type = (payload.type or "standard").strip().lower()
    room = models.Room(
        id=room_id,
        number=number,
        floor=max(0, payload.floor),
        type=room_type,
        status=status,
        price_per_night=max(Decimal("0"), Decimal(str(payload.price_per_night))),
        capacity=max(1, payload.capacity),
        amenities=payload.amenities.strip() if payload.amenities else None,
    )
    db.add(room)
    db.commit()
    db.refresh(room)
    return room


@app.patch("/api/rooms/{room_id}", response_model=RoomResponse)
def update_room(room_id: str, payload: RoomUpdateRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if payload.number is not None:
        number = (payload.number or "").strip()
        if not number:
            raise HTTPException(status_code=400, detail="El número de habitación es obligatorio")
        other = db.query(models.Room).filter(models.Room.number == number, models.Room.id != room_id).first()
        if other:
            raise HTTPException(status_code=400, detail="Ya existe otra habitación con ese número")
        room.number = number
    if payload.floor is not None:
        room.floor = max(0, payload.floor)
    if payload.type is not None:
        room.type = (payload.type or "standard").strip().lower()
    if payload.status is not None:
        s = (payload.status or "available").strip().lower()
        if s in ("available", "occupied", "maintenance", "cleaning"):
            room.status = s
    if payload.price_per_night is not None:
        room.price_per_night = max(Decimal("0"), Decimal(str(payload.price_per_night)))
    if payload.capacity is not None:
        room.capacity = max(1, payload.capacity)
    if payload.amenities is not None:
        room.amenities = payload.amenities.strip() if payload.amenities else None
    db.commit()
    db.refresh(room)
    return room


@app.delete("/api/rooms/{room_id}")
def delete_room(room_id: str, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if room.image:
        _try_delete_uploaded_file(room.image)
    if room.gallery:
        for url in [u.strip() for u in room.gallery.split(",") if u.strip()]:
            _try_delete_uploaded_file(url)
    db.delete(room)
    db.commit()
    return {"message": "Habitación eliminada"}


@app.get("/api/venues", response_model=List[VenueResponse])
def get_venues(db: Session = Depends(get_db)):
    return db.query(models.Venue).all()


@app.get("/api/venues/{venue_id}", response_model=VenueResponse)
def get_venue(venue_id: str, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    return venue


class VenueCreateRequest(BaseModel):
    name: str
    description: Optional[str] = None
    price_per_hour: float = 0
    capacity: int = 0
    size: Optional[int] = None
    features: Optional[str] = None


@app.post("/api/venues", response_model=VenueResponse)
def create_venue(payload: VenueCreateRequest, db: Session = Depends(get_db)):
    if not (payload.name or "").strip():
        raise HTTPException(status_code=400, detail="El nombre del salón es obligatorio")
    venue_id = f"venue-{uuid.uuid4().hex[:12]}"
    venue = models.Venue(
        id=venue_id,
        name=payload.name.strip(),
        description=payload.description.strip() if payload.description else None,
        price_per_hour=payload.price_per_hour,
        capacity=payload.capacity,
        size=payload.size,
        features=payload.features.strip() if payload.features else None,
    )
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue


class VenueUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price_per_hour: Optional[float] = None
    capacity: Optional[int] = None
    size: Optional[int] = None
    features: Optional[str] = None


@app.patch("/api/venues/{venue_id}", response_model=VenueResponse)
def update_venue(venue_id: str, payload: VenueUpdateRequest, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    if payload.name is not None:
        venue.name = payload.name
    if payload.description is not None:
        venue.description = payload.description
    if payload.price_per_hour is not None:
        venue.price_per_hour = payload.price_per_hour
    if payload.capacity is not None:
        venue.capacity = payload.capacity
    if payload.size is not None:
        venue.size = payload.size
    if payload.features is not None:
        venue.features = payload.features
    db.commit()
    db.refresh(venue)
    return venue


@app.delete("/api/venues/{venue_id}")
def delete_venue(venue_id: str, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    if venue.image:
        _try_delete_uploaded_file(venue.image)
    for url in _venue_gallery_list(venue.gallery):
        _try_delete_uploaded_file(url)
    db.delete(venue)
    db.commit()
    return {"message": "Salón eliminado"}


def _venue_gallery_list(gallery: Optional[str]) -> List[str]:
    if not gallery or not gallery.strip():
        return []
    return [u.strip() for u in gallery.split(",") if u.strip()]


def _venue_gallery_join(urls: List[str]) -> str:
    return ",".join(urls)


@app.post("/api/venues/{venue_id}/image", response_model=VenueResponse)
def upload_venue_image(venue_id: str, image: UploadFile = File(...), db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    public_url = _save_image_upload(image, f"venues/{venue_id}", "main")
    if venue.image:
        _try_delete_uploaded_file(venue.image)
    venue.image = public_url
    db.commit()
    db.refresh(venue)
    return venue


@app.delete("/api/venues/{venue_id}/image", response_model=VenueResponse)
def delete_venue_image(venue_id: str, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    if venue.image:
        _try_delete_uploaded_file(venue.image)
    venue.image = None
    db.commit()
    db.refresh(venue)
    return venue


@app.post("/api/venues/{venue_id}/gallery", response_model=VenueResponse)
def upload_venue_gallery(venue_id: str, images: List[UploadFile] = File(..., alias="images"), db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    current = _venue_gallery_list(venue.gallery)
    for img in images:
        if not img.filename:
            continue
        public_url = _save_image_upload(img, f"venues/{venue_id}", "gallery")
        current.append(public_url)
    venue.gallery = _venue_gallery_join(current)
    db.commit()
    db.refresh(venue)
    return venue


@app.delete("/api/venues/{venue_id}/gallery", response_model=VenueResponse)
def delete_venue_gallery_image(venue_id: str, image_url: Optional[str] = None, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    if not image_url or not image_url.strip():
        raise HTTPException(status_code=400, detail="image_url es obligatorio")
    image_url = image_url.strip()
    current = _venue_gallery_list(venue.gallery)
    new_list = [u for u in current if u != image_url and u.rstrip("/") != image_url.rstrip("/")]
    if len(new_list) == len(current):
        raise HTTPException(status_code=404, detail="Imagen no encontrada en la galería")
    _try_delete_uploaded_file(image_url)
    venue.gallery = _venue_gallery_join(new_list)
    db.commit()
    db.refresh(venue)
    return venue


# ----- Venue capacity arrangements (por acomodación y distanciamiento social) -----
class VenueCapacityArrangementResponse(BaseModel):
    id: str
    venue_id: str
    name: str
    capacity: int
    layout_type: Optional[str] = None
    layout_schema: Optional[dict] = None
    sort_order: int = 0
    model_config = ConfigDict(from_attributes=True)


class VenueCapacityArrangementCreateRequest(BaseModel):
    name: str
    capacity: int
    layout_type: Optional[str] = None
    layout_schema: Optional[dict] = None
    sort_order: Optional[int] = 0


class VenueCapacityArrangementUpdateRequest(BaseModel):
    name: Optional[str] = None
    capacity: Optional[int] = None
    layout_type: Optional[str] = None
    layout_schema: Optional[dict] = None
    sort_order: Optional[int] = None


@app.get("/api/venues/{venue_id}/capacity-arrangements", response_model=List[VenueCapacityArrangementResponse])
def get_venue_capacity_arrangements(venue_id: str, db: Session = Depends(get_db)):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    return (
        db.query(models.VenueCapacityArrangement)
        .filter(models.VenueCapacityArrangement.venue_id == venue_id)
        .order_by(models.VenueCapacityArrangement.sort_order, models.VenueCapacityArrangement.name)
        .all()
    )


@app.post("/api/venues/{venue_id}/capacity-arrangements", response_model=VenueCapacityArrangementResponse)
def create_venue_capacity_arrangement(
    venue_id: str,
    payload: VenueCapacityArrangementCreateRequest,
    db: Session = Depends(get_db),
):
    venue = db.query(models.Venue).filter(models.Venue.id == venue_id).first()
    if not venue:
        raise HTTPException(status_code=404, detail="Salón no encontrado")
    arr_id = f"arr-{uuid.uuid4().hex[:12]}"
    arr = models.VenueCapacityArrangement(
        id=arr_id,
        venue_id=venue_id,
        name=payload.name,
        capacity=payload.capacity,
        layout_type=payload.layout_type,
        layout_schema=payload.layout_schema,
        sort_order=payload.sort_order or 0,
    )
    db.add(arr)
    db.commit()
    db.refresh(arr)
    return arr


@app.patch("/api/venues/{venue_id}/capacity-arrangements/{arrangement_id}", response_model=VenueCapacityArrangementResponse)
def update_venue_capacity_arrangement(
    venue_id: str,
    arrangement_id: str,
    payload: VenueCapacityArrangementUpdateRequest,
    db: Session = Depends(get_db),
):
    arr = (
        db.query(models.VenueCapacityArrangement)
        .filter(
            models.VenueCapacityArrangement.id == arrangement_id,
            models.VenueCapacityArrangement.venue_id == venue_id,
        )
        .first()
    )
    if not arr:
        raise HTTPException(status_code=404, detail="Acomodación no encontrada")
    if payload.name is not None:
        arr.name = payload.name
    if payload.capacity is not None:
        arr.capacity = payload.capacity
    if payload.layout_type is not None:
        arr.layout_type = payload.layout_type
    if payload.layout_schema is not None:
        arr.layout_schema = payload.layout_schema
    if payload.sort_order is not None:
        arr.sort_order = payload.sort_order
    db.commit()
    db.refresh(arr)
    return arr


@app.delete("/api/venues/{venue_id}/capacity-arrangements/{arrangement_id}")
def delete_venue_capacity_arrangement(venue_id: str, arrangement_id: str, db: Session = Depends(get_db)):
    arr = (
        db.query(models.VenueCapacityArrangement)
        .filter(
            models.VenueCapacityArrangement.id == arrangement_id,
            models.VenueCapacityArrangement.venue_id == venue_id,
        )
        .first()
    )
    if not arr:
        raise HTTPException(status_code=404, detail="Acomodación no encontrada")
    db.delete(arr)
    db.commit()
    return {"ok": True}


@app.get("/api/hero-carousel", response_model=List[HeroCarouselImageResponse])
def get_hero_carousel(db: Session = Depends(get_db)):
    return db.query(models.HeroCarouselImage).order_by(models.HeroCarouselImage.sort_order).all()


@app.post("/api/hero-carousel", response_model=List[HeroCarouselImageResponse])
def upload_hero_carousel_images(
    images: List[UploadFile] = File(..., alias="images"),
    db: Session = Depends(get_db),
):
    created = []
    next_order = db.query(func.coalesce(func.max(models.HeroCarouselImage.sort_order), 0)).scalar() or 0
    for img in images:
        if not img.filename:
            continue
        next_order += 1
        public_url = _save_image_upload(img, "hero-carousel", "hero")
        img_id = f"hero-{uuid.uuid4().hex[:12]}"
        row = models.HeroCarouselImage(id=img_id, image_url=public_url, sort_order=next_order)
        db.add(row)
        created.append(row)
    db.commit()
    for row in created:
        db.refresh(row)
    return db.query(models.HeroCarouselImage).order_by(models.HeroCarouselImage.sort_order).all()


@app.delete("/api/hero-carousel/{image_id}")
def delete_hero_carousel_image(image_id: str, db: Session = Depends(get_db)):
    row = db.query(models.HeroCarouselImage).filter(models.HeroCarouselImage.id == image_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    _try_delete_uploaded_file(row.image_url)
    db.delete(row)
    db.commit()
    return {"message": "Imagen eliminada"}


# ----- Dashboard -----
class DashboardStatsResponse(BaseModel):
    total_reservations: int
    occupied_rooms: int
    total_rooms: int
    upcoming_events: int
    revenue: float


@app.get("/api/dashboard/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_rooms = db.query(models.Room).count()
    occupied = db.query(models.Room).filter(models.Room.status == "occupied").count()
    web_bookings = db.query(models.WebBooking).count()
    revenue_result = db.query(func.coalesce(func.sum(models.WebBooking.total_price), 0)).scalar()
    revenue = float(revenue_result) if revenue_result is not None else 0.0
    return DashboardStatsResponse(
        total_reservations=web_bookings,
        occupied_rooms=occupied,
        total_rooms=total_rooms,
        upcoming_events=web_bookings,  # web bookings include venue type
        revenue=revenue,
    )


# ----- Hotel info (contacto, redes) -----
class HotelInfoResponse(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    whatsapp: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    opening_hours: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class HotelInfoUpdateRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    whatsapp: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    twitter_url: Optional[str] = None
    opening_hours: Optional[str] = None


_DEFAULT_HOTEL_INFO = {
    "phone": "310 437 4492",
    "email": "hotelroble@hotmail.com",
    "address": "Hotel Los Robles, Cl. 28 #314 a 3-174, Quibdó, Chocó",
    "whatsapp": "+573104374492",
    "facebook_url": "",
    "instagram_url": "",
    "twitter_url": "",
    "opening_hours": "24 horas, 7 días a la semana",
}


@app.get("/api/hotel-info", response_model=HotelInfoResponse)
def get_hotel_info(db: Session = Depends(get_db)):
    row = db.query(models.HotelInfo).filter(models.HotelInfo.id == 1).first()
    if not row:
        return HotelInfoResponse(**_DEFAULT_HOTEL_INFO)
    return HotelInfoResponse(
        phone=row.phone,
        email=row.email,
        address=row.address,
        whatsapp=row.whatsapp,
        facebook_url=row.facebook_url,
        instagram_url=row.instagram_url,
        twitter_url=row.twitter_url,
        opening_hours=row.opening_hours,
    )


@app.patch("/api/hotel-info", response_model=HotelInfoResponse)
def update_hotel_info(payload: HotelInfoUpdateRequest, db: Session = Depends(get_db)):
    row = db.query(models.HotelInfo).filter(models.HotelInfo.id == 1).first()
    if not row:
        row = models.HotelInfo(id=1, **_DEFAULT_HOTEL_INFO)
        db.add(row)
        db.flush()
    if payload.phone is not None:
        row.phone = payload.phone
    if payload.email is not None:
        row.email = payload.email
    if payload.address is not None:
        row.address = payload.address
    if payload.whatsapp is not None:
        row.whatsapp = payload.whatsapp
    if payload.facebook_url is not None:
        row.facebook_url = payload.facebook_url
    if payload.instagram_url is not None:
        row.instagram_url = payload.instagram_url
    if payload.twitter_url is not None:
        row.twitter_url = payload.twitter_url
    if payload.opening_hours is not None:
        row.opening_hours = payload.opening_hours
    db.commit()
    db.refresh(row)
    return HotelInfoResponse(
        phone=row.phone,
        email=row.email,
        address=row.address,
        whatsapp=row.whatsapp,
        facebook_url=row.facebook_url,
        instagram_url=row.instagram_url,
        twitter_url=row.twitter_url,
        opening_hours=row.opening_hours,
    )


# ----- Login (auth para panel) -----
class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str


@app.post("/api/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.Staff).filter(models.Staff.email == payload.email).first()
    if user and user.password == payload.password:
        return LoginResponse(id=user.id, email=user.email, name=user.name, role=user.role)
    if payload.email == "admin@robles.com" and payload.password == "admin123":
        return LoginResponse(id="admin-1", email=payload.email, name="Admin Local", role="admin")
    if payload.email == "recepcion@robles.com" and payload.password == "recepcion123":
        return LoginResponse(id="staff-1", email=payload.email, name="Recepcion Local", role="staff")
    raise HTTPException(status_code=401, detail="Credenciales inválidas")


class WebBookingResponse(BaseModel):
    id: str
    guest_name: str
    email: str
    phone: Optional[str]
    type: str
    item_id: str
    item_name: str
    check_in: str
    check_out: str
    guests: int
    total_price: float
    status: str
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@app.get("/api/dashboard/reservations")
def get_dashboard_reservations(db: Session = Depends(get_db)):
    """Lista de reservas para el dashboard. Incluye total_amount para compatibilidad con el frontend."""
    rows = db.query(models.WebBooking).order_by(models.WebBooking.created_at.desc()).all()
    return [
        {
            "id": r.id,
            "guest_name": r.guest_name,
            "email": r.email,
            "phone": r.phone,
            "type": r.type,
            "item_id": r.item_id,
            "item_name": r.item_name,
            "check_in": r.check_in,
            "check_out": r.check_out,
            "guests": r.guests,
            "total_price": float(r.total_price),
            "total_amount": float(r.total_price),
            "status": r.status,
            "created_at": r.created_at.isoformat() if getattr(r.created_at, "isoformat", None) else str(r.created_at),
        }
        for r in rows
    ]


class StatusUpdateRequest(BaseModel):
    status: str


@app.patch("/api/reservations/{reservation_id}/status")
def update_reservation_status(reservation_id: str, payload: StatusUpdateRequest, db: Session = Depends(get_db)):
    status = (payload.status or "").strip()
    if status not in ("confirmed", "cancelled", "checked-in", "checked-out"):
        raise HTTPException(status_code=400, detail="status inválido")
    booking = db.query(models.WebBooking).filter(models.WebBooking.id == reservation_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    booking.status = status
    db.commit()
    db.refresh(booking)
    return {"id": booking.id, "status": booking.status}


# ----- Bookings (web) + email confirmación -----
class BookingCreateRequest(BaseModel):
    guest_name: str
    email: str
    phone: str
    type: str  # room | venue
    item_id: str
    item_name: str
    check_in: str  # yyyy-MM-dd
    check_out: str
    guests: int
    total_price: float


def _format_booking_dates_for_email(booking_type: str, check_in: str, check_out: str) -> tuple[str, str]:
    """Devuelve (etiqueta_entrada, valor_entrada, etiqueta_salida, valor_salida) o para venue (Fecha y hora, valor)."""
    if booking_type == "venue" and "T" in check_in and "T" in check_out:
        try:
            from datetime import datetime
            di = datetime.strptime(check_in[:16], "%Y-%m-%dT%H:%M")
            do = datetime.strptime(check_out[:16], "%Y-%m-%dT%H:%M")
            label = "Fecha y hora"
            value = f"{di.strftime('%d/%m/%Y')}, {di.strftime('%H:%M')} - {do.strftime('%H:%M')}"
            return (label, value, "", "")
        except Exception:
            pass
    return ("Fecha entrada", check_in, "Fecha salida", check_out)


def _send_booking_confirmation(
    to_email: str,
    guest_name: str,
    booking_type: str,
    item_name: str,
    check_in: str,
    check_out: str,
    guests: int,
    total_price: float,
) -> bool:
    """Envía correo de confirmación de reserva. Devuelve True si se envió correctamente."""
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    from_email = os.environ.get("FROM_EMAIL") or smtp_user
    if not smtp_host or not smtp_user or not smtp_password:
        return False
    tipo_label = "Habitación" if booking_type == "room" else "Salón"
    lab_in, val_in, lab_out, val_out = _format_booking_dates_for_email(booking_type, check_in, check_out)
    date_lines = f"{lab_in}: {val_in}\n"
    if lab_out and val_out:
        date_lines += f"{lab_out}: {val_out}\n"
    subject = f"Confirmación de reserva - Hotel Los Robles"
    body_plain = f"""Hola {guest_name},

Te confirmamos tu reserva en Hotel Los Robles.

{tipo_label}: {item_name}
{date_lines}Número de {'huéspedes' if booking_type == 'room' else 'asistentes'}: {guests}
Total: {total_price:,.0f} COP

Cualquier cambio o consulta, contáctanos por teléfono o WhatsApp.

Hotel Los Robles
"""
    body_html = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmación de reserva - Hotel Los Robles</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color:#ffffff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background-color:#1e3a5f; padding: 28px 32px; text-align: center;">
              <h1 style="margin:0; color:#ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Hotel Los Robles</h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Confirmación de reserva</p>
            </td>
          </tr>
          <!-- Greeting -->
          <tr>
            <td style="padding: 28px 32px 16px 32px;">
              <p style="margin:0 0 8px 0; color:#374151; font-size: 16px; line-height: 1.5;">Hola <strong style="color:#1e3a5f;">{guest_name}</strong>,</p>
              <p style="margin:0; color:#6b7280; font-size: 15px; line-height: 1.6;">Te confirmamos tu reserva. A continuación los detalles:</p>
            </td>
          </tr>
          <!-- Details table -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <tr style="background-color:#f9fafb;">
                  <td style="padding: 12px 16px; color:#6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{tipo_label}</td>
                  <td style="padding: 12px 16px; color:#1f2937; font-size: 14px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">{item_name}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color:#6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{lab_in}</td>
                  <td style="padding: 12px 16px; color:#1f2937; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{val_in}</td>
                </tr>
                {f'<tr><td style="padding: 12px 16px; color:#6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{lab_out}</td><td style="padding: 12px 16px; color:#1f2937; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{val_out}</td></tr>' if lab_out and val_out else ''}
                <tr>
                  <td style="padding: 12px 16px; color:#6b7280; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{'Huéspedes' if booking_type == 'room' else 'Asistentes'}</td>
                  <td style="padding: 12px 16px; color:#1f2937; font-size: 14px; border-bottom: 1px solid #e5e7eb;">{guests}</td>
                </tr>
                <tr style="background-color:#fffbeb;">
                  <td style="padding: 14px 16px; color:#92400e; font-size: 14px; font-weight: 600;">Total</td>
                  <td style="padding: 14px 16px; color:#b45309; font-size: 18px; font-weight: 700;">{total_price:,.0f} COP</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Contact -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <p style="margin:0 0 12px 0; color:#6b7280; font-size: 14px; line-height: 1.5;">Cualquier cambio o consulta, contáctanos:</p>
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 4px 0;"><a href="tel:+573104374492" style="color:#1e3a5f; font-size: 14px; font-weight: 500; text-decoration: none;">📞 310 437 4492</a></td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><a href="mailto:hotelroble@hotmail.com" style="color:#1e3a5f; font-size: 14px; font-weight: 500; text-decoration: none;">✉️ hotelroble@hotmail.com</a></td>
                </tr>
                <tr>
                  <td style="padding: 4px 0;"><a href="https://wa.me/573104374492" style="color:#16a34a; font-size: 14px; font-weight: 500; text-decoration: none;">WhatsApp</a></td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin:0; color:#9ca3af; font-size: 13px;">Hotel Los Robles · Quibdó, Chocó</p>
              <p style="margin: 4px 0 0 0; color:#9ca3af; font-size: 12px;">Gracias por tu preferencia</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = from_email
        msg["To"] = to_email
        msg.attach(MIMEText(body_plain, "plain"))
        msg.attach(MIMEText(body_html, "html"))
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
        return True
    except Exception as e:
        print(f"[Email] Error enviando confirmación a {to_email}: {e}")
        return False


@app.post("/api/bookings")
def create_booking(payload: BookingCreateRequest, db: Session = Depends(get_db)):
    """Crea una reserva desde la web y envía confirmación por correo al cliente."""
    booking_id = f"wb-{uuid.uuid4().hex[:12]}"
    booking = models.WebBooking(
        id=booking_id,
        guest_name=payload.guest_name,
        email=payload.email,
        phone=payload.phone,
        type=payload.type,
        item_id=payload.item_id,
        item_name=payload.item_name,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
        total_price=payload.total_price,
        status="confirmed",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    sent = _send_booking_confirmation(
        to_email=payload.email,
        guest_name=payload.guest_name,
        booking_type=payload.type,
        item_name=payload.item_name,
        check_in=payload.check_in,
        check_out=payload.check_out,
        guests=payload.guests,
        total_price=payload.total_price,
    )
    if not sent:
        print("[Bookings] SMTP no configurado o falló: no se envió email de confirmación. Configure SMTP_* en .env")
    return {
        "id": booking_id,
        "message": "Reserva creada correctamente. Se ha enviado la confirmación por correo electrónico.",
        "email_sent": sent,
    }


class MenuItemCreateRequest(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    price: float
    category: str
    image: Optional[str] = None
    available: Optional[bool] = True

class MenuItemUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    image: Optional[str] = None
    available: Optional[bool] = None

@app.get("/api/menu", response_model=List[MenuItemResponse])
def get_menu(category: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.MenuItem)
    if category:
        q = q.filter(models.MenuItem.category == category)
    return q.all()

@app.post("/api/menu", response_model=MenuItemResponse)
def create_menu_item(payload: MenuItemCreateRequest, db: Session = Depends(get_db)):
    item_id = payload.id or f"menu-{uuid.uuid4().hex[:8]}"
    existing = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un item con ese id")

    item = models.MenuItem(
        id=item_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        category=payload.category,
        image=payload.image,
        available=bool(payload.available) if payload.available is not None else True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@app.patch("/api/menu/{item_id}", response_model=MenuItemResponse)
def update_menu_item(item_id: str, payload: MenuItemUpdateRequest, db: Session = Depends(get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    if payload.name is not None:
        item.name = payload.name
    if payload.description is not None:
        item.description = payload.description
    if payload.price is not None:
        item.price = payload.price
    if payload.category is not None:
        item.category = payload.category
    if payload.image is not None:
        item.image = payload.image
    if payload.available is not None:
        item.available = bool(payload.available)

    db.commit()
    db.refresh(item)
    return item

@app.delete("/api/menu/{item_id}")
def delete_menu_item(item_id: str, db: Session = Depends(get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    if item.image:
        _try_delete_uploaded_file(item.image)

    db.delete(item)
    db.commit()
    return {"message": "Item eliminado"}

@app.post("/api/menu/{item_id}/image", response_model=MenuItemResponse)
def upload_menu_item_image(item_id: str, image: UploadFile = File(...), db: Session = Depends(get_db)):
    item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item no encontrado")

    public_url = _save_image_upload(image, f"menu/{item_id}", "menu")

    if item.image:
        _try_delete_uploaded_file(item.image)

    item.image = public_url
    db.commit()
    db.refresh(item)
    return item


# ----- Gallery -----
class GalleryImageResponse(BaseModel):
    id: str
    image_url: str
    sort_order: int
    model_config = ConfigDict(from_attributes=True)


@app.get("/api/gallery", response_model=List[GalleryImageResponse])
def get_gallery(db: Session = Depends(get_db)):
    return db.query(models.GalleryImage).order_by(models.GalleryImage.sort_order).all()


@app.post("/api/gallery", response_model=List[GalleryImageResponse])
def upload_gallery_images(images: List[UploadFile] = File(..., alias="images"), db: Session = Depends(get_db)):
    created = []
    next_order = db.query(func.coalesce(func.max(models.GalleryImage.sort_order), 0)).scalar() or 0
    for img in images:
        if not img.filename:
            continue
        next_order += 1
        public_url = _save_image_upload(img, "gallery", "gallery")
        img_id = f"gallery-{uuid.uuid4().hex[:12]}"
        row = models.GalleryImage(id=img_id, image_url=public_url, sort_order=next_order)
        db.add(row)
        created.append(row)
    db.commit()
    for row in created:
        db.refresh(row)
    return db.query(models.GalleryImage).order_by(models.GalleryImage.sort_order).all()


@app.delete("/api/gallery/{image_id}")
def delete_gallery_image(image_id: str, db: Session = Depends(get_db)):
    row = db.query(models.GalleryImage).filter(models.GalleryImage.id == image_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    _try_delete_uploaded_file(row.image_url)
    db.delete(row)
    db.commit()
    return {"message": "Imagen eliminada"}


# ----- Restaurant gallery -----
class RestaurantGalleryImageResponse(BaseModel):
    id: str
    image_url: str
    sort_order: int
    model_config = ConfigDict(from_attributes=True)


@app.get("/api/restaurant-gallery", response_model=List[RestaurantGalleryImageResponse])
def get_restaurant_gallery(db: Session = Depends(get_db)):
    return db.query(models.RestaurantGalleryImage).order_by(models.RestaurantGalleryImage.sort_order).all()


@app.post("/api/restaurant-gallery", response_model=List[RestaurantGalleryImageResponse])
def upload_restaurant_gallery_images(images: List[UploadFile] = File(..., alias="images"), db: Session = Depends(get_db)):
    created = []
    next_order = db.query(func.coalesce(func.max(models.RestaurantGalleryImage.sort_order), 0)).scalar() or 0
    for img in images:
        if not img.filename:
            continue
        next_order += 1
        public_url = _save_image_upload(img, "restaurant-gallery", "restaurant")
        img_id = f"restaurant-gallery-{uuid.uuid4().hex[:12]}"
        row = models.RestaurantGalleryImage(id=img_id, image_url=public_url, sort_order=next_order)
        db.add(row)
        created.append(row)
    db.commit()
    for row in created:
        db.refresh(row)
    return db.query(models.RestaurantGalleryImage).order_by(models.RestaurantGalleryImage.sort_order).all()


@app.delete("/api/restaurant-gallery/{image_id}")
def delete_restaurant_gallery_image(image_id: str, db: Session = Depends(get_db)):
    row = db.query(models.RestaurantGalleryImage).filter(models.RestaurantGalleryImage.id == image_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    _try_delete_uploaded_file(row.image_url)
    db.delete(row)
    db.commit()
    return {"message": "Imagen eliminada"}


# ----- Contact -----
class ContactMessageResponse(BaseModel):
    id: str
    name: str
    email: str
    whatsapp: str
    subject: str
    message: str
    created_at: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class ContactCreateRequest(BaseModel):
    name: str
    email: str
    whatsapp: str
    subject: str
    message: str


@app.get("/api/contact", response_model=List[ContactMessageResponse])
def get_contact_messages(db: Session = Depends(get_db)):
    rows = db.query(models.ContactMessage).order_by(models.ContactMessage.created_at.desc()).all()
    return [
        ContactMessageResponse(
            id=r.id,
            name=r.name,
            email=r.email,
            whatsapp=r.whatsapp,
            subject=r.subject,
            message=r.message,
            created_at=r.created_at.isoformat() if getattr(r.created_at, "isoformat", None) else str(r.created_at),
        )
        for r in rows
    ]


@app.post("/api/contact", response_model=ContactMessageResponse)
def create_contact_message(payload: ContactCreateRequest, db: Session = Depends(get_db)):
    msg_id = f"contact-{uuid.uuid4().hex[:12]}"
    row = models.ContactMessage(
        id=msg_id,
        name=payload.name,
        email=payload.email,
        whatsapp=payload.whatsapp,
        subject=payload.subject,
        message=payload.message,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ContactMessageResponse(
        id=row.id,
        name=row.name,
        email=row.email,
        whatsapp=row.whatsapp,
        subject=row.subject,
        message=row.message,
        created_at=row.created_at.isoformat() if getattr(row.created_at, "isoformat", None) else str(row.created_at),
    )


@app.get("/api/contact/{message_id}", response_model=ContactMessageResponse)
def get_contact_message(message_id: str, db: Session = Depends(get_db)):
    row = db.query(models.ContactMessage).filter(models.ContactMessage.id == message_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Mensaje no encontrado")
    return ContactMessageResponse(
        id=row.id,
        name=row.name,
        email=row.email,
        whatsapp=row.whatsapp,
        subject=row.subject,
        message=row.message,
        created_at=row.created_at.isoformat() if getattr(row.created_at, "isoformat", None) else str(row.created_at),
    )


# ----- Reviews (reseñas de huéspedes) -----
class ReviewResponse(BaseModel):
    id: str
    guest_name: str
    rating: int
    comment: str
    is_approved: bool
    created_at: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ReviewCreateRequest(BaseModel):
    guest_name: str
    rating: int = 5
    comment: str


class ReviewUpdateRequest(BaseModel):
    is_approved: Optional[bool] = None


@app.get("/api/reviews", response_model=List[ReviewResponse])
def get_reviews(
    approved_only: bool = False,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(models.Review).order_by(models.Review.created_at.desc())
    if approved_only:
        q = q.filter(models.Review.is_approved == True)
    rows = q.limit(max(1, min(limit, 100))).all()
    return [
        ReviewResponse(
            id=r.id,
            guest_name=r.guest_name,
            rating=r.rating,
            comment=r.comment,
            is_approved=r.is_approved,
            created_at=r.created_at.isoformat() if getattr(r.created_at, "isoformat", None) else str(r.created_at) if r.created_at else None,
        )
        for r in rows
    ]


@app.post("/api/reviews", response_model=ReviewResponse)
def create_review(payload: ReviewCreateRequest, db: Session = Depends(get_db)):
    if not payload.guest_name or len(payload.guest_name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Nombre inválido")
    if not payload.comment or len(payload.comment.strip()) < 10:
        raise HTTPException(status_code=400, detail="El comentario debe tener al menos 10 caracteres")
    rating = max(1, min(5, payload.rating))
    review_id = f"review-{uuid.uuid4().hex[:12]}"
    row = models.Review(
        id=review_id,
        guest_name=payload.guest_name.strip(),
        rating=rating,
        comment=payload.comment.strip(),
        is_approved=False,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return ReviewResponse(
        id=row.id,
        guest_name=row.guest_name,
        rating=row.rating,
        comment=row.comment,
        is_approved=row.is_approved,
        created_at=row.created_at.isoformat() if getattr(row.created_at, "isoformat", None) else str(row.created_at) if row.created_at else None,
    )


@app.get("/api/admin/reviews", response_model=List[ReviewResponse])
def get_admin_reviews(db: Session = Depends(get_db)):
    rows = db.query(models.Review).order_by(models.Review.created_at.desc()).all()
    return [
        ReviewResponse(
            id=r.id,
            guest_name=r.guest_name,
            rating=r.rating,
            comment=r.comment,
            is_approved=r.is_approved,
            created_at=r.created_at.isoformat() if getattr(r.created_at, "isoformat", None) else str(r.created_at) if r.created_at else None,
        )
        for r in rows
    ]


@app.patch("/api/admin/reviews/{review_id}", response_model=ReviewResponse)
def update_review(review_id: str, payload: ReviewUpdateRequest, db: Session = Depends(get_db)):
    row = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if payload.is_approved is not None:
        row.is_approved = payload.is_approved
    db.commit()
    db.refresh(row)
    return ReviewResponse(
        id=row.id,
        guest_name=row.guest_name,
        rating=row.rating,
        comment=row.comment,
        is_approved=row.is_approved,
        created_at=row.created_at.isoformat() if getattr(row.created_at, "isoformat", None) else str(row.created_at) if row.created_at else None,
    )


@app.delete("/api/admin/reviews/{review_id}")
def delete_review(review_id: str, db: Session = Depends(get_db)):
    row = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    db.delete(row)
    db.commit()
    return {"message": "Reseña eliminada"}


# ----- Rooms: image + status -----
@app.post("/api/rooms/{room_id}/image", response_model=RoomResponse)
def upload_room_image(room_id: str, image: UploadFile = File(...), db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    public_url = _save_image_upload(image, f"rooms/{room_id}", "main")
    if room.image:
        _try_delete_uploaded_file(room.image)
    room.image = public_url
    db.commit()
    db.refresh(room)
    return room


@app.delete("/api/rooms/{room_id}/image", response_model=RoomResponse)
def delete_room_image(room_id: str, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if room.image:
        _try_delete_uploaded_file(room.image)
    room.image = None
    db.commit()
    db.refresh(room)
    return room


@app.patch("/api/rooms/{room_id}/status", response_model=RoomResponse)
def update_room_status(room_id: str, payload: StatusUpdateRequest, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    status = (payload.status or "").strip()
    if status not in ("available", "occupied", "maintenance", "cleaning"):
        raise HTTPException(status_code=400, detail="status inválido")
    room.status = status
    db.commit()
    db.refresh(room)
    return room


def _room_gallery_list(gallery: Optional[str]) -> List[str]:
    if not gallery or not gallery.strip():
        return []
    return [u.strip() for u in gallery.split(",") if u.strip()]


def _room_gallery_join(urls: List[str]) -> str:
    return ",".join(urls)


@app.post("/api/rooms/{room_id}/gallery", response_model=RoomResponse)
def upload_room_gallery(room_id: str, images: List[UploadFile] = File(..., alias="images"), db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    current = _room_gallery_list(room.gallery)
    for img in images:
        if not img.filename:
            continue
        public_url = _save_image_upload(img, f"rooms/{room_id}", "gallery")
        current.append(public_url)
    room.gallery = _room_gallery_join(current)
    db.commit()
    db.refresh(room)
    return room


@app.delete("/api/rooms/{room_id}/gallery", response_model=RoomResponse)
def delete_room_gallery_image(room_id: str, image_url: Optional[str] = None, db: Session = Depends(get_db)):
    room = db.query(models.Room).filter(models.Room.id == room_id).first()
    if not room:
        raise HTTPException(status_code=404, detail="Habitación no encontrada")
    if not image_url or not image_url.strip():
        raise HTTPException(status_code=400, detail="image_url es obligatorio")
    image_url = image_url.strip()
    current = _room_gallery_list(room.gallery)
    new_list = [u for u in current if u != image_url and u.rstrip("/") != image_url.rstrip("/")]
    if len(new_list) == len(current):
        raise HTTPException(status_code=404, detail="Imagen no encontrada en la galería")
    _try_delete_uploaded_file(image_url)
    room.gallery = _room_gallery_join(new_list)
    db.commit()
    db.refresh(room)
    return room


def seed_restaurant_data():
    db = SessionLocal()
    try:
        if db.query(models.MenuItem).count() == 0:
            # Seed Menu Items
            items = [
                models.MenuItem(
                    id="foie-gras", name="Foie Gras Mi-Cuit", 
                    description="Con reducción de Pedro Ximénez y pan de especias casero", 
                    price=38, category="entrante", available=True
                ),
                models.MenuItem(
                    id="tartar-atun", name="Tartar de Atún Rojo", 
                    description="Aguacate, sésamo negro y emulsión de wasabi", 
                    price=32, category="entrante", available=True
                ),
                models.MenuItem(
                    id="wagyu-a5", name="Wagyu A5 Japonés", 
                    description="Medallón de 150g con puré trufado y espárragos verdes", 
                    price=95, category="principal", available=True
                ),
                models.MenuItem(
                    id="lubina-salvaje", name="Lubina Salvaje", 
                    description="A la sal con verduras de temporada y salsa de azafrán", 
                    price=48, category="principal", available=True
                ),
                models.MenuItem(
                    id="solomillo-iberico", name="Solomillo Ibérico", 
                    description="Con foie a la plancha, reducción de oporto y patatas parisinas", 
                    price=52, category="principal", available=True
                ),
                models.MenuItem(
                    id="soufle-chocolate", name="Soufflé de Chocolate", 
                    description="Con helado de vainilla Bourbon y crujiente de praliné", 
                    price=18, category="postre", available=True
                ),
            ]
            db.add_all(items)
            db.commit()
            print("Seeded menu items")

        if db.query(models.DiningArea).count() == 0:
            # Seed Dining Areas
            areas = [
                models.DiningArea(
                    id="restaurante-principal",
                    name="Le Grand Restaurant",
                    description="Nuestra joya culinaria donde la alta cocina mediterránea se fusiona con técnicas vanguardistas. Dirigido por el chef estrella Michelin Carlos Mendoza.",
                    schedule="13:00 - 16:00 / 20:00 - 23:30",
                    features="Cocina de autor,Maridaje de vinos,Menú degustación,Vista panorámica"
                ),
                models.DiningArea(
                    id="bar-lounge",
                    name="The Golden Hour Bar",
                    description="Un sofisticado bar lounge donde la mixología artesanal se encuentra con un ambiente exclusivo. Cócteles de autor y una selección premium de whiskies y champagnes.",
                    schedule="18:00 - 02:00",
                    features="Cócteles de autor,Música en vivo,Terraza privada,Carta de puros"
                )
            ]
            db.add_all(areas)
            db.commit()
            print("Seeded dining areas")

    except Exception as e:
        print(f"Error seeding restaurant data: {e}")
    finally:
        db.close()

seed_restaurant_data()

# Servir archivos subidos (habitaciones, galería, hero, etc.) en /uploads/
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)

