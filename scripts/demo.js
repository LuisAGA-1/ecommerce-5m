#!/usr/bin/env node
// =========================================================
// DEMO CON UN SOLO COMANDO
//
//   npm run demo                  -> PostgreSQL + backend + frontend + n8n
//   npm run demo -- --sin-n8n     -> sin n8n
//   npm run demo -- --sin-navegador
//   npm run demo:detener          -> libera los puertos 3000, 5173 y 5678
//
// Ctrl+C apaga todo lo que este script levantó.
// Solo usa módulos de Node y dotenv (ya instalado).
// =========================================================
const { spawn, spawnSync } = require("child_process");
const net = require("net");
const path = require("path");
const fs = require("fs");

const RAIZ = path.resolve(__dirname, "..");
const ARGS = new Set(process.argv.slice(2));

// Entorno original de la terminal, ANTES de leer backend/.env.
// n8n debe arrancar con este entorno limpio: si recibe variables
// del backend como N8N_WEBHOOK_URL, las interpreta como su propia
// configuración y genera mal las URLs.
const ENTORNO_TERMINAL = { ...process.env };

require("dotenv").config({ path: path.join(RAIZ, "backend/.env"), quiet: true });

const PUERTO_BACK = Number(process.env.PORT || 3000);
const PUERTO_FRONT = 5173;
const PUERTO_N8N = 5678;
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = Number(process.env.DB_PORT || 5432);

const CON_N8N = !ARGS.has("--sin-n8n");
const ABRIR_NAVEGADOR = !ARGS.has("--sin-navegador");

// ---------------------------------------------------------
// Utilidades de consola
// ---------------------------------------------------------
const COLOR = { back: 36, front: 35, n8n: 33, demo: 32, error: 31, gris: 90 };
const pintar = (codigo, texto) => `\x1b[${codigo}m${texto}\x1b[0m`;
const log = (msg) => console.log(`${pintar(COLOR.demo, "[demo]")} ${msg}`);
const error = (msg) => console.error(`${pintar(COLOR.error, "[demo]")} ${msg}`);

function prefijar(etiqueta, color, flujo) {
  let resto = "";
  flujo.on("data", (trozo) => {
    resto += trozo.toString();
    const lineas = resto.split(/\r?\n/);
    resto = lineas.pop();
    for (const linea of lineas) {
      if (linea.trim()) console.log(`${pintar(color, `[${etiqueta}]`)} ${linea}`);
    }
  });
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------
// Red: ¿hay algo escuchando en host:puerto?
// ---------------------------------------------------------
function puertoAbierto(puerto, host = "127.0.0.1", timeout = 800) {
  return new Promise((resolve) => {
    const s = net.connect({ port: puerto, host });
    const fin = (ok) => { s.destroy(); resolve(ok); };
    s.setTimeout(timeout, () => fin(false));
    s.once("connect", () => fin(true));
    s.once("error", () => fin(false));
  });
}

async function respondeHttp(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return r.status < 500;
  } catch {
    return false;
  }
}

async function esperarHttp(nombre, url, segundos) {
  const limite = Date.now() + segundos * 1000;
  while (Date.now() < limite) {
    if (await respondeHttp(url)) return true;
    await esperar(1000);
  }
  error(`${nombre} no respondió en ${segundos} s (${url}). Revisa sus mensajes arriba.`);
  return false;
}

// ---------------------------------------------------------
// Liberar un puerto ocupado por un proceso viejo
// ---------------------------------------------------------
function liberarPuerto(puerto) {
  const r = spawnSync("fuser", ["-k", "-TERM", `${puerto}/tcp`], { stdio: "ignore" });
  if (r.error) {
    // Sin fuser: intentar con lsof
    const l = spawnSync("sh", ["-c", `lsof -ti tcp:${puerto} | xargs -r kill`], { stdio: "ignore" });
    return !l.error;
  }
  return true;
}

