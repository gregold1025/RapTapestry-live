// StopButton.jsx
export function StopButton({ onClick }) {
  return (
    <button
      className="ac-btn stop-btn"
      onClick={onClick}
      title="Stop"
      style={{
        width: "2em",
        height: "2em",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        borderRadius: "0.5em",
      }}
    >
      <svg
        width="80%"
        height="80%"
        viewBox="0 0 24 24"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <rect x="6" y="6" width="12" height="12" fill="currentColor" />
      </svg>
    </button>
  );
}
