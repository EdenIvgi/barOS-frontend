import { httpService } from './http.service'

const MAX_EDGE = 1280
const QUALITY = 0.82
const MAX_UPLOAD_BYTES = 3 * 1024 * 1024

export const imageService = {
  pickAndUpload,
  downscale,
  upload,
  MAX_EDGE,
}

/**
 * Shrinks a photo before it ever leaves the phone.
 *
 * A picture straight from a camera is several megabytes; stored at that size a
 * few hundred of them would fill the database the app runs on, and every page
 * that shows one would drag it down a mobile connection. Twelve-eighty on the
 * long edge is enough to tell one bottle from another, which is what these are
 * for.
 *
 * Always re-encodes as JPEG, which also converts the HEIC an iPhone produces
 * into something every browser can draw.
 */
export async function downscale(file, maxEdge = MAX_EDGE) {
  const bitmap = await loadBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()

  return canvas.toDataURL('image/jpeg', QUALITY)
}

function loadBitmap(file) {
  // createImageBitmap handles orientation and is far cheaper, but Safari did not
  // support it for a long time, so an <img> remains the fallback.
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(file).catch(() => loadViaImgElement(file))
  }
  return loadViaImgElement(file)
}

function loadViaImgElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('unreadable image'))
    }
    img.src = url
  })
}

async function upload(dataUrl) {
  const res = await httpService.post('image', { data: dataUrl })
  return res.url
}

/**
 * The whole journey for one chosen file: check it, shrink it, send it.
 * Returns the URL to store, or throws with a message worth showing.
 */
export async function pickAndUpload(file, t) {
  if (!file) return null
  // Anything the browser can draw is fine, because it is re-encoded as JPEG on
  // the way out — which is also how an iPhone's HEIC becomes viewable.
  if (!file.type.startsWith('image/')) {
    throw new Error(t('imageNotAnImage'))
  }

  const dataUrl = await downscale(file)

  // Base64 inflates by about a third; this is the server's own ceiling checked
  // early so a doomed upload does not travel first.
  const approxBytes = Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75)
  if (approxBytes > MAX_UPLOAD_BYTES) {
    throw new Error(t('imageTooLarge'))
  }

  return upload(dataUrl)
}
