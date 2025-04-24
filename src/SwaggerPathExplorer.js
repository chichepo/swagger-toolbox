
const fs = require('fs');

class SwaggerPathExplorer {
  constructor(swaggerJson, fileTag) {
    this.swagger = swaggerJson;
    this.fileTag = fileTag;
    this.propertyPaths = new Set(); // Deduplicated list
    this.apiTitle = (swaggerJson.info?.title || fileTag).replace(/\s+/g, '');
  }

  extractPropertyPaths() {
    const schemas = this.swagger.components?.schemas || {};
    for (const schemaName in schemas) {
      const cleanName = this._cleanName(schemaName);
      // console.log(`[DEBUG] Cleaning schema: schemaName="${schemaName}", cleanName="${cleanName}"`);
      const cleanedPath = `${this.apiTitle}.${cleanName}`;
      this._walkSchema(schemaName, schemas[schemaName], cleanedPath);
    }
    return Array.from(this.propertyPaths);
  }

  _walkSchema(schemaName, schemaObj, parentPath) {
    if (!schemaObj.properties) return;

    for (const prop in schemaObj.properties) {
      const cleanProp = this._cleanName(prop);
      const fullPath = `${parentPath}.${cleanProp}`;
      // console.log(`[DEBUG] Cleaning property: original="${prop}", cleaned="${cleanProp}"`);
      this.propertyPaths.add(fullPath);

      const propDef = schemaObj.properties[prop];
      if (propDef.$ref) {
        const refName = propDef.$ref.split("/").pop();
        const cleanRefName = this._cleanName(refName);
        const refSchema = this.swagger.components?.schemas?.[refName];
        if (refSchema) {
          const refPath = `${fullPath.substring(0, fullPath.lastIndexOf(".") + 1)}${cleanRefName}`;
          // console.log(`[DEBUG] Cleaning referenced schema: original="${refName}", cleaned="${cleanRefName}"`);
          this._walkSchema(refName, refSchema, refPath);
        }
      } else if (propDef.type === "object" && propDef.properties) {
        this._walkSchema(prop, propDef, fullPath);
      }
    }
  }

  _cleanName(name) {
    return name.replace(/-\w+-\w+$/, '');
  }

  saveToCsv(outputPath) {
    const csv = Array.from(this.propertyPaths).map(p => `"${p}"`).join("\n");
    fs.writeFileSync(outputPath, csv);
    console.log(`✅ Property paths saved to ${outputPath}`);
  }
}

module.exports = SwaggerPathExplorer;
