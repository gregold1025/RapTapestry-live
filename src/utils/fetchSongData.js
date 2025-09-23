export async function fetchSongData(songName) {
  const basePath = `/data/${songName}`;
  const audioPath = `${basePath}/audio`;
  const midiPath = `${basePath}/midi`;
  const lyricTranscriptionPath = `${basePath}/lyric-transcription.json`;
  const drumTranscriptionPath = `${basePath}/drum-transcription.json`;
  const bassTranscriptionPath = `${basePath}/bass-transcription.json`;

  // Categories to retrieve
  const stems = ["Vocals", "Bass", "Drums", "Other"];

  // Get lyric transcription
  let lyricTranscription = null;
  try {
    const res = await fetch(lyricTranscriptionPath);
    if (!res.ok) throw new Error("Lyric transcription not found");
    lyricTranscription = await res.json();
  } catch (err) {
    console.error(`Error loading lyric transcription for ${songName}:`, err);
  }

  // Get drum transcription (optional)
  let drumTranscription = null;
  try {
    const res = await fetch(drumTranscriptionPath);
    if (res.ok) drumTranscription = await res.json();
    else console.warn(`No drum transcription found for ${songName}`);
  } catch (err) {
    console.warn(`Error loading drum transcription for ${songName}:`, err);
  }

  // Get bass transcription (optional)
  let bassTranscription = null;
  try {
    const res = await fetch(bassTranscriptionPath);
    if (res.ok) bassTranscription = await res.json();
    else console.warn(`No drum transcription found for ${songName}`);
  } catch (err) {
    console.warn(`Error loading drum transcription for ${songName}:`, err);
  }

  // Get audio URLs (all assumed to exist)
  const audioFiles = {};
  for (let stem of stems) {
    audioFiles[stem.toLowerCase()] = `${audioPath}/${songName}_${stem}.mp3`;
  }

  // // Try to load MIDI file for each stem
  // const midiFiles = {};
  // for (let stem of stems) {
  //   const url = `${midiPath}/${songName}_${stem}.mid`;
  //   try {
  //     const res = await fetch(url, { method: "HEAD" }); // check if exists
  //     if (res.ok) midiFiles[stem.toLowerCase()] = url;
  //   } catch (err) {
  //     console.warn(`MIDI file for ${stem} not found or unreadable: ${url}`);
  //   }
  // }

  // Compute song duration (using the Vocals stem)
  let duration = null;
  try {
    duration = await new Promise((resolve, reject) => {
      const audio = new Audio(audioFiles.vocals);
      audio.addEventListener("loadedmetadata", () => {
        resolve(audio.duration);
      });
      audio.addEventListener("error", reject);
    });
  } catch (err) {
    console.warn(`Unable to determine duration for ${songName}:`, err);
  }

  return {
    lyricTranscription,
    audio: audioFiles,
    // midi: midiFiles,
    drumTranscription,
    bassTranscription,
    duration, // float, no rounding
  };
}
