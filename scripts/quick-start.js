import fs from "fs/promises"
import path from "path"

// Configuración rápida - Modifica estos valores
const CONFIG = {
  BEARER_TOKEN: "",
  DEPLOYMENT_ID: "",
  OUTPUT_DIR: "./downloaded-project",
}

const BASE_URL = "https://api.vercel.com/v8/deployments"

console.log("🚀 DESCARGADOR RÁPIDO DE VERCEL")
console.log("=".repeat(40))

// Función simple para descargar
async function quickDownload() {
  const headers = { Authorization: `Bearer ${CONFIG.BEARER_TOKEN}` }

  try {
    // Limpiar directorio
    await fs.rm(CONFIG.OUTPUT_DIR, { recursive: true, force: true }).catch(() => { })
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true })

    console.log("📋 Obteniendo lista de archivos...")
    const response = await fetch(`${BASE_URL}/${CONFIG.DEPLOYMENT_ID}/files`, { headers })
    const files = await response.json()

    let downloaded = 0
    let total = 0

    // Contar archivos totales
    function countFiles(items) {
      for (const item of items) {
        if (item.type === "file") total++
        if (item.children) countFiles(item.children)
      }
    }
    countFiles(files)

    console.log(`📊 Total de archivos: ${total}`)

    // Descargar archivos
    async function downloadFiles(items, basePath = "") {
      for (const item of items) {
        const fullPath = path.join(CONFIG.OUTPUT_DIR, basePath, item.name)

        if (item.type === "directory" && item.children) {
          await fs.mkdir(fullPath, { recursive: true })
          await downloadFiles(item.children, path.join(basePath, item.name))
        } else if (item.type === "file" && item.uid) {
          try {
            const fileResponse = await fetch(`${BASE_URL}/${CONFIG.DEPLOYMENT_ID}/files/${item.uid}`, { headers })
            const fileData = await fileResponse.json()

            if (fileData.data) {
              const content = Buffer.from(fileData.data, "base64")
              await fs.mkdir(path.dirname(fullPath), { recursive: true })
              await fs.writeFile(fullPath, content)

              downloaded++
              const progress = ((downloaded / total) * 100).toFixed(1)
              console.log(`✅ [${progress}%] ${item.name}`)
            }
          } catch (error) {
            console.error(`❌ Error: ${item.name}`)
          }
        }
      }
    }

    await downloadFiles(files)
    console.log(`🎉 ¡Completado! ${downloaded}/${total} archivos descargados`)
  } catch (error) {
    console.error("💥 Error:", error.message)
  }
}

quickDownload()
