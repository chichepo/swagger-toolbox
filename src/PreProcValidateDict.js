
const SwaggerPathExplorer = require('./SwaggerPathExplorer');

module.exports = class PreProcValidateDict {
  /**
   * Validate all x-mapper-host references in a main Swagger file.
   * 
   * @param {object} serverHosts - An object like { main, pet, store }
   * @param {object} serverVariables - An object like { pet: 'var-pet.var.pet', store: 'var-store.var.store' }
   * @returns {Promise<{ isErr: boolean, errors?: object[] }>}
   */
  async validate(serverHosts, serverVariables) {
    let retVal = { isErr: false, errors: [] };

    // Build path sets from secondary files
    const pathMap = {};
    for (const [tag, swagger] of Object.entries(serverHosts)) {
      if (tag === "main") continue;
      const explorer = new SwaggerPathExplorer(swagger, tag);
      const paths = explorer.extractPropertyPaths();
      pathMap[tag] = new Set(paths);
    }

    const mainSchemas = serverHosts.main?.components?.schemas || {};

    for (const [schemaName, schema] of Object.entries(mainSchemas)) {
      if (!schema.properties) continue;

      for (const [prop, def] of Object.entries(schema.properties)) {
        const xmap = def["x-mapper-host"];
        if (xmap) {
          let found = false;

          // Try stripping known variable prefixes
          for (const [tag, prefix] of Object.entries(serverVariables)) {
            const normalizedPrefix = prefix + ".";

            if (xmap.startsWith(normalizedPrefix)) {
              const cleanPath = xmap.substring(normalizedPrefix.length); // cut the prefix
              // console.log(`[VALIDATE] Checking '${cleanPath}' in tag '${tag}'`);
              const validPaths = pathMap[tag];
              if (validPaths && validPaths.has(cleanPath)) {
                found = true;
                break;
              }
            }
          }

          if (!found) {
            retVal.isErr = true;
            retVal.errors.push({
              schema: schemaName,
              property: prop,
              xMapperHost: xmap,
              reason: "Reference not found in secondary files"
            });
          }
        }
      }
    }
    return retVal;
  }
}
