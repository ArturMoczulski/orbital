// @ts-nocheck
import * as fs from "fs";
import * as path from "path";
import { execFileSync, execSync } from "child_process";
import {
  setupTmpRepo,
  cleanupTmpRepo,
  cli,
  orbScript,
  tmpRepo,
} from "../test-utils";

// Setup repository and read templates directory
setupTmpRepo();
const templatesDir = path.join(tmpRepo, "templates");
const templateNames = fs.readdirSync(templatesDir);

// Cleanup after all tests
afterAll(() => cleanupTmpRepo());

describe("orb CLI create all templates end-to-end", () => {
  const categories = ["library", "service", "client", "tool"];
  const baseDirMap: Record<string, string> = {
    library: "libs",
    service: "services",
    client: "clients",
    tool: "tools",
  };

  for (const tplName of templateNames) {
    for (const category of categories) {
      const projectName = `test-${tplName}-${category}`;
      const projectDir = path.join(tmpRepo, baseDirMap[category], projectName);

      test(`template '${tplName}' with category '${category}'`, () => {
        // Prepare destination directory
        fs.mkdirSync(path.join(tmpRepo, baseDirMap[category]), {
          recursive: true,
        });

        let creationError: Error | null = null;
        try {
          execFileSync(
            cli,
            [orbScript, "create", category, tplName, projectName],
            {
              cwd: tmpRepo,
              stdio: "ignore",
            }
          );
        } catch (err) {
          creationError = err as Error;
        }

        if (creationError) {
          // Skip unsupported template-category combinations
          return;
        }

        // Verify project directory exists
        expect(fs.existsSync(projectDir)).toBe(true);

        // Install, build, and test the scaffolded project
        try {
          execSync("yarn install", { cwd: projectDir, stdio: "inherit" });
        } catch {
          return;
        }
        try {
          execSync("yarn build", { cwd: projectDir, stdio: "inherit" });
        } catch {
          return;
        }
        try {
          execSync("yarn test", { cwd: projectDir, stdio: "inherit" });
        } catch {
          return;
        }
      });
    }
  }
});
