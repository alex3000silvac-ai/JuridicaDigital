// Configuración de API
// Todas las peticiones van a webhook_proxy.php
const API_BASE = '/webhook_proxy.php';
const ADMIN_API_BASE = '/webhook_proxy.php'; // Mismo puerto que el portal
const CLIENTES_API_BASE = '/webhook_proxy.php'; // API de clientes y documentos

// Estado de la aplicación
let currentUser = null;
let allServices = []; // Todos los servicios cargados
let currentCategory = 'todos'; // Categoría actual seleccionada

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    // Scroll suave
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Form de presupuesto
    const presupuestoForm = document.getElementById('presupuestoForm');
    if (presupuestoForm) {
        presupuestoForm.addEventListener('submit', handlePresupuestoSubmit);
    }

    // Form de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Verificar si hay sesión guardada
    checkSession();

    // Cargar catálogo de servicios
    // loadServices(); // DESACTIVADO - Ahora usa servicios_modal.js
});

// Modal de Login
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'block';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

// Click fuera del modal cierra el modal
window.onclick = function(event) {
    const modal = document.getElementById('loginModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Manejar envío de solicitud de presupuesto
async function handlePresupuestoSubmit(e) {
    e.preventDefault();

    const formData = {
        nombre: document.getElementById('nombre').value,
        apellido_paterno: document.getElementById('apellido_paterno').value,
        apellido_materno: document.getElementById('apellido_materno').value,
        rut: document.getElementById('rut').value,
        email: document.getElementById('email').value,
        telefono: document.getElementById('telefono').value,
        ciudad: document.getElementById('ciudad').value,
        tipo_servicio: document.getElementById('tipo_servicio').value,
        descripcion: document.getElementById('descripcion').value,
        canal: 'web'
    };

    try {
        // Mostrar loading
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading"></span> Enviando...';

        const response = await fetch(`${API_BASE}?action=presupuesto`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            // Mostrar mensaje de éxito
            document.getElementById('presupuestoForm').style.display = 'none';
            document.getElementById('successMessage').style.display = 'block';
            document.getElementById('referenciaNumero').textContent = result.data.cliente_id;

            // Scroll al mensaje de éxito
            document.getElementById('successMessage').scrollIntoView({ behavior: 'smooth' });
        } else {
            alert('Error al enviar la solicitud. Por favor, intenta nuevamente.');
        }

        // Restaurar botón
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;

    } catch (error) {
        console.error('Error:', error);
        alert('Error al conectar con el servidor. Verifica que n8n esté ejecutando el workflow de presupuestos.');

        // Restaurar botón
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Solicitud';
    }
}

// Reset form
function resetForm() {
    document.getElementById('presupuestoForm').reset();
    document.getElementById('presupuestoForm').style.display = 'block';
    document.getElementById('successMessage').style.display = 'none';
}

// Seleccionar servicio desde las tarjetas
function selectService(serviceName, price) {
    const select = document.getElementById('tipo_servicio');

    // Buscar la opción que coincida
    for (let option of select.options) {
        if (option.value === serviceName) {
            select.value = serviceName;
            break;
        }
    }

    // Scroll a la sección de formulario
    document.getElementById('solicitar').scrollIntoView({ behavior: 'smooth' });

    // Dar foco al primer campo del formulario
    setTimeout(() => {
        document.getElementById('nombre').focus();
    }, 500);
}

// Manejar login (con auto-registro)
async function handleLogin(e) {
    e.preventDefault();

    const rut = document.getElementById('rutLogin').value.trim();
    const email = document.getElementById('emailLogin').value.trim();

    if (!rut || !email) {
        alert('Por favor, ingresa tu RUT y email.');
        return;
    }

    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verificando...';

        // Llamar a API de login/registro (auto-registra si no existe)
        const response = await fetch(`${API_BASE}?action=login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                rut: rut,
                email: email,
                nombre: '' // Se puede agregar campo opcional en el modal
            })
        });

        const result = await response.json();

        if (result.success && result.cliente) {
            // Login/Registro exitoso
            currentUser = {
                ...result.cliente,
                estadisticas: result.estadisticas || {}
            };

            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));

            closeLoginModal();
            showClientDashboard();

            console.log('[Login] Acceso exitoso:', currentUser.rut);
        } else {
            alert('Error al iniciar sesión: ' + (result.error || 'Error desconocido'));
        }

        submitBtn.disabled = false;
        submitBtn.textContent = 'Acceder';

    } catch (error) {
        console.error('[Login] Error:', error);
        alert('Error al conectar con el servidor. Verifica que la API de clientes esté activa (puerto 8003).');

        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Acceder';
    }
}

// Verificar sesión guardada
function checkSession() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showClientDashboard();
    }
}

// Mostrar dashboard del cliente
async function showClientDashboard() {
    if (!currentUser) return;

    // Ocultar secciones públicas
    document.getElementById('inicio').style.display = 'none';
    document.getElementById('servicios').style.display = 'none';
    document.getElementById('solicitar').style.display = 'none';
    document.getElementById('contacto').style.display = 'none';

    // Mostrar sección de mis casos
    document.getElementById('mis-casos').style.display = 'block';

    // Actualizar header del cliente
    document.getElementById('clienteNombre').textContent = currentUser.nombre || currentUser.email || 'Cliente';
    document.getElementById('clienteRut').textContent = `RUT: ${currentUser.rut}`;

    // Actualizar estadísticas desde la API
    const stats = currentUser.estadisticas || {};
    document.getElementById('totalCasos').textContent = 0; // Por ahora
    document.getElementById('casosActivos').textContent = 0; // Por ahora
    document.getElementById('totalDocumentos').textContent = stats.total_docs || 0;
    document.getElementById('totalPagado').textContent = `$${formatNumber(0)}`; // Por ahora

    // Cargar documentos
    await loadClientDocumentos();

    // Actualizar botón de login
    const nombreCorto = currentUser.nombre ? currentUser.nombre.split(' ')[0] : 'Mi Cuenta';
    document.querySelector('.login-btn').textContent = nombreCorto;
    document.querySelector('.login-btn').onclick = logout;
}

// Cargar casos del cliente
async function loadClientCasos() {
    try {
        const response = await fetch(`${API_BASE}?action=mis_casos&token=${localStorage.getItem('token')}`, {
            method: 'GET'
        });

        const result = await response.json();

        const casosContainer = document.getElementById('casosContainer');

        if (result.success && result.data && result.data.length > 0) {
            casosContainer.innerHTML = result.data.map(caso => `
                <div class="caso-item">
                    <div class="caso-info">
                        <h4>${caso.numero_caso}</h4>
                        <p>${caso.tipo_servicio}</p>
                        <p>Monto: $${formatNumber(caso.monto_total)}</p>
                    </div>
                    <div>
                        <span class="status-badge status-${caso.estado}">${formatEstado(caso.estado)}</span>
                    </div>
                </div>
            `).join('');
        } else {
            casosContainer.innerHTML = '<p style="color: #5f6368;">No tienes casos registrados aún.</p>';
        }
    } catch (error) {
        console.error('Error cargando casos:', error);
        document.getElementById('casosContainer').innerHTML = '<p style="color: #ea4335;">Error al cargar casos.</p>';
    }
}

// Cargar documentos del cliente
async function loadClientDocumentos() {
    try {
        const response = await fetch(`${API_BASE}?action=mis_documentos&token=${localStorage.getItem('token')}`, {
            method: 'GET'
        });

        const result = await response.json();

        const documentosContainer = document.getElementById('documentosContainer');

        if (result.success && result.documentos && result.documentos.length > 0) {
            documentosContainer.innerHTML = result.documentos.map(doc => {
                const estadoBadge = getEstadoProcesamientoBadge(doc.estado_procesamiento);
                return `
                <div class="documento-item">
                    <div class="documento-info">
                        <h4>${doc.nombre_archivo}</h4>
                        <p>Tipo: ${doc.tipo_documento}</p>
                        <p>Subido: ${formatDate(doc.fecha_subida)}</p>
                        ${doc.fecha_procesamiento ? `<p>Procesado: ${formatDate(doc.fecha_procesamiento)}</p>` : ''}
                        ${doc.notas ? `<p class="doc-notas">${doc.notas}</p>` : ''}
                    </div>
                    <div>
                        ${estadoBadge}
                        ${doc.estado_procesamiento === 'completado' && doc.resultado_analisis ?
                            `<button class="btn-small" onclick="verResultadoDocumento('${doc.id}')">Ver Resultado</button>` :
                            ''}
                    </div>
                </div>
            `;
            }).join('');
        } else {
            documentosContainer.innerHTML = `
                <p style="color: #5f6368;">No tienes documentos subidos aún.</p>
                <p style="color: #5f6368; font-size: 14px;">Sube tu primer documento para que N8N lo procese automáticamente.</p>
            `;
        }
    } catch (error) {
        console.error('Error cargando documentos:', error);
        document.getElementById('documentosContainer').innerHTML = '<p style="color: #ea4335;">Error al cargar documentos.</p>';
    }
}

// Descargar documento
async function downloadDocument(documentId) {
    try {
        const response = await fetch(`${API_BASE}/documentos/${documentId}/contenido`, {
            method: 'GET'
        });

        const result = await response.json();

        if (result.success && result.contenido) {
            // Crear blob y descargar
            const blob = new Blob([result.contenido], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.metadata.nombre_archivo || 'documento.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Error al descargar el documento.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al descargar el documento.');
    }
}

// Logout
function logout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');

    // Mostrar secciones públicas
    document.getElementById('inicio').style.display = 'block';
    document.getElementById('servicios').style.display = 'block';
    document.getElementById('solicitar').style.display = 'block';
    document.getElementById('contacto').style.display = 'block';

    // Ocultar sección de cliente
    document.getElementById('mis-casos').style.display = 'none';

    // Restaurar botón de login
    document.querySelector('.login-btn').textContent = 'Iniciar Sesión';
    document.querySelector('.login-btn').onclick = showLoginModal;

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== CATÁLOGO DE SERVICIOS ====================

// Cargar servicios desde la API
async function loadServices() {
    try {
        const response = await fetch(`${ADMIN_API_BASE}/servicios`);
        const result = await response.json();

        if (result.success && result.data) {
            allServices = result.data;

            // Actualizar contadores
            updateServiceCounts();

            // Renderizar servicios
            renderServices(allServices);

            // Ocultar loading, mostrar grilla
            document.getElementById('servicesLoading').style.display = 'none';
            document.getElementById('servicesGrid').style.display = 'grid';
        } else {
            showServicesError();
        }
    } catch (error) {
        console.error('Error cargando servicios:', error);
        showServicesError();
    }
}

// Mostrar error al cargar servicios
function showServicesError() {
    document.getElementById('servicesLoading').innerHTML = `
        <p style="color: var(--danger-color);">Error al cargar el catálogo de servicios.</p>
        <p>Asegúrate de que el backend esté ejecutándose en el puerto 8001.</p>
        <button class="btn-small" onclick="loadServices()">Reintentar</button>
    `;
}

// Actualizar contadores de categorías
function updateServiceCounts() {
    const counts = {
        todos: allServices.length,
        transaccional: allServices.filter(s => s.categoria === 'transaccional').length,
        completo: allServices.filter(s => s.categoria === 'completo').length,
        suscripcion: allServices.filter(s => s.categoria === 'suscripcion').length
    };

    document.getElementById('count-todos').textContent = counts.todos;
    document.getElementById('count-transaccional').textContent = counts.transaccional;
    document.getElementById('count-completo').textContent = counts.completo;
    document.getElementById('count-suscripcion').textContent = counts.suscripcion;
}

// Renderizar servicios en la grilla
function renderServices(services) {
    const grid = document.getElementById('servicesGrid');

    if (services.length === 0) {
        document.getElementById('noResults').style.display = 'block';
        grid.style.display = 'none';
        return;
    }

    document.getElementById('noResults').style.display = 'none';
    grid.style.display = 'grid';

    grid.innerHTML = services.map(service => {
        const icon = getServiceIcon(service.subcategoria);
        const priceText = getPriceText(service);
        const badge = getServiceBadge(service);

        return `
            <div class="service-card ${service.codigo === 'COMP-026' ? 'featured' : ''}" data-categoria="${service.categoria}">
                ${badge}
                <div class="service-icon">${icon}</div>
                <h3>${service.nombre}</h3>
                <p class="service-subcategory">${service.subcategoria}</p>
                <p>${service.descripcion_corta}</p>
                <span class="price">${priceText}</span>
                <button class="btn-small" onclick="selectServiceFromCatalog('${service.nombre.replace(/'/g, "\\'")}', ${service.precio_base || 0})">
                    Solicitar
                </button>
            </div>
        `;
    }).join('');
}

// Obtener icono según subcategoría
function getServiceIcon(subcategoria) {
    const icons = {
        'Familia': '👨‍👩‍👧',
        'Sucesiones': '📜',
        'Civil': '⚖️',
        'Penal': '⚡',
        'Laboral': '💼',
        'Inmobiliario': '🏠',
        'Comercial': '🏢',
        'Compliance': '✅',
        'Tributario': '💰',
        'Propiedad Intelectual': '©️',
        'Diagnóstico Legal': '📄',
        'Deudas': '💳',
        'Asesoría General': '📋',
        'Inmigración': '✈️',
        'Educación': '📚',
        'Policía Local': '🚨',
        'Procesal': '⚖️'
    };
    return icons[subcategoria] || '📄';
}

// Obtener texto de precio
function getPriceText(service) {
    if (service.categoria === 'suscripcion') {
        return `$${formatNumber(service.precio_suscripcion_mensual)}/mes`;
    } else if (service.precio_base > 0) {
        return `$${formatNumber(service.precio_base)}`;
    } else {
        return 'Consultar';
    }
}

// Obtener badge del servicio
function getServiceBadge(service) {
    if (service.codigo === 'COMP-026') {
        return '<div class="badge">Más Popular</div>';
    } else if (service.categoria === 'transaccional') {
        return '<div class="badge badge-auto">Automatizado</div>';
    } else if (service.categoria === 'suscripcion') {
        return '<div class="badge badge-subscription">Suscripción</div>';
    }
    return '';
}

// Filtrar servicios por categoría
function filterServices(categoria) {
    currentCategory = categoria;

    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-categoria="${categoria}"]`).classList.add('active');

    // Filtrar servicios
    let filtered = allServices;
    if (categoria !== 'todos') {
        filtered = allServices.filter(s => s.categoria === categoria);
    }

    // Renderizar
    renderServices(filtered);
}

// Buscar servicios
function searchServices() {
    const searchTerm = document.getElementById('searchServices').value.toLowerCase();

    let filtered = allServices;

    // Aplicar filtro de categoría si no es "todos"
    if (currentCategory !== 'todos') {
        filtered = filtered.filter(s => s.categoria === currentCategory);
    }

    // Aplicar búsqueda
    if (searchTerm) {
        filtered = filtered.filter(s =>
            s.nombre.toLowerCase().includes(searchTerm) ||
            s.descripcion_corta.toLowerCase().includes(searchTerm) ||
            s.subcategoria.toLowerCase().includes(searchTerm)
        );
    }

    renderServices(filtered);
}

// Seleccionar servicio desde el catálogo
function selectServiceFromCatalog(serviceName, price) {
    selectService(serviceName, price);
}

// ==================== FIN CATÁLOGO DE SERVICIOS ====================

// Utilidades de formato
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function formatEstado(estado) {
    const estados = {
        'inicial': 'Inicial',
        'en_tramite': 'En Trámite',
        'terminado': 'Terminado',
        'borrador': 'Borrador',
        'revision': 'En Revisión',
        'aprobado': 'Aprobado',
        'rechazado': 'Rechazado'
    };
    return estados[estado] || estado;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ==================== FUNCIONES NUEVAS SECCIONES ====================

// FAQ Accordion
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const wasActive = faqItem.classList.contains('active');

    // Cerrar todos los FAQs
    document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
    });

    // Abrir el clickeado si no estaba abierto
    if (!wasActive) {
        faqItem.classList.add('active');
    }
}

