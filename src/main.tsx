import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// PWA service worker (with self-heal: when a NEW worker takes control,
// reload once so a stale cached worker can never get stuck intercepting,
// e.g. the Google sign-in redirect).
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => reg.update().catch(() => {}))
      .catch(() => {});

    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      // only when an OLD worker is being replaced (skip first-ever install)
      if (reloaded || !hadController) return;
      reloaded = true;
      window.location.reload();
    });
  });
}
