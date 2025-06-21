// Extended Phaser mock library
const PhaserMock = require("phaser-mock");

// Ensure GameObjects namespace and GameObject stub with rendering APIs
PhaserMock.GameObjects = PhaserMock.GameObjects || {};
PhaserMock.GameObjects.GameObject = jest
  .fn()
  .mockImplementation(function (scene, type) {
    this.scene = scene;
    this.type = type;
    this.active = true;
    this.visible = true;
    this.scaleX = 1;
    this.scaleY = 1;
    this.x = 0;
    this.y = 0;
    this.setFillStyle = jest.fn().mockReturnThis();
    this.setAlpha = jest.fn().mockReturnThis();
    this.setStrokeStyle = jest.fn().mockReturnThis();
    this.setOrigin = jest.fn().mockReturnThis();
    this.setScale = jest.fn().mockReturnThis();
    this.setPosition = jest.fn().mockReturnThis();
    this.setInteractive = jest.fn().mockReturnThis();
    this.disableInteractive = jest.fn().mockReturnThis();
    this.on = jest.fn().mockReturnThis();
    this.off = jest.fn().mockReturnThis();
    this.setDepth = jest.fn().mockReturnThis();
  });

// Ensure Display namespace and Color stub
PhaserMock.Display = PhaserMock.Display || {};

// Create a special implementation for the Color constructor that will
// properly handle the RGB values for the tests
const ColorMock = jest.fn().mockImplementation(function (r, g, b) {
  // Store the original RGB values
  this.r = r !== undefined ? r : 0;
  this.g = g !== undefined ? g : 0;
  this.b = b !== undefined ? b : 0;

  // Calculate the color value from RGB
  this.color =
    ((this.r & 0xff) << 16) | ((this.g & 0xff) << 8) | (this.b & 0xff);

  // Mock the lighten method
  this.lighten = jest.fn().mockImplementation(function (percent) {
    // Simple implementation that just returns white
    this.r = 255;
    this.g = 255;
    this.b = 255;
    this.color = 0xffffff;
    return this;
  });

  // Mock the darken method
  this.darken = jest.fn().mockImplementation(function (percent) {
    // Simple implementation that just returns black
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.color = 0x000000;
    return this;
  });
});

// Assign the mock to Phaser.Display.Color
PhaserMock.Display.Color = ColorMock;

// Make sure prototype methods are properly defined
PhaserMock.Display.Color.prototype = {
  lighten: function (percent) {
    this.r = 255;
    this.g = 255;
    this.b = 255;
    this.color = 0xffffff;
    return this;
  },
  darken: function (percent) {
    this.r = 0;
    this.g = 0;
    this.b = 0;
    this.color = 0x000000;
    return this;
  },
};

// Add mock for Scene events
PhaserMock.Scene = PhaserMock.Scene || {};
PhaserMock.Scene.prototype = PhaserMock.Scene.prototype || {};
PhaserMock.Scene.prototype.events = {
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
};

// Helper to create a mock Phaser.Scene for tests
PhaserMock.createMockScene = function () {
  return {
    rexUI: {
      add: {
        roundRectangle: jest.fn().mockReturnThis(),
        sizer: jest.fn().mockReturnValue({
          addBackground: jest.fn().mockReturnThis(),
          layout: jest.fn().mockReturnThis(),
          setInnerPadding: jest.fn().mockReturnThis(),
          width: 0,
          height: 0,
        }),
      },
    },
    scale: { width: 800, height: 600 },
    add: {
      text: jest.fn().mockReturnValue({
        setOrigin: jest.fn().mockReturnThis(),
        disableInteractive: jest.fn().mockReturnThis(),
      }),
    },
    events: {
      on: jest.fn(),
      off: jest.fn(),
      once: jest.fn(),
      emit: jest.fn(),
    },
  };
};

module.exports = PhaserMock;
