# JurídicaDigital - Deployment en Vercel

## 🚀 Instrucciones de Deployment

### 1. Crear cuenta en Vercel (si no tienes)
- Ve a: https://vercel.com/signup
- Regístrate con tu email o GitHub
- Es GRATIS

### 2. Instalar Vercel CLI (Opcional - si quieres deployar desde terminal)
```bash
npm install -g vercel
```

### 3. Deploy desde la Web (RECOMENDADO - Más fácil)

**Opción A: Drag & Drop**
1. Ve a: https://vercel.com/new
2. Click en "Deploy" o "Import Project"
3. **Arrastra toda la carpeta `I:/vercel_deploy`** a la página
4. Vercel detectará automáticamente el proyecto
5. Click en "Deploy"
6. ¡Listo! En 30 segundos tendrás tu sitio en: `https://juridicadigital.vercel.app`

**Opción B: Desde Git (si tienes GitHub)**
1. Sube los archivos de `I:/vercel_deploy` a un repositorio GitHub
2. En Vercel, click "Import Git Repository"
3. Selecciona tu repositorio
4. Click "Deploy"

### 4. Configurar dominio personalizado

1. En el dashboard de Vercel, ve a tu proyecto
2. Click en "Settings" → "Domains"
3. Agrega: `www.juridicadigital.cl`
4. Vercel te dará registros DNS para configurar

### 5. Configurar DNS en Cloudflare

En Cloudflare (https://dash.cloudflare.com):
1. Click en `juridicadigital.cl`
2. Ve a "DNS" → "Records"
3. **ELIMINA** el registro A actual de `www`
4. **AGREGA** un registro CNAME:
   - Type: CNAME
   - Name: www
   - Target: cname.vercel-dns.com
   - Proxy status: Proxied (naranja)
5. Guarda los cambios

### 6. Verificar

Espera 5-10 minutos y visita:
- https://www.juridicadigital.cl

Deberías ver:
✅ Chatbot en ESPAÑOL
✅ Colores AZULES
✅ Sin problemas de cache
✅ Actualizaciones instantáneas

## 📁 Estructura del Proyecto

```
vercel_deploy/
├── index.html          # Página principal
├── admin.html          # Panel admin
├── pago-*.html         # Páginas de pago
├── *.css              # Estilos
├── *.js               # Scripts
├── api/
│   └── webhook_proxy.js  # Proxy serverless para n8n
├── vercel.json        # Configuración de Vercel
└── package.json       # Metadata del proyecto
```

## ⚙️ Configuración

- **n8n URL:** https://n8n.juridicadigital.cl (Cloudflare Tunnel)
- **Base de datos:** Local (I:\n8n_running.sqlite) - en tu PC
- **Hosting frontend:** Vercel (CDN global)
- **Cache:** Deshabilitado para index.html

## 🔒 Cumplimiento Ley 21.719

- ✅ Datos sensibles en Chile (n8n local)
- ✅ Solo HTML estático en Vercel
- ✅ Comunicación cifrada (HTTPS)
- ✅ Logs de acceso

## 📞 Soporte

Si hay problemas, contacta a tu desarrollador.
