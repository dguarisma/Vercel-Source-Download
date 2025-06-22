import fs from "fs/promises"
import path from "path"
import { CONFIG, validateConfig } from "./download-config.js"

// Validar configuración al inicio
validateConfig()

const { BEARER_TOKEN, DEPLOYMENT_ID, BASE_URL, OUTPUT_DIR, DOWNLOAD_OPTIONS } = CONFIG

// Estadísticas de descarga
const stats = {
  totalFiles: 0,
  downloadedFiles: 0,
  failedFiles: 0,
  totalDirectories: 0,
  startTime: null,
  errors: [],
}

// Configurar headers para las requests
const getHeaders = () => ({
  Authorization: `Bearer ${BEARER_TOKEN}`,
  "Content-Type": "application/json",
})

// Función para hacer requests con reintentos
async function makeRequestWithRetry(url, retries = DOWNLOAD_OPTIONS.MAX_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), DOWNLOAD_OPTIONS.REQUEST_TIMEOUT)

      const response = await fetch(url, {
        method: "GET",
        headers: getHeaders(),
        redirect: "follow",
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (attempt === retries) {
        throw new Error(`Failed after ${retries} attempts: ${error.message}`)
      }

      console.warn(`⚠️  Intento ${attempt} falló para ${url}, reintentando...`)
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// Función para crear directorios recursivamente
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
    return true
  } catch (error) {
    console.error(`❌ Error creando directorio ${dirPath}:`, error.message)
    return false
  }
}

// Función para verificar si un archivo debe ser excluido
function shouldExcludeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return DOWNLOAD_OPTIONS.EXCLUDE_EXTENSIONS.includes(ext)
}

// Función para verificar si un directorio debe ser excluido
function shouldExcludeDirectory(dirName) {
  return DOWNLOAD_OPTIONS.EXCLUDE_DIRECTORIES.some((excluded) => dirName.includes(excluded))
}

// Función para descargar un archivo individual
async function downloadFile(fileUid, filePath) {
  try {
    if (shouldExcludeFile(filePath)) {
      console.log(`⏭️  Omitiendo archivo excluido: ${filePath}`)
      return
    }

    const fileUrl = `${BASE_URL}/${DEPLOYMENT_ID}/files/${fileUid}`
    const fileData = await makeRequestWithRetry(fileUrl)

    if (!fileData.data) {
      console.warn(`⚠️  Sin datos para: ${filePath}`)
      stats.failedFiles++
      return
    }

    // Decodificar base64
    const decodedContent = Buffer.from(fileData.data, "base64")

    // Crear directorio padre si no existe
    const dirPath = path.dirname(filePath)
    await ensureDirectoryExists(dirPath)

    // Escribir archivo
    await fs.writeFile(filePath, decodedContent)

    stats.downloadedFiles++
    const progress = ((stats.downloadedFiles / stats.totalFiles) * 100).toFixed(1)
    console.log(`✅ [${progress}%] ${filePath} (${decodedContent.length} bytes)`)
  } catch (error) {
    stats.failedFiles++
    stats.errors.push({ file: filePath, error: error.message })
    console.error(`❌ Error descargando ${filePath}:`, error.message)
  }
}

// Función para contar archivos totales
function countFiles(items) {
  let count = 0
  let dirCount = 0

  for (const item of items) {
    if (item.type === "directory" && item.children) {
      if (!shouldExcludeDirectory(item.name)) {
        dirCount++
        const childCounts = countFiles(item.children)
        count += childCounts.files
        dirCount += childCounts.directories
      }
    } else if (item.type === "file" && item.uid) {
      count++
    }
  }

  return { files: count, directories: dirCount }
}

