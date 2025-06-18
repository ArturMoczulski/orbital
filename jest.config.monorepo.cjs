const { internalPackages } = require("./orb.json");
const commonConfig = require("./jest.common.cjs");

/**
 * Aggregate each internal package's Jest config path
 * into the root "projects" array for monorepo testing.
 */
const projects = internalPackages.map((name) => {
  if (name.startsWith("@")) {
    const [scope, pkg] = name.slice(1).split("/");
    return `<rootDir>/tools/@${scope}/${pkg}`;
  }
  return `<rootDir>/tools/${name}`;
});

module.exports = {
  ...commonConfig,
  projects,
};
