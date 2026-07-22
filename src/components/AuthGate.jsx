// AuthGate — puerta de autenticación del Centro de Mando gubernamental.
//
// Envuelve el tablero: solo deja pasar a usuarios AUTORIZADOS. No hay registro
// abierto — la cuenta «master» (masterEmail) es la única que da de alta a los
// demás desde la sección «Usuarios». Tras iniciar sesión con Firebase Auth se
// comprueba el allowlist (colección gov_users de Firestore, ver govUsers.js): si
// el correo no está autorizado, se cierra la sesión y se muestra un aviso.
//
// Si no hay proyecto Firebase (VITE_FIREBASE_*), cae a un modo demo local para
// poder probar el tablero sin backend de auth (sin gestión de usuarios).
//
// Expone `useAuth()` con { user, role, isMaster, signOut }.
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, firebaseEnabled } from "../lib/firebase.js";
import { resolveAccess } from "../lib/govUsers.js";

const AuthContext = createContext({ user: null, role: null, isMaster: false, signOut: () => {} });
export const useAuth = () => useContext(AuthContext);

const DEMO_KEY = "pls_gov_demo_session";

// Mensajes de error de Firebase → español legible.
function authErrorMessage(code) {
  const map = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/user-disabled": "Esta cuenta está deshabilitada.",
    "auth/user-not-found": "No existe una cuenta con este correo.",
    "auth/wrong-password": "Correo o contraseña incorrectos.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Ya existe una cuenta con este correo.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Inténtalo más tarde.",
    "auth/network-request-failed": "Error de red. Revisa tu conexión.",
  };
  return map[code] || "No se pudo completar la operación. Inténtalo de nuevo.";
}

const AUTH_STYLE = `
  .gauth-gate{position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;
    justify-content:center;padding:24px;background:var(--pls-bg);
    background-image:radial-gradient(1100px 560px at 15% -10%,rgba(95,183,230,.14),transparent 58%),
      radial-gradient(900px 520px at 108% 15%,rgba(255,90,54,.08),transparent 55%);overflow-y:auto}
  .gauth-card{width:100%;max-width:420px;background:var(--pls-bg-2);
    border:1px solid var(--pls-line);border-radius:var(--pls-r-3);
    box-shadow:0 24px 70px rgba(0,0,0,.5);padding:30px 30px 26px;margin:auto}
  .gauth-brand{display:flex;align-items:center;gap:11px;margin-bottom:8px}
  .gauth-brand-mark{display:grid;place-items:center;width:38px;height:38px;border-radius:11px;
    background:var(--pls-bg-3);color:var(--pls-cool);border:1px solid var(--pls-line)}
  .gauth-brand-name{font-family:var(--pls-display);font-size:19px;font-weight:700;letter-spacing:-.01em}
  .gauth-brand-tag{font-size:11px;color:var(--pls-fg-mute)}
  .gauth-org{font-size:10.5px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:var(--pls-fg-faint);margin:14px 0 4px}
  .gauth-title{font-family:var(--pls-display);font-size:23px;font-weight:700;line-height:1.15;
    letter-spacing:-.015em;margin:0 0 6px}
  .gauth-sub{font-size:12.5px;color:var(--pls-fg-mute);line-height:1.5;margin:0 0 20px}
  .gauth-field{margin-bottom:14px}
  .gauth-lbl{display:block;font-size:11px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;
    color:var(--pls-fg-mute);margin-bottom:7px}
  .gauth-input{width:100%;height:44px;padding:0 14px;border:1px solid var(--pls-line-2);
    border-radius:var(--pls-r-1);background:var(--pls-bg-3);color:var(--pls-fg);
    font:inherit;font-size:14.5px;outline:none}
  .gauth-input:focus{border-color:var(--pls-cool)}
  .gauth-input::placeholder{color:var(--pls-fg-faint)}
  .gauth-err{font-size:12.5px;color:var(--pls-danger);background:rgba(239,77,77,.1);
    border:1px solid rgba(239,77,77,.3);border-radius:var(--pls-r-1);padding:9px 12px;
    margin-bottom:14px;line-height:1.4}
  .gauth-cta{width:100%;height:46px;margin-top:4px;border:0;border-radius:var(--pls-r-1);
    background:var(--pls-cool);color:#06202e;font:inherit;font-size:15px;font-weight:600;
    cursor:pointer;transition:filter .12s,opacity .12s}
  .gauth-cta:hover:not(:disabled){filter:brightness(1.07)}
  .gauth-cta:disabled{opacity:.55;cursor:not-allowed}
  .gauth-switch{font-size:12.5px;color:var(--pls-fg-mute);text-align:center;margin:16px 0 0}
  .gauth-switch button{appearance:none;border:0;background:none;color:var(--pls-cool);
    font:inherit;font-weight:600;cursor:pointer;padding:0 2px}
  .gauth-foot{font-size:10.5px;color:var(--pls-fg-faint);text-align:center;margin:18px 0 0;
    line-height:1.5;border-top:1px solid var(--pls-line);padding-top:14px}
  .gauth-demo{font-size:11px;color:var(--pls-warn);text-align:center;margin:10px 0 0}
`;

function BrandMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <rect x="3" y="6" width="16" height="12" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <rect x="19" y="9" width="2.5" height="6" fill="currentColor" />
      <rect x="5.5" y="9" width="2" height="6" fill="currentColor" />
      <rect x="8.5" y="9" width="2" height="6" fill="currentColor" />
      <rect x="11.5" y="9" width="2" height="6" fill="currentColor" />
    </svg>
  );
}

