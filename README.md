# 🎮 Sopa de Letras

## 📌 Descripción
Juego web de sopa de letras multijugador, donde el servidor gestiona la lógica del juego y la validación de palabras en tiempo real, mientras el cliente interactúa mediante una interfaz web.

## 🏗️ Arquitectura
- Arquitectura **Cliente–Servidor**
- Comunicación en tiempo real mediante **WebSockets**
- Manejo de concurrencia basado en el **Event Loop de Node.js**, aplicando conceptos de la **teoría de hilos** (procesamiento concurrente sin bloqueo)
- Backend encargado de:
  - Generación dinámica del tablero
  - Selección y validación de palabras
  - Gestión de múltiples jugadores simultáneos
- Frontend web para la interacción del usuario

## 🛠️ Tecnologías
- Node.js
- Express.js
- Socket.IO (WebSockets)
- JavaScript
- HTML5
- CSS3
- JSON
