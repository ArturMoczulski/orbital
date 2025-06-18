module.exports = function (plop) {
  plop.setGenerator("ts-lib", {
    description: "Scaffold a new TypeScript library",
    prompts: (inquirer, data = {}) => {
      if (data.name) {
        return [];
      }
      return [
        {
          type: "input",
          name: "name",
          message: "Enter library name:",
        },
      ];
    },
    actions: [
      {
        type: "addMany",
        destination: "libs/{{name}}",
        templateFiles: [
          // Scaffold core files
          ".env.template",
          "package.json",
          "tsconfig.json",
          "jest.config.base.js",
          "jest.config.js",
          ".gitignore",
          // Source code
          "src/**/*",
          // Tests
          "tests/**/*",
        ],
        base: "templates/ts-lib",
        skipInterpolation: ["**/*.js"],
        skipIfExists: true,
      },
      {
        type: "modify",
        path: "libs/{{name}}/package.json",
        pattern: /"name":\s*".*"/,
        template: '"name": "@orbital/{{name}}",',
      },
    ],
  });
};
