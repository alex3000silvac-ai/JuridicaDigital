-- Tabla de precios de servicios - Jurídica Digital
-- Código generado por Grok AI

CREATE TABLE precios_servicios (
    id SERIAL PRIMARY KEY,
    nombre_servicio VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar precios iniciales validados por Grok
INSERT INTO precios_servicios (nombre_servicio, precio, descripcion) VALUES
    ('Informe Preliminar', 10000.00, 'Informe inicial de evaluación del caso + Ebook'),
    ('Juicio Laboral', 800000.00, 'Representación en juicio laboral completo - Defensa del Trabajador/Empleador'),
    ('Counsel', 30000.00, 'Asesoría legal personalizada mensual - Counsel / Asesoría Legal Continua');

-- Índice para búsquedas rápidas por nombre
CREATE INDEX idx_nombre_servicio ON precios_servicios(nombre_servicio);

-- Comentarios en la tabla
COMMENT ON TABLE precios_servicios IS 'Tabla de precios de servicios legales - Validado con Grok AI';
COMMENT ON COLUMN precios_servicios.precio IS 'Precio en pesos chilenos';
