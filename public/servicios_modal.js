// ===============================================
// SISTEMA DE MODALES Y SERVICIOS POR MATERIA
// JurídicaDigital - Fase B Corregida
// ===============================================

let catalogoServicios = {};
let servicioActual = null;
let opcionSeleccionada = null; // 'informe' o 'completo'

// ==================== CARGA DE CATÁLOGO ====================

/**
 * Cargar catálogo completo desde JSON
 */
async function cargarCatalogoCompleto() {
    try {
        const response = await fetch('servicios_completo.json');
        catalogoServicios = await response.json();

        console.log('[Servicios] Catálogo cargado:', catalogoServicios);

        // Renderizar servicios organizados por materia
        renderizarServiciosPorMateria();

        // Ocultar loading
        document.getElementById('servicesLoading').style.display = 'none';
        document.getElementById('servicesGrid').style.display = 'block';

    } catch (error) {
        console.error('[Servicios] Error al cargar catálogo:', error);
        mostrarErrorCarga();
    }
}

/**
 * Mostrar error de carga
 */
function mostrarErrorCarga() {
    document.getElementById('servicesLoading').innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <p style="color: var(--danger-color); margin-bottom: 1rem;">
                Error al cargar el catálogo de servicios.
            </p>
            <button class="btn-small" onclick="cargarCatalogoCompleto()">Reintentar</button>
        </div>
    `;
}

// ==================== RENDERIZADO POR MATERIA ====================

/**
 * Renderizar servicios organizados por materia
 */
function renderizarServiciosPorMateria() {
    const grid = document.getElementById('servicesGrid');
    let html = '';

    // Orden de visualización de materias
    const ordenMaterias = ['TRANSACCIONALES', 'FAMILIA', 'LABORAL', 'CIVIL', 'PENAL', 'CORPORATIVO'];

    // Iconos por materia
    const iconosMaterias = {
        'TRANSACCIONALES': '⚡',
        'FAMILIA': '👨‍👩‍👧',
        'LABORAL': '💼',
        'CIVIL': '⚖️',
        'PENAL': '🔒',
        'CORPORATIVO': '🏢'
    };

    // Nombres formateados
    const nombresMaterias = {
        'TRANSACCIONALES': 'Servicios Transaccionales',
        'FAMILIA': 'Derecho de Familia',
        'LABORAL': 'Derecho Laboral',
        'CIVIL': 'Derecho Civil',
        'PENAL': 'Derecho Penal',
        'CORPORATIVO': 'Derecho Corporativo'
    };

    ordenMaterias.forEach(materia => {
        const servicios = catalogoServicios[materia];

        if (!servicios || servicios.length === 0) return;

        html += `
            <div class="materia-section">
                <div class="materia-header">
                    <h2>${iconosMaterias[materia]} ${nombresMaterias[materia]}</h2>
                    <span class="materia-count">${servicios.length} servicio${servicios.length !== 1 ? 's' : ''}</span>
                </div>
                <div class="servicios-materia-grid">
                    ${servicios.map(servicio => crearTarjetaServicio(servicio, materia)).join('')}
                </div>
            </div>
        `;
    });

    grid.innerHTML = html;
}

/**
 * Crear tarjeta individual de servicio
 */
function crearTarjetaServicio(servicio, materia) {
    const precio = obtenerPrecioFormateado(servicio);
    const duracion = servicio.duracion || 'Variable';

    return `
        <div class="service-card-new" data-servicio-id="${servicio.id}">
            <div class="service-card-header">
                <h3>${servicio.nombre}</h3>
                <div class="service-duracion">
                    <span class="duracion-icon">⏱</span>
                    <span>${duracion}</span>
                </div>
            </div>

            <p class="service-description">${servicio.descripcion || servicio.descripcion_corta || ''}</p>

            <div class="service-price">
                <span class="price-label">Desde:</span>
                <span class="price-value">${precio}</span>
            </div>

            <div class="service-actions">
                <button class="btn-info" onclick="mostrarModalInformativo('${servicio.id}', '${materia}')">
                    ℹ️ De qué se trata
                </button>

                <div class="service-options">
                    ${servicio.se_abona !== false ? `
                        <button class="btn-option btn-informe" onclick="seleccionarOpcion('${servicio.id}', '${materia}', 'informe')">
                            📋 Informe Preliminar
                            <span class="option-price">$10.000</span>
                        </button>
                    ` : ''}

                    <button class="btn-option btn-completo" onclick="seleccionarOpcion('${servicio.id}', '${materia}', 'completo')">
                        ⚖️ Servicio Completo
                        <span class="option-price">${precio}</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}

