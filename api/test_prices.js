import { getCachedPrices } from './get_prices.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const prices = await getCachedPrices();

    return res.status(200).json({
      success: true,
      prices: prices,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}
