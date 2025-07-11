import type { ConfigFile } from "@rtk-query/codegen-openapi";

const config: ConfigFile = {
  schemaFile: "../../services/@orbital/admin-gateway/openapi.json",
  apiFile: "./services/apiBase.ts",
  apiImport: "baseSplitApi",
  outputFile: "./services/adminApi.generated.ts",
  exportName: "adminApi",
  hooks: true,
  tag: true,
};

export default config;
