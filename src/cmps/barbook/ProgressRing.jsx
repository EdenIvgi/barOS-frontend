/**
 * Completion as a ring with the count inside.
 *
 * A 26-item closing checklist needs an at-a-glance answer to "how much is left",
 * which a column of checkboxes does not give. The ring turns accent-coloured only
 * when everything is done, so "finished" reads differently from "nearly there".
 */
export function ProgressRing({ done, total, size = 44 }) {
  const pct = total > 0 ? done / total : 0
  const stroke = 4
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const complete = total > 0 && done === total

  return (
    <span
      className={'progress-ring' + (complete ? ' is-complete' : '')}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${done}/${total}`}
    >
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          className="ring-track"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className="ring-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          // Start at twelve o'clock rather than three.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="ring-label">{done}</span>
    </span>
  )
}
