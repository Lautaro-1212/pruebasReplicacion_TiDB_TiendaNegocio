import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../config/.env")
});

const app = express();
const PORT = process.env.API_PORT || 3010;

app.use(express.json());
const nodosTiKV = [];

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "TiKV API funcionando"
  });
});

// Registrar nodo TiKV

app.post("/api/tikv/register", (req, res) => {

  const {
    hostname,
    ip,
    tikv_port,
    status_port,
    version
  } = req.body;

  // Validar datos obligatorios

  if (!hostname || !ip || !tikv_port || !status_port || !version) {
    return res.status(400).json({
      success: false,
      message: "Faltan datos del nodo TiKV"
    });
  }

  const nodoExistente = nodosTiKV.find(nodo => nodo.hostname === hostname);

  if (nodoExistente) {
    nodoExistente.ip = ip;
    nodoExistente.tikv_port = tikv_port;
    nodoExistente.status_port = status_port;
    nodoExistente.version = version;
  } else {
    nodosTiKV.push({
      hostname,
      ip,
      tikv_port,
      status_port,
      version
    });
  }

  // Mostrar información recibida

  console.log("Nuevo nodo TiKV:");
  console.log({
    hostname,
    ip,
    tikv_port,
    status_port,
    version
  });

  // Configuración del cluster

  const pdHost = process.env.HOST_IP;
  const pdPort = process.env.PD_PORT;

  // Respuesta

  res.json({
    success: true,

    cluster: {
      pd: `${pdHost}:${pdPort}`
    },

    node: {
      address: `${ip}:${tikv_port}`,
      status_address: `${ip}:${status_port}`
    }
  });
});

app.get("/api/tikv/status", (req, res) => {
  res.json({
    success: true,
    nodes: nodosTiKV
  });
});

app.get("/api/tikv/targets", async (req, res) => {
  try {
    const pdHost = process.env.HOST_IP;
    const pdPort = process.env.PD_PORT;

    const response = await fetch(
      `http://${pdHost}:${pdPort}/pd/api/v1/stores`
    );

    if (!response.ok) {
      throw new Error(`PD respondió con HTTP ${response.status}`);
    }

    const data = await response.json();

    const targets = data.stores
      .filter(store => store.store.state_name === "Up")
      .filter(store => !store.store.status_address.startsWith(`${pdHost}:`))
      .map(store => ({
        targets: [
          store.store.status_address
        ],
        labels: {
          version: store.store.version
        }
      }));

    res.json(targets);

  } catch (error) {
    console.error("Error consultando PD:", error);

    res.status(500).json({
      success: false,
      message: "No se pudo obtener información de PD"
    });
  }
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});