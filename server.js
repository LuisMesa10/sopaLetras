// server.js

// Importar librerías
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const gameLogic = require('./gameLogic');

// Inicializar Express y Socket.IO
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: "*" } // Permitir conexiones desde cualquier origen
});

// Cargar la lista de palabras
const palabrasData = JSON.parse(fs.readFileSync('palabras.json', 'utf-8'));
const listaPalabrasCompleta = palabrasData.palabras;

// Configuraciones por dificultad (size = tamaño del tablero)
const configuracionesDificultad = {
  facil:  { cantidadPalabras: 6,  size: 10 },
  medio:  { cantidadPalabras: 8,  size: 12 },
  dificil:{ cantidadPalabras: 12, size: 14 }
};

// ============================================
// ESTRUCTURA DE DATOS: JUGADORES EN MEMORIA
// ============================================
// Guardar el estado de cada jugador conectado
const jugadores = {};

/**
 * Estructura de un jugador:
 * {
 *   socketId: "abc123...",
 *   nombre: "Jugador 1",
 *   palabrasDelJuego: ["palabra1", "palabra2", ...],  ✅ NUEVO: Las 6 palabras de este juego
 *   tablero: [[...matriz...]],
 *   palabrasEncontradas: ["palabra1", "palabra2"],
 *   palabrasCoord: { "palabra": [[fila, col], ...] },
 *   tiempoInicio: 1701245600000,
 *   activo: true
 * }
 */

// ============================================
// RUTAS HTTP (estáticas)
// ============================================
app.use(express.static('public')); // Servir archivos estáticos (HTML, CSS, JS del cliente)

app.get('/', (req, res) => {
  res.send(`
    <h1>🎮 Servidor de Sopa de Letras</h1>
    <p>Servidor ejecutándose en puerto 3000</p>
    <p>Conecta con tu cliente para jugar</p>
  `);
});

// ============================================
// EVENTOS DE SOCKET.IO
// ============================================

/**
 * EVENTO: Cuando un cliente se conecta
 * 
 * ¿Qué pasa?
 * 1. Se crea una nueva conexión Socket
 * 2. Se le asigna un ID único (socket.id)
 * 3. Esperamos que envíe un evento "iniciar_juego"
 */
