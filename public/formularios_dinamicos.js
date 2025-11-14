// ===============================================
// SISTEMA DE FORMULARIOS DINÁMICOS Y PAGOS
// JurídicaDigital - Completado
// ===============================================

/**
 * Mostrar formulario dinámico basado en el servicio
 */
function mostrarFormularioDinamico() {
    if (!servicioActual || !opcionSeleccionada) return;

    console.log('[Formulario] Generando formulario para:', servicioActual.nombre, opcionSeleccionada);

    const modal = document.getElementById('modalFormulario') || crearModalFormulario();

    // Configurar título del modal
    document.getElementById('formularioModalTitulo').textContent =
        opcionSeleccionada === 'informe'
            ? `Solicitar Informe Preliminar - ${servicioActual.nombre}`
            : `Contratar Servicio Completo - ${servicioActual.nombre}`;

    // Generar formulario
    const formularioHTML = generarFormularioHTML();
    document.getElementById('formularioContenedor').innerHTML = formularioHTML;

    // Agregar event listeners
    agregarEventListenersFormulario();

    // Verificar descuento si existe email
    const emailInput = document.getElementById('form_email');
    if (emailInput) {
        emailInput.addEventListener('blur', verificarDescuentoAutomatico);
    }

    // Resetear mensaje de descuento
    document.getElementById('mensajeDescuento').style.display = 'none';

    modal.style.display = 'block';
}

/**
 * Generar HTML del formulario dinámicamente
 */
function generarFormularioHTML() {
    // Para informe preliminar, campos básicos
    if (opcionSeleccionada === 'informe') {
        return `
            <div class="form-group">
                <label for="form_nombre">Nombre Completo <span class="required">*</span></label>
                <input type="text" id="form_nombre" name="nombre" required>
            </div>

            <div class="form-group">
                <label for="form_email">Email <span class="required">*</span></label>
                <input type="email" id="form_email" name="email" required>
            </div>

            <div class="form-group">
                <label for="form_telefono">Teléfono <span class="required">*</span></label>
                <input type="tel" id="form_telefono" name="telefono" required>
            </div>

            <div class="form-group">
                <label for="form_descripcion">Descripción del Caso <span class="required">*</span></label>
                <textarea id="form_descripcion" name="descripcion" rows="6" required
                    placeholder="Describe tu situación con el mayor detalle posible..."></textarea>
                <small>Cuanto más detallada sea tu descripción, mejor será el análisis del informe</small>
            </div>

            <div id="mensajeDescuento" class="mensaje-descuento" style="display: none;"></div>
        `;
    }

    // Para servicio completo, campos específicos del servicio
    if (!servicioActual.campos_formulario || servicioActual.campos_formulario.length === 0) {
        // Formulario genérico si no hay campos específicos
        return generarFormularioGenerico();
    }

    let html = '<div id="mensajeDescuento" class="mensaje-descuento" style="display: none;"></div>';

    servicioActual.campos_formulario.forEach(campo => {
        html += generarCampoHTML(campo);
    });

    return html;
}

/**
 * Generar HTML para un campo específico
 */
function generarCampoHTML(campo) {
    const required = campo.requerido ? 'required' : '';
    const requiredMark = campo.requerido ? '<span class="required">*</span>' : '';
    const condicional = campo.visible_si || campo.condicional;
    const display = condicional ? 'style="display: none;"' : '';
    const dataCondicional = condicional ? `data-condicional="${condicional}"` : '';

    let html = `<div class="form-group" id="group_${campo.nombre}" ${display} ${dataCondicional}>`;
    html += `<label for="form_${campo.nombre}">${campo.label || campo.nombre} ${requiredMark}</label>`;

    switch (campo.tipo) {
        case 'text':
        case 'email':
        case 'tel':
        case 'date':
        case 'number':
            html += `<input type="${campo.tipo}" id="form_${campo.nombre}" name="${campo.nombre}" ${required}>`;
            break;

        case 'textarea':
            html += `<textarea id="form_${campo.nombre}" name="${campo.nombre}" rows="4" ${required}></textarea>`;
            break;

        case 'select':
            html += `<select id="form_${campo.nombre}" name="${campo.nombre}" ${required}>`;
            html += '<option value="">Seleccione una opción</option>';
            if (campo.opciones) {
                campo.opciones.forEach(opcion => {
                    html += `<option value="${opcion}">${opcion}</option>`;
                });
            }
            html += '</select>';
            break;

        default:
            html += `<input type="text" id="form_${campo.nombre}" name="${campo.nombre}" ${required}>`;
    }

    html += '</div>';
    return html;
}

