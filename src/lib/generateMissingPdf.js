import { jsPDF } from 'jspdf'

async function loadImageAsBase64(url) {
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

async function svgToPngDataUrl(svgUrl, w = 40, h = 30) {
  try {
    const svgText = await fetch(svgUrl).then((r) => r.text())
    const blob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)

    const img = new Image()
    await new Promise((resolve, reject) => {
      img.onload = resolve
      img.onerror = reject
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = w * 4
    canvas.height = h * 4
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    URL.revokeObjectURL(url)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

function countWrappedLines(codes, maxWidth, doc) {
  let lines = 1
  let currentWidth = 0
  const gap = doc.getTextWidth('  ')

  codes.forEach((code) => {
    const codeW = doc.getTextWidth(code)
    if (currentWidth > 0 && currentWidth + gap + codeW > maxWidth) {
      lines++
      currentWidth = codeW
    } else {
      currentWidth = currentWidth > 0 ? currentWidth + gap + codeW : codeW
    }
  })

  return lines
}

export default async function generateMissingPdf(stickers, ownedStickers) {
  const missing = stickers.filter((s) => !ownedStickers.has(s.code))

  if (missing.length === 0) {
    alert('No te falta ningún cromo. ¡Álbum completo!')
    return
  }

  // Agrupar
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
  const specialOrder = ['FWC', 'CC']
  groupList.sort((a, b) => {
    const ai = specialOrder.indexOf(a.groupCode)
    const bi = specialOrder.indexOf(b.groupCode)
    if (ai >= 0 && bi >= 0) return ai - bi
    if (ai >= 0) return 1
    if (bi >= 0) return -1
    return a.groupName.localeCompare(b.groupName)
  })

  // Precargar imágenes
  const imageCache = {}
  imageCache['app'] = await loadImageAsBase64('/icon.png')

  await Promise.all(
    groupList.map(async (g) => {
      if (g.logo) {
        imageCache[g.groupCode] = await loadImageAsBase64(g.logo)
      } else if (g.flagCode) {
        imageCache[g.groupCode] = await svgToPngDataUrl(
          `/flags/${g.flagCode}.svg`,
          40,
          30
        )
      }
    })
  )

  // PDF A4 horizontal
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = 297
  const pageH = 210
  const margin = 10
  const contentW = pageW - margin * 2

  // === CABECERA ===
  let y = margin + 2

  if (imageCache['app']) {
    doc.addImage(imageCache['app'], 'PNG', margin, y - 1, 7, 7)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(22, 30, 45)
  doc.text('Cromos faltantes', margin + 10, y + 4)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  const today = new Date().toLocaleDateString('es-ES')
  doc.text(today, pageW - margin, y + 4, { align: 'right' })

  y += 10

  // Stats
  const total = stickers.length
  const missingCount = missing.length
  const ownedCount = total - missingCount
  const percent = Math.round((ownedCount / total) * 100)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  doc.text(`Faltan ${missingCount} / ${total} cromos   (${percent}%)`, margin, y)

  // Barra progreso
  const barW = 60
  const barH = 3
  const barX = margin + 80
  doc.setFillColor(230, 230, 230)
  doc.roundedRect(barX, y - 2.5, barW, barH, 1, 1, 'F')
  doc.setFillColor(22, 163, 74)
  doc.roundedRect(barX, y - 2.5, barW * (percent / 100), barH, 1, 1, 'F')

  y += 6

  // Separador
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)
  y += 4

  // === CONTENIDO ===
  const startY = y
  const maxY = pageH - margin
  const availableH = maxY - startY

  const cols = 4
  const colGap = 3
  const colWidth = (contentW - colGap * (cols - 1)) / cols
  const colXs = Array.from(
    { length: cols },
    (_, i) => margin + i * (colWidth + colGap)
  )

  const headerFontSize = 7
  const codeFontSize = 6
  const lineHeight = 3.2
  const headerH = 4.5
  const groupGap = 2.5

  // Medir altura real de cada grupo con wrapping exacto
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(codeFontSize)
  const codeMaxW = colWidth - 2

  const measuredGroups = groupList.map((g) => {
    const lines = countWrappedLines(g.codes, codeMaxW, doc)
    const height = headerH + lines * lineHeight + groupGap
    return { group: g, height }
  })

  // Distribuir en columnas balanceadas (más corta primero)
  const colGroups = Array.from({ length: cols }, () => [])
  const colHeights = Array(cols).fill(0)

  measuredGroups.forEach((mg) => {
    const shortestIdx = colHeights.indexOf(Math.min(...colHeights))
    colGroups[shortestIdx].push(mg)
    colHeights[shortestIdx] += mg.height
  })

  // Dibujar columnas
  colGroups.forEach((groups, colIdx) => {
    const x = colXs[colIdx]
    let cy = startY

    groups.forEach(({ group: g, height }) => {
      // Si se pasa de página, truncar (no debería pasar con 4 cols)
      if (cy + height > maxY) return

      const imgSize = 4
      const imgH = 3

      // Imagen
      if (imageCache[g.groupCode]) {
        doc.addImage(imageCache[g.groupCode], 'PNG', x, cy - 0.5, imgSize, imgH)
      }

      // Nombre grupo
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(headerFontSize)
      doc.setTextColor(30, 30, 30)
      doc.text(`${g.groupCode}  ${g.groupName}`, x + imgSize + 1.5, cy + 2)

      cy += headerH

      // Códigos faltantes (wrapping real)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(codeFontSize)
      doc.setTextColor(80, 80, 80)

      let currentLine = ''
      let lineCount = 0
      const gapStr = '  '

      g.codes.forEach((code, idx) => {
        const prefix = idx > 0 ? gapStr : ''
        const testLine = currentLine + prefix + code
        if (idx > 0 && doc.getTextWidth(testLine) > codeMaxW) {
          doc.text(currentLine, x, cy + lineCount * lineHeight)
          lineCount++
          currentLine = code
        } else {
          currentLine = testLine
        }
      })

      if (currentLine) {
        doc.text(currentLine, x, cy + lineCount * lineHeight)
        lineCount++
      }

      cy += lineCount * lineHeight + groupGap
    })
  })

  doc.save('cromos-faltantes-fwc2026.pdf')
}
