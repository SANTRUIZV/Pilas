// Proyección de violencia intrafamiliar (serie mensual MinDefensa · Cali).
//
// Modelo: regresión log-lineal  log(casos) = a + b·t + efecto_mes  ajustada por
// mínimos cuadrados sobre los últimos WINDOW meses (tendencia + estacionalidad).
// La banda del ~80 % sale de la desviación de los residuos del ajuste.
// No usa XGBoost: con ~245 puntos mensuales un modelo estacional simple es más
// estable. `backtest` mide el error real contra los meses ya observados.

export const WINDOW = 48;

// Resuelve el sistema normal (XᵀX + λI)w = Xᵀy por eliminación gaussiana.
function solve(X, y) {
  const n = X[0].length;
  const M = Array.from({ length: n }, () => Array(n).fill(0));
  const v = Array(n).fill(0);
  X.forEach((r, i) => {
    for (let p = 0; p < n; p++) {
      v[p] += r[p] * y[i];
      for (let q = 0; q < n; q++) M[p][q] += r[p] * r[q];
    }
  });
  for (let p = 0; p < n; p++) M[p][p] += 1e-6;
  for (let i = 0; i < n; i++) {
    let m = i;
    for (let r = i + 1; r < n; r++) if (Math.abs(M[r][i]) > Math.abs(M[m][i])) m = r;
    [M[i], M[m]] = [M[m], M[i]];
    [v[i], v[m]] = [v[m], v[i]];
    for (let r = i + 1; r < n; r++) {
      const f = M[r][i] / M[i][i];
      for (let c = i; c < n; c++) M[r][c] -= f * M[i][c];
      v[r] -= f * v[i];
    }
  }
  const w = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = v[i];
    for (let c = i + 1; c < n; c++) s -= M[i][c] * w[c];
    w[i] = s / M[i][i];
  }
  return w;
}

// Fila de variables: [1, t, feb..dic]; t en años relativos al origen (enero = base).
const row = (t, end, month) => {
  const r = Array(13).fill(0);
  r[0] = 1;
  r[1] = (t - end) / 12;
  if (month > 1) r[month] = 1;
  return r;
};

// Ajusta con los datos monthly[0..end) (monthly = [[año, mes, casos], …]).
function fit(monthly, end, window) {
  const start = Math.max(0, end - window);
  const X = [], y = [];
  for (let t = start; t < end; t++) {
    X.push(row(t, end, monthly[t][1]));
    y.push(Math.log(monthly[t][2]));
  }
  const w = solve(X, y);
  const dot = (r) => r.reduce((s, x, j) => s + x * w[j], 0);
  const sse = X.reduce((s, r, i) => s + (y[i] - dot(r)) ** 2, 0);
  const sd = Math.sqrt(sse / Math.max(1, X.length - 13));
  return { sd, at: (t, month) => Math.exp(dot(row(t, end, month))) };
}

// Proyecta `horizon` meses después del último dato. Z=1.28 → banda ~80 %.
export function forecastVif(monthly, horizon = 12, window = WINDOW) {
  const end = monthly.length;
  const f = fit(monthly, end, window);
  let [y, m] = monthly[end - 1];
  const out = [];
  for (let h = 0; h < horizon; h++) {
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    const mean = f.at(end + h, m);
    out.push({ year: y, month: m, mean, lo: mean * Math.exp(-1.28 * f.sd), hi: mean * Math.exp(1.28 * f.sd) });
  }
  return { points: out, sd: f.sd };
}

// Backtest: predice los últimos 12 meses con datos previos, y también con un
// origen 6 meses antes. Compara el error (MAPE) con «mismo mes del año pasado».
export function backtest(monthly, window = WINDOW) {
  const N = monthly.length;
  const e = [], naive = [];
  for (const end of [N - 18, N - 12]) {
    const f = fit(monthly, end, window);
    for (let t = end; t < Math.min(end + 12, N); t++) {
      const real = monthly[t][2];
      e.push(Math.abs(f.at(t, monthly[t][1]) - real) / real);
      naive.push(Math.abs(monthly[t - 12][2] - real) / real);
    }
  }
  const mean = (a) => (a.reduce((s, x) => s + x, 0) / a.length) * 100;
  return { mape: mean(e), mapeNaive: mean(naive), n: e.length };
}
