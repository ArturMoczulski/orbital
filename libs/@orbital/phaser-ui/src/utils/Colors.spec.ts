import Colors from "./Colors";
import Phaser from "phaser";

describe("Colors", () => {
  describe("parse", () => {
    it("should return the input if it is already a Color-like object", () => {
      const colorObj = { color: 0xff0000 };
      const result = Colors.parse(colorObj as any);
      expect(result).toBe(colorObj);
    });

    it("should convert numeric input to a Color-like object", () => {
      const colorNum = 0xff0000;
      const result = Colors.parse(colorNum);
      expect(result).toEqual({ color: colorNum });
    });

    it("should convert hex string input to a Color-like object", () => {
      const colorHex = "#ff0000";
      const result = Colors.parse(colorHex);
      expect(result).toEqual({ color: 0xff0000 });
    });

    it("should handle hex strings without # prefix", () => {
      const colorHex = "ff0000";
      const result = Colors.parse(colorHex);
      expect(result).toEqual({ color: 0xff0000 });
    });

    it("should handle Phaser.Display.Color instances", () => {
      const phaserColor = new Phaser.Display.Color(255, 0, 0);
      const result = Colors.parse(phaserColor);
      expect(result).toBe(phaserColor);
    });
  });

  describe("toNumber", () => {
    it("should convert Color-like object to number", () => {
      const colorObj = { color: 0xff0000 };
      const result = Colors.toNumber(colorObj as any);
      expect(result).toBe(0xff0000);
    });

    it("should return numeric input directly", () => {
      const colorNum = 0xff0000;
      const result = Colors.toNumber(colorNum);
      expect(result).toBe(colorNum);
    });

    it("should convert hex string to number", () => {
      const colorHex = "#ff0000";
      const result = Colors.toNumber(colorHex);
      expect(result).toBe(0xff0000);
    });

    it("should convert Phaser.Display.Color to number", () => {
      const phaserColor = new Phaser.Display.Color(255, 0, 0);
      const result = Colors.toNumber(phaserColor);
      expect(typeof result).toBe("number");
    });
  });

  describe("lighten", () => {
    it("should convert input to number using toNumber", () => {
      const spy = jest.spyOn(Colors, "toNumber");
      const colorHex = "#ff0000";
      Colors.lighten(colorHex, 10);
      expect(spy).toHaveBeenCalledWith(colorHex);
    });

    it("should create a Phaser.Display.Color with RGB components", () => {
      const colorSpy = jest.spyOn(Phaser.Display, "Color");
      Colors.lighten(0xff0000, 10);
      expect(colorSpy).toHaveBeenCalledWith(255, 0, 0);
    });

    it("should call lighten on the Phaser.Display.Color instance", () => {
      // We expect the mocked Color constructor to return an object with a mocked lighten method
      const mockColorInstance = { lighten: jest.fn(), color: 0 };
      jest
        .spyOn(Phaser.Display, "Color")
        .mockReturnValue(mockColorInstance as any);

      Colors.lighten(0xff0000, 10);
      expect(mockColorInstance.lighten).toHaveBeenCalledWith(10);
    });

    it("should return the color property of the lightened color instance", () => {
      const mockColorInstance = {
        lighten: jest.fn().mockReturnThis(),
        color: 0xffffff,
      };
      jest
        .spyOn(Phaser.Display, "Color")
        .mockReturnValue(mockColorInstance as any);

      const result = Colors.lighten(0xff0000, 10);
      expect(result).toBe(0xffffff);
    });
  });

  describe("darken", () => {
    it("should convert input to number using toNumber", () => {
      const spy = jest.spyOn(Colors, "toNumber");
      const colorHex = "#ff0000";
      Colors.darken(colorHex, 10);
      expect(spy).toHaveBeenCalledWith(colorHex);
    });

    it("should create a Phaser.Display.Color with RGB components", () => {
      const colorSpy = jest.spyOn(Phaser.Display, "Color");
      Colors.darken(0xff0000, 10);
      expect(colorSpy).toHaveBeenCalledWith(255, 0, 0);
    });

    it("should call darken on the Phaser.Display.Color instance", () => {
      // Create a mock instance with the darken method
      const mockColorInstance = {
        darken: jest.fn().mockReturnThis(),
        color: 0,
      };

      // Mock the Color constructor to return our mock instance
      const colorSpy = jest
        .spyOn(Phaser.Display, "Color")
        .mockImplementation(() => mockColorInstance as any);

      Colors.darken(0xff0000, 10);
      expect(mockColorInstance.darken).toHaveBeenCalledWith(10);

      // Clean up
      colorSpy.mockRestore();
    });

    it("should return the color property of the darkened color instance", () => {
      const mockColorInstance = {
        darken: jest.fn().mockReturnThis(),
        color: 0x000000,
      };

      const colorSpy = jest
        .spyOn(Phaser.Display, "Color")
        .mockImplementation(() => mockColorInstance as any);

      const result = Colors.darken(0xff0000, 10);
      expect(result).toBe(0x000000);

      // Clean up
      colorSpy.mockRestore();
    });
  });
});
