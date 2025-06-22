const fs = require("fs").promises
const path = require("path")

const BEARER_TOKEN = ""
const DEPLOYMENT_ID = ""
const BASE_URL = "https://api.vercel.com/v8/deployments"
const OUTPUT_DIR = "./downloaded-project"

// Configurar headers para las requests
const getHeaders = () => ({
  Authorization: `Bearer ${BEARER_TOKEN}`,
  "Content-Type": "application/json",
})

// Función para hacer requests con manejo de errores
async function makeRequest(url) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: getHeaders(),
      redirect: "follow",
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message)
    throw error
  }
}

// Función para crear directorios recursivamente
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true })
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error.message)
    throw error
  }
}

// Función para descargar un archivo individual
async function downloadFile(fileUid, filePath) {
  try {
    console.log(`Descargando: ${filePath}`)

    const fileUrl = `${BASE_URL}/${DEPLOYMENT_ID}/files/${fileUid}`
    const fileData = await makeRequest(fileUrl)

    if (!fileData.data) {
      console.warn(`No data found for file: ${filePath}`)
      return
    }

    // Decodificar base64
    const decodedContent = Buffer.from(fileData.data, "base64")

    // Crear directorio padre si no existe
    const dirPath = path.dirname(filePath)
    await ensureDirectoryExists(dirPath)

    // Escribir archivo
    await fs.writeFile(filePath, decodedContent)
    console.log(`✅ Guardado: ${filePath}`)
  } catch (error) {
    console.error(`❌ Error descargando ${filePath}:`, error.message)
  }
}

// Función para procesar recursivamente la estructura de archivos
async function processFileStructure(items, basePath = "") {
  const downloadPromises = []

  for (const item of items) {
    const itemPath = path.join(OUTPUT_DIR, basePath, item.name)

    if (item.type === "directory" && item.children) {
      // Crear directorio
      await ensureDirectoryExists(itemPath)
      console.log(`📁 Directorio creado: ${itemPath}`)

      // Procesar archivos hijos recursivamente
      const childPromises = processFileStructure(item.children, path.join(basePath, item.name))
      downloadPromises.push(childPromises)
    } else if (item.type === "file" && item.uid) {
      // Descargar archivo
      const downloadPromise = downloadFile(item.uid, itemPath)
      downloadPromises.push(downloadPromise)
    }
  }

  // Esperar a que todas las descargas terminen
  await Promise.all(downloadPromises)
}

// Función principal
async function downloadDeployment() {
  try {
    console.log("🚀 Iniciando descarga del deployment...")
    console.log(`Deployment ID: ${DEPLOYMENT_ID}`)
    console.log(`Directorio de salida: ${OUTPUT_DIR}`)

    // Limpiar directorio de salida si existe
    try {
      await fs.rm(OUTPUT_DIR, { recursive: true, force: true })
    } catch (error) {
      // Ignorar si el directorio no existe
    }

    // Crear directorio de salida
    await ensureDirectoryExists(OUTPUT_DIR)

    // Obtener estructura de archivos
    console.log("📋 Obteniendo estructura de archivos...")
    const filesUrl = `${BASE_URL}/${DEPLOYMENT_ID}/files`
    const filesData = await makeRequest(filesUrl)

    if (!Array.isArray(filesData)) {
      throw new Error("La respuesta no contiene un array de archivos válido")
    }

    console.log(`📊 Encontrados ${filesData.length} elementos en el nivel raíz`)

    // Procesar estructura de archivos
    await processFileStructure(filesData)

    console.log("🎉 ¡Descarga completada exitosamente!")
    console.log(`📁 Archivos guardados en: ${OUTPUT_DIR}`)
  } catch (error) {
    console.error("💥 Error durante la descarga:", error.message)
    process.exit(1)
  }
}

// Ejecutar descarga
downloadDeployment()
