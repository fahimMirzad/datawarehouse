const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const router = express.Router();

const projectRoot = path.resolve(__dirname, "../..");
const statusFile = path.join(projectRoot, "etl", "etl-status.json");
let activeProcess = null;
let status = readSavedStatus();

function readSavedStatus() {
  try {
    return JSON.parse(fs.readFileSync(statusFile, "utf8"));
  } catch {
    return {
      runId: null, state: "idle", stage: "Not run yet", startedAt: null,
      finishedAt: null, durationMs: null, counts: {}, logs: [], error: null,
    };
  }
}
function saveStatus() {
  try { fs.writeFileSync(statusFile, JSON.stringify(status, null, 2)); }
  catch (error) { console.error("Could not persist ETL status:", error.message); }
}
function appendLog(line) {
  status.logs = [...(status.logs || []), { time: new Date().toISOString(), message: line }].slice(-150);
  saveStatus();
}

router.get("/status", (_req, res) => res.json(status));

router.post("/run", (_req, res) => {
  if (activeProcess) {
    return res.status(409).json({ message: "ETL is already running", status });
  }

  const startedAt = new Date().toISOString();
  status = {
    runId: `${Date.now()}`, state: "running", stage: "Starting ETL", startedAt,
    finishedAt: null, durationMs: null, counts: {}, logs: [], error: null,
  };
  appendLog("ETL run requested from dashboard.");

  const scriptPath = path.join(projectRoot, "etl", "run-etl.js");
  activeProcess = spawn(process.execPath, [scriptPath], {
    cwd: projectRoot,
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const consume = (chunk, streamName) => {
    const lines = chunk.toString().split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      appendLog(`${streamName === "stderr" ? "ERROR: " : ""}${line}`);
      const marker = line.match(/^\[ETL\]\s+([A-Z_]+)(?:\s+(.*))?$/);
      if (marker) {
        const [, event, details = ""] = marker;
        if (event === "STAGE") status.stage = details;
        else if (event === "EXTRACTED" || event === "TRANSFORMED" || event === "LOADED") {
          const [name, value] = details.split("=");
          if (name && value !== undefined) status.counts[`${event.toLowerCase()}_${name}`] = Number(value);
        } else if (event === "SUMMARY") {
          try { status.counts = { ...status.counts, ...JSON.parse(details) }; } catch { /* retain counts */ }
        }
        saveStatus();
      }
    }
  };
  activeProcess.stdout.on("data", chunk => consume(chunk, "stdout"));
  activeProcess.stderr.on("data", chunk => consume(chunk, "stderr"));
  activeProcess.on("error", error => {
    status.state = "failed"; status.error = error.message;
    status.stage = "Could not start ETL process"; status.finishedAt = new Date().toISOString();
    status.durationMs = new Date(status.finishedAt) - new Date(startedAt);
    appendLog(`Process error: ${error.message}`); activeProcess = null; saveStatus();
  });
  activeProcess.on("close", code => {
    status.state = code === 0 ? "success" : "failed";
    status.stage = code === 0 ? "ETL completed successfully" : "ETL failed";
    status.finishedAt = new Date().toISOString();
    status.durationMs = new Date(status.finishedAt) - new Date(startedAt);
    if (code !== 0 && !status.error) status.error = `ETL process exited with code ${code}`;
    appendLog(code === 0 ? "ETL process finished successfully." : `ETL process exited with code ${code}.`);
    activeProcess = null; saveStatus();
  });

  saveStatus();
  return res.status(202).json({ message: "ETL started", status });
});

module.exports = router;
