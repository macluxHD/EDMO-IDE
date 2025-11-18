import "./InfiniteLoopWarning.css";

interface InfiniteLoopWarningProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "iterations" | "timeout";
  iterationCount?: number;
}

export default function InfiniteLoopWarning({
  isOpen,
  onClose,
  reason,
  iterationCount,
}: InfiniteLoopWarningProps) {
  if (!isOpen) return null;

  const message =
    reason === "iterations"
      ? `Your code executed ${iterationCount?.toLocaleString()} loop iterations and was automatically stopped.`
      : "Your code ran for too long and was automatically stopped.";

  return (
    <div className="loop-modal-overlay" onClick={onClose}>
      <div className="loop-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="loop-modal-icon">⚠️</div>
        <h2 className="loop-modal-title">Infinite Loop Detected</h2>
        <p className="loop-modal-message">{message}</p>
        <p className="loop-modal-hint">
          This happens when you have a loop that never ends:
        </p>
        <pre className="loop-modal-code">
          <code>
{`repeat while true do
  set rotation of servo 0 to angle 90
end`}
          </code>
        </pre>
        <button className="loop-modal-btn" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

