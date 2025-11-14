// ===============================================
// SISTEMA DE PAGOS SIMPLIFICADO - JURIDICADIGITAL
// ===============================================

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Pagos] Sistema de pagos inicializado');

    // Agregar botón de pago al formulario del modal
    const serviceForm = document.getElementById('serviceForm');
    if (serviceForm) {
        agregarBotonPagoAlModal();
    }

    // Observar cuando el modal se abre
    const modal = document.getElementById('serviceModal');
    if (modal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (modal.style.display === 'block' || modal.classList.contains('show')) {
                    agregarBotonPagoAlModal();
                }
            });
        });

        observer.observe(modal, {
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }
});

function agregarBotonPagoAlModal() {
    const serviceForm = document.getElementById('serviceForm');
    if (!serviceForm) return;

    // Evitar duplicados
    const existingButton = document.getElementById('btn-pago-modal');
    if (existingButton) return;

    // Obtener información del servicio desde el modal
    const serviceName = document.getElementById('modalServiceName')?.textContent || 'Servicio';
    const priceElement = document.getElementById('modalServicePrice')?.textContent || '$0';
    const servicePrice = parseInt(priceElement.replace(/[^0-9]/g, '')) || 0;

    // Encontrar el botón de submit
    const submitButton = serviceForm.querySelector('button[type="submit"]');
    if (!submitButton) return;

    // Crear botón de pago
    const payButton = document.createElement('button');
    payButton.type = 'button';
    payButton.id = 'btn-pago-modal';
    payButton.className = 'btn-payment';
    payButton.innerHTML = `💳 Pagar Ahora - ${priceElement}`;
    payButton.style.cssText = 'margin-top: 1rem; width: 100%;';

    payButton.onclick = function() {
        iniciarPagoDesdeModal();
    };

    // Insertar antes del botón de submit
    submitButton.parentNode.insertBefore(payButton, submitButton);

    // Agregar listener al campo email para verificar descuento automáticamente
    const emailInput = document.getElementById('serviceEmail');
    if (emailInput && typeof calcularPrecioConDescuento === 'function') {
        emailInput.addEventListener('blur', async function() {
            const email = emailInput.value;
            if (email && email.includes('@')) {
                const serviceCode = serviceName.toUpperCase().replace(/\s+/g, '_');
                const descuentoInfo = await calcularPrecioConDescuento(email, servicePrice, serviceCode);
                if (typeof mostrarDescuentoEnModal === 'function') {
                    mostrarDescuentoEnModal(descuentoInfo);
                }
            }
        });
    }

    console.log('[Pagos] Botón de pago agregado al modal');
}

async function iniciarPagoDesdeModal() {
    // Obtener datos del formulario
    const nombre = document.getElementById('serviceNombre')?.value;
    const email = document.getElementById('serviceEmail')?.value;
    const serviceName = document.getElementById('modalServiceName')?.textContent;
    const priceText = document.getElementById('modalServicePrice')?.textContent || '$0';
    const servicePrice = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;

    // Validar campos requeridos
    if (!nombre || !email) {
        alert('Por favor completa tu nombre y email antes de continuar con el pago');
        return;
    }

    if (!email.includes('@')) {
        alert('Por favor ingresa un email válido');
        return;
    }

    if (servicePrice === 0) {
        alert('No se pudo determinar el precio del servicio');
        return;
    }

    // Verificar si hay descuento disponible y calcular precio final
    showLoader('Verificando descuentos disponibles...');

    const serviceCode = serviceName.toUpperCase().replace(/\s+/g, '_');
    const descuentoInfo = await calcularPrecioConDescuento(email, servicePrice, serviceCode);

    hideLoader();

    // Usar el precio final con descuento aplicado
    const precioFinal = descuentoInfo.precio_final || servicePrice;

    console.log('[Pagos] Precio final después de descuento:', precioFinal);

    // Iniciar proceso de pago con el precio ajustado
    await pagarServicio(serviceName, precioFinal, nombre, email, descuentoInfo);
}

async function pagarServicio(serviceName, servicePrice, nombre, email) {
    showLoader('Procesando pago...');

    try {
        console.log('[Pagos] Iniciando pago:', { serviceName, servicePrice, nombre, email });

        const response = await fetch('http://localhost:8001/api/crear-pago', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                monto: servicePrice,
                concepto: `Pago por ${serviceName}`,
                email: email,
                service_code: serviceName.toUpperCase().replace(/\s+/g, '_'),
                cliente_nombre: nombre
            })
        });

        const result = await response.json();

        hideLoader();

        if (result.success && result.payment_url) {
            console.log('[Pagos] Redirigiendo a Flow:', result.payment_url);
            window.location.href = result.payment_url;
        } else {
            alert(result.message || 'Error al procesar el pago. Por favor intenta nuevamente.');
        }

    } catch (error) {
        hideLoader();
        console.error('[Pagos] Error:', error);
        alert('Error al conectar con el servidor de pagos. Por favor verifica tu conexión e intenta nuevamente.');
    }
}

function showLoader(message) {
    hideLoader();

    const loader = document.createElement('div');
    loader.id = 'payment-loader';
    loader.innerHTML = `
        <div class="loader-overlay">
            <div class="loader-content">
                <div class="spinner"></div>
                <p>${message}</p>
                <small>No cierres esta ventana</small>
            </div>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('payment-loader');
    if (loader) {
        loader.remove();
    }
}
