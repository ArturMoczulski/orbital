// Import reflect-metadata for InversifyJS
require("reflect-metadata");

const Phaser = require("phaser");
global.Phaser = Phaser;

// Polyfill window.history and window.localStorage for tests
Object.defineProperty(window, "history", {
  configurable: true,
  writable: true,
  value: {
    pushState: jest.fn(),
  },
});

Object.defineProperty(window, "localStorage", {
  configurable: true,
  writable: true,
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
});
