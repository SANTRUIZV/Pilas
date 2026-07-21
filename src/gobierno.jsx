import React from "react";
import { createRoot } from "react-dom/client";
import App from "./pages/Dashboard.jsx";
import AuthGate from "./components/AuthGate.jsx";
import "./styles/styles.css";
import "./styles/dashboard.css";

// El Centro de Mando exige inicio de sesión: AuthGate envuelve el tablero y
// solo lo monta tras autenticar (Firebase Auth, o modo demo si no hay proyecto).
createRoot(document.getElementById("root")).render(
  <AuthGate>
    <App />
  </AuthGate>
);
