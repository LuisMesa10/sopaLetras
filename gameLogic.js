// gameLogic.js

/**
 * Seleccionar N palabras aleatoriamente de una lista (sin repetir)
 */
function seleccionarPalabrasAleatorias(listaPalabras, cantidad) {
  const copia = [...listaPalabras];
  const seleccionadas = [];
  const max = Math.min(cantidad, copia.length);

  for (let i = 0; i < max; i++) {
    const idx = Math.floor(Math.random() * copia.length);
    seleccionadas.push(copia[idx]);
    copia.splice(idx, 1);
  }

  return seleccionadas;
}

/**
 * Generar un tablero aleatorio de letras
 * - Coloca las palabras (8 direcciones)
 * - Usa palabra.length - 1 para comprobar límites correctamente
 * - Permite solapamientos cuando la letra coincide
 */
function generarTablero(palabras, size = 12) {
  // Matriz size x size con letras aleatorias
  const tablero = Array.from({ length: size }, () =>
    Array.from({ length: size }, () =>
      String.fromCharCode(65 + Math.floor(Math.random() * 26))
    )
  );

  const celdasOcupadas = new Set();

  // Direcciones (8)
  const direcciones = [
    [0, 1],   // → derecha
    [0, -1],  // ← izquierda
    [1, 0],   // ↓ abajo
    [-1, 0],  // ↑ arriba
    [1, 1],   // ↘ diagonal
    [1, -1],  // ↙ diagonal
    [-1, 1],  // ↗ diagonal
    [-1, -1]  // ↖ diagonal
  ];

  // Ordenar por longitud descendente para facilitar el encaje
  const palabrasOrdenadas = [...palabras].sort((a, b) => b.length - a.length);

  for (const palabraRaw of palabrasOrdenadas) {
    const palabra = palabraRaw.toUpperCase();
    let colocada = false;
    let intentos = 0;
    const maxIntentos = 1000;

    while (!colocada && intentos < maxIntentos) {
      intentos++;

      const dir = direcciones[Math.floor(Math.random() * direcciones.length)];
      const dirFila = dir[0], dirCol = dir[1];

      // Elegir punto de inicio aleatorio
      const fila = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);

      // Comprobar límites: la última letra estará en:
      // fila + dirFila * (palabra.length - 1)
      const ultimaFila = fila + dirFila * (palabra.length - 1);
      const ultimaCol = col + dirCol * (palabra.length - 1);

      if (ultimaFila < 0 || ultimaFila >= size || ultimaCol < 0 || ultimaCol >= size) {
        continue; // No cabe
      }

      // Verificar conflictos (solo conflicto si hay letra distinta)
      let conflicto = false;
      for (let i = 0; i < palabra.length; i++) {
        const f = fila + dirFila * i;
        const c = col + dirCol * i;
        const key = `${f},${c}`;
        if (celdasOcupadas.has(key) && tablero[f][c] !== palabra[i]) {
          conflicto = true;
          break;
        }
      }
      if (conflicto) continue;

      // Colocar la palabra
      for (let i = 0; i < palabra.length; i++) {
        const f = fila + dirFila * i;
        const c = col + dirCol * i;
        tablero[f][c] = palabra[i];
        celdasOcupadas.add(`${f},${c}`);
      }

      colocada = true;
      // console.log(`✓ Palabra colocada: ${palabra}`);
    }

    if (!colocada) {
      console.warn(`❌ NO se pudo colocar: ${palabraRaw} (intentos: ${intentos})`);
    }
  }

  return tablero;
}

/**
 * Obtener las coordenadas de una palabra en el tablero
 * - Recorre todas las direcciones (incluidas inversas)
 * - Retorna array de [fila,col] o null si no existe
 */
function obtenerCoordenadasPalabra(tablero, palabra) {
  const palabraUpper = palabra.toUpperCase();
  const size = tablero.length;
  const direcciones = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
    [1, 1], [1, -1], [-1, 1], [-1, -1]
  ];

  for (let fila = 0; fila < size; fila++) {
    for (let col = 0; col < size; col++) {
      for (const [dirFila, dirCol] of direcciones) {
        let encontrada = true;
        const coords = [];

        for (let i = 0; i < palabraUpper.length; i++) {
          const f = fila + dirFila * i;
          const c = col + dirCol * i;
          if (f < 0 || f >= size || c < 0 || c >= size || tablero[f][c] !== palabraUpper[i]) {
            encontrada = false;
            break;
          }
          coords.push([f, c]);
        }

        if (encontrada) return coords;
      }
    }
  }

  return null;
}

/**
 * Validar si un conjunto de coordenadas forma una palabra válida
 * - Verifica que las coordenadas estén en línea recta y sean contiguas
 * - Acepta la palabra en orden normal o inverso (por si el jugador selecciona al revés)
 * - listaValida: array de palabras en minúscula
 */