/**
 * Obtener precio formateado
 */
function obtenerPrecioFormateado(servicio) {
    if (servicio.precio) {
        return `$${formatNumber(servicio.precio)}`;
    } else if (servicio.precio_base) {
        return `$${formatNumber(servicio.precio_base)}`;
    } else if (servicio.precio_comision) {
        return `${(servicio.precio_comision * 100)}% del resultado`;
    } else if (servicio.precio_porcentaje) {
        return `${(servicio.precio_porcentaje * 100)}% del monto`;
    } else {
        return 'Consultar';
    }
}

// ==================== MODAL INFORMATIVO ====================

/**
 * Mostrar modal "De qué se trata"
 */
function mostrarModalInformativo(servicioId, materia) {
    const servicio = catalogoServicios[materia].find(s => s.id === servicioId);
    if (!servicio) return;

    servicioActual = { ...servicio, materia };

    const modal = document.getElementById('modalInformativo') || crearModalInformativo();

    // Rellenar contenido
    document.getElementById('infoModalTitulo').textContent = servicio.nombre;
    document.getElementById('infoDescripcion').textContent = servicio.descripcion || servicio.descripcion_completa || servicio.descripcion_corta || '';

    // Incluye
    document.getElementById('infoIncluye').innerHTML = servicio.incluye
        ? servicio.incluye.map(item => `<li>✓ ${item}</li>`).join('')
        : '<li>Información no disponible</li>';

    // No incluye
    document.getElementById('infoNoIncluye').innerHTML = servicio.no_incluye
        ? servicio.no_incluye.map(item => `<li>✗ ${item}</li>`).join('')
        : '<li>Información no disponible</li>';

    // Etapas procesales
    if (servicio.etapas && servicio.etapas.length > 0) {
        document.getElementById('infoEtapasContainer').style.display = 'block';
        document.getElementById('infoEtapas').innerHTML = servicio.etapas.map(etapa => `
            <div class="etapa-item">
                <div class="etapa-numero">${etapa.numero}</div>
                <div class="etapa-info">
                    <h4>${etapa.nombre}</h4>
                    <p>${etapa.descripcion}</p>
                    <span class="etapa-duracion">⏱ ${etapa.duracion}</span>
                </div>
            </div>
        `).join('');
    } else {
        document.getElementById('infoEtapasContainer').style.display = 'none';
    }

    // Mostrar modal
    modal.style.display = 'block';
}

/**
 * Crear estructura del modal informativo
 */
