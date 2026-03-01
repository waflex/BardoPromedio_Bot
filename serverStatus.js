const { exec } = require("child_process");
const util = require("util");
const execAsync = util.promisify(exec);

// ─── Definición de servicios a monitorear ───────────────────────────────────
// "systemd" es el nombre exacto del servicio en systemctl
// Si no usas systemd, cambia checkService() para usar el método que prefieras
const SERVICES = [
  {
    id: "minecraft",
    name: "Minecraft",
    emoji: "⛏️",
    systemd: "minecraft", // nombre en: systemctl status minecraft
  },
  {
    id: "zomboid",
    name: "Project Zomboid",
    emoji: "🧟",
    systemd: "zomboid",
  },
  {
    id: "foundry",
    name: "Foundry VTT",
    emoji: "🎲",
    systemd: "foundry",
  },
];

// Guarda el estado anterior para detectar reinicios
const previousStates = {};

/**
 * Consulta el estado de UN servicio vía systemctl.
 * Devuelve: { active: bool, startedAt: Date|null, error: string|null }
 */
async function checkService(svc) {
  try {
    // is-active devuelve "active" si está corriendo, otro valor si no
    const { stdout: activeOut } = await execAsync(
      `systemctl is-active ${svc.systemd}`
    );
    const active = activeOut.trim() === "active";

    let startedAt = null;
    if (active) {
      try {
        const { stdout: timeOut } = await execAsync(
          `systemctl show ${svc.systemd} --property=ActiveEnterTimestamp --value`
        );
        const parsed = new Date(timeOut.trim());
        if (!isNaN(parsed.getTime())) startedAt = parsed;
      } catch (_) {
        // Si no puede leer el timestamp, no pasa nada
      }
    }

    return { active, startedAt, error: null };
  } catch (err) {
    return { active: false, startedAt: null, error: err.message };
  }
}

/**
 * Detecta si el servicio se reinició comparando con el estado anterior.
 * Retorna true si hubo reinicio o si pasó de caído a activo.
 */
function wasRestarted(serviceId, currentState) {
  const prev = previousStates[serviceId];
  if (!prev) return false;

  // Pasó de inactivo a activo → inicio/reinicio
  if (!prev.active && currentState.active) return true;

  // Seguía activo pero el startedAt cambió → reinicio
  if (
    prev.active &&
    currentState.active &&
    prev.startedAt &&
    currentState.startedAt
  ) {
    return prev.startedAt.getTime() !== currentState.startedAt.getTime();
  }

  return false;
}

/**
 * Formatea la diferencia de tiempo como "3d 4h 12m"
 */
function formatUptime(startedAt) {
  if (!startedAt) return "—";
  const diff = Date.now() - startedAt.getTime();
  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

/**
 * Consulta todos los servicios y devuelve un array con su estado enriquecido.
 * También actualiza previousStates para la próxima llamada.
 */
async function getAllServiceStatuses() {
  const results = await Promise.all(
    SERVICES.map(async (svc) => {
      const state = await checkService(svc);
      const restarted = wasRestarted(svc.id, state);

      // Guardar como estado previo para la próxima iteración
      previousStates[svc.id] = {
        active: state.active,
        startedAt: state.startedAt,
      };

      return {
        ...svc,
        active: state.active,
        startedAt: state.startedAt,
        uptime: formatUptime(state.startedAt),
        restarted,
        error: state.error,
      };
    })
  );

  return results;
}

module.exports = { getAllServiceStatuses };
