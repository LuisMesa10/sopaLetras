// gameLogic.js

/**
 * FUNCIÓN: Seleccionar N palabras aleatoriamente de una lista
 * 
 * ¿Qué hace?
 * - Recibe una lista de palabras y un número N
 * - Retorna N palabras aleatorias de esa lista
 * - Cada juego es diferente porque elige distintas palabras
 */
function seleccionarPalabrasAleatorias(listaPalabras, cantidad) {
  // Crear una copia de la lista para no modificar el original
  const copia = [...listaPalabras];
  const seleccionadas = [];

  // Seleccionar N palabras aleatorias
  for (let i = 0; i < cantidad; i++) {
    const indiceAleatorio = Math.floor(Math.random() * copia.length);
    seleccionadas.push(copia[indiceAleatorio]);
    // Eliminar la palabra seleccionada para no repetir
    copia.splice(indiceAleatorio, 1);
  }

  return seleccionadas;
}

/**
 * FUNCIÓN: Generar un tablero aleatorio de letras
 * 
 * ✅ MEJORADO: Garantiza que TODAS las palabras se coloquen
 */
function generarTablero(palabras, size = 12) {
  // Crear una matriz vacía (12x12)
  let tablero = Array(size).fill(null).map(() => 
    Array(size).fill('').map(() => 
      String.fromCharCode(65 + Math.floor(Math.random() * 26)) // Letras aleatorias A-Z
    )
  );

  // Guardar qué celdas ya tienen palabras (para no sobrescribir)
  let celdasOcupadas = new Set();

  // Ordenar palabras por longitud (de más larga a más corta)
  // Esto ayuda a que quepan todas más fácilmente
  const palabrasOrdenadas = [...palabras].sort((a, b) => b.length - a.length);

  // Colocar cada palabra en el tablero
  for (const palabra of palabrasOrdenadas) {
    let colocada = false;
    let intentos = 0;

    // Intentar 500 veces para asegurar que se coloca
    while (!colocada && intentos < 500) {
      const fila = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      
      // Elegir dirección aleatoria
      const direcciones = [
        [0, 1],   // Derecha →
        [1, 0],   // Abajo ↓
        [1, 1],   // Diagonal ↘
        [1, -1]   // Diagonal ↙ (✅ NUEVO: diagonal izquierda)
      ];
      
      const [dirFila, dirCol] = direcciones[
        Math.floor(Math.random() * direcciones.length)
      ];

      // Verificar si cabe la palabra
      let cabe = true;
      if (fila + dirFila * palabra.length >= size || 
          fila + dirFila * palabra.length < 0 ||
          col + dirCol * palabra.length >= size || 
          col + dirCol * palabra.length < 0) {
        cabe = false;
      }

      if (!cabe) {
        intentos++;
        continue;
      }

      // Verificar que no sobrescriba otras palabras
      let hayConflicto = false;
      for (let i = 0; i < palabra.length; i++) {
        const f = fila + dirFila * i;
        const c = col + dirCol * i;
        const key = `${f},${c}`;
        
        // Si la celda ya está ocupada y no tiene la misma letra, hay conflicto
        if (celdasOcupadas.has(key) && tablero[f][c] !== palabra[i].toUpperCase()) {
          hayConflicto = true;
          break;
        }
      }

      if (hayConflicto) {
        intentos++;
        continue;
      }

      // Colocar la palabra
      for (let i = 0; i < palabra.length; i++) {
        const f = fila + dirFila * i;
        const c = col + dirCol * i;
        tablero[f][c] = palabra[i].toUpperCase();
        celdasOcupadas.add(`${f},${c}`);
      }

      colocada = true;
      console.log(`✓ Palabra colocada: ${palabra}`);
    }

    if (!colocada) {
      console.warn(`❌ NO se pudo colocar: ${palabra} (después de 500 intentos)`);
    }
  }

  return tablero;
}

/**
 * FUNCIÓN: Obtener las coordenadas de una palabra en el tablero
 * 
 * ¿Qué hace?
 * - Busca dónde está una palabra específica
 * - Retorna las posiciones (fila, columna) donde aparece
 * 
 * ✅ MEJORADO: También busca en direcciones inversas
 */
function obtenerCoordenadasPalabra(tablero, palabra) {
  const palabra_upper = palabra.toUpperCase();
  const size = tablero.length;
  
  // Todas las direcciones posibles (incluyendo inversas)
  const direcciones = [
    [0, 1],    // Derecha →
    [0, -1],   // Izquierda ←
    [1, 0],    // Abajo ↓
    [-1, 0],   // Arriba ↑
    [1, 1],    // Diagonal ↘
    [1, -1],   // Diagonal ↙
    [-1, 1],   // Diagonal ↗
    [-1, -1]   // Diagonal ↖
  ];

  for (let fila = 0; fila < size; fila++) {
    for (let col = 0; col < size; col++) {
      for (const [dirFila, dirCol] of direcciones) {
        let encontrada = true;
        let coordenadas = [];

        for (let i = 0; i < palabra_upper.length; i++) {
          const f = fila + dirFila * i;
          const c = col + dirCol * i;

          if (f < 0 || f >= size || c < 0 || c >= size || 
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
  seleccionarPalabrasAleatorias,
  generarTablero,
  obtenerCoordenadasPalabra,
  validarPalabra
};
