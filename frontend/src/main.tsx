import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css"
import "./utils/leafletSetup"; // Fix Leaflet icons


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
