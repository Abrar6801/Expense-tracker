// Generates minimal valid PNG icons with the Aurora violet gradient
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

function createPNG(size) {
  const r1 = 124, g1 = 58, b1 = 237  // violet-600
  const r2 = 99,  g2 = 102, b2 = 241  // indigo-500
  const cornerRadius = Math.round(size * 0.22)

  // Build raw RGBA pixel data
  const pixels = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4
      const t = (x + y) / (size * 2)
      const r = Math.round(r1 + (r2 - r1) * t)
      const g = Math.round(g1 + (g2 - g1) * t)
      const b = Math.round(b1 + (b2 - b1) * t)

      // Rounded corner mask
      const dx = Math.max(cornerRadius - x, 0, x - (size - 1 - cornerRadius))
      const dy = Math.max(cornerRadius - y, 0, y - (size - 1 - cornerRadius))
      const dist = Math.sqrt(dx * dx + dy * dy)
      const alpha = dist > cornerRadius ? 0 : 255

      pixels[idx]     = r
      pixels[idx + 1] = g
      pixels[idx + 2] = b
      pixels[idx + 3] = alpha
    }
  }

  // Draw a simple bar chart in white
  const barW = Math.round(size * 0.13)
  const gap  = Math.round(size * 0.065)
  const barX = [
    Math.round(size * 0.20),
    Math.round(size * 0.41),
    Math.round(size * 0.62),
  ]
  const barH = [
    Math.round(size * 0.34),
    Math.round(size * 0.50),
    Math.round(size * 0.62),
  ]
  const bottom = Math.round(size * 0.82)

  for (let b = 0; b < 3; b++) {
    const top = bottom - barH[b]
    for (let y = top; y < bottom; y++) {
      for (let x = barX[b]; x < barX[b] + barW; x++) {
        if (x < size && y < size && x >= 0 && y >= 0) {
          const idx = (y * size + x) * 4
          if (pixels[idx + 3] > 0) {
            pixels[idx]     = 255
            pixels[idx + 1] = 255
            pixels[idx + 2] = 255
            pixels[idx + 3] = 230
          }
        }
      }
    }
  }

  // PNG encoding
  function crc32(buf) {
    let crc = 0xffffffff
    const table = []
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
      table[i] = c
    }
    for (const byte of buf) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    return (crc ^ 0xffffffff) >>> 0
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const typeB = Buffer.from(type)
    const crcB = Buffer.alloc(4)
    crcB.writeUInt32BE(crc32(Buffer.concat([typeB, data])))
    return Buffer.concat([len, typeB, data, crcB])
  }

  // IHDR
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8   // bit depth
  ihdr[9] = 6   // RGBA
  ihdr[10] = ihdr[11] = ihdr[12] = 0

  // IDAT: filter byte 0 per row, then deflate
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4)
  }
  const compressed = zlib.deflateSync(raw, { level: 6 })

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))])
}

const outDir = path.join(__dirname, '../public/icons')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512))
console.log('Icons generated.')
