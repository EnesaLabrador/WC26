import { jsPDF } from 'jspdf'

async function loadImageBase64(url) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

async function loadSvgString(url) {
  try {
    const res = await fetch(url)
    return res.text()
  } catch {
    return null
  }
}

export default async function generateMissingPdf(stickers, ownedStickers) {
  const missing = stickers.filter((s) => !ownedStickers.has(s.code))

  if (missing.length === 0) {
    alert('No te falta ningún cromo. ¡Álbum completo!')
    return
  }

  // Agrupar por grupo
  const groups = new Map()
  missing.forEach((s) => {
    if (!groups.has(s.groupCode)) {
      groups.set(s.groupCode, {
        groupCode: s.groupCode,
        groupName: s.groupName,
        flagCode: s.flagCode,
        logo: s.logo,
        codes: [],
      })
    }
    groups.get(s.groupCode).codes.push(s.code)
  })

  const groupList = Array.from(groups.values())

  // Ordenar: países primero, luego FWC, luego CC
  const order = ['FWC', 'CC']
  groupList.sort((a, b) => {
    const ai = order.indexOf(a.groupCode)
    const bi = order.indexOf(b.groupCode)
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0) return 1
    if (bi >= 0) return -1
    return a.groupName.localeCompare(b.groupName)
  })

  // Cargar imágenes necesarias
  const imageCache = {}
  const loadPromises = groupList.map(async (g) => {
    if (g.logo) {
      if (!imageCache[g.logo]) {
        imageCache[g.logo] = await loadImageBase64(g.logo)
      }
    } else if (g.flagCode) {
      const url = `/flags/${g.flagCode}.svg`
      if (!imageCache[url]) {
        imageCache[url] = await loadSvgString(url)
      }
    }
  })
  await Promise.all(loadPromises)

  // También cargar logo de la app
  const appLogo = await loadImageBase64('/icon.png')

  // Crear PDF A4 vertical
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 10
  const contentW = pageW - margin * 2

  // Calcular tamaño de fuente basado en cantidad de grupos
  let countryFontSize = 7
  let codeFontSize = 6
  let lineHeight = 3.8
  let groupGap = 1.8

  const totalGroups = groupList.length
  if (totalGroups > 40) {
    countryFontSize = 6
    codeFontSize = 5
    lineHeight = 3.2
    groupGap = 1.2
  } else if (totalGroups > 28) {
    countryFontSize = 6.5
    codeFontSize = 5.5
    lineHeight = 3.5
    groupGap = 1.5
  }

  // Cabecera
  let y = margin + 4

  if (appLogo) {
    doc.addImage(appLogo, 'PNG', margin, y - 2, 8, 8)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(22, 30, 45)
  doc.text('Cromos faltantes', margin + 11, y + 3)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const today = new Date().toLocaleDateString('es-ES')
  doc.text(today, pageW - margin, y + 3, { align: 'right' })

  y += 8

  // Progreso
  const total = stickers.length
  const missingCount = missing.length
  const percent = Math.round(((total - missingCount) / total) * 100)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(22, 30, 45)
  doc.text(`Faltan ${missingCount} / ${total} cromos  (${percent}%)`, margin, y)

  // Barra de progreso
  const barW = 50
  const barH = 2.5
  const barX = margin + 65
  doc.setDrawColor(200, 200, 200)
  doc.setFillColor(230, 230, 230)
  doc.roundedRect(barX, y - 3, barW, barH, 1, 1, 'FD')
  doc.setFillColor(22, 163, 74)
  doc.roundedRect(barX, y - 3, barW * (percent / 100), barH, 1, 1, 'F')

  y += 6

  // Línea separadora
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 4

  // Layout de 3 columnas
  const cols = 3
  const colGap = 4
  const colWidth = (contentW - colGap * (cols - 1)) / cols
  const colXs = [margin, margin + colWidth + colGap, margin + (colWidth + colGap) * 2]
  const maxY = pageH - margin

  // Distribuir grupos en columnas balanceadas
  const colGroups = [[], [], []]
  groupList.forEach((g, i) => {
    colGroups[i % cols].push(g)
  })

  // Mejor distribución: ir añadiendo a la columna más corta
  const colHeights = [0, 0, 0]
  const finalColGroups = [[], [], []]
  groupList.forEach((g) => {
    const shortest = colHeights.indexOf(Math.min(...colHeights))
    finalColGroups[shortest].push(g)
    colHeights[shortest] += lineHeight * 2 + groupGap + 1
  })

  const colYs = [y, y, y]

  finalColGroups.forEach((groups, colIdx) => {
    const x = colXs[colIdx]
    let cy = colYs[colIdx]

    groups.forEach((g) => {
      // Verificar si cabe, si no, reducir más
      if (cy + lineHeight * 2 > maxY) {
        return
      }

      // Imagen
      const imgSize = 3.5
      if (g.logo && imageCache[g.logo]) {
        doc.addImage(imageCache[g.logo], 'PNG', x, cy - 1, imgSize, imgSize)
      } else if (g.flagCode && imageCache[`/flags/${g.flagCode}.svg`]) {
        try {
          doc.addSvgAsImage(imageCache[`/flags/${g.flagCode}.svg`], x, cy - 1, imgSize, imgSize * 0.75)
        } catch {
          // Fallback si SVG no carga
        }
      }

      // Nombre del grupo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(countryFontSize)
      doc.setTextColor(22, 30, 45)
      doc.text(`${g.groupCode}  ${g.groupName}`, x + imgSize + 1.5, cy + 1.2)

      cy += lineHeight

      // Códigos faltantes
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(codeFontSize)
      doc.setTextColor(80, 80, 80)

      const codesText = g.codes.join('  ')
      const maxTextW = colWidth - 2
      const textW = doc.getTextWidth(codesText)

      if (textW <= maxTextW) {
        doc.text(codesText, x, cy)
      } else {
        // Wrap simple por número de códigos
        const maxChars = Math.floor((maxTextW / textW) * codesText.length)
        const breakIdx = codesText.lastIndexOf(' ', maxChars)
        const line1 = breakIdx > 0 ? codesText.slice(0, breakIdx) : codesText.slice(0, maxChars)
        const line2 = breakIdx > 0 ? codesText.slice(breakIdx + 1) : codesText.slice(maxChars)
        doc.text(line1, x, cy)
        cy += lineHeight - 0.5
        if (line2) doc.text(line2, x, cy)
      }

      cy += groupGap
    })
  })

  doc.save('cromos-faltantes-fwc2026.pdf')
}
