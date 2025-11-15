// Extrae precios dinámicamente de la página web
export async function getPricesFromWebsite() {
  try {
    const response = await fetch('https://www.juridicadigital.cl/');
    const html = await response.text();

    // Extraer precios usando regex
    const prices = {};

    // Informe Preliminar
    const informeMatch = html.match(/Informe Preliminar.*?\$([0-9,]+)/i);
    if (informeMatch) {
      prices.informe = informeMatch[1].replace(',', '.');
    }

    // Juicio Laboral
    const juicioMatch = html.match(/Juicio Laboral.*?desde\s*\$([0-9,]+)/i);
    if (juicioMatch) {
      prices.juicio = juicioMatch[1].replace(',', '.');
    }

    // Counsel
    const counselMatch = html.match(/Counsel.*?desde\s*\$([0-9,]+)/i);
    if (counselMatch) {
      prices.counsel = counselMatch[1].replace(',', '.');
    }

    return prices;
  } catch (error) {
    console.error('Error obteniendo precios:', error);
    // Valores por defecto si falla
    return {
      informe: '7.500',
      juicio: '800.000',
      counsel: '30.000'
    };
  }
}

// Cache de precios (se actualiza cada hora)
let pricesCache = null;
let lastFetch = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

export async function getCachedPrices() {
  const now = Date.now();

  if (!pricesCache || (now - lastFetch) > CACHE_DURATION) {
    pricesCache = await getPricesFromWebsite();
    lastFetch = now;
    console.log('[Prices] Precios actualizados:', pricesCache);
  }

  return pricesCache;
}
