import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { pickAndUpload } from '../services/image.service'

/**
 * Attach a photograph, from the camera or the library.
 *
 * Deliberately no `capture` attribute on the input: with it, a phone goes
 * straight to the camera and the library becomes unreachable. Without it, both
 * iOS and Android offer the choice, which is what someone behind a bar needs —
 * sometimes the picture is being taken now, sometimes it was taken yesterday.
 */
export function ImagePicker({ value, onChange, className = '', label }) {
  const { t } = useTranslation()
  const inputRef = useRef(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(ev) {
    const file = ev.target.files?.[0]
    // Let the same file be chosen again after a failure.
    ev.target.value = ''
    if (!file) return

    setIsBusy(true)
    setError(null)
    try {
      const url = await pickAndUpload(file, t)
      onChange(url)
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || t('imageUploadFailed'))
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <div className={`image-picker ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />

      <div className="image-picker-actions">
        <button
          type="button"
          className="btn-shell"
          disabled={isBusy}
          onClick={() => inputRef.current?.click()}
        >
          {isBusy ? t('imageUploading') : (label || (value ? t('imageReplace') : t('imageAdd')))}
        </button>

        {value && !isBusy && (
          <button type="button" className="image-picker-clear" onClick={() => onChange('')}>
            {t('imageRemove')}
          </button>
        )}
      </div>

      {error && <p className="image-picker-error">{error}</p>}
    </div>
  )
}
