// utils/fetchSongData.js
export async function fetchSongData(songName) {
  const basePath = `/data/${songName}`;
  const audioPath = `${basePath}/audio`;
  const midiPath = `${basePath}/midi`;
  const lyricTranscriptionPath = `${basePath}/lyric-transcription.json`;
  const drumTranscriptionPath = `${basePath}/drum-transcription.json`;
  const bassTranscriptionPath = `${basePath}/bass-transcription.json`;

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

  // --- JSON loads ---
  let lyricTranscription = null;
  try {
    const res = await fetch(lyricTranscriptionPath);
    if (!res.ok) throw new Error("Lyric transcription not found");
    lyricTranscription = await res.json();
  } catch (err) {
    console.error(`Error loading lyric transcription for ${songName}:`, err);
  }

  let drumTranscription = null;
  try {
    const res = await fetch(drumTranscriptionPath);
    if (res.ok) drumTranscription = await res.json();
    else console.warn(`No drum transcription found for ${songName}`);
  } catch (err) {
    console.warn(`Error loading drum transcription for ${songName}:`, err);
  }

  let bassTranscription = null;
  try {
    const res = await fetch(bassTranscriptionPath);
    if (res.ok) bassTranscription = await res.json();
    else console.warn(`No bass transcription found for ${songName}`);
  } catch (err) {
    console.warn(`Error loading bass transcription for ${songName}:`, err);
  }

  // --- Audio URLs (probe for an existing extension) ---
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

  // --- Duration from first available stem (prefer vocals, else any) ---
  const duration =
    (await computeDurationFrom(audioFiles.vocals)) ||
    (await (async () => {
      const any = Object.values(audioFiles)[0];
      return computeDurationFrom(any);
    })());

  return {
    lyricTranscription,
    audio: audioFiles,
    // midi: midiFiles, // (left commented as in your original)
    drumTranscription,
    bassTranscription,
    duration,
  };
}
