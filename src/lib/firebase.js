// Inicialización de Firebase para la autenticación del Centro de Mando.
//
// La config web de Firebase (apiKey, authDomain, …) NO es secreta: está pensada
// para ir embebida en el cliente. La seguridad real la dan las reglas de
// Firebase y los «dominios autorizados» de Authentication, no ocultar la apiKey.
// Por eso va aquí como valor por defecto (proyecto «pilasdb»), y se puede
// sobreescribir con variables de entorno VITE_FIREBASE_* si hiciera falta.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env;

export const firebaseConfig = {
  apiKey:        env.VITE_FIREBASE_API_KEY        || "AIzaSyD2UH6KJoQEOEePZC6hGBqC4jvGYwWstTo",
  authDomain:    env.VITE_FIREBASE_AUTH_DOMAIN    || "pilasdb.firebaseapp.com",
  projectId:     env.VITE_FIREBASE_PROJECT_ID     || "pilasdb",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "pilasdb.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "456135647783",
  appId:         env.VITE_FIREBASE_APP_ID         || "1:456135647783:web:164e84d1775f96c59ee402",
};

// Correo de la cuenta «master»: siempre tiene rol master y puede dar de alta y
// baja al resto de usuarios. Configúralo con VITE_GOV_MASTER_EMAIL. El valor por
// defecto es el correo del responsable del proyecto; cámbialo por el de la
// persona que administrará el Centro de Mando. Debe coincidir con la regla de
// Firestore (ver firestore.rules).
export const masterEmail =
  (env.VITE_GOV_MASTER_EMAIL || "santruizv@gmail.com").trim().toLowerCase();

// Consideramos Firebase «configurado» solo si están los campos mínimos.
export const firebaseEnabled = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

let auth = null;
let db = null;
if (firebaseEnabled) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
