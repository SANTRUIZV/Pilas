// Gestión de usuarios del Centro de Mando.
//
// El acceso NO es abierto: solo entran los usuarios que figuran en la colección
// `gov_users` de Firestore (allowlist), más la cuenta «master» (masterEmail),
// que siempre tiene rol master aunque su documento aún no exista. La cuenta
// master es la única que puede dar de alta y baja usuarios, tanto desde la app
// como por las reglas de seguridad de Firestore (ver firestore.rules).
//
// Modelo del documento `gov_users/{uid}`:
//   { email, role: "master" | "operador", createdAt, createdBy }
//
// «Quitar» un usuario borra su documento del allowlist: aunque su cuenta de
// Firebase Auth siga existiendo, el login la rechaza al no estar en la lista.
import { auth, db, firebaseConfig, masterEmail } from "./firebase.js";

const COLLECTION = "gov_users";

export function isMasterEmail(email) {
  return !!email && !!masterEmail && email.trim().toLowerCase() === masterEmail;
}

// Lee el registro de acceso del usuario autenticado. { role, email, ... } o null.
async function fetchAccessRecord(uid) {
  const { doc, getDoc } = await import("firebase/firestore");
  const snap = await getDoc(doc(db, COLLECTION, uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
}

// Crea/actualiza el documento de la cuenta master (bootstrap del primer acceso).
async function ensureMasterRecord(user) {
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");
  await setDoc(
    doc(db, COLLECTION, user.uid),
    { email: user.email, role: "master", createdAt: serverTimestamp(), createdBy: "bootstrap" },
    { merge: true },
  );
}

// Resuelve el acceso de un usuario recién autenticado. Devuelve
// { uid, email, role } si está autorizado, o null si no lo está.
export async function resolveAccess(user) {
  // La cuenta master siempre entra; de paso se asegura su documento.
  if (isMasterEmail(user.email)) {
    try { await ensureMasterRecord(user); } catch { /* Firestore aún sin configurar: no bloquea al master */ }
    return { uid: user.uid, email: user.email, role: "master" };
  }
  // El resto debe estar en el allowlist.
  const rec = await fetchAccessRecord(user.uid);
  if (rec?.role) return { uid: user.uid, email: user.email, role: rec.role };
  return null;
}

// Lista todos los usuarios autorizados (solo la master puede leer la colección).
export async function listUsers() {
  const { collection, getDocs } = await import("firebase/firestore");
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => (a.role === "master" ? -1 : b.role === "master" ? 1 : 0)
      || String(a.email).localeCompare(String(b.email)));
}

// Da de alta un usuario SIN cerrar la sesión de la master. Truco: se crea la
// cuenta en una instancia secundaria de Firebase (createUser inicia sesión en
// esa app, no en la principal), y el documento del allowlist se escribe desde la
// sesión de la master para que pase las reglas de seguridad.
export async function addUser({ email, password, role = "operador" }) {
  const { initializeApp, deleteApp, getApp, getApps } = await import("firebase/app");
  const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");
  const { doc, setDoc, serverTimestamp } = await import("firebase/firestore");

  const NAME = "gov-user-provisioner";
  const existed = getApps().some(a => a.name === NAME);
  const secondary = existed ? getApp(NAME) : initializeApp(firebaseConfig, NAME);
  const secondaryAuth = getAuth(secondary);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const uid = cred.user.uid;
    await signOut(secondaryAuth);
    await setDoc(doc(db, COLLECTION, uid), {
      email: email.trim().toLowerCase(),
      role,
      createdAt: serverTimestamp(),
      createdBy: auth.currentUser?.email || "master",
    });
    return { uid, email: email.trim().toLowerCase(), role };
  } finally {
    if (!existed) await deleteApp(secondary).catch(() => {});
  }
}

// Revoca el acceso de un usuario (borra su documento del allowlist).
export async function removeUser(uid) {
  const { doc, deleteDoc } = await import("firebase/firestore");
  await deleteDoc(doc(db, COLLECTION, uid));
}
