// Configuración para el descargador de deployments de Vercel

export const CONFIG = {
  // Token de autorización de Vercel
  BEARER_TOKEN: "",

  // ID del deployment a descargar
  DEPLOYMENT_ID: "",

  // URL base de la API de Vercel
  BASE_URL: "https://api.vercel.com/v8/deployments",

  // Directorio donde se guardarán los archivos descargados
  OUTPUT_DIR: "./downloaded-project",

  // Configuraciones de descarga
  DOWNLOAD_OPTIONS: {
    // Número máximo de descargas concurrentes
    MAX_CONCURRENT_DOWNLOADS: 10,

    // Tiempo de espera para cada request (ms)
    REQUEST_TIMEOUT: 30000,

    // Reintentos en caso de error
    MAX_RETRIES: 3,

    // Tipos de archivo a excluir (opcional)
    EXCLUDE_EXTENSIONS: [".log", ".tmp"],

    // Directorios a excluir (opcional)
    EXCLUDE_DIRECTORIES: ["node_modules", ".git", ".next/cache"],
  },
}

// Función para validar la configuración
export function validateConfig() {
  const required = ["BEARER_TOKEN", "DEPLOYMENT_ID"]
  const missing = required.filter((key) => !CONFIG[key])

  if (missing.length > 0) {
    throw new Error(`Configuración faltante: ${missing.join(", ")}`)
  }

  return true
}
