// src/contexts/undoable.js
// Wraps a reducer with an undo / redo history (Cmd-Z, Cmd-Shift-Z).
//   - actions that leave the state unchanged add nothing
//   - a new action after an undo drops the redo branch; the past is capped
//   - actions carrying the same `coalesce` key in a row replace one step
//     (a color drag is one undo)
//   - a change that `transientIf(prev, next)` accepts (e.g. focus only) is
//     applied without a history step
export const UNDO = "history/undo";
export const REDO = "history/redo";
// a session load: this present, with no past and no future (Greg 2026-11-09)
export const RESET = "history/reset";

export function undoable(reducer, initialPresent, { limit = 100, transientIf = null } = {}) {
  const initial = { past: [], present: initialPresent, future: [], canUndo: false, canRedo: false, lastKey: null };
  const wrap = (past, present, future, lastKey = null) => ({ past, present, future, canUndo: past.length > 0, canRedo: future.length > 0, lastKey });
  return function historyReducer(state = initial, action) {
    if (action.type === RESET) return wrap([], action.present, []);
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
    if (transientIf && transientIf(state.present, next)) return { ...state, present: next };
    if (action.coalesce && action.coalesce === state.lastKey) return wrap(state.past, next, [], action.coalesce);
    const past = [...state.past, state.present];
    if (past.length > limit) past.splice(0, past.length - limit);
    return wrap(past, next, [], action.coalesce ?? null);
  };
}
