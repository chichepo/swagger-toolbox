
# 🛠️ Swagger Toolbox

This project provides a set of tools to analyze, validate, and link OpenAPI 3 (Swagger) specifications — especially when split across multiple files.

---

## 📁 Project Structure

```
swagger-toolbox/
├── data/                    # Contains OpenAPI 3 files (main + secondary)
│   ├── pet.json
│   ├── store.json
│   └── petStore.json
├── output/                 # Auto-generated outputs (CSV and JSON)
├── src/                    # Core logic and utilities
│   ├── SwaggerExtractor.js
│   ├── SwaggerLinker.js
│   ├── SwaggerPathExplorer.js
│   └── PreProcValidateDict.js
├── index.js                # CLI entry point
└── package.json
```

---

## 🚀 Available Commands

Run using:

```bash
node index.js <swagger-file> <action>
```

---

## 🔧 Actions

### 1. `extract`

Extract all endpoints (`method`, `path`, and `operationId`) into a CSV file.

```bash
node index.js ./data/pet.json extract
```

Output → `./output/pet-endpoints.csv`

---

### 2. `paths`

Extract all JSON-style property paths used in schemas, responses, and request bodies.

```bash
node index.js ./data/store.json paths
```

Output → `./output/store-property-paths.csv`

---

### 3. `link`

Add `x-mapper-host` references to schema properties in the **main Swagger file** by matching them to properties in `pet.json` and `store.json`.

```bash
node index.js ./data/petStore.json link
```

Output → `./output/petStore-linked.json`

---

### 4. `validate`

Validate that all `x-mapper-host` references in the **main Swagger file** point to valid properties in the secondary files.

```bash
node index.js ./data/petStore.json validate
```

✅ Prints a success message  
❌ Prints a table of invalid mappings

---

## 📦 Requirements

- Node.js v14+ installed
- Install dependencies (if needed):

```bash
npm install
```

---

## 📌 Notes

- Only OpenAPI 3.x JSON files are supported.
- Custom extensions like `x-mapper-host` and `servers.variables` are used for linking across files.

---

Happy Swaggering! 🎉
