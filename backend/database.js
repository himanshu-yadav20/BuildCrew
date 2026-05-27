const fs = require("fs");
const path = require("path");
const { createSeedData } = require("./seed");

const dataDir = path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "db.json");

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) writeDb(createSeedData());
}

function readDb() {
  ensureDatabase();
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(db) {
  fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`);
}

function updateDb(mutator) {
  const db = readDb();
  const result = mutator(db);
  writeDb(db);
  return result;
}

function nextId(db, key) {
  const value = db.counters[key] || 1;
  db.counters[key] = value + 1;
  return value;
}

module.exports = {
  dbPath,
  readDb,
  updateDb,
  nextId
};