function crearModalInformativo() {
    const modalHTML = `
        <div id="modalInformativo" class="modal-servicio">
            <div class="modal-servicio-content">
                <div class="modal-servicio-header">
                    <h2 id="infoModalTitulo"></h2>
                    <button class="modal-close" onclick="cerrarModalInformativo()">&times;</button>
                </div>

                <div class="modal-servicio-body">
                    <section class="info-section">
                        <h3>📋 Descripción</h3>
                        <p id="infoDescripcion"></p>
                    </section>

                    <section class="info-section">
                        <h3>✅ Qué Incluye</h3>
                        <ul id="infoIncluye" class="info-list info-list-incluye"></ul>
                    </section>

                    <section class="info-section">
                        <h3>❌ Qué NO Incluye (Gastos Adicionales)</h3>
                        <ul id="infoNoIncluye" class="info-list info-list-no-incluye"></ul>
                    </section>

                    <section class="info-section" id="infoEtapasContainer">
                        <h3>📊 Etapas del Proceso</h3>
                        <div id="infoEtapas" class="etapas-timeline"></div>
                    </section>
                </div>

                <div class="modal-servicio-footer">
                    <button class="btn-secondary" onclick="cerrarModalInformativo()">Cerrar</button>
                    <button class="btn-primary" onclick="cerrarModalInformativoYSeleccionar()">
                        Continuar con este servicio →
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('modalInformativo');
}

/**
 * Cerrar modal informativo
 */
function cerrarModalInformativo() {
    const modal = document.getElementById('modalInformativo');
    if (modal) modal.style.display = 'none';
}

/**
 * Cerrar modal informativo y mostrar opciones
 */
function cerrarModalInformativoYSeleccionar() {
    cerrarModalInformativo();
    if (servicioActual) {
        mostrarModalOpciones(servicioActual.id, servicioActual.materia);
    }
}

// ==================== MODAL DE OPCIONES ====================

/**
 * Mostrar modal de opciones (Informe vs Servicio Completo)
 */
function mostrarModalOpciones(servicioId, materia) {
    const servicio = catalogoServicios[materia].find(s => s.id === servicioId);
    if (!servicio) return;

    servicioActual = { ...servicio, materia };

    const modal = document.getElementById('modalOpciones') || crearModalOpciones();

    document.getElementById('opcionesModalTitulo').textContent = servicio.nombre;

    // Mostrar u ocultar opción de informe según se_abona
    const opcionInforme = document.getElementById('opcionInforme');
    if (servicio.se_abona !== false) {
        opcionInforme.style.display = 'block';
    } else {
        opcionInforme.style.display = 'none';
    }

    // Actualizar precio en opción completa
    document.getElementById('precioServicioCompleto').textContent = obtenerPrecioFormateado(servicio);

    // Calcular adelanto si aplica
    if (servicio.adelanto_requerido) {
        const adelanto = servicio.precio * servicio.adelanto_requerido;
        document.getElementById('adelantoInfo').innerHTML = `
            <strong>Adelanto requerido:</strong> ${(servicio.adelanto_requerido * 100)}%
            ($${formatNumber(adelanto)})
        `;
    } else {
        document.getElementById('adelantoInfo').innerHTML = '';
    }

    modal.style.display = 'block';
}

/**
 * Crear estructura del modal de opciones
 */
function crearModalOpciones() {
    const modalHTML = `
        <div id="modalOpciones" class="modal-servicio">
            <div class="modal-servicio-content modal-opciones-content">
                <div class="modal-servicio-header">
                    <h2 id="opcionesModalTitulo"></h2>
                    <button class="modal-close" onclick="cerrarModalOpciones()">&times;</button>
                </div>

                <div class="modal-servicio-body">
                    <p class="opciones-intro">Elige cómo deseas continuar con este servicio:</p>

                    <div class="opciones-grid">
                        <div id="opcionInforme" class="opcion-card" onclick="seleccionarOpcionDesdeModal('informe')">
                            <div class="opcion-icon">📋</div>
                            <h3>Informe Preliminar</h3>
                            <div class="opcion-price">$10.000</div>
                            <ul class="opcion-beneficios">
                                <li>✓ Diagnóstico completo de tu caso</li>
                                <li>✓ Análisis por IA + revisión de 2 abogados</li>
                                <li>✓ Entrega en 24 horas</li>
                                <li>✓ <strong>Se abona 100% si contratas el servicio completo</strong></li>
                            </ul>
                            <p class="opcion-nota">Ideal si quieres evaluar tu caso antes de contratar</p>
                        </div>

                        <div class="opcion-card opcion-destacada" onclick="seleccionarOpcionDesdeModal('completo')">
                            <div class="opcion-badge">Recomendado</div>
                            <div class="opcion-icon">⚖️</div>
                            <h3>Servicio Completo</h3>
                            <div class="opcion-price" id="precioServicioCompleto"></div>
                            <ul class="opcion-beneficios">
                                <li>✓ Representación legal completa</li>
                                <li>✓ Gestión integral del caso</li>
                                <li>✓ Todas las audiencias incluidas</li>
                                <li>✓ Seguimiento hasta la resolución</li>
                            </ul>
                            <div class="opcion-nota" id="adelantoInfo"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('modalOpciones');
}

/**
 * Cerrar modal de opciones
 */
function cerrarModalOpciones() {
    const modal = document.getElementById('modalOpciones');
    if (modal) modal.style.display = 'none';
}

/**
 * Seleccionar opción desde el modal
 */
function seleccionarOpcionDesdeModal(opcion) {
    opcionSeleccionada = opcion;
    cerrarModalOpciones();
    mostrarModalCondiciones();
}

/**
 * Seleccionar opción directamente desde la tarjeta
 */
function seleccionarOpcion(servicioId, materia, opcion) {
    const servicio = catalogoServicios[materia].find(s => s.id === servicioId);
    if (!servicio) return;

    servicioActual = { ...servicio, materia };
    opcionSeleccionada = opcion;

    mostrarModalCondiciones();
}

// ==================== MODAL DE CONDICIONES ====================

/**
 * Mostrar modal de condiciones
 */
