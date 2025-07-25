import React from "react";
import ReactDOM from "react-dom/client";
import App from "./src/App";
import "./src/index.css";
import { Buffer } from 'buffer';
// @ts-ignore
window.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
