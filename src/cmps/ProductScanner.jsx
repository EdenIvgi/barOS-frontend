import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { scanProduct } from '../services/scan.service'

/**
 * Photograph a bottle and let the form fill itself in.
 *
 * What comes back is filled into the fields, not saved: identification is a
 * guess, and the person photographing the shelf is the one who knows whether it
 * is right. A low-confidence reading says so rather than looking as certain as
 * any other.
 *
 * Like the photo picker, no `capture` attribute: both the camera and the
 * library stay reachable, because the bottle is sometimes in front of you and
 * sometimes in a picture you already took.
 */
export function ProductScanner({ categories = [], onScanned }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confidence, setConfidence] = useState(null)

  async function handleFile(ev) {
    const file = ev.target.files?.[0]
    // Let the same photo be chosen again after a failure.
    ev.target.value = ''
    if (!file) return

    setIsBusy(true)
    setError(null)
    setConfidence(null)
    try {
      const product = await scanProduct(file, categories)
      setConfidence(product?.confidence || null)
      onScanned(toFormPatch(product))
    } catch (err) {
      setError(messageFor(err, t))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className="product-scanner">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <button
        type="button"
        className="btn-shell product-scanner-btn"
        disabled={isBusy}
        onClick={() => inputRef.current?.click()}
      >
        {isBusy ? t('scanScanning') : t('scanProduct')}
      </button>

      <p className="product-scanner-hint">{t('scanHint')}</p>

      {error && <p className="product-scanner-error">{error}</p>}
      {!error && confidence === 'low' && (
        <p className="product-scanner-warning">{t('scanLowConfidence')}</p>
      )}
      {!error && confidence && confidence !== 'low' && (
        <p className="product-scanner-ok">{t('scanFilled')}</p>
      )}
    </div>
  )
}

/** Only the fields that came back with something — a blank must not wipe a field. */
function toFormPatch(product) {
  const patch = {}
  if (product?.name) patch.name = product.name
  if (product?.nameEn) patch.nameEn = product.nameEn
  if (product?.categoryLabel) patch.categoryId = product.categoryLabel
  if (product?.volumeMl) patch.volumeMl = product.volumeMl
  return patch
}

function messageFor(err, t) {
  const status = err?.response?.status
  if (err?.response?.data?.code === 'not_a_drink' || status === 422) return t('scanNotADrink')
  if (status === 503) return t('scanNotConfigured')
  if (status === 429) return t('scanTooMany')
  if (err?.code === 'not_an_image') return t('imageNotAnImage')
  return err?.response?.data?.error || t('scanFailed')
}
