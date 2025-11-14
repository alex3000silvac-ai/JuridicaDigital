// ===============================================
// SISTEMA DE INFORME PRELIMINAR - JURIDICADIGITAL
// ===============================================

/**
 * Verifica si un cliente tiene un informe preliminar disponible
 * @param {string} email - Email del cliente
 * @param {string} servicio - Código del servicio (opcional)
 * @returns {Promise<Object>} - {tiene_descuento, monto_descuento, informe_id}
 */
async function verificarInformePreliminar(email, servicio = null) {
    try {
        console.log('[Informe] Verificando informe preliminar para:', email, servicio);

        const response = await fetch('http://localhost:8001/api/verificar-informe-preliminar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                servicio: servicio
            })
        });

        if (!response.ok) {
            throw new Error('Error al verificar informe preliminar');
        }

        const result = await response.json();
        console.log('[Informe] Resultado verificación:', result);
        return result;

    } catch (error) {
        console.error('[Informe] Error al verificar:', error);
        return { tiene_descuento: false, monto_descuento: 0 };
    }
}

/**
 * Calcula el precio final con el descuento del informe preliminar
 * @param {string} email - Email del cliente
 * @param {number} precioOriginal - Precio original del servicio
 * @param {string} servicio - Código del servicio (opcional)
 * @returns {Promise<Object>} - Información completa del cálculo
 */
async function calcularPrecioConDescuento(email, precioOriginal, servicio = null) {
    try {
        console.log('[Informe] Calculando precio con descuento:', {email, precioOriginal, servicio});

        const response = await fetch('http://localhost:8001/api/calcular-precio-con-descuento', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                precio_original: precioOriginal,
                servicio: servicio
            })
        });

        if (!response.ok) {
            throw new Error('Error al calcular precio con descuento');
        }

        const result = await response.json();
        console.log('[Informe] Resultado cálculo:', result);
        return result;

    } catch (error) {
        console.error('[Informe] Error al calcular:', error);
        return {
            tiene_descuento: false,
            precio_original: precioOriginal,
            descuento: 0,
            precio_final: precioOriginal
        };
    }
}

/**
 * Muestra información del descuento en el modal de servicio
 * @param {Object} descuentoInfo - Información del descuento
 */
function mostrarDescuentoEnModal(descuentoInfo) {
    // Buscar o crear el contenedor de descuento
    let descuentoContainer = document.getElementById('descuento-info-container');

    if (!descuentoContainer) {
        descuentoContainer = document.createElement('div');
        descuentoContainer.id = 'descuento-info-container';
        descuentoContainer.className = 'descuento-info';

        // Insertar después del modal-service-info
        const serviceInfo = document.querySelector('.modal-service-info');
        if (serviceInfo) {
            serviceInfo.parentNode.insertBefore(descuentoContainer, serviceInfo.nextSibling);
        }
    }

    if (descuentoInfo.tiene_descuento) {
        descuentoContainer.innerHTML = `
            <div class="descuento-card">
                <div class="descuento-icon">✅</div>
                <div class="descuento-content">
                    <h3>¡Tienes un Informe Preliminar!</h3>
                    <p>Se aplicará automáticamente un descuento de <strong>$${descuentoInfo.descuento.toLocaleString('es-CL')}</strong></p>
                    <div class="precio-breakdown">
                        <div class="precio-item">
                            <span>Precio original:</span>
                            <span class="precio-tachado">$${descuentoInfo.precio_original.toLocaleString('es-CL')}</span>
                        </div>
                        <div class="precio-item descuento-aplicado">
                            <span>Descuento (Informe Preliminar):</span>
                            <span>-$${descuentoInfo.descuento.toLocaleString('es-CL')}</span>
                        </div>
                        <div class="precio-item precio-final">
                            <span>Precio final:</span>
                            <span>$${descuentoInfo.precio_final.toLocaleString('es-CL')}</span>
                        </div>
                    </div>
                    <p class="ahorro-text">Ahorras un ${descuentoInfo.ahorro_porcentaje}% en este servicio</p>
                </div>
            </div>
        `;
        descuentoContainer.style.display = 'block';
    } else {
        // Mostrar opción de informe preliminar
        descuentoContainer.innerHTML = `
            <div class="informe-preliminar-card">
                <div class="informe-icon">💡</div>
                <div class="informe-content">
                    <h3>¿Necesitas evaluar tu caso primero?</h3>
                    <p>Solicita un <strong>Informe Preliminar</strong> por solo <strong>$10.000</strong></p>
                    <ul>
                        <li>✓ Diagnóstico completo de tu caso en 24 horas</li>
                        <li>✓ Revisado por 2 abogados expertos</li>
                        <li>✓ <strong>Se abona 100% si contratas el servicio completo</strong></li>
                    </ul>
                    <button type="button" class="btn-informe-preliminar" onclick="solicitarInformePreliminar()">
                        📋 Solicitar Informe Preliminar ($10.000)
                    </button>
                </div>
            </div>
        `;
        descuentoContainer.style.display = 'block';
    }
}

