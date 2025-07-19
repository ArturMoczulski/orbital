const path = require("path");
const nodeExternals = require("webpack-node-externals");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
  mode: "production",
  target: "node",
  externals: [nodeExternals()],
  entry: "./src/main.ts",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: "ts-loader",
          options: {
            // Skip type checking completely
            transpileOnly: true,
            // Disable type checking in ts-loader
            compilerOptions: {
              noEmitOnError: false,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@orbital/characters": path.resolve(
        __dirname,
        "../../../libs/@orbital/characters/dist"
      ),
      "@orbital/core": path.resolve(
        __dirname,
        "../../../libs/@orbital/core/dist"
      ),
      "@orbital/typegoose": path.resolve(
        __dirname,
        "../../../libs/@orbital/typegoose/dist"
      ),
      "@orbital/contracts": path.resolve(
        __dirname,
        "../../../libs/@orbital/contracts/dist"
      ),
      "@orbital/nest": path.resolve(
        __dirname,
        "../../../libs/@orbital/nest/dist"
      ),
    },
  },
  output: {
    filename: "main.js",
    path: path.resolve(__dirname, "dist"),
  },
  // Disable the ForkTsCheckerWebpackPlugin to prevent type checking
  plugins: [],
};
