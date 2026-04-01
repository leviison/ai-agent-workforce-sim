import { businessLaunchRules } from '../../../packages/simulation-facade/src/index'

type Props = {
  insights: string[]
}

const BORDER_COLOR: Record<string, string> = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
}

export default function CoachingInsightsPanel({ insights }: Props) {
  if (insights.length === 0) {
    return (
      <section>
        <h3
          style={{
            margin: '0 0 12px',
            fontSize: '1rem',
            color: '#111827',
          }}
        >
          Coaching Insights
        </h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#6b7280' }}>
          No coaching alerts for this run.
        </p>
      </section>
    )
  }

  return (
    <section>
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: '1rem',
          color: '#111827',
        }}
      >
        Coaching Insights
      </h3>

      {insights.map((insight, i) => {
        const rule = businessLaunchRules.find((r) => r.insightText === insight)
        const severity = rule?.severity ?? 'info'
        const borderColor = BORDER_COLOR[severity] ?? BORDER_COLOR.info

        return (
          <div
            key={i}
            style={{
              borderLeft: `4px solid ${borderColor}`,
              padding: '10px 14px',
              background: '#ffffff',
              borderRadius: '6px',
              marginBottom: '8px',
            }}
          >
            <span
              style={{
                color: '#374151',
                fontSize: '0.875rem',
              }}
            >
              {insight}
            </span>
          </div>
        )
      })}
    </section>
  )
}
