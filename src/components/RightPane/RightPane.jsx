import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import LyricsView from "../LyricsView";
import QueryListView from "./QueryListView";
import SingleQueryView from "./SingleQueryView";
import "./RightPane.css";

/** Exactly one of: lyrics, query list, single query (header right selector). */
export default function RightPane({ songKey }) {
  const { rightView } = useUIState();
  if (rightView === "queries") return <QueryListView />;
  if (rightView === "query") return <SingleQueryView />;
  return <LyricsView key={`lyrics-${songKey}`} height="100%" />;
}