function mostrarModalCondiciones() {
    if (!servicioActual || !opcionSeleccionada) return;

    const modal = document.getElementById('modalCondiciones') || crearModalCondiciones();

    // Personalizar según la opción
    if (opcionSeleccionada === 'informe') {
        document.getElementById('condicionesTitulo').textContent = 'Condiciones - Informe Preliminar';
        document.getElementById('condicionesContenido').innerHTML = generarCondicionesInforme();
    } else {
        document.getElementById('condicionesTitulo').textContent = `Condiciones - ${servicioActual.nombre}`;
        document.getElementById('condicionesContenido').innerHTML = generarCondicionesServicioCompleto();
    }

    // Resetear checkbox
    document.getElementById('aceptoCondiciones').checked = false;
    document.getElementById('btnContinuarCondiciones').disabled = true;

    modal.style.display = 'block';
}

/**
 * Generar HTML de condiciones para informe preliminar
 */
function generarCondicionesInforme() {
    return `
        <div class="condiciones-content">
            <h3>1. Naturaleza del Informe Preliminar</h3>
            <p>El Informe Preliminar es un <strong>análisis orientativo</strong> de su caso, generado mediante inteligencia artificial y revisado por abogados titulados. <strong>NO constituye asesoría legal formal</strong> ni reemplaza la representación judicial.</p>

            <h3>2. Alcance del Servicio</h3>
            <ul>
                <li>Diagnóstico inicial del caso basado en la información proporcionada</li>
                <li>Identificación de materias legales aplicables</li>
                <li>Orientación sobre posibles vías de acción</li>
                <li>Revisión y aprobación por dos abogados</li>
                <li>Entrega en formato digital en 24 horas hábiles</li>
            </ul>

            <h3>3. Limitaciones</h3>
            <p>El informe preliminar <strong>NO incluye</strong>:</p>
            <ul>
                <li>Representación judicial</li>
                <li>Redacción de documentos legales formales</li>
                <li>Presentación ante tribunales</li>
                <li>Asesoría legal específica sobre acciones concretas</li>
            </ul>

            <h3>4. Abono al Servicio Completo</h3>
            <p>Si posteriormente decide contratar el servicio completo de <strong>${servicioActual.nombre}</strong>,
            el monto pagado por el informe preliminar ($10.000) será <strong>descontado automáticamente</strong>
            del precio total del servicio.</p>

            <h3>5. Confidencialidad y Privacidad</h3>
            <p>Sus datos se procesan en <strong>servidores locales privados</strong>. No utilizamos servicios en la nube externos.
            Su información está protegida según la Ley 21.719 de Protección de Datos Personales.</p>

            <h3>6. Precio y Pago</h3>
            <p>El costo del Informe Preliminar es de <strong>$10.000 CLP</strong>, pago único.
            Debe completar el pago antes de que el informe sea procesado.</p>
        </div>
    `;
}

/**
 * Generar HTML de condiciones para servicio completo
 */
function generarCondicionesServicioCompleto() {
    const precio = servicioActual.precio || servicioActual.precio_base || 0;
    const adelanto = servicioActual.adelanto_requerido ? (precio * servicioActual.adelanto_requerido) : 0;

    return `
        <div class="condiciones-content">
            <h3>1. Alcance del Servicio</h3>
            <p><strong>El precio base incluye:</strong></p>
            <ul>
                ${servicioActual.incluye ? servicioActual.incluye.map(item => `<li>✓ ${item}</li>`).join('') : '<li>Servicios según descripción</li>'}
            </ul>

            <h3>2. Gastos NO Incluidos en el Precio Base</h3>
            <p>Los siguientes gastos se cobran <strong>por separado</strong> y deben ser cubiertos por el cliente:</p>
            <ul>
                ${servicioActual.no_incluye ? servicioActual.no_incluye.map(item => `<li>✗ ${item}</li>`).join('') : '<li>Gastos adicionales según corresponda</li>'}
            </ul>

            ${adelanto > 0 ? `
                <h3>3. Forma de Pago</h3>
                <p>Este servicio requiere un <strong>adelanto del ${(servicioActual.adelanto_requerido * 100)}%</strong> ($${formatNumber(adelanto)})
                para iniciar la tramitación. El saldo restante se pagará según el avance del caso.</p>
            ` : servicioActual.precio_comision ? `
                <h3>3. Forma de Pago</h3>
                <p>Este servicio se cobra como <strong>porcentaje del resultado</strong> (${(servicioActual.precio_comision * 100)}%).
                <strong>Solo se paga si ganamos el caso.</strong></p>
            ` : ''}

            <h3>4. Plazos y Duración</h3>
            <p>Duración estimada: <strong>${servicioActual.duracion || 'Variable según el caso'}</strong></p>
            <p>Los plazos son aproximados y pueden variar según la carga tribunalicia y la complejidad del caso.</p>

            <h3>5. Responsabilidades del Cliente</h3>
            <ul>
                <li>Proporcionar información veraz y completa</li>
                <li>Entregar documentación requerida en los plazos indicados</li>
                <li>Asistir a las audiencias y reuniones programadas</li>
                <li>Pagar los gastos adicionales cuando corresponda</li>
            </ul>

            <h3>6. Marco Legal</h3>
            <p>Este servicio se rige por el <strong>Código de Ética Profesional del Colegio de Abogados</strong> y el
            <strong>Art. 527 del Código Orgánico de Tribunales</strong>. El abogado actúa con independencia técnica y
            confidencialidad profesional.</p>

            <h3>7. Confidencialidad</h3>
            <p>Todos los datos se almacenan en <strong>servidores locales privados</strong>. Cumplimos con la
            <strong>Ley 21.719 de Protección de Datos Personales</strong>.</p>

            <h3>8. Formalización del Servicio</h3>
            <p>Una vez completado el pago del adelanto, nos pondremos en contacto con usted para:</p>
            <ul>
                <li><strong>Firma del contrato de prestación de servicios legales:</strong> Documento que formaliza nuestra relación profesional y establece los términos específicos del servicio contratado.</li>
                <li><strong>Emisión de boleta o factura:</strong> Le haremos llegar el comprobante tributario correspondiente según lo requiera (boleta de honorarios o factura electrónica).</li>
            </ul>
            <p>El proceso se iniciará una vez formalizada la contratación mediante el contrato firmado y el pago del adelanto correspondiente.</p>
        </div>
    `;
}

