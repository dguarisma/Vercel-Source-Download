#!/bin/bash

echo "🚀 DESCARGADOR DE DEPLOYMENT DE VERCEL"
echo "======================================"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado"
    echo "   Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

# Mostrar versión de Node.js
echo "📋 Versión de Node.js: $(node --version)"

# Verificar si el package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ package.json no encontrado"
    echo "   Asegúrate de estar en el directorio correcto"
    exit 1
fi

echo ""
echo "Selecciona una opción:"
echo "1) Descarga básica (ES Modules)"
echo "2) Descarga básica (CommonJS)"
echo "3) Descarga avanzada con progreso"
echo "4) Descarga rápida"
echo "5) Analizar archivos descargados"

read -p "Opción (1-5): " option

case $option in
    1)
        echo "🚀 Ejecutando descarga básica (ES Modules)..."
        node scripts/download-deployment.js
        ;;
    2)
        echo "🚀 Ejecutando descarga básica (CommonJS)..."
        node scripts/download-deployment-commonjs.js
        ;;
    3)
        echo "🚀 Ejecutando descarga avanzada..."
        node scripts/download-with-progress.js
        ;;
    4)
        echo "🚀 Ejecutando descarga rápida..."
        node scripts/quick-start.js
        ;;
    5)
        echo "🔍 Analizando archivos..."
        node scripts/file-analyzer.js
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac
