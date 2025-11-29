// gameLogic.js

/**
 * FUNCIÓN: Generar un tablero aleatorio de letras
 * 
 * ¿Qué hace?
 * - Crea una matriz (cuadrícula) de letras aleatorias
 * - Coloca palabras de forma horizontal, vertical o diagonal
 * 
 * ¿Por qué?
 * - Cada jugador necesita un tablero único
 * - Las palabras deben estar "escondidas" entre letras aleatorias
 */
function generarTablero(palabras, size = 12) {
  // Crear una matriz vacía (12x12)
  let tablero = Array(size).fill(null).map(() => 
    Array(size).fill('').map(() => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) // Letras aleatorias A-Z
    )
  );

  // Colocar cada palabra en el tablero
  palabras.forEach(palabra => {
    colocarPalabra(tablero, palabra.toUpperCase(), size);
  });

  return tablero;
}

/**
 * FUNCIÓN: Colocar una palabra en el tablero
 * 
 * Elige una posición y dirección aleatorias:
 * - Horizontal (→)
 * - Vertical (↓)
 * - Diagonal (↘)
 */
function colocarPalabra(tablero, palabra, size) {
  // Direcciones: [fila, columna]
  const direcciones = [
    [0, 1],   // Derecha →
    [1, 0],   // Abajo ↓
    [1, 1]  // Diagonal ↘
  ];

  let colocada = false;
  let intentos = 0;

  while (!colocada && intentos < 100) {
    // Elegir posición inicial aleatoria
    const fila = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    // Elegir dirección aleatoria
    const [dirFila, dirCol] = direcciones[
      Math.floor(Math.random() * direcciones.length)
    ];

    // Verificar si cabe la palabra en esa dirección
    if (fila + dirFila * palabra.length < size && 
        col + dirCol * palabra.length < size) {
      
      // Colocar la palabra
      for (let i = 0; i < palabra.length; i++) {
        tablero[fila + dirFila * i][col + dirCol * i] = palabra[i];
      }
      colocada = true;
    }

    intentos++;
  }
}

/**
 * FUNCIÓN: Obtener las coordenadas de una palabra en el tablero
 * 
 * ¿Qué hace?
 * - Busca dónde está una palabra específica
 * - Retorna las posiciones (fila, columna) donde aparece
 * 
 * Esto es lo que necesita el servidor para la opción "RESOLVER"
 */
function obtenerCoordenadasPalabra(tablero, palabra) {
  const palabra_upper = palabra.toUpperCase();
  const size = tablero.length;
  const direcciones = [
    [0, 1],   // Derecha
    [1, 0],   // Abajo
    [1, 1]    // Diagonal
  ];

  for (let fila = 0; fila < size; fila++) {
    for (let col = 0; col < size; col++) {
      for (const [dirFila, dirCol] of direcciones) {
        let encontrada = true;
        let coordenadas = [];

        for (let i = 0; i < palabra_upper.length; i++) {
          const f = fila + dirFila * i;
          const c = col + dirCol * i;

          if (f >= size || c >= size || 
              tablero[f][c] !== palabra_upper[i]) {
            encontrada = false;
            break;
          }

          coordenadas.push([f, c]);
        }

        if (encontrada) {
          return coordenadas;
        }
      }
    }
  }

  return null; // Palabra no encontrada
}

/**
 * FUNCIÓN: Validar si un conjunto de coordenadas forma una palabra válida
 * 
 * ¿Qué hace?
 * - El cliente envía un array de [fila, col] que ha marcado
 * - Verificamos si esas coordenadas forman una palabra de nuestra lista
 */
function validarPalabra(tablero, coordenadas, listaValida) {
  if (coordenadas.length === 0) return false;

  // Extraer las letras de las coordenadas
  let palabra = '';
  for (const [fila, col] of coordenadas) {
    palabra += tablero[fila][col];
  }

  // Verificar si la palabra está en la lista de palabras válidas
  return listaValida.includes(palabra.toLowerCase());
}

// Exportar las funciones para usarlas en server.js
module.exports = {
  generarTablero,
  obtenerCoordenadasPalabra,
  validarPalabra
};
