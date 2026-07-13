# Conclusiones

## Hallazgos

- **Los datos abiertos de Cali sí soportan un modelo de riesgo útil.** Con
  ~219k hurtos históricos (2010–2026) agregados a una malla comuna × hora ×
  día × mes, un XGBoost Poisson con split temporal (entrena 2010–2017, valida
  2018) alcanza **ROC-AUC ≈ 0.73** para identificar celdas de alto riesgo y
  **Precision@K ≈ 0.41** — un *lift* claro sobre el baseline histórico.
- **El patrón espacio-temporal es fuerte y estable:** el riesgo varía más por
  hora y día de la semana que por mes; las noches de viernes y sábado
  concentran los picos, con diferencias marcadas entre comunas.
- **Pocas features bien elegidas bastan:** comuna, hora (codificada
  circularmente), día de semana, fin de semana, mes y festivo explican la
  mayor parte de la señal (verificado con SHAP).
- **La degradación elegante funciona:** la plataforma opera con modelo, sin
  modelo (fórmula analítica) y sin backend (datos estáticos), lo que facilitó
  desarrollar frontend y modelo en paralelo.

## Limitaciones

- **Granularidad espacial a nivel de comuna.** Sin georreferenciación fina de
  los incidentes no es posible bajar a hexágonos H3 o barrios en el modelo (el
  mapa sí muestra barrios con su histórico).
- **Solo hurtos.** La base consolidada de la Alcaldía es de hurtos; homicidios
  y lesiones (SIJIN / Medicina Legal) tienen la integración lista pero aún no
  hay acceso a las bases.
- **Sesgo de denuncia:** los datos reflejan denuncias, no criminalidad total; el
  subregistro puede variar por comuna y estrato.
- **Sin variables de contexto dinámico** (clima histórico, eventos masivos,
  alumbrado), que probablemente mejorarían el modelo.
- **Validación con usuarios pendiente:** las entrevistas con ciudadanos,
  turistas y funcionarios (Fase 4 del plan) aún no se realizan.

## Próximos pasos

1. Conseguir las bases de SIJIN / Medicina Legal y activar `/crimes/external`.
2. Georreferenciación fina → malla de hexágonos **H3** y features espaciales
   (distancia a CAI, alumbrado, densidad poblacional).
3. Variables exógenas: clima histórico, festivos especiales, eventos.
4. Versionado de experimentos con **MLflow** y re-entrenamiento programado.
5. Validación con usuarios (5–10 entrevistas variando edad, comuna y género;
   piloto con turistas; sesión con la Secretaría de Seguridad).
6. PWA offline y migración del mapa a MapLibre + deck.gl para escala real.
