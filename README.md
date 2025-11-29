# 🎮 Juego de Sopa de Letras Multijugador

Un juego interactivo de sopa de letras en tiempo real, desarrollado con **Node.js**, **Socket.IO** y **HTML5**. Cada jugador recibe un tablero único con 6 palabras aleatorias para encontrar.

---

## 📋 Características

✅ **Juego en tiempo real** - Comunicación bidireccional con Socket.IO  
✅ **Tableros únicos** - Cada jugador recibe un tablero diferente con 6 palabras aleatorias  
✅ **Validación en servidor** - Las palabras se validan en el servidor (seguro)  
✅ **Interfaz intuitiva** - Selecciona letras contiguas y valida  
✅ **Cronómetro** - Mide el tiempo de juego en tiempo real  
✅ **Botón Resolver** - Muestra todas las respuestas si te atascas  
✅ **Contador de palabras** - Muestra cuántas palabras encontraste  
✅ **Responsive** - Funciona en desktop y dispositivos móviles  

---

## 🚀 Requisitos

- **Node.js** (v14 o superior)
- **npm** (gestor de paquetes)

---

## 📦 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd sopa-letras
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará:
- `express` - Servidor web
- `socket.io` - Comunicación en tiempo real

---

## 🎯 Estructura del Proyecto

```
sopa-letras/
│
├── server.js                    # Servidor principal (Node.js)
├── gameLogic.js                # Lógica del juego
├── palabras.json               # Lista de palabras disponibles
├── package.json                # Dependencias del proyecto
│
└── public/                     # Carpeta de archivos estáticos
    └── index.html              # Cliente web (HTML + CSS + JS)
```

### Descripción de archivos

| Archivo | Descripción |
|---------|-------------|
| **server.js** | Servidor principal que gestiona conexiones y valida palabras |
| **gameLogic.js** | Funciones para generar tableros, colocar palabras y validar |
| **palabras.json** | JSON con lista de 12 palabras (se seleccionan 6 aleatorias por juego) |
| **package.json** | Configuración del proyecto y dependencias |
| **public/index.html** | Aplicación web con interfaz interactiva |

---

## 🔧 Configuración

### Archivo: `palabras.json`

Contiene la lista de palabras disponibles:

```json
{
  "palabras": [
    "modulo",
    "programa",
    "socket",
    "web",
    "computador",
    "backend",
    "frontend",
    "maquina",
    "paralela",
    "hilos",
    "servidor",
    "modelo"
  ]
}

```

Puedes agregar o cambiar palabras según necesites.

---

## ▶️ Cómo ejecutar

### Iniciar el servidor

```bash
npm start
```

El servidor se ejecutará en: **http://localhost:3000**

### En la consola verás:

```
🚀 Servidor ejecutándose en http://localhost:3000
📊 Palabras disponibles: 12
📋 Palabras cargadas: traductor, empleado, relojero, ...
🎲 Por juego: 6 palabras aleatorias de las 12 disponibles
```

### Abrir en el navegador

1. Abre tu navegador web
2. Ve a: **http://localhost:3000**
3. Ingresa tu nombre
4. ¡A jugar!

---

## 🎮 Cómo Jugar

### Paso 1: Iniciar el juego
- Abre la aplicación en tu navegador
- Escribe tu nombre
- Presiona "▶️ Iniciar Juego"

### Paso 2: Buscar palabras
- **Haz clic en las letras** para seleccionarlas
- Las letras deben ser **contiguas** (horizontales, verticales o diagonales)
- Las letras seleccionadas se mostrarán en **AZUL**

### Paso 3: Validar palabra
- Una vez seleccionada una palabra completa
- Presiona el botón **"✓ Validar"**
- El servidor verificará si es correcta

### Paso 4: Resultados
- Si es correcta → Se mostrará en **VERDE** 🟢
- Si es incorrecta → Recibirás un mensaje de error
- Si ya la encontraste → Te avisará

### Paso 5: Completar el juego
- Encuentra todas las 6 palabras
- ¡Recibe un mensaje de felicitación! 🎉

### Botones disponibles

| Botón | Función |
|-------|---------|
| **✓ Validar** | Envía tu selección al servidor |
| **✕ Limpiar** | Borra la selección actual |
| **🔓 Resolver** | Muestra todas las palabras (solo si te atascas) |
| **🔄 Nuevo** | Inicia un nuevo juego |

---

## 🔌 Arquitectura de Comunicación

### Cliente → Servidor

```
Cliente emite evento          Servidor recibe evento
    ↓                              ↓
validar_palabra          →    Valida coordenadas
{ coordenadas: [...] }        Verifica palabra
                              Guarda estado
                              Responde
    ↓                              ↓
Recibe respuesta         ←    palabra_valida
palabra_valida                 { palabra, coordenadas }
palabra_invalida          O    palabra_invalida
palabra_duplicada              palabra_duplicada
```

---

## 📊 Flujo de Datos

```
1. INICIAR JUEGO
   Cliente: emit('iniciar_juego', {nombre})
   Servidor: 
   - Selecciona 6 palabras aleatorias
   - Genera tablero único
   - Guarda en memoria
   - Envía tablero + palabras

2. SELECCIONAR LETRAS
   Cliente: Almacena en juego.seleccion = [[fila, col], ...]
   Tablero: Muestra letras en AZUL

3. VALIDAR PALABRA
   Cliente: emit('validar_palabra', {coordenadas})
   Servidor:
   - Extrae letras de coordenadas
   - Verifica si está en lista de palabras
   - Guarda coordenadas
   - Responde con palabra_valida

4. MOSTRAR RESULTADO
   Cliente: Dibuja celdas en VERDE
   Tablero: Actualiza visualmente

5. GANAR JUEGO
   Servidor: Detecta "6/6 palabras encontradas"
   Cliente: Muestra mensaje de felicitación
```

