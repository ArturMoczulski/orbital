const path = require("path");

module.exports = {
  mode: "development",
  devtool: "eval-source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
    alias: {
      // Match the aliases from next.config.js
      "@orbital/react-ui": path.resolve(
        __dirname,
        "../../../libs/@orbital/react-ui/src"
      ),
      "@emotion/react": path.resolve(
        __dirname,
        "../../../node_modules/@emotion/react"
      ),
      "@emotion/styled": path.resolve(
        __dirname,
        "../../../node_modules/@emotion/styled"
      ),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [
                "@babel/preset-env",
                "@babel/preset-react",
                "@babel/preset-typescript",
              ],
            },
          },
          {
            loader: "ts-loader",
            options: {
              transpileOnly: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  // Remove externals to avoid conflicts with React versions
  // This will bundle React and ReactDOM with the tests
};
