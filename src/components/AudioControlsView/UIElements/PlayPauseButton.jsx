// PlayPauseButton.jsx
export function PlayPauseButton({ isPlaying, onClick }) {
  return (
    <button
      className="ac-btn playpause-btn"
      onClick={onClick}
      title="Play/Pause"
      style={{
        width: "8rem",
        height: "8rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        borderRadius: "0.5rem",
      }}
    >
      {isPlaying ? (
        <svg
          width="80%"
          height="80%"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ display: "block" }}
        >
          <rect x="5" y="4" width="4" height="16" fill="currentColor" />
          <rect x="15" y="4" width="4" height="16" fill="currentColor" />
        </svg>
      ) : (
        <svg
          width="80%"
          height="80%"
          viewBox="0 0 24 24"
          aria-hidden="true"
          style={{ display: "block" }}
        >
          <polygon points="6,4 20,12 6,20" fill="currentColor" />
        </svg>
      )}
    </button>
  );
}