/**
 * Generar formulario genérico
 */
function generarFormularioGenerico() {
    return `
        <div class="form-group">
            <label for="form_nombre">Nombre Completo <span class="required">*</span></label>
            <input type="text" id="form_nombre" name="nombre" required>
        </div>

        <div class="form-group">
            <label for="form_rut">RUT <span class="required">*</span></label>
            <input type="text" id="form_rut" name="rut" required placeholder="12345678-9">
        </div>

        <div class="form-group">
            <label for="form_email">Email <span class="required">*</span></label>
            <input type="email" id="form_email" name="email" required>
        </div>

        <div class="form-group">
            <label for="form_telefono">Teléfono <span class="required">*</span></label>
            <input type="tel" id="form_telefono" name="telefono" required>
        </div>

        <div class="form-group">
            <label for="form_descripcion">Descripción del Caso <span class="required">*</span></label>
            <textarea id="form_descripcion" name="descripcion" rows="6" required></textarea>
        </div>

        <div id="mensajeDescuento" class="mensaje-descuento" style="display: none;"></div>
    `;
}

/**
 * Agregar event listeners al formulario
 */
function agregarEventListenersFormulario() {
    // Manejar campos condicionales
    const camposCondicionales = document.querySelectorAll('[data-condicional]');

    camposCondicionales.forEach(grupo => {
        const condicion = grupo.dataset.condicional;
        const [campo, valor] = condicion.split('==');

        const campoTrigger = document.getElementById(`form_${campo}`);
        if (campoTrigger) {
            campoTrigger.addEventListener('change', function() {
                if (this.value === valor) {
                    grupo.style.display = 'block';
                } else {
                    grupo.style.display = 'none';
                    // Limpiar valor del campo oculto
                    const input = grupo.querySelector('input, select, textarea');
                    if (input) input.value = '';
                }
            });
        }
    });
}

/**
 * Verificar descuento automáticamente al ingresar email
 */
async function verificarDescuentoAutomatico() {
    const email = this.value;

    if (!email || !email.includes('@') || opcionSeleccionada !== 'completo') {
        return;
    }

    console.log('[Descuento] Verificando descuento para:', email);

    try {
        showLoader('Verificando descuentos disponibles...');

        const precio = servicioActual.precio || servicioActual.precio_base || 0;
        const serviceCode = servicioActual.id;

        const descuentoInfo = await calcularPrecioConDescuento(email, precio, serviceCode);

        hideLoader();

        if (descuentoInfo.tiene_descuento) {
            mostrarMensajeDescuento(descuentoInfo);
        }
    } catch (error) {
        hideLoader();
        console.error('[Descuento] Error:', error);
    }
}

/**
 * Mostrar mensaje de descuento disponible
 */
function mostrarMensajeDescuento(descuentoInfo) {
    const mensajeDiv = document.getElementById('mensajeDescuento');

    mensajeDiv.innerHTML = `
        <div class="descuento-disponible">
            <div class="descuento-icon">✅</div>
            <div class="descuento-texto">
                <strong>¡Tienes un Informe Preliminar!</strong>
                <p>Se aplicará un descuento de <strong>$${formatNumber(descuentoInfo.descuento)}</strong></p>
                <div class="descuento-detalle">
                    <span>Precio original: <del>$${formatNumber(descuentoInfo.precio_original)}</del></span>
                    <span class="precio-final">Precio final: $${formatNumber(descuentoInfo.precio_final)}</span>
                </div>
            </div>
        </div>
    `;

    mensajeDiv.style.display = 'block';
}

/**
 * Crear estructura del modal de formulario
 */
