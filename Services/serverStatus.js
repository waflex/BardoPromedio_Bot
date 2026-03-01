const { exec } = require("child_process");
const util = require("util");
const net = require("net");
const dgram = require("dgram");
const http = require("http");

const execAsync = util.promisify(exec);

// ─── CONFIGURACIÓN DE SERVICIOS ───────────────────────────────────────────────
const SERVICES = [
  {
    id: "minecraft",
    name: "Minecraft",
    emoji: "⛏️",
    systemd: "minecraft",
    maxPlayers: 20,
    getPlayers: () => getMinecraftPlayers(),
  },
  {
    id: "zomboid",
    name: "Project Zomboid",
    emoji: "🧟",
    systemd: "zomboid",
    maxPlayers: 24,
    getPlayers: () => getZomboidPlayers(),
  },
  {
    id: "foundry",
    name: "Foundry VTT",
    emoji: "🎲",
    systemd: "foundry",
    maxPlayers: 10,
    getPlayers: () => getFoundryPlayers(),
  },
];

// ─── CREDENCIALES — configura estas en tu .env ────────────────────────────────
const MINECRAFT_RCON_HOST = process.env.MINECRAFT_RCON_HOST || "127.0.0.1";
const MINECRAFT_RCON_PORT = parseInt(process.env.MINECRAFT_RCON_PORT) || 25575;
const MINECRAFT_RCON_PASS = process.env.RCON_PASSWORD || "";

const ZOMBOID_QUERY_HOST = process.env.ZOMBOID_QUERY_HOST || "127.0.0.1";
const ZOMBOID_QUERY_PORT = parseInt(process.env.ZOMBOID_QUERY_PORT) || 16262;

const FOUNDRY_HOST = process.env.FOUNDRY_HOST || "127.0.0.1";
const FOUNDRY_PORT = parseInt(process.env.FOUNDRY_PORT) || 30000;

// ─── Estado previo para detectar reinicios ───────────────────────────────────
const previousStates = {};

// ═════════════════════════════════════════════════════════════════════════════
// MINECRAFT — RCON (protocolo TCP) prueba push
// ═════════════════════════════════════════════════════════════════════════════
function buildRconPacket(id, type, body) {
  const bodyBuf = Buffer.from(body + "\x00", "utf8");
  const length = 4 + 4 + bodyBuf.length + 1;
  const buf = Buffer.alloc(4 + length);
  buf.writeInt32LE(length, 0);
  buf.writeInt32LE(id, 4);
  buf.writeInt32LE(type, 8);
  bodyBuf.copy(buf, 12);
  buf[buf.length - 1] = 0x00;
  return buf;
}

