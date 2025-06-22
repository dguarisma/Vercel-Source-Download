# 🚀 Descargador de Deployments de Vercel

Sistema completo para descargar todos los archivos de un deployment de Vercel, recreando la estructura de directorios original.

## 📋 Requisitos

- Node.js 16+ 
- Token de acceso de Vercel
- ID del deployment a descargar

## 🔧 Configuración Rápida

1. **Obtener Token de Vercel:**
   - Ve a [Vercel Dashboard](https://vercel.com/account/tokens)
   - Crea un nuevo token
   - Copia el token generado

2. **Obtener ID del Deployment:**
   - Ve a tu proyecto en Vercel
   - Selecciona el deployment deseado
   - Copia el ID de la URL (ej: `dpl_xxxxx`)

3. **Configurar el script:**
   - Edita `scripts/download-config.js`
   - Actualiza `BEARER_TOKEN` y `DEPLOYMENT_ID`

## 🚀 Uso

### Opción 1: Script de Shell (Recomendado)
```
chmod +x run.sh
./run.sh
```

### Opción 2: Comandos directos

**Descarga básica:**
```
node scripts/download-deployment.js
```

**Descarga avanzada con progreso:**
``` bash
node scripts/download-with-progress.js
```

**Descarga rápida:**
``` bash
node scripts/quick-start.js
```

**Analizar archivos descargados:**
``` bash
node scripts/file-analyzer.js
```
### Opción 3: NPM Scripts
``` bash
npm run download          # Descarga básica
npm run download-advanced # Descarga avanzada
npm run analyze          # Analizar archivos
```

## 📁 Estructura de Archivos

```
Vercel-Source-Download/
├── scripts/
│   ├── download-deployment.js      # Descarga básica (ES Modules)
│   ├── download-deployment-commonjs.js # Descarga básica (CommonJS)
│   ├── download-with-progress.js   # Descarga avanzada
│   ├── download-config.js          # Configuración
│   ├── file-analyzer.js           # Analizador post-descarga
│   └── quick-start.js             # Descarga rápida
├── downloaded-project/             # Archivos descargados (se crea automáticamente)
├── package.json                   # Configuración del proyecto
├── run.sh                        # Script de ejecución
└── README.md                     # Este archivo
```


# Con ES Modules (requiere package.json)
```
node scripts/download-deployment.js
```

# Con CommonJS (funciona sin package.json)
```
node scripts/download-deployment-commonjs.js
```

# Descarga rápida
```
node scripts/quick-start.js
```

## ⚙️ Características

### 🔥 Descarga Básica
- Descarga todos los archivos del deployment
- Recrea la estructura de directorios
- Decodificación automática de base64
- Manejo básico de errores

### 🚀 Descarga Avanzada
- **Control de concurrencia**: Limita descargas simultáneas
- **Reintentos automáticos**: Reintenta descargas fallidas
- **Progreso en tiempo real**: Muestra porcentaje completado
- **Filtros de exclusión**: Omite archivos/directorios no deseados
- **Estadísticas detalladas**: Tiempo, éxito, errores
- **Timeout de requests**: Evita descargas colgadas

### 📊 Analizador
- Estadísticas de archivos por extensión
- Top 10 archivos más grandes
- Tamaño total del proyecto
- Reporte en JSON

## 🛠️ Solución de Problemas

### Error: "Cannot use import statement outside a module"
**Solución:** Usa la versión CommonJS:
```bash
node scripts/download-deployment-commonjs.js
```

### Error: "HTTP 401 Unauthorized"
**Solución:** Verifica que tu token de Vercel sea válido y tenga permisos.

### Error: "HTTP 404 Not Found"
**Solución:** Verifica que el ID del deployment sea correcto.

### Descargas lentas
**Solución:** Ajusta `MAX_CONCURRENT_DOWNLOADS` en `download-config.js`.

## 📝 Configuración Avanzada

Edita `scripts/download-config.js` para personalizar:

```javascript
export const CONFIG = {
  BEARER_TOKEN: "tu_token_aqui",
  DEPLOYMENT_ID: "tu_deployment_id_aqui",
  OUTPUT_DIR: "./downloaded-project",
  DOWNLOAD_OPTIONS: {
    MAX_CONCURRENT_DOWNLOADS: 10,
    REQUEST_TIMEOUT: 30000,
    MAX_RETRIES: 3,
    EXCLUDE_EXTENSIONS: [".log", ".tmp"],
    EXCLUDE_DIRECTORIES: ["node_modules", ".git", ".next/cache"],
  },
}
```

## 📄 Licencia

MIT License - Puedes usar este código libremente.