async function asegurarPuertoLibre(puerto, nombre) {
  if (!(await puertoAbierto(puerto))) return;
  log(`El puerto ${puerto} (${nombre}) está ocupado por un proceso anterior; cerrándolo…`);
  liberarPuerto(puerto);
  for (let i = 0; i < 10 && (await puertoAbierto(puerto)); i++) await esperar(500);
  if (await puertoAbierto(puerto)) {
    error(`No se pudo liberar el puerto ${puerto}. Ciérralo manualmente: sudo fuser -k ${puerto}/tcp`);
    process.exit(1);
  }
}

// ---------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------
async function asegurarPostgres() {
  if (await puertoAbierto(DB_PORT, DB_HOST === "localhost" ? "127.0.0.1" : DB_HOST)) {
    log(`PostgreSQL ya está activo en ${DB_HOST}:${DB_PORT}`);
    return;
  }
  log("PostgreSQL está apagado; iniciándolo (puede pedirte tu contraseña de sudo)…");
  const r = spawnSync("sudo", ["service", "postgresql", "start"], { stdio: "inherit" });
  if (r.status !== 0) {
    error("No se pudo iniciar PostgreSQL. Prueba manualmente: sudo service postgresql start");
    process.exit(1);
  }
  for (let i = 0; i < 20; i++) {
    if (await puertoAbierto(DB_PORT)) return log("PostgreSQL listo");
    await esperar(500);
  }
  error(`PostgreSQL no abrió el puerto ${DB_PORT}.`);
  process.exit(1);
}

// ---------------------------------------------------------
// Procesos hijos
// ---------------------------------------------------------
const hijos = [];

function lanzar(etiqueta, color, comando, args, opciones = {}) {
  const base = opciones.entornoLimpio ? ENTORNO_TERMINAL : process.env;
  const hijo = spawn(comando, args, {
    cwd: opciones.cwd || RAIZ,
    env: { ...base, FORCE_COLOR: "1", ...(opciones.env || {}) },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true // grupo propio para poder cerrarlo completo
  });
  prefijar(etiqueta, color, hijo.stdout);
  prefijar(etiqueta, color, hijo.stderr);
  hijo.on("exit", (codigo, senal) => {
    if (!apagando) {
      error(`${etiqueta} se detuvo (código ${codigo ?? senal}). Revisa los mensajes de arriba.`);
    }
  });
  hijo.on("error", (e) => error(`No se pudo ejecutar "${comando}": ${e.message}`));
  hijos.push(hijo);
  return hijo;
}

let apagando = false;

function apagarTodo(codigo = 0) {
  if (apagando) return;
  apagando = true;
  console.log("");
  log("Apagando backend, frontend y n8n…");
  for (const h of hijos) {
    try { process.kill(-h.pid, "SIGTERM"); } catch { /* ya terminó */ }
  }
  setTimeout(() => {
    for (const h of hijos) {
      try { process.kill(-h.pid, "SIGKILL"); } catch { /* ya terminó */ }
    }
    log("Listo. ¡Hasta la próxima demo!");
    process.exit(codigo);
  }, 2500);
}

process.on("SIGINT", () => apagarTodo(0));
process.on("SIGTERM", () => apagarTodo(0));

function abrirNavegador(url) {
  const esWsl = fs.existsSync("/proc/version") &&
    /microsoft/i.test(fs.readFileSync("/proc/version", "utf8"));
  const intentos = esWsl
    ? [["wslview", [url]], ["cmd.exe", ["/c", "start", "", url]], ["explorer.exe", [url]]]
    : process.platform === "darwin"
      ? [["open", [url]]]
      : [["xdg-open", [url]]];
  for (const [cmd, args] of intentos) {
    const r = spawnSync(cmd, args, { stdio: "ignore" });
    if (!r.error) return;
  }
}

// ---------------------------------------------------------
// Comprobaciones previas
// ---------------------------------------------------------
function comprobarInstalacion() {
  const faltan = [];
  if (!fs.existsSync(path.join(RAIZ, "node_modules"))) faltan.push("npm install");
  if (!fs.existsSync(path.join(RAIZ, "frontend/node_modules"))) faltan.push("cd frontend && npm install");
  if (!fs.existsSync(path.join(RAIZ, "backend/.env"))) faltan.push("cp .env.example backend/.env  (y llena tus datos)");
  if (faltan.length) {
    error("Antes de la demo ejecuta:");
    faltan.forEach((f) => console.error(`   ${f}`));
    process.exit(1);
  }
  const mayor = Number(process.versions.node.split(".")[0]);
  if (CON_N8N && mayor < 20) {
    error(`n8n necesita Node 20 o superior (tienes ${process.versions.node}). Usa: npm run demo -- --sin-n8n`);
    process.exit(1);
  }
}

