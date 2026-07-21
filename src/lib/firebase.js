// Inicialización de Firebase para la autenticación del Centro de Mando.
//
// La configuración se lee de variables de entorno (VITE_FIREBASE_*), así el
// repositorio no lleva claves. Ver .env.example. Si no hay configuración
// (desarrollo/demo sin proyecto Firebase), `firebaseEnabled` es false y el
// AuthGate cae a un modo demo local — nunca deja el tablero sin protección,
// pero tampoco exige un proyecto real para poder probarlo.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Consideramos Firebase «configurado» solo si están los campos mínimos.
export const firebaseEnabled = Boolean(config.apiKey && config.authDomain && config.projectId);

let auth = null;
if (firebaseEnabled) {
  const app = initializeApp(config);
  auth = getAuth(app);
}

export { auth };