/**
 * Crear estructura del modal de condiciones
 */
function crearModalCondiciones() {
    const modalHTML = `
        <div id="modalCondiciones" class="modal-servicio">
            <div class="modal-servicio-content modal-condiciones-content">
                <div class="modal-servicio-header">
                    <h2 id="condicionesTitulo"></h2>
                    <button class="modal-close" onclick="cerrarModalCondiciones()">&times;</button>
                </div>

                <div class="modal-servicio-body">
                    <div id="condicionesContenido" class="condiciones-scroll"></div>

                    <div class="condiciones-aceptacion">
                        <label class="checkbox-label">
                            <input type="checkbox" id="aceptoCondiciones" onchange="toggleBotonContinuar()">
                            <span>He leído y acepto las condiciones del servicio</span>
                        </label>
                    </div>
                </div>

                <div class="modal-servicio-footer">
                    <button class="btn-secondary" onclick="cerrarModalCondiciones()">Cancelar</button>
                    <button class="btn-primary" id="btnContinuarCondiciones" onclick="continuarAFormulario()" disabled>
                        Continuar al Formulario →
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    return document.getElementById('modalCondiciones');
}

/**
 * Toggle botón continuar según checkbox
 */
function toggleBotonContinuar() {
    const checkbox = document.getElementById('aceptoCondiciones');
    const btn = document.getElementById('btnContinuarCondiciones');
    btn.disabled = !checkbox.checked;
}

/**
 * Cerrar modal de condiciones
 */
function cerrarModalCondiciones() {
    const modal = document.getElementById('modalCondiciones');
    if (modal) modal.style.display = 'none';
}

/**
 * Continuar al formulario
 */
function continuarAFormulario() {
    cerrarModalCondiciones();
    mostrarFormularioDinamico();
}

// ==================== FORMULARIO DINÁMICO ====================

/**
 * Mostrar formulario dinámico basado en el servicio
 */
function mostrarFormularioDinamico() {
    if (!servicioActual || !opcionSeleccionada) return;

    console.log('[Formulario] Mostrando formulario para:', servicioActual.nombre, opcionSeleccionada);

    // TODO: Implementar generación de formulario dinámico
    // Por ahora, mostrar un placeholder
    alert(`Formulario dinámico para ${servicioActual.nombre} (${opcionSeleccionada}) - En construcción`);
}

// ==================== UTILIDADES ====================

/**
 * Formatear números con separador de miles
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Cerrar modales al hacer click fuera
 */
window.onclick = function(event) {
    if (event.target.classList.contains('modal-servicio')) {
        event.target.style.display = 'none';
    }
}

// ==================== INICIALIZACIÓN ====================

// Cargar catálogo al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    cargarCatalogoCompleto();
});

console.log('[Servicios Modal] Sistema inicializado');
