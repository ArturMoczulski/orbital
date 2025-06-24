module.exports = {
  schemaFile: "../../../services/@orbital/admin-gateway/openapi.json",
  apiFile: "./services/emptyApi.ts",
  apiImport: "emptySplitApi",
  outputFile: "./services/adminApi.generated.ts",
  exportName: "adminApi",
  hooks: true,
  tag: true,
};
