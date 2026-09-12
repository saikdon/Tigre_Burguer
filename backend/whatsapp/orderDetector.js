const PRODUCTS = [
  { name: 'salchipapa', variants: ['salchipapa', 'salchipapas', 'salchi', 'salchip', 'salchipa'] },
  { name: 'hamburguesa', variants: ['hamburguesa', 'hamburguesas', 'hamburger', 'hamburgesa', 'hamburgesas', 'hamburgueza'] },
  { name: 'hot dog', variants: ['hot dog', 'hotdog', 'hot dogs', 'hotdogs', 'perro caliente', 'perros calientes'] },
  { name: 'chupacabras', variants: ['chupacabras', 'chupacabra'] },
  { name: 'papas', variants: ['papas', 'papitas', 'pap frit'] },
  { name: 'porcion', variants: ['porcion', 'porciones', 'porcion'] },
  { name: 'mixta', variants: ['mixta', 'mixtas', 'mixto'] },
  { name: 'combo', variants: ['combo', 'combos'] },
  { name: 'especial', variants: ['especial', 'especiales'] },
  { name: 'lomito', variants: ['lomito', 'lomitos'] },
  { name: 'pizza', variants: ['pizza', 'pizzas', 'pisa', 'pisas'] },
  { name: 'nuggets', variants: ['nuggets', 'nugget', 'nugets', 'nuget'] },
  { name: 'alitas', variants: ['alitas', 'alita'] },
  { name: 'bebida', variants: ['bebida', 'bebidas', 'refresco', 'refrescos', 'gaseosa', 'gaseosas'] },
];

const ORDER_VERBS = ['quiero', 'kiero', 'qiero', 'dame', 'pedir', 'necesito', 'regale', 'regaleme', 'vendame', 'vende', 'me da', 'me das', 'me puede', 'podria', 'puede ser', 'llevar', 'para llevar', 'encargar', 'ordeno', 'ordenar', 'sirve', 'trae', 'traeme'];

const QUANTIFIERS = ['un', 'una', 'uno', 'dos', 'tres', 'cuatro', 'cinco', '2', '3', '4', '5', 'par', 'medio', 'mitad'];

const ANTI_PATTERNS = [
  'hola', 'buenas', 'buen dia', 'buenos dias', 'buenas tardes', 'buenas noches',
  'gracias', 'muchas gracias', 'gracias totales',
  'cuanto', 'cuanto cuesta', 'precio', 'precios', 'cual es', 'como es',
  'que tal', 'como estas', 'bien y tu', 'bien vos',
  'si', 'no', 'ok', 'okey', 'vale', 'dale', 'listo', 'sale',
  'mañana', 'despues', 'luego', 'ahorita', 'rato',
  'donde', 'ubicacion', 'direccion', 'estan', 'ubicados',
  'horario', 'atienden', 'abren', 'cierran', 'abierto',
  'menu', 'menu', 'carta', 'tienen', 'vendes', 'venden',
  'amigo', 'amiga', 'jefe', 'jefa', 'bro', 'brother', 'pana',
  'chorizo', 'salchicha', 'carne', 'pollo',
];

const normalizeText = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const levenshteinDistance = (a, b) => {
  const an = a.length;
  const bn = b.length;
  const matrix = [];

  for (let i = 0; i <= bn; i++) matrix[i] = [i];
  for (let j = 0; j <= an; j++) matrix[0][j] = j;

  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[bn][an];
};

const matchProduct = (word) => {
  for (const product of PRODUCTS) {
    for (const variant of product.variants) {
      const vWords = variant.split(' ');
      if (vWords.length > 1) {
        if (word.includes(variant)) return product.name;
        if (levenshteinDistance(word.slice(0, variant.length), variant) <= 2) return product.name;
      } else {
        if (word === variant) return product.name;
        if (word.startsWith(variant) && Math.abs(word.length - variant.length) <= 2) return product.name;
        if (levenshteinDistance(word, variant) <= 2) return product.name;
      }
    }
  }
  return null;
};

const hasOrderKeywords = (text) => {
  if (!text) return false;

  const normalized = normalizeText(text);
  const words = normalized.split(' ');

  if (words.length === 1) {
    const product = matchProduct(words[0]);
    return product !== null;
  }

  let score = 0;
  let matchedProducts = [];

  for (const word of words) {
    const product = matchProduct(word);
    if (product) {
      matchedProducts.push(product);
      score += 2;
    }
  }

  for (const verb of ORDER_VERBS) {
    const vWords = verb.split(' ');
    if (vWords.length > 1) {
      if (normalized.includes(verb)) { score += 1; break; }
    } else {
      if (words.includes(verb)) { score += 1; break; }
    }
  }

  for (const q of QUANTIFIERS) {
    if (words.includes(q)) { score += 1; break; }
  }

  for (const anti of ANTI_PATTERNS) {
    const aWords = anti.split(' ');
    if (aWords.length > 1) {
      if (normalized.includes(anti)) { score -= 2; break; }
    } else {
      if (words.includes(anti)) { score -= 1; }
    }
  }

  if (matchedProducts.length === 0) return false;

  return score >= 1;
};

const detectOrder = (text) => {
  const isOrder = hasOrderKeywords(text);
  return { isOrder, text: text || '' };
};

module.exports = { detectOrder, hasOrderKeywords, normalizeText, PRODUCTS };