function LoginForm({ onDemoSignIn, notice }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (firebaseEnabled) {
        const { signInWithEmailAndPassword } = await import("firebase/auth");
        await signInWithEmailAndPassword(auth, email.trim(), password);
        // onAuthStateChanged en AuthGate valida el allowlist y monta el tablero.
      } else {
        // Modo demo: sin proyecto Firebase, valida mínimamente y crea sesión local.
        if (!email.trim() || password.length < 6) throw { code: "auth/invalid-credential" };
        onDemoSignIn({ email: email.trim() });
      }
    } catch (err) {
      setError(authErrorMessage(err?.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gauth-gate">
      <style>{AUTH_STYLE}</style>
      <div className="gauth-card">
        <div className="gauth-brand">
          <span className="gauth-brand-mark" aria-hidden><BrandMark /></span>
          <div>
            <div className="gauth-brand-name">
              Pilas<span style={{ color: "var(--pls-accent)" }}>.</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: "var(--pls-fg-mute)", marginLeft: 7 }}>Gobierno</span>
            </div>
            <div className="gauth-brand-tag">Centro de Mando · Cali</div>
          </div>
        </div>

        <div className="gauth-org">Secretaría de Seguridad y Justicia</div>
        <h1 className="gauth-title">Acceso restringido</h1>
        <p className="gauth-sub">
          Inicia sesión con tu cuenta autorizada. El acceso lo otorga la
          administración del Centro de Mando; no hay registro público.
        </p>

        <form onSubmit={submit}>
          {notice && <div className="gauth-err" role="alert">{notice}</div>}
          {error && <div className="gauth-err" role="alert">{error}</div>}

          <div className="gauth-field">
            <label className="gauth-lbl" htmlFor="gauth-email">Correo institucional</label>
            <input id="gauth-email" className="gauth-input" type="email" autoComplete="email"
              placeholder="nombre@cali.gov.co" value={email}
              onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="gauth-field">
            <label className="gauth-lbl" htmlFor="gauth-pass">Contraseña</label>
            <input id="gauth-pass" className="gauth-input" type="password"
              autoComplete="current-password"
              placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6} />
          </div>

          <button className="gauth-cta" type="submit" disabled={busy}>
            {busy ? "Verificando…" : "Iniciar sesión"}
          </button>
        </form>

        {!firebaseEnabled && (
          <p className="gauth-demo">
            Modo demo · Firebase no configurado. Usa cualquier correo y una contraseña de 6+ caracteres.
          </p>
        )}

        <p className="gauth-foot">
          Alcaldía de Santiago de Cali · Este acceso queda registrado.
          ¿Eres ciudadano? <a href="ciudadano.html" style={{ color: "var(--pls-cool)" }}>Ir a la app ciudadana</a>
        </p>
      </div>
    </div>
  );
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);   // { email, uid, role } una vez autorizado
  const [ready, setReady] = useState(!firebaseEnabled); // en demo no hay que esperar a Firebase
  const [notice, setNotice] = useState("");  // aviso de «no autorizado» en el login

  // Firebase: escucha cambios de sesión y valida el allowlist tras autenticar.
  useEffect(() => {
    if (!firebaseEnabled) {
      try {
        const raw = sessionStorage.getItem(DEMO_KEY);
        if (raw) setUser(JSON.parse(raw));
      } catch { /* ignore */ }
      return;
    }
    let unsub = () => {};
    let alive = true;
    import("firebase/auth").then(({ onAuthStateChanged, signOut: fbSignOut }) => {
      unsub = onAuthStateChanged(auth, async (u) => {
        if (!u) { if (alive) { setUser(null); setReady(true); } return; }
        // Hay sesión de Firebase: ¿está el correo autorizado?
        try {
          const access = await resolveAccess({ uid: u.uid, email: u.email });
          if (!alive) return;
          if (access) {
            setNotice("");
            setUser(access);
          } else {
            // Autenticó pero no está en el allowlist: fuera.
            setNotice(`La cuenta ${u.email} no está autorizada. Pide acceso al administrador del Centro de Mando.`);
            await fbSignOut(auth).catch(() => {});
            setUser(null);
          }
        } catch {
          if (!alive) return;
          setNotice("No se pudo verificar tu acceso. Revisa la conexión o que Firestore esté configurado.");
          await fbSignOut(auth).catch(() => {});
          setUser(null);
        } finally {
          if (alive) setReady(true);
        }
      });
    });
    return () => { alive = false; unsub(); };
  }, []);

  const signOut = async () => {
    if (firebaseEnabled) {
      const { signOut: fbSignOut } = await import("firebase/auth");
      await fbSignOut(auth);
    } else {
      try { sessionStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
      setUser(null);
    }
  };

  const demoSignIn = (u) => {
    const demoUser = { ...u, role: "operador" };
    try { sessionStorage.setItem(DEMO_KEY, JSON.stringify(demoUser)); } catch { /* ignore */ }
    setUser(demoUser);
  };

  if (!ready) return null; // evita parpadeo del login mientras Firebase resuelve la sesión

  if (!user) return <LoginForm onDemoSignIn={demoSignIn} notice={notice} />;

  const isMaster = user.role === "master";
  return (
    <AuthContext.Provider value={{ user, role: user.role, isMaster, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
