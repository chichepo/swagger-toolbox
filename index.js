
const path = require('path');
const fs = require('fs');
const SwaggerExtractor = require('./src/SwaggerExtractor');
const SwaggerPathExplorer = require('./src/SwaggerPathExplorer');
const SwaggerLinker = require('./src/SwaggerLinker');
const PreProcValidateDict = require('./src/PreProcValidateDict');

async function main() {
  const inputPath = process.argv[2];
  const action = process.argv[3]; // 'extract' | 'paths' | 'link' | 'validate'

  if (!inputPath || !action) {
    console.error("❌ Usage: node index.js <swagger-file.json> <extract|paths|link|validate>");
    process.exit(1);
  }

  let swagger;
  try {
    swagger = require(path.resolve(inputPath));
  } catch (err) {
    console.error(`❌ Failed to load Swagger file: ${err.message}`);
    process.exit(1);
  }

  const fileTag = path.basename(inputPath, ".json");

  if (action === "extract") {
    const extractor = new SwaggerExtractor(swagger);
    const output = path.join(__dirname, 'output', `${fileTag}-endpoints.csv`);
    extractor.saveToCsv(output);

  } else if (action === "paths") {
    const explorer = new SwaggerPathExplorer(swagger, fileTag);
    const output = path.join(__dirname, 'output', `${fileTag}-property-paths.csv`);
    explorer.extractPropertyPaths();
    explorer.saveToCsv(output);

  } else if (action === "link") {
    const secondaryFiles = {
      entry1: require('./data/store.json'),
      entry2: require('./data/pet.json'),
    };

    const serverVarMap = {
      entry1: 'var-store.var',
      entry2: 'var-pet.var',
    };

    const linker = new SwaggerLinker(swagger, secondaryFiles, serverVarMap);
    linker.linkSchemas();

    const output = path.join(__dirname, 'output', `${fileTag}-linked.json`);
    linker.saveToFile(output);

  } else if (action === "validate") {
    const validator = new PreProcValidateDict();

    const result = await validator.validate(
      {
        main: swagger,
        entry1: require('./data/store.json'),
        entry2: require('./data/pet.json'),
      },
      {
        entry1: 'var-store.var',
        entry2: 'var-pet.var',
      }
    );

    if (result.isErr) {
      console.error("❌ Invalid x-mapper-host references found:");
      console.table(result.errors);
    } else {
      console.log("✅ All x-mapper-host references are valid.");
    }

  } else {
    console.error("❌ Unknown action. Use 'extract', 'paths', 'link', or 'validate'.");
  }
}

main();
