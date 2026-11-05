// utils/fetchSongData.js
export async function fetchSongData(songName) {
  const basePath = `/data/${songName}`;
  const audioPath = `${basePath}/audio`;
  const lyricTranscriptionPath = `${basePath}/lyric-transcription.json`;
  const drumTranscriptionPath = `${basePath}/drum-transcription.json`;
  const bassTranscriptionPath = `${basePath}/bass-transcription.json`;
  // MFA-aligned + measured copy of the lyrics (timing + F0); optional.
  const measuredPath = `${basePath}/lyric-transcription.measured.json`;
  // the drum classifier's named hits (experiments/drums-01, mix input); optional.
  const drumClassesPath = `${basePath}/drum-classes.json`;

  // Stems we expect (keys will be lowercased in the return object)
  const stems = ["Vocals", "Bass", "Drums", "Other"];

  // Prefer WAV for Unemployed, otherwise MP3 first. Still try others as fallback.
  const preferredExts =
    songName === "Unemployed"
      ? ["wav", "mp3", "m4a", "ogg"]
      : ["mp3", "wav", "m4a", "ogg"];

  // --- helpers ---
  async function pickExistingUrl(baseNoExt, exts) {
    for (const ext of exts) {
      const url = `${baseNoExt}.${ext}`;
      try {
        // HEAD avoids downloading the whole file; works with most dev servers
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) return url;
      } catch (_) {
        // ignore and try next extension
      }
    }
    return null;
  }

  async function computeDurationFrom(url) {
    if (!url) return null;
    return await new Promise((resolve, reject) => {
      const a = new Audio(url);
      a.preload = "metadata";
      a.addEventListener("loadedmetadata", () => resolve(a.duration || null), {
        once: true,
      });
      a.addEventListener("error", () => resolve(null), { once: true });
    });
  }

  // --- JSON loads (all three in parallel) ---
  async function loadJson(url, label, { required = false } = {}) {
    try {
      const res = await fetch(url);
      if (res.ok) return await res.json();
      if (required) throw new Error(`${label} not found`);
      console.warn(`No ${label} found for ${songName}`);
    } catch (err) {
      if (required) console.error(`Error loading ${label} for ${songName}:`, err);
      else console.warn(`Error loading ${label} for ${songName}:`, err);
    }
    return null;
  }

  // --- Audio URLs (probe for an existing extension), then duration from
  // the first available stem (prefer vocals). Runs concurrently with JSON.
  async function loadAudio() {
    const audioFiles = {};
    await Promise.all(
      stems.map(async (stem) => {
        const base = `${audioPath}/${songName}_${stem}`;
        const url = await pickExistingUrl(base, preferredExts);
        if (url) {
          audioFiles[stem.toLowerCase()] = url;
        } else {
          console.warn(
            `[fetchSongData] Missing audio for ${songName} ${stem} at ${base}.( ${preferredExts.join(
              " | "
            )} )`
          );
        }
      })
    );
    const duration =
      (await computeDurationFrom(audioFiles.vocals)) ||
      (await computeDurationFrom(Object.values(audioFiles)[0]));
    return { audioFiles, duration };
  }

  const [lyricTranscription, drumTranscription, bassTranscription, measuredTranscription, drumClassesTranscription, { audioFiles, duration }] =
    await Promise.all([
      loadJson(lyricTranscriptionPath, "lyric transcription", { required: true }),
      loadJson(drumTranscriptionPath, "drum transcription"),
      loadJson(bassTranscriptionPath, "bass transcription"),
      loadJson(measuredPath, "measured lyric transcription"),
      loadJson(drumClassesPath, "drum classes"),
      loadAudio(),
    ]);

  return {
    song: songName,
    lyricTranscription,
    audio: audioFiles,
    // midi: midiFiles, // (left commented as in your original)
    drumTranscription,
    bassTranscription,
    measuredTranscription,
    drumClassesTranscription,
    duration,
  };
}
