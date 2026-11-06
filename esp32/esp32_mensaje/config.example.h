// ============================================================
//  PLANTILLA DE CONFIGURACION
//  1. Copia este archivo y renombralo a "config.h" (misma carpeta)
//  2. Edita los valores con los datos de TU red y TU equipo
//  "config.h" esta en .gitignore: tus credenciales NO se suben a GitHub
// ============================================================
#pragma once

// Red WiFi a la que se conectara la ESP32 (solo 2.4 GHz)
#define WIFI_SSID     "NOMBRE_DE_TU_RED"
#define WIFI_PASSWORD "CLAVE_DE_TU_RED"

// IP del equipo donde corre Docker (backend). Ver README > "Que cambiar"
// Ejemplo hotspot de Windows: 192.168.137.1
#define BACKEND_HOST  "192.168.137.1"
#define BACKEND_PORT  8000
