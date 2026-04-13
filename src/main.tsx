import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { TauriBridgeBootstrap } from "@/bridge/tauri-bootstrap";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <TauriBridgeBootstrap />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
