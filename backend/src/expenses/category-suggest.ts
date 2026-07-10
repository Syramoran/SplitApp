/**
 * Sugerencia automática de categoría por keywords, igual que el prototipo:
 * "lee 'Carrefour' y lo archiva en Súper". El orden importa: gana el primer match.
 */
const CATEGORY_PATTERNS: Array<[RegExp, string]> = [
  [/(super|coto|d[ií]a|carrefour|jumbo|chino|almac[eé]n|verduler)/i, 'Súper'],
  [/(uber|cabify|nafta|sube|tren|bondi|taxi|peaje|estacionamiento)/i, 'Transporte'],
  [/(bar|birra|salida|boliche|cine|teatro|recital|entrada)/i, 'Salidas'],
  [/(pizza|sushi|resto|caf[eé]|delivery|hamburgues|helado|panader)/i, 'Comida'],
  [/(ferret|limpieza|l[aá]mpara|casa|mueble|deco)/i, 'Hogar'],
  [/(alquiler|expensas|inmobiliaria)/i, 'Vivienda'],
  [/(internet|fibertel|luz|gas|agua|celular|streaming|netflix|spotify)/i, 'Servicios'],
];

export function suggestCategoryName(description: string): string | null {
  for (const [pattern, category] of CATEGORY_PATTERNS) {
    if (pattern.test(description)) return category;
  }
  return null;
}
