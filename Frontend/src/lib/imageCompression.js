const defaultMaxBytes = 1800 * 1024
const defaultMaxWidth = 1600
const minimumQuality = 0.55

function canvasToBlob(canvas, quality) {
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    const url = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image could not be loaded.'))
    }
    image.src = url
  })
}

function compressedName(name) {
  const baseName = String(name || 'image').replace(/\.[^.]+$/, '')
  return `${baseName}.jpg`
}

export async function compressImageFile(file, options = {}) {
  if (!file?.type?.startsWith('image/')) {
    return file
  }

  const maxBytes = options.maxBytes || defaultMaxBytes
  const maxWidth = options.maxWidth || defaultMaxWidth

  if (file.size <= maxBytes) {
    return file
  }

  try {
    const image = await loadImage(file)
    let width = image.naturalWidth || image.width
    let height = image.naturalHeight || image.height
    const scale = Math.min(1, maxWidth / width)

    width = Math.max(1, Math.round(width * scale))
    height = Math.max(1, Math.round(height * scale))

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = width
    canvas.height = height
    context.drawImage(image, 0, 0, width, height)

    let quality = options.quality || 0.82
    let blob = await canvasToBlob(canvas, quality)

    while (blob && blob.size > maxBytes && quality > minimumQuality) {
      quality = Math.max(minimumQuality, quality - 0.08)
      blob = await canvasToBlob(canvas, quality)
    }

    if (!blob || blob.size >= file.size) {
      return file
    }

    return new File([blob], compressedName(file.name), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
