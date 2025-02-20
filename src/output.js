const fs = require("fs");
const path = require("path");
const { config } = require("./config");

function saveToSQL(filename, data, tableName) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Data array must be a non-empty array.");
  }

  const columns = Object.keys(data[0]);
  const statements = [];

  for (let i = 0; i < data.length; i += config.BATCH_SIZE_INSERT_SQL) {
    const batchData = data.slice(i, i + config.BATCH_SIZE_INSERT_SQL);
    const valueSets = batchData.map((obj) => {
      const values = Object.values(obj).map((value) => {
        if (typeof value === "string") {
          return `'${value}'`;
        }
        return value;
      });
      return `(${values.join(", ")})\n`;
    });

    const sql = `INSERT INTO ${tableName} (${columns.join(
      ", "
    )})\n VALUES ${valueSets.join(", ")};`;
    statements.push(sql);
  }

  writeFile(filename, statements.join("\n"));
}

function saveSqlSchema(filename, sql) {
  writeFile(filename, sql);
}

function saveToCSV(filename, data) {
  const headers = Object.keys(data[0]);
  const filteredHeaders = headers.filter((header) => !header.startsWith("_"));
  const headerRow = filteredHeaders.join(",") + "\n";
  const dataRows = data
    .map((row) => filteredHeaders.map((header) => row[header]).join(","))
    .join("\n");
  const csv = headerRow + dataRows;
  writeFile(filename, csv);
}

function writeFile(filename, data) {
  const dir = path.dirname(filename);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filename, data);
}

module.exports = { saveToSQL, saveToCSV, saveSqlSchema };