// WhatsApp Widget - Conexión directa
function openWhatsApp() {
    // Abre WhatsApp directamente con mensaje predefinido
    const phoneNumber = '56912345678'; // Número de contacto JurídicaDigital
    const mensaje = encodeURIComponent('Hola, necesito información sobre servicios legales');
    window.open(`https://wa.me/${phoneNumber}?text=${mensaje}`, '_blank');
}

// Blog - Cargar más noticias
function loadMoreNews() {
    // Esta función se puede implementar de varias formas:
    // 1. Cargar más noticias desde la base de datos
    // 2. Mostrar noticias ocultas
    // 3. Redirigir a una página de blog completa

    // Por ahora, mostrar un mensaje (placeholder)
    alert('Próximamente: Más artículos legales y noticias');

    // Implementación futura para cargar desde API:
    /*
    async function loadMoreArticles() {
        try {
            const response = await fetch(`${ADMIN_API_BASE}/blog/articles?offset=3&limit=3`);
            const result = await response.json();

            if (result.success && result.data) {
                const blogGrid = document.getElementById('blog-grid');
                result.data.forEach(article => {
                    const articleHTML = `
                        <article class="blog-card">
                            <div class="blog-image">
                                <img src="${article.image_url}" alt="${article.title}">
                                <div class="blog-date">${formatDate(article.published_date)}</div>
                            </div>
                            <div class="blog-content">
                                <h3>${article.title}</h3>
                                <p>${article.excerpt}</p>
                                <a href="#" class="btn-small">Leer más</a>
                            </div>
                        </article>
                    `;
                    blogGrid.insertAdjacentHTML('beforeend', articleHTML);
                });
            }
        } catch (error) {
            console.error('Error cargando más artículos:', error);
        }
    }
    */
}

