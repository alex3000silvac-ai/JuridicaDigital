// Webhook Proxy - Vercel Serverless Function
// Redirige solicitudes al n8n local via Cloudflare Tunnel

import { getCachedPrices } from './get_prices.js';
const N8N_BASE_URL = 'https://n8n.juridicadigital.cl';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get action from query
    const action = req.query.action || 'chat';

    // Log request
    console.log(`[${new Date().toISOString()}] Action: ${action}, Method: ${req.method}`);

    // Route based on action
    switch (action) {
      case 'chat':
        return await handleChat(req, res);

      case 'presupuesto':
        return await handlePresupuesto(req, res);

      case 'login':
        return await handleLogin(req, res);

      case 'crear_pago':
      case 'confirmar_pago':
        return await handlePago(req, res, action);

      case 'mis_casos':
      case 'mis_documentos':
        return await handleCliente(req, res, action);

      default:
        return res.status(400).json({
          success: false,
          error: 'Acción no válida'
        });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
}

// Handle chat messages
// NUEVO: Handle chat con Grok AI
async function handleChatWithGrok(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const GROK_API_KEY = process.env.GROK_API_KEY;
  const GROK_API_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1';
  const GROK_MODEL = process.env.GROK_MODEL || 'grok-beta';
  const WHATSAPP = process.env.WHATSAPP_NUMBER || '56912345678';

  const PROMPT = 'Eres el asistente de Jurídica Digital, vendedor de servicios legales. Servicios: Informe Preliminar ($7,500), Juicios Laborales ($800k+), Counsel ($30k/mes). Diferenciadores: 100% privado, 24h, 2 abogados. NO des consejos legales. SÍ promueve servicios. Profesional y amable.';

  try {
    const chatInput = req.body?.chatInput || req.body?.message || '';
    if (!chatInput.trim()) {
      return res.status(400).json({success: false, output: 'Mensaje vacío'});
    }

    console.log('[Grok Chat] Input:', chatInput);

    const grokRes = await fetch(GROK_API_URL + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROK_API_KEY
      },
      body: JSON.stringify({
        model: GROK_MODEL,
        messages: [
          {role: 'system', content: PROMPT},
          {role: 'user', content: chatInput.trim()}
        ],
        temperature: 0.7,
        max_tokens: 400
      })
    });

    if (!grokRes.ok) {
      const err = await grokRes.text();
      console.error('Grok error:', grokRes.status, err);
      throw new Error('Grok API error ' + grokRes.status);
    }

    const data = await grokRes.json();
    let msg = data.choices?.[0]?.message?.content || 'Error procesando respuesta';
    
    if (msg.length > 150) {
      msg += '\n\n💬 ¿Necesitas hablar con un asesor? https://wa.me/' + WHATSAPP;
    }

    console.log('[Grok Chat] Response:', msg.substring(0, 100));

    return res.status(200).json({
      success: true,
      output: msg,
      sessionId: 's_' + Date.now()
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      success: false,
      output: 'Error. Contacta por WhatsApp: https://wa.me/' + WHATSAPP
    });
  }
}

// Original handleChat redirigido a Grok
async function handleChat(req, res) {
  return await handleChatWithGrok(req, res);
}

// Handle presupuesto (budget request)
async function handlePresupuesto(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const data = req.body;

    // Validate required fields
    const required = ['nombre', 'email', 'telefono', 'tipo_servicio', 'descripcion'];
    for (const field of required) {
      if (!data[field]) {
        return res.status(400).json({
          success: false,
          error: `Campo requerido: ${field}`
        });
      }
    }

    // Forward to n8n
    const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook/presupuesto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await n8nResponse.json();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Presupuesto error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error procesando solicitud'
    });
  }
}

// Handle login
async function handleLogin(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña requeridos'
      });
    }

    // Forward to n8n
    const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password })
    });

    const result = await n8nResponse.json();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en autenticación'
    });
  }
}

// Handle payments
async function handlePago(req, res, action) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const endpoint = action === 'crear_pago' ? '/webhook/crear_pago' : '/webhook/confirmar_pago';

    const n8nResponse = await fetch(`${N8N_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });

    const result = await n8nResponse.json();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Payment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error procesando pago'
    });
  }
}

// Handle client area
async function handleCliente(req, res, action) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No autorizado'
      });
    }

    const endpoint = action === 'mis_casos' ? '/webhook/mis_casos' : '/webhook/mis_documentos';

    const n8nResponse = await fetch(`${N8N_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    const result = await n8nResponse.json();
    return res.status(200).json(result);

  } catch (error) {
    console.error('Client area error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error obteniendo datos'
    });
  }
}

// Generate session ID
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