// ---------------------------------------------------------
// Programa principal
// ---------------------------------------------------------
async function detener() {
  for (const [p, n] of [[PUERTO_BACK, "backend"], [PUERTO_FRONT, "frontend"], [PUERTO_N8N, "n8n"]]) {
    if (await puertoAbierto(p)) {
      liberarPuerto(p);
      log(`Puerto ${p} (${n}) liberado`);
    }
  }
  log("Todo detenido.");
}

async function main() {
  if (ARGS.has("--detener")) return detener();

  console.log(pintar(COLOR.demo, "\n=== E-commerce 5M · modo demo ===\n"));
  comprobarInstalacion();
  await asegurarPostgres();

  await asegurarPuertoLibre(PUERTO_BACK, "backend");
  await asegurarPuertoLibre(PUERTO_FRONT, "frontend");

  // n8n se reutiliza si ya está corriendo (por ejemplo, en Docker)
  let n8nExterno = false;
  if (CON_N8N && (await respondeHttp(`http://localhost:${PUERTO_N8N}/healthz`))) {
    n8nExterno = true;
    log(`n8n ya está corriendo en el puerto ${PUERTO_N8N}; se reutiliza.`);
  } else if (CON_N8N) {
    await asegurarPuertoLibre(PUERTO_N8N, "n8n");
  }

  log(`EMAIL_PROVIDER=${process.env.EMAIL_PROVIDER || "ethereal"} (desde backend/.env)`);

  lanzar("back", COLOR.back, process.execPath, ["backend/src/interfaces/server.js"]);
  lanzar("front", COLOR.front, "npm", ["run", "dev", "--", "--port", String(PUERTO_FRONT), "--strictPort"], {
    cwd: path.join(RAIZ, "frontend")
  });
  if (CON_N8N && !n8nExterno) {
    log("Iniciando n8n (la primera vez puede tardar varios minutos en descargarse)…");
    lanzar("n8n", COLOR.n8n, "npx", ["--yes", "n8n"], {
      entornoLimpio: true,
      env: { GENERIC_TIMEZONE: "America/Mexico_City", N8N_DIAGNOSTICS_ENABLED: "false" }
    });
  }

  const [okBack, okFront] = await Promise.all([
    esperarHttp("El backend", `http://localhost:${PUERTO_BACK}/`, 40),
    esperarHttp("El frontend", `http://localhost:${PUERTO_FRONT}/`, 60)
  ]);
  const okN8n = CON_N8N
    ? await esperarHttp("n8n", `http://localhost:${PUERTO_N8N}/healthz`, 300)
    : null;

  const estado = (ok) => (ok ? pintar(32, "✔ listo") : pintar(31, "✘ revisar"));
  console.log("");
  console.log(pintar(COLOR.demo, "┌──────────────────────────────────────────────────────────┐"));
  console.log(pintar(COLOR.demo, "│  E-commerce 5M listo para demostrar                      │"));
  console.log(pintar(COLOR.demo, "└──────────────────────────────────────────────────────────┘"));
  console.log(`  Tienda (frontend)   http://localhost:${PUERTO_FRONT}    ${estado(okFront)}`);
  console.log(`  API (backend)       http://localhost:${PUERTO_BACK}    ${estado(okBack)}`);
  if (CON_N8N) console.log(`  n8n                 http://localhost:${PUERTO_N8N}    ${estado(okN8n)}`);
  console.log(`  Correos de prueba   https://ethereal.email/messages`);
  console.log(pintar(COLOR.gris, "\n  Ctrl+C para apagar todo.\n"));

  if (ABRIR_NAVEGADOR && okFront) abrirNavegador(`http://localhost:${PUERTO_FRONT}`);
}

main().catch((e) => {
  error(e.stack || e.message);
  apagarTodo(1);
});
