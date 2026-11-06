#include <WiFi.h>
#include <HTTPClient.h>

// Credenciales WiFi e IP del backend (NO se sube a GitHub).
// Si no existe, copia "config.example.h" como "config.h" y editalo.
#include "config.h"

const char* ssid     = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// Endpoint de texto plano del backend
String url = String("http://") + BACKEND_HOST + ":" + BACKEND_PORT + "/mensaje/texto";

String ultimoMensaje = "";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Conectado. IP ESP32: ");
  Serial.println(WiFi.localIP());
  Serial.print("Consultando: ");
  Serial.println(url);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(url);
    int code = http.GET();
    if (code == 200) {
      String mensaje = http.getString();
      if (mensaje != ultimoMensaje) {
        Serial.print("Nuevo mensaje: ");
        Serial.println(mensaje);
        ultimoMensaje = mensaje;
      }
    } else {
      Serial.printf("Error HTTP: %d\n", code);
    }
    http.end();
  } else {
    Serial.println("WiFi desconectado, reconectando...");
    WiFi.reconnect();
  }
  delay(1000);
}
