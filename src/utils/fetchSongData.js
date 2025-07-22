export async function fetchSongData(songName) {
  const basePath = `/data/${songName}`;
  const audioPath = `${basePath}/audio`;
  const midiPath = `${basePath}/midi`;
  const transcriptionPath = `${basePath}/lyric-transcription.json`;

  // Categories to retrieve
  const stems = ["Vocals", "Bass", "Drums", "Other"];

  // Get transcription
  let transcriptionData = null;
  try {
    const res = await fetch(transcriptionPath);
    if (!res.ok) throw new Error("Lyric transcription not found");
    transcriptionData = await res.json();
  } catch (err) {
    console.error(`Error loading transcription for ${songName}:`, err);
  }

  // Get audio URLs (all assumed to exist)
  const audioFiles = {};
  for (let stem of stems) {
    audioFiles[stem.toLowerCase()] = `${audioPath}/${songName}_${stem}.mp3`;
  }

  // Try to load MIDI file for each stem
  const midiFiles = {};
  for (let stem of stems) {
    const url = `${midiPath}/${songName}_${stem}.mid`;
    try {
      const res = await fetch(url, { method: "HEAD" }); // check if exists
      if (res.ok) midiFiles[stem.toLowerCase()] = url;
    } catch (err) {
      console.warn(`MIDI file for ${stem} not found or unreadable: ${url}`);
    }
  }

  return {
    transcriptionData,
    audio: audioFiles,
    midi: midiFiles,
  };
}
