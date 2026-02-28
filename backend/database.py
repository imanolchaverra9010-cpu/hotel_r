import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Cargar .env desde la carpeta backend (así funciona aunque el proceso arranque desde otra ruta) 
_load_env = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
load_dotenv(_load_env)

# Obtener URL de base de datos desde entorno (ahora hardcodeado)
SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://u659323332_hotel:Hotelrobles123%40@82.197.82.29/u659323332_hotel"

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("No se encontró SQLALCHEMY_DATABASE_URL en el entorno o en el archivo .env")

# Conectar directamente usando la URL proporcionada
_engine_kw = {"pool_pre_ping": True}
engine = create_engine(SQLALCHEMY_DATABASE_URL, **_engine_kw)

try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    print("[DB] Conectado a: MySQL")
except Exception as e:
    print(f"[DB] Error crítico al conectar a MySQL: {e}")
    raise e

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) 
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

