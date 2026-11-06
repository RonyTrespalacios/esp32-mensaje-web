// El backend corre en el mismo host que sirve el frontend, puerto 8000
const API = `http://${window.location.hostname}:8000`;

const actual = document.getElementById("actual");
const form = document.getElementById("form");
const input = document.getElementById("nuevo");
const estado = document.getElementById("estado");

async function cargarMensaje() {
  try {
    const res = await fetch(`${API}/mensaje`);
    const data = await res.json();
    actual.textContent = data.mensaje;
  } catch (e) {
    actual.textContent = "Error conectando al backend";
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const res = await fetch(`${API}/mensaje`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensaje: input.value }),
    });
    const data = await res.json();
    actual.textContent = data.mensaje;
    estado.textContent = "Mensaje actualizado ✔";
    input.value = "";
    setTimeout(() => (estado.textContent = ""), 2000);
  } catch (e) {
    estado.textContent = "Error al guardar";
  }
});

cargarMensaje();
setInterval(cargarMensaje, 2000); // refresco automático