/**
 * Oculta la información del descuento
 */
function ocultarDescuentoEnModal() {
    const descuentoContainer = document.getElementById('descuento-info-container');
    if (descuentoContainer) {
        descuentoContainer.style.display = 'none';
    }
}

/**
 * Maneja la solicitud de un informe preliminar
 */
async function solicitarInformePreliminar() {
    const nombre = document.getElementById('serviceNombre')?.value;
    const email = document.getElementById('serviceEmail')?.value;
    const serviceName = document.getElementById('modalServiceName')?.textContent;

    // Validar campos
    if (!nombre || !email) {
        alert('Por favor completa tu nombre y email antes de solicitar el informe preliminar');
        return;
    }

    if (!email.includes('@')) {
        alert('Por favor ingresa un email válido');
        return;
    }

    // Procesar pago del informe preliminar
    showLoader('Procesando solicitud de Informe Preliminar...');

    try {
        const response = await fetch('http://localhost:8001/api/crear-pago', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                monto: 10000,
                concepto: `Informe Preliminar - ${serviceName}`,
                email: email,
                service_code: 'INFORME_PRELIMINAR',
                cliente_nombre: nombre
            })
        });

        const result = await response.json();
        hideLoader();

        if (result.success && result.payment_url) {
            console.log('[Informe] Redirigiendo a Flow para informe preliminar:', result.payment_url);
            window.location.href = result.payment_url;
        } else {
            alert(result.message || 'Error al procesar el pago del informe preliminar. Por favor intenta nuevamente.');
        }

    } catch (error) {
        hideLoader();
        console.error('[Informe] Error:', error);
        alert('Error al conectar con el servidor de pagos. Por favor verifica tu conexión e intenta nuevamente.');
    }
}

// Agregar estilos CSS para el sistema de informe preliminar
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .descuento-info {
            margin: 1.5rem 0;
            padding: 0;
        }

        .descuento-card, .informe-preliminar-card {
            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
            color: white;
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(30, 64, 175, 0.3);
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }

        .informe-preliminar-card {
            background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%);
        }

        .descuento-icon, .informe-icon {
            font-size: 2.5rem;
            flex-shrink: 0;
        }

        .descuento-content, .informe-content {
            flex: 1;
        }

        .descuento-content h3, .informe-content h3 {
            margin: 0 0 0.5rem 0;
            font-size: 1.25rem;
        }

        .descuento-content p, .informe-content p {
            margin: 0.5rem 0;
            opacity: 0.95;
        }

        .precio-breakdown {
            background: rgba(255, 255, 255, 0.15);
            padding: 1rem;
            border-radius: 8px;
            margin: 1rem 0;
        }

        .precio-item {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .precio-item:last-child {
            border-bottom: none;
        }

        .precio-tachado {
            text-decoration: line-through;
            opacity: 0.7;
        }

        .descuento-aplicado {
            color: #a7f3d0;
            font-weight: 600;
        }

        .precio-final {
            font-size: 1.25rem;
            font-weight: bold;
            padding-top: 0.75rem;
            margin-top: 0.5rem;
            border-top: 2px solid rgba(255, 255, 255, 0.3);
        }

        .ahorro-text {
            text-align: center;
            font-size: 0.9rem;
            font-weight: 600;
            margin-top: 0.75rem;
            padding: 0.5rem;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 6px;
        }

        .informe-content ul {
            list-style: none;
            padding: 0;
            margin: 1rem 0;
        }

        .informe-content ul li {
            padding: 0.4rem 0;
            opacity: 0.95;
        }

        .btn-informe-preliminar {
            width: 100%;
            padding: 0.875rem 1.5rem;
            background: white;
            color: #0ea5e9;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 1rem;
        }

        .btn-informe-preliminar:hover {
            background: #f1f5f9;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    `;
    document.head.appendChild(style);
});

console.log('[Informe] Sistema de Informe Preliminar inicializado');
