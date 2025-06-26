const { execSync } = require("child_process");

try {
  console.log("Running unit tests...");
  execSync("yarn test:unit", {
    stdio: "inherit",
    cwd: __dirname,
  });

  console.log("Running integration tests...");
  execSync("yarn test:integration", {
    stdio: "inherit",
    cwd: __dirname,
  });

  console.log("All tests completed successfully!");
} catch (error) {
  console.error("Tests failed:", error.message);
  process.exit(1);
}
