
// --- Embedded SwaggerLookupPathExplorer class ---

class SwaggerLookupPathExplorer {
  constructor(swaggerJson, fileTag) {
    this.swagger = swaggerJson;
    this.fileTag = fileTag;
    this.propertyPaths = new Set();
    this.apiTitle = (swaggerJson.info?.title || fileTag).replace(/\s+/g, '');
  }

  extractPropertyPaths() {
    const schemas = this.swagger.components?.schemas || {};
    for (const schemaName in schemas) {
      const cleanName = this._cleanName(schemaName);
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
      this.propertyPaths.add(fullPath);

      const propDef = schemaObj.properties[prop];
      if (propDef.$ref) {
        const refName = propDef.$ref.split("/").pop();
        const cleanRefName = this._cleanName(refName);
        const refSchema = this.swagger.components?.schemas?.[refName];
        if (refSchema) {
          const refPath = `${parentPath}.${cleanRefName}`;
          this._walkSchema(refName, refSchema, refPath);
        }
      } else if (propDef.type === "object" && propDef.properties) {
        this._walkSchema(prop, propDef, fullPath);
      }
    }
  }

  _cleanName(name) {
    return name.replace(/-\d+-\d+$/, '');
  }

  hasPath(inputPath) {
    return this.propertyPaths.has(inputPath);
  }

  getApiTitle() {
    return this.apiTitle;
  }
}

// --- End Embedded ---

module.exports = class PreProcValidatDict {
  constructor(user) {
    this.user = user;
  }

  extractMapperHostPrefix(xmap, serverVariablesData) {
    for (const prefixKey of Object.keys(serverVariablesData)) {
      const testPrefix = prefixKey + ".";
      if (xmap.startsWith(testPrefix)) {
        const cleanPath = xmap.substring(testPrefix.length);
        return { matchedPrefix: prefixKey, cleanPath };
      }
    }
    return { matchedPrefix: null, cleanPath: null };
  }

  async validate(dictJson, hostsData, serverVariablesData) {
    let retVal = { isErr: false, errors: [] };

    // Fatal checks
    if (!dictJson?.components?.schemas) {
      const message = "Missing dictJson.components.schemas";
      console.error(`[FATAL] ${message}`);
      retVal.isErr = true;
      retVal.errorMsg = message;
      return retVal;
    }

    const serverBlock = dictJson?.servers?.[0];
    if (!serverBlock) {
      const message = "Missing dictJson.servers[0]";
      console.error(`[FATAL] ${message}`);
      retVal.isErr = true;
      retVal.errorMsg = message;
      return retVal;
    }

    const serverVars = serverBlock.variables;
    if (!serverVars) {
      const message = "Missing server variables in dictJson.servers[0].variables";
      console.error(`[FATAL] ${message}`);
      retVal.isErr = true;
      retVal.errorMsg = message;
      return retVal;
    }

    const hostKeys = Object.keys(serverBlock).filter(k => k.startsWith("x-origin-host"));
    const pathLookups = {};

    for (const key of hostKeys) {
      const url = serverBlock[key];
      const hostData = hostsData.find(h => h.url === url);
      if (!hostData) {
        const message = `Missing host definition for URL: ${url}`;
        console.error(`[FATAL] ${message}`);
        retVal.isErr = true;
        retVal.errorMsg = message;
        return retVal;
      }

      const explorer = new SwaggerLookupPathExplorer(hostData.json, key);
      explorer.extractPropertyPaths();
      pathLookups[url] = explorer;
    }

    const schemas = dictJson.components.schemas;
    for (const [schemaName, schemaDef] of Object.entries(schemas)) {
      const props = schemaDef.properties || {};
      for (const [propName, propDef] of Object.entries(props)) {
        const xmap = propDef["x-mapper-host"];
        if (!xmap) continue;

        const { matchedPrefix, cleanPath } = this.extractMapperHostPrefix(xmap, serverVariablesData);
        if (!matchedPrefix) {
          const msg = `In '${schemaName}.${propName}', unknown prefix in x-mapper-host: '${xmap}'`;
          console.error(msg);
          retVal.errors.push(msg);
          retVal.isErr = true;
          continue;
        }

        const variableMeta = serverVars[matchedPrefix];
        if (!variableMeta || !variableMeta.default) {
          const msg = `In '${schemaName}.${propName}', missing .default for variable '${matchedPrefix}'`;
          console.error(msg);
          retVal.errors.push(msg);
          retVal.isErr = true;
          continue;
        }

        const targetUrl = variableMeta.default;
        const explorer = pathLookups[targetUrl];
        if (!explorer) {
          const msg = `In '${schemaName}.${propName}', Swagger not loaded for URL '${targetUrl}'`;
          console.error(msg);
          retVal.errors.push(msg);
          retVal.isErr = true;
          continue;
        }

        const fullPath = cleanPath;
        if (!explorer.hasPath(fullPath)) {
          const msg = `In '${schemaName}.${propName}', bad value for x-mapper-host: '${xmap}'`;
          console.error(msg);
          retVal.errors.push(msg);
          retVal.isErr = true;
        }
      }
    }

    if (!retVal.isErr) {
      console.log("[VALIDATION] ✅ All x-mapper-host references are valid.");
    } else {
      console.error("❌ Validation failed.");
    }

    return retVal;
  }
}
