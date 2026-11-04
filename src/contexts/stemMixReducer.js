// src/contexts/stemMixReducer.js
// Pure mute / solo / visible state for the four stems (rules carried over
// from the old channel strips: one solo at a time; muting anything while a
// solo is active cancels the solo; toggling the active solo unmutes all).

export const STEMS = ["vocals", "drums", "bass", "other"];

const allFalse = () => Object.fromEntries(STEMS.map((s) => [s, false]));
const allTrue = () => Object.fromEntries(STEMS.map((s) => [s, true]));

export const initialStemMix = {
  muted: allFalse(),
  soloed: null,
  visible: allTrue(),
};

export function stemMixReducer(state, action) {
  switch (action.type) {
    case "toggleMute": {
      const next = { ...state.muted, [action.stem]: !state.muted[action.stem] };
      // Any mute click while soloed cancels the solo.
      return { ...state, muted: next, soloed: null };
    }
    case "toggleSolo": {
      if (state.soloed === action.stem) {
        return { ...state, soloed: null, muted: allFalse() };
      }
      return { ...state, soloed: action.stem };
    }
    case "setVisible": {
      return { ...state, visible: { ...state.visible, [action.stem]: !!action.visible } };
    }
    default:
      return state;
  }
}

/** What each audio element should actually do right now. */
export function effectiveMutedOf(state) {
  const out = {};
  for (const s of STEMS) {
    out[s] = state.soloed ? s !== state.soloed : !!state.muted[s];
  }
  return out;
}
