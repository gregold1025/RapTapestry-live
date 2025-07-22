// src/components/AudioEngine/MuteButton.jsx
export function MuteButton({ isMuted, onClick }) {
  return (
    <button onClick={onClick}>
      {isMuted ? "Unmute Vocals" : "Mute Vocals"}
    </button>
  );
}
