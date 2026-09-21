/**
 * Workspace loading skeleton — §5: content-shaped, not a spinner.
 * Principle: Clarity — skeleton matches exact layout of the real content.
 */
export default function WorkspaceLoading() {
  return (
    <div className="flex-1 flex flex-col h-full" style={{ background: "var(--color-system-background)" }}>
      {/* Message skeletons */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="mx-auto"
          style={{
            maxWidth: "var(--conversation-max-width)",
            padding: "var(--space-8) var(--space-6)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            {/* Assistant messages — wider */}
            {[92, 70, 85, 55].map((w, i) => (
              <div
                key={i}
                className="flex gap-[var(--space-3)]"
                style={{
                  animation: `thinkingPulse 1.8s ease-in-out ${i * 150}ms infinite`,
                }}
              >
                {i % 2 === 0 && (
                  <div
                    style={{
                      height: "24px", width: "24px", borderRadius: "50%", flexShrink: 0,
                      marginTop: "4px",
                      background: "var(--color-tertiary-background)",
                    }}
                  />
                )}
                <div style={{ flex: 1, paddingTop: "4px" }}>
                  <div
                    style={{
                      height: "14px",
                      width: `${w}%`,
                      borderRadius: "var(--radius-pill)",
                      background: "var(--color-tertiary-background)",
                      marginBottom: "8px",
                    }}
                  />
                  {i % 2 === 0 && (
                    <div
                      style={{
                        height: "14px",
                        width: `${w - 15}%`,
                        borderRadius: "var(--radius-pill)",
                        background: "var(--color-secondary-background)",
                      }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input skeleton */}
      <div
        style={{
          flexShrink: 0,
          borderTop: "1px solid var(--color-separator)",
          background: "var(--color-system-background)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        <div
          style={{
            maxWidth: "var(--conversation-max-width)",
            margin: "0 auto",
            padding: "var(--space-4) var(--space-6)",
          }}
        >
          <div
            style={{
              height: "56px",
              borderRadius: "var(--radius-md)",
              background: "var(--color-secondary-background)",
              border: "1px solid var(--color-separator)",
              animation: "thinkingPulse 1.8s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}