function validarPalabra(tablero, coordenadas, listaValida) {
  if (!Array.isArray(coordenadas) || coordenadas.length === 0) return false;

  // Verificar que todas las coordenadas estén dentro del tablero
  const size = tablero.length;
  for (const [f, c] of coordenadas) {
    if (f < 0 || f >= size || c < 0 || c >= size) return false;
  }

  // Si solo hay 1 coordenada -> construir palabra de 1 letra y verificar
  if (coordenadas.length === 1) {
    const [f, c] = coordenadas[0];
    const letra = tablero[f][c].toLowerCase();
    return listaValida.includes(letra);
  }

  // Calcular dirección normalizada usando las dos primeras coordenadas
  const [f0, c0] = coordenadas[0];
  const [f1, c1] = coordenadas[1];
  const df = f1 - f0;
  const dc = c1 - c0;

  // Normalizar a -1,0,1
  const dirFila = Math.sign(df);
  const dirCol = Math.sign(dc);

  // Asegurar que (dirFila, dirCol) esté en {-1,0,1} y que la distancia sea 1 en sentido Manhattan/admisible
  if (!(Math.abs(df) === Math.abs(dirFila) || Math.abs(df) === 1) || !(Math.abs(dc) === Math.abs(dirCol) || Math.abs(dc) === 1)) {
    // no se pudo normalizar correctamente (defensivo), pero mejor seguir comprobando estrictamente:
  }

  // Verificar que todas las coordenadas sigan la misma dirección y sean contiguas
  for (let i = 0; i < coordenadas.length; i++) {
    const expectedF = f0 + dirFila * i;
    const expectedC = c0 + dirCol * i;
    const [fi, ci] = coordenadas[i];
    if (fi !== expectedF || ci !== expectedC) {
      // Puede que las coords estén en orden inverso (jugador seleccionó desde el final)
      // Intentamos comprobar usando la última como inicio (reverse)
      const last = coordenadas[coordenadas.length - 1];
      const [fl, cl] = last;
      const df2 = fl - coordenadas[coordenadas.length - 2][0];
      const dc2 = cl - coordenadas[coordenadas.length - 2][1];
      const dirFilaRev = Math.sign(df2);
      const dirColRev = Math.sign(dc2);

      // comprobar con orden invertido
      for (let j = 0; j < coordenadas.length; j++) {
        const expectedFr = fl + dirFilaRev * j * -1; // -1 porque vamos hacia atrás
        const expectedCr = cl + dirColRev * j * -1;
        const [fj, cj] = coordenadas[j];
        // si cualquiera no coincide con la suposición rev => no es línea recta/contigua
        if (fj !== expectedFr || cj !== expectedCr) {
          return false;
        }
      }
      // si pasa la verificación invertida, seguimos
      break;
    }
  }

  // Construir palabra a partir de coordenadas tal y como vienen
  let palabra = '';
  for (const [f, c] of coordenadas) palabra += tablero[f][c];

  const palabraLower = palabra.toLowerCase();
  const palabraReverseLower = palabra.split('').reverse().join('').toLowerCase();

  // Verificar contra la lista válida (aceptar normal o invertida)
  return listaValida.includes(palabraLower) || listaValida.includes(palabraReverseLower);
}

/**
 * Asignar colores pastel bonitos a un array de palabras
 * - Devuelve [{texto, color}, ...]
 * - Intenta asignar colores distintos dentro de la misma partida
 */
function asignarColores(palabras) {
  const paletaPastel = [
    "#1F75FE", // Azul vibrante
  "#FFCA3A", // Amarillo dorado vivo
  "#4CAF50", // Verde brillante
  "#FF595E", // Rojo coral fuerte
  "#8C52FF", // Morado eléctrico
  "#00BBF9", // Azul celeste intenso
  "#F15BB5", // Rosa vibrante
  "#43AA8B", // Verde esmeralda suave
  "#F8961E", // Naranja cálido vibrante
  "#577590", // Azul acero moderno
  "#FF7F50", // Coral anaranjado vivo
  "#6A4C93"  // Morado profundo

  ];

  // Shuffle (Fisher-Yates) para seleccionar colores aleatorios pero sin repetir hasta agotar paleta
  const paleta = [...paletaPastel];
  for (let i = paleta.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [paleta[i], paleta[j]] = [paleta[j], paleta[i]];
  }

  const resultados = palabras.map((texto, idx) => {
    const color = paleta[idx % paleta.length];
    return { texto, color };
  });

  return resultados;
}

// Exportar funciones
module.exports = {
  seleccionarPalabrasAleatorias,
  generarTablero,
  obtenerCoordenadasPalabra,
  validarPalabra,
  asignarColores
};
