# Planteamiento del problema

## Contexto

La inseguridad urbana en Santiago de Cali afecta decisiones cotidianas de
ciudadanos y turistas (por dónde caminar, a qué hora salir, dónde tomar
transporte) y la asignación de recursos de la Secretaría de Seguridad y
Justicia. Los datos de criminalidad existen y son públicos (datos.gov.co,
Alcaldía de Cali, Policía Nacional), pero llegan como archivos crudos que un
ciudadano no puede convertir en decisiones preventivas.

## Problema

**Los datos abiertos de seguridad de Cali no son accionables:** no responden,
en el momento y lugar donde se necesita, la pregunta "¿qué tan atento debo
estar aquí, a esta hora?" — ni para el ciudadano ni para el funcionario que
decide dónde reforzar patrullaje.

## Pregunta de investigación

> ¿Es posible estimar, a partir de datos abiertos históricos, el nivel de
> riesgo de hurto por **comuna y franja horaria** en Cali, con suficiente
> poder predictivo para orientar decisiones preventivas de ciudadanos y
> autoridades?

## Solución propuesta

**Pilas**: plataforma web que entrena un modelo de conteo (XGBoost Poisson)
sobre ~219k hurtos históricos (2010–2026) y sirve el riesgo estimado por
comuna × hora × día × mes en dos interfaces:

- **App ciudadana** — mapa de "nivel de atención" por zona y hora, ruta segura,
  recomendaciones preventivas y modo turista.
- **Dashboard gubernamental** — KPIs, alertas accionables y recomendación de
  patrullas para la Secretaría de Seguridad.

## Alcance y restricciones

- **Ciudad piloto:** Cali (22 comunas). El código evita lógica atada a Cali
  para poder escalar (criterio del concurso DATOS AL ECOSISTEMA 2026, MinTIC).
- **Granularidad espacial:** comuna (el salto a hexágonos H3 con datos
  georreferenciados finos queda como trabajo futuro).
- **Privacidad:** solo agregados por zona/franja; nunca datos de individuos.
- **Comunicación no estigmatizante:** la métrica se presenta como "nivel de
  atención" (metáfora de batería), no como peligrosidad de las personas de una
  comuna.

## Objetivos

| # | Objetivo | Métrica de éxito |
|---|----------|------------------|
| O1 | Estimar riesgo por zona y hora con datos abiertos reales | *Lift* sobre el baseline histórico (ROC-AUC, Precision@K) |
| O2 | Recomendaciones preventivas accionables | Cada alerta termina en una acción concreta |
| O3 | Visualización clara para ciudadano y funcionario | 2 interfaces validadas con usuarios |
| O4 | Explicabilidad y trazabilidad | SHAP + métricas y fuentes visibles en la UI |
| O5 | Escalabilidad a otras ciudades | Sin lógica *hardcoded* a Cali en el backend |