function getMinecraftPlayers() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => { socket.destroy(); resolve(null); }, 5000);
    const socket = net.createConnection({ host: MINECRAFT_RCON_HOST, port: MINECRAFT_RCON_PORT });

    socket.on("connect", () => {
      socket.write(buildRconPacket(1, 3, MINECRAFT_RCON_PASS));
    });

    let authed = false;
    let buffer = Buffer.alloc(0);

    socket.on("data", (data) => {
      buffer = Buffer.concat([buffer, data]);
      while (buffer.length >= 14) {
        const length = buffer.readInt32LE(0);
        if (buffer.length < length + 4) break;
        const packetId = buffer.readInt32LE(4);
        const body = buffer.slice(12, length + 2).toString("utf8");
        buffer = buffer.slice(length + 4);

        if (!authed) {
          if (packetId === -1) { clearTimeout(timeout); socket.destroy(); return resolve(null); }
          authed = true;
          socket.write(buildRconPacket(2, 2, "list"));
        } else {
          clearTimeout(timeout);
          socket.destroy();
          // "There are X of a max of Y players online"
          const match = body.match(/There are (\d+) of a max(?: of)? (\d+)/i)
                     || body.match(/Hay (\d+) de un m[aá]ximo de (\d+)/i);
          resolve(match ? { current: parseInt(match[1]), max: parseInt(match[2]) } : null);
        }
      }
    });

    socket.on("error", () => { clearTimeout(timeout); resolve(null); });
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// PROJECT ZOMBOID — A2S_INFO UDP Query (puerto query = puerto juego + 1)
// ═════════════════════════════════════════════════════════════════════════════
function getZomboidPlayers() {
  return new Promise((resolve) => {
    const socket = dgram.createSocket("udp4");
    const timeout = setTimeout(() => { socket.close(); resolve(null); }, 5000);

    // Valve A2S_INFO packet
    const request = Buffer.from([
      0xff, 0xff, 0xff, 0xff, 0x54,
      0x53, 0x6f, 0x75, 0x72, 0x63, 0x65, 0x20, 0x45,
      0x6e, 0x67, 0x69, 0x6e, 0x65, 0x20, 0x51, 0x75,
      0x65, 0x72, 0x79, 0x00,
    ]);

    socket.on("message", (msg) => {
      clearTimeout(timeout);
      socket.close();
      try {
        // Respuesta tipo 0x49 = A2S_INFO
        if (msg[4] !== 0x49) return resolve(null);
        let offset = 6;
        // Saltar 4 strings: name, map, folder, game
        for (let i = 0; i < 4; i++) {
          while (offset < msg.length && msg[offset] !== 0x00) offset++;
          offset++;
        }
        offset += 2; // app id (short)
        resolve({ current: msg[offset], max: msg[offset + 1] });
      } catch (_) { resolve(null); }
    });

    socket.on("error", () => { clearTimeout(timeout); resolve(null); });
    socket.send(request, 0, request.length, ZOMBOID_QUERY_PORT, ZOMBOID_QUERY_HOST);
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// FOUNDRY VTT — Endpoint /api/status (público, no requiere auth)
// ═════════════════════════════════════════════════════════════════════════════
function getFoundryPlayers() {
  return new Promise((resolve) => {
    const req = http.request(
      { hostname: FOUNDRY_HOST, port: FOUNDRY_PORT, path: "/api/status", method: "GET", timeout: 5000 },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            // Foundry devuelve: { active, version, world, users }
            // "users" es el array de usuarios conectados
            const current = Array.isArray(json.users) ? json.users.length : (json.players ?? null);
            if (current === null) return resolve(null);
            resolve({ current, max: SERVICES.find(s => s.id === "foundry").maxPlayers });
          } catch (_) { resolve(null); }
        });
      }
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.end();
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// SYSTEMCTL — Estado del servicio
// ═════════════════════════════════════════════════════════════════════════════
async function checkService(svc) {
  try {
    const { stdout } = await execAsync(`systemctl is-active ${svc.systemd}`);
    const active = stdout.trim() === "active";
    let startedAt = null;
    if (active) {
      try {
        const { stdout: t } = await execAsync(
          `systemctl show ${svc.systemd} --property=ActiveEnterTimestamp --value`
        );
        const parsed = new Date(t.trim());
        if (!isNaN(parsed.getTime())) startedAt = parsed;
      } catch (_) {}
    }
    return { active, startedAt };
  } catch {
    return { active: false, startedAt: null };
  }
}

function wasRestarted(id, current) {
  const prev = previousStates[id];
  if (!prev) return false;
  if (!prev.active && current.active) return true;
  if (prev.active && current.active && prev.startedAt && current.startedAt)
    return prev.startedAt.getTime() !== current.startedAt.getTime();
  return false;
}

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

// ═════════════════════════════════════════════════════════════════════════════
// FUNCIÓN PRINCIPAL — exportada
// ═════════════════════════════════════════════════════════════════════════════
async function getAllServiceStatuses() {
  const results = await Promise.all(
    SERVICES.map(async (svc) => {
      const state = await checkService(svc);
      const restarted = wasRestarted(svc.id, state);
      previousStates[svc.id] = { active: state.active, startedAt: state.startedAt };

      let players = null;
      if (state.active) {
        try { players = await svc.getPlayers(); } catch (_) {}
      }

      return {
        ...svc,
        active: state.active,
        startedAt: state.startedAt,
        uptime: formatUptime(state.startedAt),
        restarted,
        players, // { current, max } o null
      };
    })
  );
  return results;
}

module.exports = { getAllServiceStatuses };