// Catálogo de departamentos y ciudades para el selector de ubicación de la app
// ciudadana. Por ahora solo Valle del Cauca · Cali está habilitado; el resto se
// muestra como «Próximamente» para dejar claro que la cobertura crecerá sin
// prometer datos que aún no existen.
//
// `enabled: true` marca las combinaciones con datos y modelo disponibles. El
// selector deshabilita todo lo demás.

export const DEPARTAMENTOS = [
  {
    id: "valle-del-cauca",
    nombre: "Valle del Cauca",
    enabled: true,
    ciudades: [
      { id: "cali", nombre: "Santiago de Cali", enabled: true },
      { id: "palmira", nombre: "Palmira", enabled: false },
      { id: "buenaventura", nombre: "Buenaventura", enabled: false },
      { id: "tulua", nombre: "Tuluá", enabled: false },
    ],
  },
  {
    id: "cundinamarca",
    nombre: "Cundinamarca",
    enabled: false,
    ciudades: [
      { id: "bogota", nombre: "Bogotá D.C.", enabled: false },
      { id: "soacha", nombre: "Soacha", enabled: false },
    ],
  },
  {
    id: "antioquia",
    nombre: "Antioquia",
    enabled: false,
    ciudades: [
      { id: "medellin", nombre: "Medellín", enabled: false },
      { id: "bello", nombre: "Bello", enabled: false },
    ],
  },
  {
    id: "atlantico",
    nombre: "Atlántico",
    enabled: false,
    ciudades: [
      { id: "barranquilla", nombre: "Barranquilla", enabled: false },
    ],
  },
];

// Ubicación por defecto (única disponible hoy).
export const DEFAULT_LOCATION = { departamento: "valle-del-cauca", ciudad: "cali" };

export function findDepartamento(id) {
  return DEPARTAMENTOS.find(d => d.id === id) || null;
}

export function findCiudad(depId, ciudadId) {
  const dep = findDepartamento(depId);
  if (!dep) return null;
  return dep.ciudades.find(c => c.id === ciudadId) || null;
}

// Etiqueta legible «Ciudad, Departamento» a partir de una ubicación guardada.
export function locationLabel(loc) {
  if (!loc) return "";
  const dep = findDepartamento(loc.departamento);
  const ciu = findCiudad(loc.departamento, loc.ciudad);
  if (!dep || !ciu) return "";
  return `${ciu.nombre}, ${dep.nombre}`;
}
