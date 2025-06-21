module.exports = function (plop) {
  plop.setGenerator("client", {
    description: "Scaffold a new client project",
    prompts: (inquirer, data = {}) => {
      if (data.name) {
        return [];
      }
      return [
        {
          type: "input",
          name: "name",
          message: "Enter project name:",
        },
      ];
    },
    actions: [
      {
        type: "addMany",
        destination: "clients/{{name}}",
        templateFiles: ["**/*", "!plopfile.cjs", "!plopfile.js"],
        base: "templates/client",
        skipInterpolation: ["**/*"],
        skipIfExists: true,
      },
      {
        type: "modify",
        path: "clients/{{name}}/package.json",
        pattern: /"name":\s*".*"/,
        template: '"name": "@orbital/{{name}}",',
      },
    ],
  });
};
