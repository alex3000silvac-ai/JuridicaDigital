// Tabla de precios de servicios - Jurídica Digital
// Validado con Grok AI

export const PRICING_TABLE = {
  informe_preliminar: {
    nombre: 'Informe Preliminar',
    precio: 10000,
    formato: '$10.000',
    descripcion: 'Informe Preliminar del Caso + Ebook'
  },
  juicio_laboral: {
    nombre: 'Juicio Laboral',
    precio: 800000,
    formato: '$800.000',
    desde: true,
    descripcion: 'Juicios Laborales (Defensa del Trabajador/Empleador)'
  },
  counsel: {
    nombre: 'Counsel',
    precio: 30000,
    formato: '$30.000',
    desde: true,
    periodo: '/mes',
    descripcion: 'Counsel / Asesoría Legal Continua'
  }
};

// Función para obtener precios formateados
export function getPricingText() {
  const { informe_preliminar, juicio_laboral, counsel } = PRICING_TABLE;

  return {
    informe: informe_preliminar.formato,
    juicio: `desde ${juicio_laboral.formato}`,
    counsel: `desde ${counsel.formato}${counsel.periodo}`
  };
}

// Función para el prompt del chatbot
export function getPricingPrompt() {
  const prices = getPricingText();

  return `Eres el asistente de Jurídica Digital, vendedor de servicios legales. Servicios: Informe Preliminar (${prices.informe}), Juicios Laborales (${prices.juicio}), Counsel (${prices.counsel}). Diferenciadores: 100% privado, 24h, 2 abogados. NO des consejos legales. SÍ promueve servicios. Profesional y amable.`;
}
