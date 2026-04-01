import type { TraceRowViewModel } from '../../../../packages/ui-contracts/src/index'

type Props = {
  traces: TraceRowViewModel[]
}

function pct(value: number): string {
  return `${Math.round(value * 100)}%`
}

export default function TraceTimeline({ traces }: Props) {
  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ margin: '0 0 12px', fontSize: '1.125rem', color: '#111827' }}>
        Trace Timeline
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {traces.map((trace) => (
          <div
            key={trace.nodeId}
            style={{
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              padding: '12px 16px',
              backgroundColor: trace.success ? '#ffffff' : '#fff7f7',
              borderLeftWidth: '4px',
              borderLeftColor: trace.success ? '#16a34a' : '#dc2626',
            }}
          >
            {/* Top row: agentId + taskId + tick range */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: trace.failureReason ? '8px' : '0',
              }}
            >
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: '#111827',
                  }}
                >
                  {trace.agentId}
                </span>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    backgroundColor: '#f3f4f6',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {trace.taskId}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '0.8rem',
                  color: '#374151',
                }}
              >
                <span>
                  ticks{' '}
                  <strong>
                    {trace.startTick}–{trace.endTick}
                  </strong>
                </span>
                <span>
                  quality <strong>{pct(trace.quality)}</strong>
                </span>
                <span>
                  cost <strong>${trace.cost.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Failure badge */}
            {trace.failureReason && (
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: '4px',
                  marginTop: '4px',
                }}
              >
                FAILED: {trace.failureReason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
