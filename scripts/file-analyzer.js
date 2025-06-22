import fs from "fs/promises"
import path from "path"

// Función para analizar la estructura de archivos descargados
async function analyzeDownloadedFiles(directory = "./downloaded-project") {
  const analysis = {
    totalFiles: 0,
    totalDirectories: 0,
    filesByExtension: {},
    largestFiles: [],
    directoryStructure: {},
    totalSize: 0,
  }

  async function analyzeDirectory(dirPath, relativePath = "") {
    try {
      const items = await fs.readdir(dirPath, { withFileTypes: true })

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name)
        const relativeItemPath = path.join(relativePath, item.name)

        if (item.isDirectory()) {
          analysis.totalDirectories++
          analysis.directoryStructure[relativeItemPath] = {
            type: "directory",
            children: {},
          }

          await analyzeDirectory(fullPath, relativeItemPath)
        } else if (item.isFile()) {
          analysis.totalFiles++

          const stats = await fs.stat(fullPath)
          const extension = path.extname(item.name).toLowerCase() || "sin extensión"

          // Contar por extensión
          analysis.filesByExtension[extension] = (analysis.filesByExtension[extension] || 0) + 1

          // Agregar a archivos más grandes
          analysis.largestFiles.push({
            path: relativeItemPath,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
          })

          analysis.totalSize += stats.size

          analysis.directoryStructure[relativeItemPath] = {
            type: "file",
            size: stats.size,
            extension: extension,
          }
        }
      }
    } catch (error) {
      console.error(`Error analizando directorio ${dirPath}:`, error.message)
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  console.log("🔍 Analizando archivos descargados...")
  await analyzeDirectory(directory)

  // Ordenar archivos más grandes
  analysis.largestFiles.sort((a, b) => b.size - a.size)
  analysis.largestFiles = analysis.largestFiles.slice(0, 10) // Top 10

  // Mostrar resultados
  console.log("\n📊 ANÁLISIS DE ARCHIVOS DESCARGADOS")
  console.log("=".repeat(50))
  console.log(`📁 Total de directorios: ${analysis.totalDirectories}`)
  console.log(`📄 Total de archivos: ${analysis.totalFiles}`)
  console.log(`💾 Tamaño total: ${formatBytes(analysis.totalSize)}`)

  console.log("\n📋 ARCHIVOS POR EXTENSIÓN:")
  Object.entries(analysis.filesByExtension)
    .sort(([, a], [, b]) => b - a)
    .forEach(([ext, count]) => {
      console.log(`   ${ext}: ${count} archivos`)
    })

  console.log("\n📈 ARCHIVOS MÁS GRANDES:")
  analysis.largestFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file.path} (${file.sizeFormatted})`)
  })

  // Guardar análisis en JSON
  const analysisPath = path.join(directory, "analysis.json")
  await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2))
  console.log(`\n💾 Análisis guardado en: ${analysisPath}`)

  return analysis
}

// Ejecutar análisis
analyzeDownloadedFiles().catch(console.error)
