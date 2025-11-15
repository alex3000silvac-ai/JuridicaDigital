// Test endpoint to debug Grok integration
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const GROK_API_KEY = process.env.GROK_API_KEY;
  const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1';
  const GROK_MODEL = process.env.GROK_MODEL || 'grok-3';

  // Return debug info
  const debugInfo = {
    hasApiKey: !!GROK_API_KEY,
    apiKeyPrefix: GROK_API_KEY ? GROK_API_KEY.substring(0, 8) + '...' : 'MISSING',
    apiUrl: GROK_API_URL,
    model: GROK_MODEL,
    timestamp: new Date().toISOString()
  };

  // Try to call Grok
  try {
    const grokRes = await fetch(GROK_API_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROK_API_KEY
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          {role: 'system', content: 'Eres un asistente.'},
          {role: 'user', content: 'Hola'}
        ],
        temperature: 0.7,
        max_tokens: 50
      })
    });

    const responseText = await grokRes.text();

    return res.status(200).json({
      debug: debugInfo,
      grokStatus: grokRes.status,
      grokOk: grokRes.ok,
      grokResponse: responseText.substring(0, 500)
    });

  } catch (error) {
    return res.status(500).json({
      debug: debugInfo,
      error: error.message,
      stack: error.stack
    });
  }
}
