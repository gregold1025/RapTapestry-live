// ScrubSlider.jsx
export function ScrubSlider({
  value,
  max,
  onChange,
  variant = "full", // "full" | "mini"
  className = "",
  ariaLabel = "Scrub",
}) {
  const handleChange = (e) => onChange(parseFloat(e.target.value));
  const cls =
    "scrub-slider " +
    (variant === "mini" ? "scrub-slider--mini " : "") +
    (className || "");

  return (
    <input
      className={cls.trim()}
      type="range"
      min="0"
      max={max}
      step="0.01"
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
    />
  );
}
