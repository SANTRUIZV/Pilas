// Inicialización de Firebase para la autenticación del Centro de Mando.
//
// La config web de Firebase (apiKey, authDomain, …) NO es secreta: está pensada
// para ir embebida en el cliente. La seguridad real la dan las reglas de
// Firebase y los «dominios autorizados» de Authentication, no ocultar la apiKey.
// Por eso va aquí como valor por defecto (proyecto «pilasdb»), y se puede
// sobreescribir con variables de entorno VITE_FIREBASE_* si hiciera falta.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const env = import.meta.env;
const config = {
  apiKey:        env.VITE_FIREBASE_API_KEY        || "AIzaSyD2UH6KJoQEOEePZC6hGBqC4jvGYwWstTo",
  authDomain:    env.VITE_FIREBASE_AUTH_DOMAIN    || "pilasdb.firebaseapp.com",
  projectId:     env.VITE_FIREBASE_PROJECT_ID     || "pilasdb",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "pilasdb.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "456135647783",
  appId:         env.VITE_FIREBASE_APP_ID         || "1:456135647783:web:164e84d1775f96c59ee402",
};

// Consideramos Firebase «configurado» solo si están los campos mínimos.
export const firebaseEnabled = Boolean(config.apiKey && config.authDomain && config.projectId);

let auth = null;
if (firebaseEnabled) {
  const app = initializeApp(config);
  auth = getAuth(app);
}

export { auth };