---

## 🛠️ Conceptos Técnicos

### Socket.IO
- Librería para comunicación bidireccional en tiempo real
- Permite que cliente y servidor se envíen mensajes instantáneamente
- Mejor que HTTP porque mantiene conexión abierta

### Event Loop en Node.js
- Node.js usa un único hilo JavaScript
- Maneja muchas conexiones sin crear hilos para cada cliente
- Más eficiente que Java con threads

### Validación en Servidor
- El cliente envía coordenadas, NO la palabra
- El servidor valida (seguridad)
- Evita trucos como cambiar datos en DevTools

### Almacenamiento en Memoria
```javascript
const jugadores = {
  "socket-id-1": {
    nombre: "Luis",
    tablero: [...],
    palabrasEncontradas: ["palabra1", "palabra2"],
    palabrasCoord: { "palabra1": [[fila, col], ...] }
  }
}
```

---

## 🎨 Colores del Juego

| Color | Significado |
|-------|------------|
| ⚪ BLANCO | Celda sin seleccionar |
| 🔵 AZUL | Letra seleccionada actualmente |
| 🟢 VERDE | Palabra encontrada y confirmada |
| 🟡 AMARILLO (hover) | Celda sobre la que pasas el mouse |

---

## 🐛 Solución de Problemas

### "No puedo conectarme al servidor"
```bash
# Verifica que el servidor está ejecutándose
npm start

# Verifica que estés en http://localhost:3000 (no localhost sin puerto)
# Abre la consola del navegador (F12) para ver errores
```

### "No puedo seleccionar letras no contiguas"
Esto es **intencional**. Las letras deben ser adyacentes (horizontales, verticales o diagonales).

### "Una palabra no se valida aunque la encontré"
- Verifica que las letras sean exactamente contiguas
- La palabra debe estar en la lista de 6 palabras de ese juego
- Intenta hacer clic nuevamente en cada letra en orden

### "No encuentro todas las 6 palabras"
- Prueba con el botón **"🔓 Resolver"** para ver dónde están
- Las palabras pueden estar en cualquier dirección (→, ↓, ↘, etc.)

---

## 📝 Modificaciones Comunes

### Cambiar cantidad de palabras por juego
En `server.js`, línea ~50:
```javascript
const palabrasDelJuego = gameLogic.seleccionarPalabrasAleatorias(listaPalabrasCompleta, 6);
// Cambia 6 por el número que desees
```

### Cambiar tamaño del tablero
En `server.js`, línea ~51:
```javascript
const tablero = gameLogic.generarTablero(palabrasDelJuego, 12);
// Cambia 12 por tamaño deseado (10, 15, 20, etc.)
```

### Agregar más palabras
En `palabras.json`:
```json
{
  "palabras": [
    "palabra1",
    "palabra2",
    "tupalabra"
  ]
}
```

---

## 🚢 Despliegue en la Nube

### Opción 1: Render (Recomendado)
1. Sube el proyecto a GitHub
2. Crea cuenta en **render.com**
3. Conecta tu repositorio
4. Selecciona "Node" como servicio
5. Deploy automático

### Opción 2: Heroku
```bash
heroku login
heroku create tu-nombre-app
git push heroku main
```

---

## 📚 Tecnologías Utilizadas

- **Node.js** - Servidor JavaScript
- **Express.js** - Framework web
- **Socket.IO** - Comunicación en tiempo real
- **HTML5** - Estructura web
- **CSS3** - Estilos
- **JavaScript** - Lógica del cliente

---

## 👨‍💻 Desarrollo y Depuración

### Ver logs del servidor
```
✅ Cliente conectado: abc123...
🎮 Iniciar juego solicitado por: Luis
✓ Palabra colocada: traductor
✅ Luis encontró: traductor
🎉 Luis ¡COMPLETÓ EL JUEGO! (tiempo: 125s)
```

### Verificar en DevTools del navegador (F12)
```javascript
// Ver estado del juego
console.log(juego);

// Ver conexión Socket
console.log(socket);
```

---

## 📖 Referencias

- [Node.js Documentation](https://nodejs.org/docs/)
- [Socket.IO Guide](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 📄 Licencia

Este proyecto es educativo y de código abierto.

---

## 🎓 Aprendizajes Clave

Este proyecto enseña:

✅ Comunicación en tiempo real con WebSockets  
✅ Arquitectura cliente-servidor  
✅ Validación de datos en servidor (seguridad)  
✅ Generación de contenido dinámico  
✅ Manejo de eventos  
✅ Algoritmos de búsqueda  
✅ Interfaz responsiva  

---

## 🤝 Contribuciones

¿Ideas para mejorar el juego?

- Agregar niveles de dificultad
- Soporte multijugador en vivo
- Rankings y puntuaciones
- Diferentes idiomas
- Modo de entrenamiento

---

## 📞 Contacto

Para preguntas o sugerencias sobre el desarrollo:

- Documentación: Ver comentarios en el código
- Errores: Revisa la consola del servidor y del navegador

---

## ✨ Características Futuras

- [ ] Sistema de puntuaciones
- [ ] Multiplicadores de tiempo
- [ ] Dificultades (Fácil, Medio, Difícil)
- [ ] Modos de juego especiales
- [ ] Chat entre jugadores
- [ ] Leaderboard global
- [ ] Soporte para más idiomas
- [ ] Temas de color personalizables

---

**¡Disfruta jugando y aprendiendo!** 🎮✨
