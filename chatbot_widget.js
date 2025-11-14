/**
 * Chatbot Widget - Integración con Grok API
 * JurídicaDigital
 */

const CHATBOT_API_URL = 'http://181.43.39.18:5678/webhook/chat';
let conversationHistory = [];

// Inicializar chatbot cuando cargue la página
document.addEventListener('DOMContentLoaded', function() {
    initChatbot();
});

function initChatbot() {
    // Event listeners
    const chatbotBtn = document.getElementById('chatbot-btn');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatbotSend = document.getElementById('chatbot-send');
    const chatbotInput = document.getElementById('chatbot-input');

    // Abrir/cerrar chatbot
    if (chatbotBtn) {
        chatbotBtn.addEventListener('click', function() {
            chatbotWindow.classList.toggle('active');
            if (chatbotWindow.classList.contains('active')) {
                chatbotInput.focus();
                // Mensaje de bienvenida (solo la primera vez)
                if (conversationHistory.length === 0) {
                    addMessage('bot', '¡Hola! Soy el asistente virtual de JurídicaDigital. ¿En qué puedo ayudarte hoy?');
                }
            }
        });
    }

    if (chatbotClose) {
        chatbotClose.addEventListener('click', function() {
            chatbotWindow.classList.remove('active');
        });
    }

    // Enviar mensaje
    if (chatbotSend) {
        chatbotSend.addEventListener('click', sendMessage);
    }

    if (chatbotInput) {
        chatbotInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Sugerencias rápidas
    document.querySelectorAll('.quick-suggestion').forEach(btn => {
        btn.addEventListener('click', function() {
            const text = this.textContent;
            chatbotInput.value = text;
            sendMessage();
        });
    });
}

async function sendMessage() {
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const message = input.value.trim();

    if (!message) return;

    // Agregar mensaje del usuario
    addMessage('user', message);

    // Limpiar input y deshabilitar botón
    input.value = '';
    sendBtn.disabled = true;

    // Mostrar indicador de escritura
    showTypingIndicator();

    try {
        // Llamar a la API de Grok
        const response = await fetch(CHATBOT_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mensaje: message,
                history: conversationHistory
            })
        });

        const data = await response.json();

        // Ocultar indicador de escritura
        hideTypingIndicator();

        if (data.success && data.response) {
            // Agregar respuesta del bot
            addMessage('bot', data.response);

            // Actualizar historial
            conversationHistory.push({
                role: 'user',
                content: message
            });
            conversationHistory.push({
                role: 'assistant',
                content: data.response
            });

            // Limitar historial a últimos 10 mensajes
            if (conversationHistory.length > 20) {
                conversationHistory = conversationHistory.slice(-20);
            }
        } else {
            throw new Error(data.error || 'Error desconocido');
        }

    } catch (error) {
        console.error('Error al comunicarse con el chatbot:', error);
        hideTypingIndicator();
        addMessage('bot', 'Lo siento, hubo un error al procesar tu mensaje. Por favor intenta nuevamente.');
    } finally {
        sendBtn.disabled = false;
        input.focus();
    }
}

function addMessage(sender, text) {
    const messagesContainer = document.getElementById('chatbot-messages');

    // Crear elemento del mensaje
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    // Avatar
    const avatar = document.createElement('div');
    avatar.className = `chat-avatar ${sender}`;

    if (sender === 'bot') {
        avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h2v2H7v-2zm4 0h2v2h-2v-2zm4 0h2v2h-2v-2z"/>
        </svg>`;
    } else {
        avatar.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>`;
    }

    // Burbuja del mensaje
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.textContent = text;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(bubble);
    messagesContainer.appendChild(messageDiv);

    // Scroll al final
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function showTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.classList.add('active');
        const messagesContainer = document.getElementById('chatbot-messages');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
        indicator.classList.remove('active');
    }
}

// Cerrar chatbot al hacer clic fuera
document.addEventListener('click', function(e) {
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotBtn = document.getElementById('chatbot-btn');

    if (chatbotWindow && chatbotBtn) {
        if (!chatbotWindow.contains(e.target) && !chatbotBtn.contains(e.target)) {
            chatbotWindow.classList.remove('active');
        }
    }
});
