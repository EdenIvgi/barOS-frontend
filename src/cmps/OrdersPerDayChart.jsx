import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

const DAY = 24 * 60 * 60 * 1000

function dayKey(ts) {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Units ordered per day over a fixed window.
 *
 * One hue for every column: this is magnitude over time, not five identities.
 * The previous chart gave each supplier its own colour, which spent the only
 * free channel on information the column heights already carried and left a
 * five-swatch legend to decode.
 */
export function OrdersPerDayChart({ orders, days = 14 }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'he' ? 'he-IL' : 'en-GB'

  const data = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const buckets = new Map()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * DAY)
      buckets.set(dayKey(d), { date: d, units: 0, orders: 0 })
    }

    for (const order of orders || []) {
      if (!order?.createdAt) continue
      const key = dayKey(order.createdAt)
      const bucket = buckets.get(key)
      if (!bucket) continue
      bucket.orders += 1
      bucket.units += (order.items || []).reduce((sum, i) => sum + (Number(i.quantity) || 0), 0)
    }

    return [...buckets.values()]
  }, [orders, days])

  const max = Math.max(1, ...data.map(d => d.units))
  const total = data.reduce((sum, d) => sum + d.units, 0)

  return (
    <div className="opd">
      <div className="dash-card-head">
        <h3 className="dash-card-title">{t('unitsOrderedPerDay')}</h3>
        <span className="opd-total">{total} · {t('lastNDays', { n: days })}</span>
      </div>

      {total === 0 ? (
        <p className="dash-empty">{t('noOrders')}</p>
      ) : (
        <>
          <div className="opd-plot" role="img" aria-label={t('unitsOrderedPerDay')}>
            {data.map(d => {
              const label = d.date.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
              return (
                <div className="opd-col" key={dayKey(d.date)}>
                  <span className="opd-bar-wrap">
                    {d.units > 0 && <span className="opd-value">{d.units}</span>}
                    <span
                      className={'opd-bar' + (d.units === 0 ? ' is-empty' : '')}
                      style={{ height: `${(d.units / max) * 100}%` }}
                      title={`${label} · ${d.units}`}
                    />
                  </span>
                  <span className="opd-tick">{label}</span>
                </div>
              )
            })}
          </div>
          <p className="bar-legend">
            <span className="bar-swatch" aria-hidden="true" />
            {t('unitsOrdered')}
          </p>
        </>
      )}
    </div>
  )
}
