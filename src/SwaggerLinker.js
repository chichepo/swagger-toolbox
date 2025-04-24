
const fs = require('fs');
const path = require('path');
const SwaggerPathExplorer = require('./SwaggerPathExplorer');

class SwaggerLinker {
  constructor(mainSwagger, secondarySwaggerMap) {
    this.main = mainSwagger;
    this.secondaryMap = secondarySwaggerMap;
  }

  linkSchemas() {
    const mainSchemas = this.main.components?.schemas || {};

    for (const schemaName in mainSchemas) {
      const schema = mainSchemas[schemaName];
      if (schema.properties) {
        this._linkProperties(schema.properties, schemaName);
      }
    }
  }

  _linkProperties(properties, parentSchemaName) {
    for (const prop in properties) {
      const definition = properties[prop];

      for (const [tag, swagger] of Object.entries(this.secondaryMap)) {
        const explorer = new SwaggerPathExplorer(swagger, tag);
        const paths = explorer.extractPropertyPaths();

        const match = paths.find(p => p.endsWith(`.${prop}`));
        if (match) {
          definition["x-mapper-host"] = match; // direct path only
          break;
        }
      }
    }
  }

  getUpdatedSwagger() {
    return this.main;
  }

  saveToFile(outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(this.main, null, 2));
    console.log(`✅ Linked Swagger saved to ${outputPath}`);
  }
}

module.exports = SwaggerLinker;
