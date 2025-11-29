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
  socket.on('iniciar_juego', (data) => {
    console.log(`🎮 Iniciar juego solicitado por: ${data.nombre}`);

    // 1. ✅ SELECCIONAR 6 PALABRAS ALEATORIAMENTE
    const palabrasDelJuego = gameLogic.seleccionarPalabrasAleatorias(listaPalabrasCompleta, 6);
    console.log(`   Palabras seleccionadas: ${palabrasDelJuego.join(', ')}`);

    // 2. Generar tablero con SOLO esas 6 palabras
    const tablero = gameLogic.generarTablero(palabrasDelJuego, 12);

    // 3. Crear objeto del jugador
    const jugador = {
      socketId: socket.id,
      nombre: data.nombre,
      palabrasDelJuego: palabrasDelJuego, // ✅ NUEVO: Guardar las 6 palabras de este juego
      tablero: tablero,
      palabrasEncontradas: [],
      palabrasCoord: {},
      tiempoInicio: Date.now(),
      activo: true
    };

    // 4. Guardar en memoria
    jugadores[socket.id] = jugador;

    // 5. Enviar al cliente su tablero y las 6 palabras (NO las 12)
    socket.emit('juego_iniciado', {
      tablero: tablero,
      palabras: palabrasDelJuego, // ✅ CAMBIO: Enviar solo las 6 palabras
      tiempoInicio: jugador.tiempoInicio
    });

    console.log(`   Tablero generado para ${data.nombre}`);
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
  socket.on('validar_palabra', (data) => {
    const jugador = jugadores[socket.id];

    if (!jugador) {
      socket.emit('error', { mensaje: 'Jugador no encontrado' });
      return;
    }

    // Validar si las coordenadas forman una palabra válida
    // ✅ CAMBIO: Usar palabrasDelJuego en lugar de listaPalabrasCompleta
    const esValida = gameLogic.validarPalabra(
      jugador.tablero,
      data.coordenadas,
      jugador.palabrasDelJuego
    );

    if (esValida) {
      // Obtener la palabra completa
      let palabra = '';
      for (const [fila, col] of data.coordenadas) {
        palabra += jugador.tablero[fila][col];
      }
      palabra = palabra.toLowerCase();

      // Verificar que no la haya encontrado antes
      if (!jugador.palabrasEncontradas.includes(palabra)) {
        jugador.palabrasEncontradas.push(palabra);
        
        // Guardar las coordenadas de esta palabra
        jugador.palabrasCoord[palabra] = data.coordenadas;
        
        console.log(`✅ ${jugador.nombre} encontró: ${palabra}`);

        // Enviar confirmación al cliente
        socket.emit('palabra_valida', {
          palabra: palabra,
          coordenadas: data.coordenadas,
          palabrasEncontradas: jugador.palabrasEncontradas
        });

        // ✅ NUEVO: Verificar si completó todas las palabras
        if (jugador.palabrasEncontradas.length === jugador.palabrasDelJuego.length) {
          const tiempoTotal = Math.floor((Date.now() - jugador.tiempoInicio) / 1000);
          console.log(`🎉 ${jugador.nombre} ¡COMPLETÓ EL JUEGO! (tiempo: ${tiempoTotal}s)`);
          socket.emit('juego_completado', {
            tiempoTotal: tiempoTotal,
            palabrasEncontradas: jugador.palabrasEncontradas.length
          });
        }
      } else {
        socket.emit('palabra_duplicada', { mensaje: 'Ya encontraste esta palabra' });
      }
    } else {
      console.log(`❌ ${jugador.nombre} intentó palabra inválida`);
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

    console.log(`🔓 ${jugador.nombre} solicita resolver`);

    // Generar mapa de soluciones
    const soluciones = {};
    // ✅ CAMBIO: Usar palabrasDelJuego en lugar de listaPalabrasCompleta
    for (const palabra of jugador.palabrasDelJuego) {
      const coordenadas = gameLogic.obtenerCoordenadasPalabra(
        jugador.tablero,
        palabra
      );
      soluciones[palabra] = coordenadas;
    }

    // Enviar soluciones al cliente
    socket.emit('soluciones', {
      soluciones: soluciones,
      tiempoTranscurrido: Date.now() - jugador.tiempoInicio
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