io.on('connection', (socket) => {
  console.log(`✅ Cliente conectado: ${socket.id}`);

  /**
   * EVENTO: El cliente solicita iniciar un juego
   * 
   * El cliente envía: { nombre: "Jugador 1" }
   * Nosotros hacemos:
   * 1. Seleccionar 6 palabras ALEATORIAMENTE
   * 2. Generar un tablero único para este jugador
   * 3. Guardar su estado en memoria
   * 4. Enviarle el tablero y las 6 palabras a encontrar
   * 5. Iniciar su cronómetro
   */
// Cuando el cliente solicita iniciar un juego
socket.on('iniciar_juego', (data) => {

  const nombre = data.nombre || 'Jugador';
  const dificultad = data.dificultad || 'medio';   // <-- IMPORTANTE
  console.log(`🎮 ${nombre} solicita iniciar juego (dificultad: ${dificultad})`);

  // 1) Configuración según dificultad
  const config = configuracionesDificultad[dificultad] || configuracionesDificultad.medio;

  // 2) Seleccionar N palabras
  const palabrasSeleccionadas = gameLogic.seleccionarPalabrasAleatorias(
      listaPalabrasCompleta,
      config.cantidadPalabras
  );

  // 3) Asignar colores a cada palabra
  const palabrasConColor = gameLogic.asignarColores(palabrasSeleccionadas);

  // 4) Generar tablero con el tamaño correcto SEGÚN dificultad
  const palabrasSoloTexto = palabrasConColor.map(p => p.texto);
  const tablero = gameLogic.generarTablero(palabrasSoloTexto, config.size);

  // 5) Guardar estado del jugador
  jugadores[socket.id] = {
    socketId: socket.id,
    nombre,
    palabrasDelJuego: palabrasSeleccionadas.map(p => p.toLowerCase()),
    tablero,
    palabrasEncontradas: [],
    palabrasCoord: {},
    palabrasConColor,
    tiempoInicio: Date.now(),
    activo: true
  };

  // 6) Enviar al cliente
  socket.emit('juego_iniciado', {
    tablero,
    palabras: palabrasConColor,
    tiempoInicio: jugadores[socket.id].tiempoInicio
  });

  console.log(`   Palabras enviadas a ${nombre}: ${palabrasSeleccionadas.join(', ')}`);
});



  /**
   * EVENTO: El cliente marca un conjunto de coordenadas
   * 
   * El cliente envía: { coordenadas: [[0,1], [0,2], [0,3]] }
   * Nosotros hacemos:
   * 1. Validar si esas coordenadas forman una palabra válida
   * 2. Si es válida, guardarla en palabrasEncontradas
   * 3. Enviar respuesta al cliente
   */
  // Cuando el cliente envía coordenadas para validar palabra
socket.on('validar_palabra', (data) => {
  const jugador = jugadores[socket.id];
  if (!jugador) {
    socket.emit('palabra_invalida', { mensaje: 'Jugador no encontrado' });
    return;
  }

  // Validar con tu función (que espera tablero, coordenadas y lista de palabras válidas)
  const esValida = gameLogic.validarPalabra(jugador.tablero, data.coordenadas, jugador.palabrasDelJuego);

  if (esValida) {
    // reconstruir la palabra desde las coordenadas
    let palabra = '';
    for (const [fila, col] of data.coordenadas) {
      palabra += jugador.tablero[fila][col];
    }
    palabra = palabra.toLowerCase();

    // verificar si ya fue encontrada
    if (!jugador.palabrasEncontradas.includes(palabra)) {
      jugador.palabrasEncontradas.push(palabra);
      jugador.palabrasCoord[palabra] = data.coordenadas;

      // buscar color de la palabra para enviarla al cliente
      const match = jugador.palabrasConColor.find(p => p.texto.toLowerCase() === palabra);
      const color = match ? match.color : '#27ae60';

      socket.emit('palabra_valida', {
        palabra,
        coordenadas: data.coordenadas,
        color,
        palabrasEncontradas: jugador.palabrasEncontradas
      });

      // verificar si completó todas
      if (jugador.palabrasEncontradas.length === jugador.palabrasDelJuego.length) {
        const tiempoTotal = Math.floor((Date.now() - jugador.tiempoInicio) / 1000);
        socket.emit('juego_completado', { tiempoTotal });
      }
    } else {
      socket.emit('palabra_duplicada', { mensaje: 'Ya encontraste esta palabra' });
    }
  } else {
    socket.emit('palabra_invalida', { mensaje: 'No es una palabra válida' });
  }
});


  /**
   * EVENTO: El cliente solicita resolver el juego
   * 
   * El cliente envía: { acción: 'resolver' }
   * Nosotros hacemos:
   * 1. Para cada palabra de las 6 del juego
   * 2. Obtener sus coordenadas en el tablero
   * 3. Enviar todas las soluciones al cliente
   */
  socket.on('resolver_juego', () => {
  const jugador = jugadores[socket.id];
  if (!jugador) {
    socket.emit('error', { mensaje: 'Jugador no encontrado' });
    return;
  }

  const soluciones = {};
  for (const palabra of jugador.palabrasDelJuego) {
    const coords = gameLogic.obtenerCoordenadasPalabra(jugador.tablero, palabra);
    soluciones[palabra] = coords;
  }

  socket.emit('soluciones', {
    soluciones,
    tiempoTranscurrido: Math.floor((Date.now() - jugador.tiempoInicio) / 1000),
    palabrasConColor: jugador.palabrasConColor
  });

  jugador.activo = false;
});


  /**
   * EVENTO: El cliente se desconecta
   * 
   * ¿Qué pasa?
   * 1. Eliminamos al jugador de la memoria
   * 2. Registramos cuánto tiempo jugó
   */
    socket.on('disconnect', () => {
    const jugador = jugadores[socket.id];

    if (jugador) {
      const tiempoTotal = Math.floor((Date.now() - jugador.tiempoInicio) / 1000);
      console.log(`❌ ${jugador.nombre} desconectado (tiempo: ${tiempoTotal}s, palabras encontradas: ${jugador.palabrasEncontradas.length}/6)`);
      delete jugadores[socket.id];
    }
  });

});  


// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📊 Palabras disponibles: ${listaPalabrasCompleta.length}`);
  console.log(`📋 Palabras cargadas: ${listaPalabrasCompleta.join(', ')}`);
  console.log(`🎲 Por juego: 6 palabras aleatorias de las ${listaPalabrasCompleta.length} disponibles`);
});