function crearModalFormulario() {
    const modalHTML = `
        <div id="modalFormulario" class="modal-servicio">
            <div class="modal-servicio-content modal-formulario-content">
                <div class="modal-servicio-header">
                    <h2 id="formularioModalTitulo"></h2>
                    <button class="modal-close" onclick="cerrarModalFormulario()">&times;</button>
                </div>

                <div class="modal-servicio-body">
                    <form id="formularioServicio" onsubmit="procesarFormulario(event)">
                        <div id="formularioContenedor"></div>

                        <div class="form-acciones">
                            <button type="button" class="btn-secondary" onclick="cerrarModalFormulario()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn-primary btn-submit">
                                Continuar al Pago
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('modalFormulario');
}

/**
 * Cerrar modal de formulario
 */
function cerrarModalFormulario() {
    const modal = document.getElementById('modalFormulario');
    if (modal) modal.style.display = 'none';
}

/**
 * Procesar envío del formulario
 */
async function procesarFormulario(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const datos = Object.fromEntries(formData);

    console.log('[Formulario] Datos recopilados:', datos);

    // Validar datos
    if (!validarFormulario(datos)) {
        return;
    }

    // Deshabilitar botón de envío
    const submitBtn = form.querySelector('.btn-submit');
    const textoOriginal = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading-spinner"></span> Procesando...';

    try {
        // Proceder al pago
        await procesarPago(datos);
    } catch (error) {
        console.error('[Formulario] Error al procesar:', error);
        alert('Error al procesar el formulario. Por favor intenta nuevamente.');

        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = textoOriginal;
    }
}

/**
 * Validar formulario
 */
function validarFormulario(datos) {
    // Validar email
    if (datos.email && !datos.email.includes('@')) {
        alert('Por favor ingresa un email válido');
        return false;
    }

    // Validar RUT si existe
    if (datos.rut && !validarRUT(datos.rut)) {
        alert('Por favor ingresa un RUT válido');
        return false;
    }

    return true;
}

/**
 * Validar RUT chileno
 */
function validarRUT(rut) {
    // Eliminar puntos y guión
    rut = rut.replace(/\./g, '').replace(/-/g, '');

    if (rut.length < 8) return false;

    const cuerpo = rut.slice(0, -1);
    const dv = rut.slice(-1).toUpperCase();

    // Calcular dígito verificador
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += parseInt(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const dvEsperado = 11 - (suma % 11);
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

    return dv === dvCalculado;
}

/**
 * Procesar pago
 */
async function procesarPago(datos) {
    console.log('[Pago] Iniciando proceso de pago...');

    showLoader('Procesando pago...');

    try {
        let monto, concepto, serviceCode;

        // Determinar monto y concepto según la opción
        if (opcionSeleccionada === 'informe') {
            monto = 10000;
            concepto = `Informe Preliminar - ${servicioActual.nombre}`;
            serviceCode = 'INFORME_PRELIMINAR';
        } else {
            // Servicio completo - calcular adelanto o monto completo
            const precioBase = servicioActual.precio || servicioActual.precio_base || 0;

            // Verificar si tiene descuento
            const descuentoInfo = await calcularPrecioConDescuento(
                datos.email,
                precioBase,
                servicioActual.id
            );

            const precioFinal = descuentoInfo.precio_final || precioBase;

            if (servicioActual.adelanto_requerido) {
                // Cobrar adelanto (ej: 20%)
                monto = Math.round(precioFinal * servicioActual.adelanto_requerido);
                concepto = `Adelanto ${servicioActual.adelanto_requerido * 100}% - ${servicioActual.nombre}`;
            } else {
                // Cobrar precio completo
                monto = precioFinal;
                concepto = servicioActual.nombre;
            }

            serviceCode = servicioActual.id;
        }

        // Crear pago en el backend
        const response = await fetch('http://localhost:8001/api/crear-pago', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                monto: monto,
                concepto: concepto,
                email: datos.email,
                service_code: serviceCode,
                cliente_nombre: datos.nombre,
                datos_formulario: datos
            })
        });

        const result = await response.json();

        hideLoader();

        if (result.success && result.payment_url) {
            console.log('[Pago] Redirigiendo a Flow:', result.payment_url);

            // Guardar datos en localStorage para recuperar después del pago
            localStorage.setItem('ultimoPago', JSON.stringify({
                servicio: servicioActual.nombre,
                opcion: opcionSeleccionada,
                monto: monto,
                datos: datos,
                payment_id: result.payment_id
            }));

            // Redirigir a Flow
            window.location.href = result.payment_url;
        } else {
            alert(result.message || 'Error al procesar el pago. Por favor intenta nuevamente.');
        }

    } catch (error) {
        hideLoader();
        console.error('[Pago] Error:', error);
        alert('Error al conectar con el servidor de pagos. Por favor verifica tu conexión e intenta nuevamente.');
        throw error;
    }
}

/**
 * Mostrar loader
 */
function showLoader(mensaje) {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.className = 'global-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-spinner"></div>
                <p class="loader-mensaje">${mensaje}</p>
            </div>
        `;
        document.body.appendChild(loader);
    } else {
        loader.querySelector('.loader-mensaje').textContent = mensaje;
        loader.style.display = 'flex';
    }
}

/**
 * Ocultar loader
 */
function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
        loader.style.display = 'none';
    }
}

console.log('[Formularios Dinámicos] Sistema inicializado');
