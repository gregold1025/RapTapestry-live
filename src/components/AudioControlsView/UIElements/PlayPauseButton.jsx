export function PlayPauseButton({ isPlaying, onClick }) {
  return (
    <button className="ac-btn playpause-btn" onClick={onClick}>
      {isPlaying ? "Pause" : "Play"}
    </button>
  );
}
