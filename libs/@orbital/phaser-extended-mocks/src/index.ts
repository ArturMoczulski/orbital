// @ts-nocheck
import * as PhaserMock from "phaser-mock";

// Ensure GameObjects namespace and stub
PhaserMock.GameObjects = PhaserMock.GameObjects || {};

PhaserMock.GameObjects.GameObject = jest
  .fn()
  .mockImplementation(function (this: any, scene: any, type: any) {
    (this as any).scene = scene;
    (this as any).type = type;
    (this as any).active = true;
    (this as any).visible = true;
    (this as any).scaleX = 1;
    (this as any).scaleY = 1;
    (this as any).x = 0;
    (this as any).y = 0;
    (this as any).setFillStyle = jest.fn().mockReturnThis();
    (this as any).setAlpha = jest.fn().mockReturnThis();
    (this as any).setStrokeStyle = jest.fn().mockReturnThis();
    (this as any).setOrigin = jest.fn().mockReturnThis();
    (this as any).setScale = jest.fn().mockReturnThis();
    (this as any).setPosition = jest.fn().mockReturnThis();
    (this as any).setInteractive = jest.fn().mockReturnThis();
    (this as any).disableInteractive = jest.fn().mockReturnThis();
    (this as any).on = jest.fn().mockReturnThis();
    (this as any).off = jest.fn().mockReturnThis();
    (this as any).setDepth = jest.fn().mockReturnThis();
  }) as any;

// Ensure Display namespace
PhaserMock.Display = PhaserMock.Display || {};

// Color mock implementation
const ColorMock = jest
  .fn()
  .mockImplementation(function (this: any, r?: number, g?: number, b?: number) {
    this.r = r ?? 0;
    this.g = g ?? 0;
    this.b = b ?? 0;
    this.color =
      ((this.r & 0xff) << 16) | ((this.g & 0xff) << 8) | (this.b & 0xff);
    this.lighten = jest
      .fn()
      .mockImplementation(function (this: any, percent: number) {
        this.r = 255;
        this.g = 255;
        this.b = 255;
        this.color = 0xffffff;
        return this;
      });
    this.darken = jest
      .fn()
      .mockImplementation(function (this: any, percent: number) {
        this.r = 0;
        this.g = 0;
        this.b = 0;
        this.color = 0x000000;
        return this;
      });
  }) as any;

PhaserMock.Display.Color = ColorMock;

// Prototype methods
ColorMock.prototype.lighten = function (percent: number) {
  this.r = 255;
  this.g = 255;
  this.b = 255;
  this.color = 0xffffff;
  return this;
};
ColorMock.prototype.darken = function (percent: number) {
  this.r = 0;
  this.g = 0;
  this.b = 0;
  this.color = 0x000000;
  return this;
};

// Scene events
PhaserMock.Scene = PhaserMock.Scene || {};
PhaserMock.Scene.prototype = PhaserMock.Scene.prototype || {};
PhaserMock.Scene.prototype.events = {
  on: jest.fn(),
  off: jest.fn(),
  once: jest.fn(),
  emit: jest.fn(),
};

// createMockScene helper
export function createMockScene() {
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
}

export default PhaserMock;
