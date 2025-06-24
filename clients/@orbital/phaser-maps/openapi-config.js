/**
 * RTK Query OpenAPI Codegen Configuration (JavaScript)
 * This file replaces openapi-config.ts to avoid ts-node bundler errors.
 */

module.exports = {
  // Path to the generated OpenAPI JSON from Admin Gateway
  schemaFile: "../../services/@orbital/admin-gateway/openapi.json",
  // Base API source file (emptySplitApi)
  apiFile: "./services/emptyApi.ts",
  apiImport: "emptySplitApi",
  // Output file for generated endpoints
  outputFile: "./services/adminApi.generated.ts",
  // Export name of the generated API object
  exportName: "adminApi",
  // Enable hook generation
  hooks: true,
  // Enable tag support
  tag: true,
};
