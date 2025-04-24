const fs = require('fs');
const path = require('path');

class SwaggerExtractor {
  constructor(swaggerJson) {
    this.swagger = swaggerJson;
  }

  extractEndpoints() {
    const rows = [["method", "path", "operationId"]];
    const paths = this.swagger.paths || {};

    for (const pathKey in paths) {
      const methods = paths[pathKey];
      for (const method in methods) {
        const operation = methods[method];
        const operationId = operation.operationId || "";
        rows.push([method.toUpperCase(), pathKey, operationId]);
      }
    }

    return rows;
  }

  saveToCsv(filePath) {
    const rows = this.extractEndpoints();
    const csvContent = rows.map(row => row.map(v => `"${v}"`).join(",")).join("\n");

    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, csvContent);
    console.log(`✅ Extracted ${rows.length - 1} endpoints to ${filePath}`);
  }
}

module.exports = SwaggerExtractor;
