module.exports = class UIPlugin {
  constructor() {
    this.add = {
      roundRectangle: jest.fn().mockReturnValue({
        setStrokeStyle: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        // Mock fill style for updateRender calls
        setFillStyle: jest.fn().mockReturnThis(),
      }),
    };
  }
};
