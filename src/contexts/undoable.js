// src/contexts/undoable.js
// Wraps a reducer with an undo / redo history (Cmd-Z, Cmd-Shift-Z). Actions
// that leave the state unchanged add nothing; a new action after an undo
// drops the redo branch; the past is capped.
export const UNDO = "history/undo";
export const REDO = "history/redo";

export function undoable(reducer, initialPresent, { limit = 100 } = {}) {
  const initial = { past: [], present: initialPresent, future: [], canUndo: false, canRedo: false };
  const wrap = (past, present, future) => ({ past, present, future, canUndo: past.length > 0, canRedo: future.length > 0 });
  return function historyReducer(state = initial, action) {
    if (action.type === UNDO) {
      if (!state.past.length) return state;
      const past = state.past.slice(0, -1);
      return wrap(past, state.past[state.past.length - 1], [state.present, ...state.future]);
    }
    if (action.type === REDO) {
      if (!state.future.length) return state;
      return wrap([...state.past, state.present], state.future[0], state.future.slice(1));
    }
    const next = reducer(state.present, action);
    if (next === state.present) return state;
    const past = [...state.past, state.present];
    if (past.length > limit) past.splice(0, past.length - limit);
    return wrap(past, next, []);
  };
}