// Función para procesar archivos con control de concurrencia
async function processFileStructure(items, basePath = "") {
  const downloadTasks = []

  for (const item of items) {
    const itemPath = path.join(OUTPUT_DIR, basePath, item.name)

    if (item.type === "directory" && item.children) {
      if (shouldExcludeDirectory(item.name)) {
        console.log(`⏭️  Omitiendo directorio excluido: ${itemPath}`)
        continue
      }

      // Crear directorio
      await ensureDirectoryExists(itemPath)

      // Procesar archivos hijos recursivamente
      await processFileStructure(item.children, path.join(basePath, item.name))
    } else if (item.type === "file" && item.uid) {
      // Agregar tarea de descarga
      downloadTasks.push(() => downloadFile(item.uid, itemPath))
    }
  }

  // Ejecutar descargas con control de concurrencia
  await executeWithConcurrencyLimit(downloadTasks, DOWNLOAD_OPTIONS.MAX_CONCURRENT_DOWNLOADS)
}

// Función para ejecutar tareas con límite de concurrencia
async function executeWithConcurrencyLimit(tasks, limit) {
  const executing = []

  for (const task of tasks) {
    const promise = task().then(() => {
      executing.splice(executing.indexOf(promise), 1)
    })

    executing.push(promise)

    if (executing.length >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
}

// Función para mostrar estadísticas finales
function showFinalStats() {
  const duration = (Date.now() - stats.startTime) / 1000

  console.log("\n" + "=".repeat(50))
  console.log("📊 ESTADÍSTICAS DE DESCARGA")
  console.log("=".repeat(50))
  console.log(`⏱️  Tiempo total: ${duration.toFixed(2)} segundos`)
  console.log(`📁 Directorios creados: ${stats.totalDirectories}`)
  console.log(`📄 Archivos totales: ${stats.totalFiles}`)
  console.log(`✅ Archivos descargados: ${stats.downloadedFiles}`)
  console.log(`❌ Archivos fallidos: ${stats.failedFiles}`)
  console.log(`📈 Tasa de éxito: ${((stats.downloadedFiles / stats.totalFiles) * 100).toFixed(1)}%`)

  if (stats.errors.length > 0) {
    console.log("\n❌ ERRORES:")
    stats.errors.forEach(({ file, error }) => {
      console.log(`   ${file}: ${error}`)
    })
  }

  console.log("=".repeat(50))
}

// Función principal mejorada
async function downloadDeployment() {
  try {
    stats.startTime = Date.now()

    console.log("🚀 DESCARGADOR DE DEPLOYMENT DE VERCEL")
    console.log("=".repeat(50))
    console.log(`📋 Deployment ID: ${DEPLOYMENT_ID}`)
    console.log(`📁 Directorio destino: ${OUTPUT_DIR}`)
    console.log(`🔧 Descargas concurrentes: ${DOWNLOAD_OPTIONS.MAX_CONCURRENT_DOWNLOADS}`)
    console.log("=".repeat(50))

    // Limpiar directorio de salida
    try {
      await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
      console.log("🧹 Directorio de salida limpiado")
    } catch (error) {
      // Ignorar si no existe
    }

    // Crear directorio de salida
    await ensureDirectoryExists(OUTPUT_DIR)

    // Obtener estructura de archivos
    console.log("📋 Obteniendo estructura de archivos...")
    const filesUrl = `${BASE_URL}/${DEPLOYMENT_ID}/files`
    const filesData = await makeRequestWithRetry(filesUrl)

    if (!Array.isArray(filesData)) {
      throw new Error("Respuesta inválida de la API")
    }

    // Contar archivos totales
    const counts = countFiles(filesData)
    stats.totalFiles = counts.files
    stats.totalDirectories = counts.directories

    console.log(`📊 Archivos a descargar: ${stats.totalFiles}`)
    console.log(`📁 Directorios a crear: ${stats.totalDirectories}`)
    console.log("=".repeat(50))

    // Procesar estructura de archivos
    await processFileStructure(filesData)

    // Mostrar estadísticas finales
    showFinalStats()

    if (stats.failedFiles === 0) {
      console.log("🎉 ¡Descarga completada exitosamente!")
    } else {
      console.log("⚠️  Descarga completada con algunos errores")
    }
  } catch (error) {
    console.error("💥 Error crítico:", error.message)
    process.exit(1)
  }
}

// Ejecutar descarga
downloadDeployment()
