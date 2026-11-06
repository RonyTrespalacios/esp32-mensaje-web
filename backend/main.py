from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

app = FastAPI(title="Mensaje API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Almacenamiento simple en memoria
mensaje: str = "Hola mundo"


class Mensaje(BaseModel):
    mensaje: str


@app.get("/mensaje")
def obtener_mensaje():
    """Devuelve el mensaje en JSON: {"mensaje": "..."}"""
    return {"mensaje": mensaje}


@app.get("/mensaje/texto", response_class=PlainTextResponse)
def obtener_mensaje_texto():
    """Devuelve el mensaje como texto plano (ideal para la ESP32)."""
    return mensaje


@app.put("/mensaje")
def actualizar_mensaje(datos: Mensaje):
    global mensaje
    mensaje = datos.mensaje
    return {"mensaje": mensaje}
