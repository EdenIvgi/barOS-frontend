import { httpService } from './http.service'
import { downscale } from './image.service'

// Smaller than a photo kept as a product picture: a label only has to be legible,
// and every pixel sent is billed. A thousand on the long edge reads a bottle label
// comfortably and costs about a third less than the size we store photos at.
const SCAN_EDGE = 1024

export const scanService = { scanProduct, SCAN_EDGE }

/**
 * Photograph a bottle, get back what it is.
 *
 * Returns the fields a product form asks for. Nothing is saved here and the
 * photograph is not kept: it goes out for identification and is dropped. What
 * comes back is a suggestion for someone to confirm.
 */
export async function scanProduct(file, categories = []) {
    if (!file) return null
    if (!file.type.startsWith('image/')) {
        const err = new Error('not an image')
        err.code = 'not_an_image'
        throw err
    }

    const dataUrl = await downscale(file, SCAN_EDGE)
    return httpService.post('scan/product', { data: dataUrl, categories })
}
