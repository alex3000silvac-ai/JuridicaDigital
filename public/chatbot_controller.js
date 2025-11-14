// Controlador del Chatbot Minimizable
// Maneja el estado minimizado/expandido del chatbot

(function() {
    'use strict';

    // Estado del chatbot
    let chatState = {
        isMinimized: true,  // Empieza minimizado
        isInitialized: false
    };

    // Esperar a que el DOM y el widget de n8n estén listos
    function initChatbotController() {
        // Esperar a que el widget de n8n se cargue
        const checkWidget = setInterval(() => {
            const chatWindow = document.querySelector('.chat-window') ||
                             document.querySelector('[class*="chat"]');

            if (chatWindow && !chatState.isInitialized) {
                clearInterval(checkWidget);
                setupChatbot(chatWindow);
                chatState.isInitialized = true;
            }
        }, 500);

        // Timeout después de 10 segundos
        setTimeout(() => clearInterval(checkWidget), 10000);
    }

    function setupChatbot(chatWindow) {
        console.log('🤖 Inicializando controlador del chatbot...');

        // Crear wrapper si no existe
        let wrapper = chatWindow.closest('.chat-window-wrapper');
        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.className = 'chat-window-wrapper minimized';
            chatWindow.parentNode.insertBefore(wrapper, chatWindow);
            wrapper.appendChild(chatWindow);
        } else {
            wrapper.classList.add('minimized');
        }

        // Agregar clase minimized al chat window
        chatWindow.classList.add('minimized');

        // Crear vista previa minimizada
        createMinimizedView(chatWindow);

        // Agregar botón minimizar al header
        addMinimizeButton(chatWindow);

        // Event listeners
        setupEventListeners(wrapper, chatWindow);

        console.log('✅ Chatbot configurado correctamente');
    }

    function createMinimizedView(chatWindow) {
        // Verificar si ya existe
        if (chatWindow.querySelector('.chat-minimized-preview')) {
            return;
        }

        const preview = document.createElement('div');
        preview.className = 'chat-minimized-preview';
        preview.innerHTML = `
            <div class="chat-minimized-text">
                <span class="chat-minimized-icon">👋</span>
                <span class="chat-minimized-message">¿En qué puedo ayudarte hoy?</span>
            </div>
            <span class="chat-expand-indicator">⬆️</span>
        `;

        // Insertar como primer hijo
        chatWindow.insertBefore(preview, chatWindow.firstChild);

        // Click en la vista previa expande el chat
        preview.addEventListener('click', (e) => {
            e.stopPropagation();
            expandChat(chatWindow);
        });
    }

    function addMinimizeButton(chatWindow) {
        // Buscar el header
        const header = chatWindow.querySelector('.chat-header') ||
                      chatWindow.querySelector('[class*="header"]');

        if (!header) {
            console.warn('Header del chat no encontrado');
            return;
        }

        // Verificar si ya existe
        if (header.querySelector('.chat-minimize-button')) {
            return;
        }

        // Crear botón minimizar
        const minimizeBtn = document.createElement('button');
        minimizeBtn.className = 'chat-minimize-button';
        minimizeBtn.innerHTML = '➖';
        minimizeBtn.title = 'Minimizar chat';
        minimizeBtn.setAttribute('aria-label', 'Minimizar chat');

        // Event listener
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            minimizeChat(chatWindow);
        });

        // Agregar al header (antes del botón cerrar si existe)
        const closeBtn = header.querySelector('.chat-close-button') ||
                        header.querySelector('[class*="close"]');

        if (closeBtn) {
            header.insertBefore(minimizeBtn, closeBtn);
        } else {
            header.appendChild(minimizeBtn);
        }
    }

    function setupEventListeners(wrapper, chatWindow) {
        // Click en el chat window minimizado
        chatWindow.addEventListener('click', (e) => {
            if (chatState.isMinimized && e.target === chatWindow) {
                expandChat(chatWindow);
            }
        });

        // Prevenir que clicks dentro del chat expandido lo minimicen
        chatWindow.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    function expandChat(chatWindow) {
        if (!chatState.isMinimized) return;

        const wrapper = chatWindow.closest('.chat-window-wrapper');

        chatWindow.classList.remove('minimized');
        if (wrapper) wrapper.classList.remove('minimized');
        if (wrapper) wrapper.classList.add('expanded');

        // Ocultar preview
        const preview = chatWindow.querySelector('.chat-minimized-preview');
        if (preview) preview.style.display = 'none';

        chatState.isMinimized = false;

        console.log('📈 Chat expandido');

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('chatExpanded'));
    }

    function minimizeChat(chatWindow) {
        if (chatState.isMinimized) return;

        const wrapper = chatWindow.closest('.chat-window-wrapper');

        chatWindow.classList.add('minimized');
        if (wrapper) wrapper.classList.add('minimized');
        if (wrapper) wrapper.classList.remove('expanded');

        // Mostrar preview
        const preview = chatWindow.querySelector('.chat-minimized-preview');
        if (preview) preview.style.display = 'flex';

        chatState.isMinimized = true;

        console.log('📉 Chat minimizado');

        // Disparar evento personalizado
        window.dispatchEvent(new CustomEvent('chatMinimized'));
    }

    // API pública
    window.ChatbotController = {
        expand: () => {
            const chatWindow = document.querySelector('.chat-window');
            if (chatWindow) expandChat(chatWindow);
        },
        minimize: () => {
            const chatWindow = document.querySelector('.chat-window');
            if (chatWindow) minimizeChat(chatWindow);
        },
        toggle: () => {
            const chatWindow = document.querySelector('.chat-window');
            if (chatWindow) {
                if (chatState.isMinimized) {
                    expandChat(chatWindow);
                } else {
                    minimizeChat(chatWindow);
                }
            }
        },
        getState: () => chatState
    };

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChatbotController);
    } else {
        initChatbotController();
    }

    // También intentar inicializar después de que todo se cargue
    window.addEventListener('load', () => {
        setTimeout(initChatbotController, 1000);
    });

})();
