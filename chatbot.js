// ============================================
// CHATBOT CONVERSACIONAL CON GROK
// JurídicaDigital - Asistente Virtual
// ============================================

class Chatbot {
    constructor() {
        this.isOpen = false;
        this.conversationHistory = [];
        this.apiUrl = '/webhook_proxy.php?action=chat';
        this.quickReplyUrl = '/webhook_proxy.php?action=chat/quick-reply';
        this.intentsUrl = '/webhook_proxy.php?action=chat/intents';
        this.init();
    }

    init() {
        this.createChatWidget();
        this.attachEventListeners();
        this.checkApiStatus();
    }

    createChatWidget() {
        const chatHTML = `
            <div id="chatbot-container" class="chatbot-closed">
                <!-- Botón flotante -->
                <button id="chatbot-toggle" class="chatbot-toggle" aria-label="Abrir chat">
                    <svg class="chat-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                    </svg>
                    <span class="chat-text">¿Necesitas ayuda legal?</span>
                </button>

                <!-- Ventana de chat -->
                <div id="chatbot-window" class="chatbot-window">
                    <!-- Header -->
                    <div class="chatbot-header">
                        <div class="chatbot-header-info">
                            <div class="chatbot-avatar">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                                </svg>
                            </div>
                            <div class="chatbot-header-text">
                                <h3>Asistente Virtual</h3>
                                <p class="chatbot-status">
                                    <span class="status-indicator"></span>
                                    En línea
                                </p>
                            </div>
                        </div>
                        <button id="chatbot-close" class="chatbot-close" aria-label="Cerrar chat">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Mensajes -->
                    <div id="chatbot-messages" class="chatbot-messages">
                        <div class="message bot-message">
                            <div class="message-content">
                                <p>👋 ¡Hola! Soy el asistente virtual de JurídicaDigital.</p>
                                <p>Puedo ayudarte con:</p>
                                <ul>
                                    <li>Información sobre servicios legales</li>
                                    <li>Precios y plazos</li>
                                    <li>Orientación sobre tu caso</li>
                                </ul>
                                <p>¿En qué puedo ayudarte hoy?</p>
                            </div>
                        </div>

                        <!-- Botones de respuesta rápida -->
                        <div class="quick-replies" id="quick-replies">
                            <button class="quick-reply-btn" data-message="¿Cuánto cuesta un divorcio?">
                                💔 Divorcio
                            </button>
                            <button class="quick-reply-btn" data-message="Me despidieron, ¿qué puedo hacer?">
                                👔 Despido
                            </button>
                            <button class="quick-reply-btn" data-message="Tengo una deuda antigua, ¿prescribió?">
                                💰 Deudas
                            </button>
                            <button class="quick-reply-btn" data-message="¿Cómo funciona la privacidad de mis datos?">
                                🔒 Privacidad
                            </button>
                        </div>
                    </div>

                    <!-- Input de mensaje -->
                    <div class="chatbot-input-container">
                        <input
                            type="text"
                            id="chatbot-input"
                            class="chatbot-input"
                            placeholder="Escribe tu consulta..."
                            autocomplete="off"
                            maxlength="500"
                        />
                        <button id="chatbot-send" class="chatbot-send" aria-label="Enviar mensaje">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                            </svg>
                        </button>
                    </div>

                    <!-- Footer con info -->
                    <div class="chatbot-footer">
                        <small>🔒 100% privado y confidencial</small>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', chatHTML);
    }

    attachEventListeners() {
        const toggle = document.getElementById('chatbot-toggle');
        const close = document.getElementById('chatbot-close');
        const send = document.getElementById('chatbot-send');
        const input = document.getElementById('chatbot-input');
        const quickReplies = document.querySelectorAll('.quick-reply-btn');

        toggle.addEventListener('click', () => this.toggleChat());
        close.addEventListener('click', () => this.closeChat());
        send.addEventListener('click', () => this.sendMessage());

        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Botones de respuesta rápida
        quickReplies.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.getAttribute('data-message');
                document.getElementById('chatbot-input').value = message;
                this.sendMessage();
            });
        });
    }

    async checkApiStatus() {
        try {
            const response = await fetch('http://localhost:8002/health');
            const data = await response.json();

            if (!data.grok_configured) {
                console.warn('⚠️ Grok API no está configurada');
            }
        } catch (error) {
            console.error('Error al verificar API:', error);
        }
    }

    toggleChat() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('chatbot-container');

        if (this.isOpen) {
            container.classList.remove('chatbot-closed');
            container.classList.add('chatbot-open');
            document.getElementById('chatbot-input').focus();
        } else {
            container.classList.remove('chatbot-open');
            container.classList.add('chatbot-closed');
        }
    }

    closeChat() {
        this.isOpen = false;
        const container = document.getElementById('chatbot-container');
        container.classList.remove('chatbot-open');
        container.classList.add('chatbot-closed');
    }

    async sendMessage() {
        const input = document.getElementById('chatbot-input');
        const message = input.value.trim();

        if (!message) return;

        // Agregar mensaje del usuario
        this.addMessage(message, 'user');
        input.value = '';

        // Guardar en historial
        this.conversationHistory.push({
            role: 'user',
            content: message
        });

        // Ocultar botones de respuesta rápida después del primer mensaje
        const quickRepliesDiv = document.getElementById('quick-replies');
        if (quickRepliesDiv && this.conversationHistory.length > 1) {
            quickRepliesDiv.style.display = 'none';
        }

        // Agregar indicador de "escribiendo..."
        this.addTypingIndicator();

        try {
            // Detectar intención primero
            const intent = await this.detectIntent(message);

            let responseData;

            // Si hay una respuesta rápida disponible, usarla
            if (intent && this.hasQuickReply(intent)) {
                responseData = await this.getQuickReply(intent);
            } else {
                // Sino, llamar a Grok
                responseData = await this.callGrokAPI(message);
            }

            // Remover indicador de escritura
            this.removeTypingIndicator();

            if (responseData.success) {
                // Agregar respuesta del bot
                this.addMessage(responseData.response, 'bot');

                // Guardar en historial
                this.conversationHistory.push({
                    role: 'assistant',
                    content: responseData.response
                });

                // Si hay un código de servicio, agregar botón de acción
                if (responseData.service_code) {
                    this.addServiceButton(responseData.service_code);
                }
            } else {
                this.addMessage(
                    'Lo siento, tuve un problema al procesar tu mensaje. ¿Puedes intentar de nuevo?',
                    'bot'
                );
            }

        } catch (error) {
            this.removeTypingIndicator();
            console.error('Error:', error);

            this.addMessage(
                'Error de conexión. Por favor verifica que el servidor del chatbot esté corriendo en el puerto 8002.',
                'bot',
                'error'
            );
        }
    }

    async detectIntent(message) {
        try {
            const response = await fetch(this.intentsUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            return data.primary_intent;
        } catch (error) {
            console.error('Error detectando intent:', error);
            return null;
        }
    }

    hasQuickReply(intent) {
        const quickReplyIntents = [
            'precio_divorcio',
            'precio_despido',
            'tiempo_proceso',
            'que_necesito_divorcio',
            'prescripcion_deudas',
            'privacidad'
        ];
        return quickReplyIntents.includes(intent);
    }

    async getQuickReply(intent) {
        try {
            const response = await fetch(this.quickReplyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ intent })
            });

            return await response.json();
        } catch (error) {
            console.error('Error obteniendo respuesta rápida:', error);
            return { success: false };
        }
    }

    async callGrokAPI(message) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: this.conversationHistory
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Error llamando a Grok API:', error);
            throw error;
        }
    }

    addMessage(text, sender, type = 'normal') {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        if (type === 'error') {
            messageDiv.classList.add('message-error');
        }

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Convertir saltos de línea en <br>
        const formattedText = text.replace(/\n/g, '<br>');
        contentDiv.innerHTML = formattedText;

        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);

        // Scroll al final
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Animación de entrada
        setTimeout(() => {
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);
    }

    addServiceButton(serviceCode) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'message bot-message';
        buttonDiv.innerHTML = `
            <div class="message-action">
                <button class="btn-service-action" onclick="openServiceByCode('${serviceCode}')">
                    📋 Ver detalles del servicio
                </button>
            </div>
        `;
        messagesContainer.appendChild(buttonDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    addTypingIndicator() {
        const messagesContainer = document.getElementById('chatbot-messages');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message bot-message typing-message';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Función auxiliar para abrir servicio desde el chatbot
function openServiceByCode(serviceCode) {
    // Esta función debe existir en app_opcion_c.js
    if (typeof openServiceModal !== 'undefined') {
        // Buscar el servicio en el DOM
        const serviceCard = document.querySelector(`[data-service-code="${serviceCode}"]`);
        if (serviceCard) {
            serviceCard.click();
        }
    } else {
        console.error('Función openServiceModal no encontrada');
    }
}

// Inicializar chatbot cuando cargue la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 Inicializando chatbot...');
    const chatbot = new Chatbot();
    window.chatbot = chatbot; // Exponer globalmente para debugging
});
