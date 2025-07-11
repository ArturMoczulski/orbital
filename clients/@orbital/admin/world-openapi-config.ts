import type { ConfigFile } from "@rtk-query/codegen-openapi";

const config: ConfigFile = {
  schemaFile: "../../services/@orbital/world/openapi.json",
  apiFile: "./services/emptyWorldApi.ts",
  apiImport: "emptyWorldSplitApi",
  outputFile: "./services/worldApi.generated.ts",
  exportName: "worldApi",
  hooks: true,
  tag: true,
};

export default config;