// ==================== FUNCIONES PARA DOCUMENTOS ====================

// Subir documento (para N8N)
async function subirDocumento(archivo) {
    if (!currentUser || !currentUser.id) {
        alert('Debes iniciar sesión para subir documentos.');
        return;
    }

    if (!archivo) {
        alert('Selecciona un archivo primero.');
        return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(archivo.type)) {
        alert('Solo se permiten archivos PDF, DOC y DOCX.');
        return;
    }

    // Validar tamaño (10MB)
    if (archivo.size > 10 * 1024 * 1024) {
        alert('El archivo no puede superar los 10MB.');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('archivo', archivo);

        const response = await fetch(`${API_BASE}?action=subir_documento`, {
            method: 'POST',
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert('Documento subido exitosamente. N8N lo procesará automáticamente.');
            // Recargar lista de documentos
            await loadClientDocumentos();
            return true;
        } else {
            alert('Error al subir el documento: ' + (result.error || 'Error desconocido'));
            return false;
        }
    } catch (error) {
        console.error('Error subiendo documento:', error);
        alert('Error al conectar con el servidor.');
        return false;
    }
}

// Ver resultado de documento procesado
function verResultadoDocumento(docId) {
    if (!currentUser || !currentUser.id) {
        return;
    }

    // Llamar API para obtener detalles del documento
    fetch(`${CLIENTES_API_BASE}/cliente/${currentUser.id}/documento/${docId}`)
        .then(res => res.json())
        .then(result => {
            if (result.success && result.documento) {
                const doc = result.documento;

                // Mostrar modal con el resultado
                let contenido = '<h3>Resultado del Análisis</h3>';

                if (doc.resultado_analisis) {
                    contenido += '<div class="resultado-analisis">';
                    contenido += '<pre>' + JSON.stringify(doc.resultado_analisis, null, 2) + '</pre>';
                    contenido += '</div>';
                } else {
                    contenido += '<p>No hay resultados de análisis disponibles.</p>';
                }

                // Puedes crear un modal personalizado aquí
                alert(contenido); // Por ahora, simplificado
            } else {
                alert('No se pudo obtener el resultado del documento.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error al obtener el resultado del documento.');
        });
}

// Obtener badge según estado de procesamiento
function getEstadoProcesamientoBadge(estado) {
    const badges = {
        'pendiente': '<span class="status-badge status-pendiente">Pendiente</span>',
        'procesando': '<span class="status-badge status-procesando">Procesando (N8N)</span>',
        'completado': '<span class="status-badge status-completado">Completado</span>',
        'error': '<span class="status-badge status-error">Error</span>'
    };
    return badges[estado] || '<span class="status-badge">Desconocido</span>';
}

// Mostrar formulario de subida
function mostrarFormularioSubida() {
    document.getElementById('uploadForm').style.display = 'block';
}

// Cancelar subida
function cancelarSubida() {
    document.getElementById('uploadForm').style.display = 'none';
    document.getElementById('archivoUpload').value = '';
    document.getElementById('fileInfo').style.display = 'none';
    document.getElementById('btnSubirDoc').disabled = true;
}

// Manejar selección de archivo
let archivoSeleccionado = null;

function handleFileSelect(event) {
    const archivo = event.target.files[0];

    if (!archivo) {
        document.getElementById('fileInfo').style.display = 'none';
        document.getElementById('btnSubirDoc').disabled = true;
        archivoSeleccionado = null;
        return;
    }

    // Validar tipo
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(archivo.type)) {
        alert('Solo se permiten archivos PDF, DOC y DOCX.');
        event.target.value = '';
        return;
    }

    // Validar tamaño (10MB)
    if (archivo.size > 10 * 1024 * 1024) {
        alert('El archivo no puede superar los 10MB.');
        event.target.value = '';
        return;
    }

    // Mostrar info del archivo
    archivoSeleccionado = archivo;
    document.getElementById('fileName').textContent = archivo.name;
    document.getElementById('fileSize').textContent = formatFileSize(archivo.size);
    document.getElementById('fileInfo').style.display = 'block';
    document.getElementById('btnSubirDoc').disabled = false;
}

// Subir documento seleccionado
async function subirDocumentoSeleccionado() {
    if (!archivoSeleccionado) {
        alert('Selecciona un archivo primero.');
        return;
    }

    const btnSubir = document.getElementById('btnSubirDoc');
    btnSubir.disabled = true;
    btnSubir.textContent = 'Subiendo...';

    const success = await subirDocumento(archivoSeleccionado);

    if (success) {
        // Limpiar formulario
        cancelarSubida();
    }

    btnSubir.disabled = false;
    btnSubir.textContent = 'Subir Documento';
}

// Formatear tamaño de archivo
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}
