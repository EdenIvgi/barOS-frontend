import { useTranslation } from 'react-i18next'
import { InlineText } from './InlineText.jsx'
import { ImagePicker } from '../ImagePicker.jsx'

/**
 * Reference photos: what the display should look like, how a garnish is cut, how
 * a plate goes out. A standard is easier to hold to when you can see it.
 *
 * A photo can be taken on the spot, chosen from the library, or given as an
 * address if it is already hosted somewhere. The address field stays because
 * linking an existing picture is still worth doing.
 */
export function GalleryView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const photos = page.photos || []

  function setPhotos(next) {
    onPageChange({ ...page, photos: next })
  }

  function updatePhoto(index, patch) {
    setPhotos(photos.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  return (
    <div className="bb-gallery">
      {photos.length === 0 && !isAdmin && <p className="dash-empty">{t('noPhotos')}</p>}

      {photos.map((photo, index) => (
        <figure className="bb-photo" key={index}>
          {photo.imageUrl ? (
            <img src={photo.imageUrl} alt={photo.caption ? undefined : ''} loading="lazy" />
          ) : (
            <div className="bb-photo-empty" aria-hidden="true" />
          )}

          <figcaption>
            <InlineText
              value={photo.caption}
              lang={lang}
              isAdmin={isAdmin}
              placeholder={t('photoCaption')}
              onCommit={caption => updatePhoto(index, { caption })}
            />
            {isAdmin && (
              <>
                <ImagePicker
                  value={photo.imageUrl}
                  onChange={imageUrl => updatePhoto(index, { imageUrl })}
                />
                <InlineText
                  value={photo.imageUrl}
                  lang={lang}
                  isAdmin={isAdmin}
                  raw
                  className="bb-photo-url"
                  placeholder={t('photoUrl')}
                  onCommit={imageUrl => updatePhoto(index, { imageUrl })}
                />
              </>
            )}
          </figcaption>

          {isAdmin && (
            <button
              type="button"
              className="bb-row-remove"
              aria-label={t('delete')}
              onClick={() => setPhotos(photos.filter((_, i) => i !== index))}
            >
              ×
            </button>
          )}
        </figure>
      ))}

      {isAdmin && (
        <button
          type="button"
          className="btn-add-item"
          onClick={() => setPhotos([...photos, { imageUrl: '', caption: '' }])}
        >
          + {t('addPhoto')}
        </button>
      )}
    </div>
  )
}
