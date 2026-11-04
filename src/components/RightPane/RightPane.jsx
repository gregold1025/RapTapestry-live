import React from "react";
import { useUIState } from "../../contexts/UIStateContext";
import ParamsPane from "../Panels/ParamsPane";
import QueriesView from "./QueriesView";
import "./RightPane.css";

/** The right pane: parameters (Global or a stem's panel) or the queries. */
export default function RightPane() {
  const { rightView } = useUIState();
  return rightView === "queries" ? <QueriesView /> : <ParamsPane />;
}
