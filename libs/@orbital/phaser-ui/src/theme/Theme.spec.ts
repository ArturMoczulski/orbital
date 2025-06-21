import Theme, { ColorPalette } from "./Theme";
import Colors from "../utils/Colors";

describe("Theme", () => {
  describe("constructor", () => {
    it("should create a new Theme instance with default values", () => {
      const theme = new Theme();
      expect(theme).toBeDefined();
      expect(theme.fontFamily).toBeDefined();
      expect(theme.fontSizes).toBeDefined();
      expect(theme.colors).toBeDefined();
    });
  });

  describe("static active", () => {
    it("should provide a singleton instance of Theme", () => {
      expect(Theme.active).toBeDefined();
      expect(Theme.active).toBeInstanceOf(Theme);
    });
  });

  describe("static parseColor", () => {
    it("should delegate to Colors.parse", () => {
      const spy = jest.spyOn(Colors, "parse");
      const color = "#ff0000";
      Theme.parseColor(color);
      expect(spy).toHaveBeenCalledWith(color);
      spy.mockRestore();
    });

    it("should handle hex string input", () => {
      const result = Theme.parseColor("#ff0000");
      expect(result).toBeDefined();
    });

    it("should handle numeric input", () => {
      const result = Theme.parseColor(0xff0000);
      expect(result).toBeDefined();
    });

    it("should handle Phaser.Display.Color input", () => {
      const colorObj = { color: 0xff0000 };
      const result = Theme.parseColor(colorObj as any);
      expect(result).toBeDefined();
    });
  });

  describe("fontFamily", () => {
    it("should return the font family string", () => {
      const theme = new Theme();
      expect(typeof theme.fontFamily).toBe("string");
    });
  });

  describe("fontSizes", () => {
    it("should return an object with xs, sm, md, lg, xl properties", () => {
      const theme = new Theme();
      const sizes = theme.fontSizes;
      expect(sizes.xs).toBeDefined();
      expect(sizes.sm).toBeDefined();
      expect(sizes.md).toBeDefined();
      expect(sizes.lg).toBeDefined();
      expect(sizes.xl).toBeDefined();
    });

    it("should return font sizes as strings with units", () => {
      const theme = new Theme();
      const sizes = theme.fontSizes;
      expect(typeof sizes.md).toBe("string");
      expect(sizes.md).toMatch(/\d+px/);
    });
  });

  describe("colors", () => {
    it("should return a ColorPalette object", () => {
      const theme = new Theme();
      const colors = theme.colors;
      expect(colors.primary).toBeDefined();
      expect(colors.secondary).toBeDefined();
      expect(colors.accent).toBeDefined();
      expect(colors.success).toBeDefined();
      expect(colors.danger).toBeDefined();
      expect(colors.background).toBeDefined();
      expect(colors.text).toBeDefined();
      expect(colors.light).toBeDefined();
      expect(colors.dark).toBeDefined();
    });

    it("should allow setting the entire color palette", () => {
      const theme = new Theme();
      const newPalette = { ...theme.colors };
      theme.colors = newPalette;
      expect(theme.colors).toEqual(newPalette);
    });
  });

  describe("primary", () => {
    it("should return the primary color", () => {
      const theme = new Theme();
      expect(theme.primary).toBeDefined();
    });

    it("should allow setting the primary color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.primary = newColor;
      expect(theme.primary).toBe(newColor);
    });
  });

  describe("secondary", () => {
    it("should return the secondary color", () => {
      const theme = new Theme();
      expect(theme.secondary).toBeDefined();
    });

    it("should allow setting the secondary color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.secondary = newColor;
      expect(theme.secondary).toBe(newColor);
    });
  });

  describe("accent", () => {
    it("should return the accent color", () => {
      const theme = new Theme();
      expect(theme.accent).toBeDefined();
    });

    it("should allow setting the accent color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.accent = newColor;
      expect(theme.accent).toBe(newColor);
    });
  });

  describe("success", () => {
    it("should return the success color", () => {
      const theme = new Theme();
      expect(theme.success).toBeDefined();
    });

    it("should allow setting the success color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.success = newColor;
      expect(theme.success).toBe(newColor);
    });
  });

  describe("danger", () => {
    it("should return the danger color", () => {
      const theme = new Theme();
      expect(theme.danger).toBeDefined();
    });

    it("should allow setting the danger color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.danger = newColor;
      expect(theme.danger).toBe(newColor);
    });
  });

  describe("background", () => {
    it("should return the background color", () => {
      const theme = new Theme();
      expect(theme.background).toBeDefined();
    });

    it("should allow setting the background color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.background = newColor;
      expect(theme.background).toBe(newColor);
    });
  });

  describe("text", () => {
    it("should return the text color", () => {
      const theme = new Theme();
      expect(theme.text).toBeDefined();
    });

    it("should allow setting the text color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.text = newColor;
      expect(theme.text).toBe(newColor);
    });
  });

  describe("light", () => {
    it("should return the light color", () => {
      const theme = new Theme();
      expect(theme.light).toBeDefined();
    });

    it("should allow setting the light color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.light = newColor;
      expect(theme.light).toBe(newColor);
    });
  });

  describe("dark", () => {
    it("should return the dark color", () => {
      const theme = new Theme();
      expect(theme.dark).toBeDefined();
    });

    it("should allow setting the dark color", () => {
      const theme = new Theme();
      const newColor = { color: 0x00ff00 } as any;
      theme.dark = newColor;
      expect(theme.dark).toBe(newColor);
    });
  });

  describe("spacing", () => {
    it("should return an object with xs, sm, md, lg, xl properties", () => {
      const theme = new Theme();
      const spacing = theme.spacing;
      expect(spacing.xs).toBeDefined();
      expect(spacing.sm).toBeDefined();
      expect(spacing.md).toBeDefined();
      expect(spacing.lg).toBeDefined();
      expect(spacing.xl).toBeDefined();
    });

    it("should allow setting the spacing object", () => {
      const theme = new Theme();
      const newSpacing = { ...theme.spacing, md: 30 };
      theme.spacing = newSpacing;
      expect(theme.spacing).toEqual(newSpacing);
    });
  });

  describe("smallRadius", () => {
    it("should return the small border radius", () => {
      const theme = new Theme();
      expect(typeof theme.smallRadius).toBe("number");
    });

    it("should allow setting the small border radius", () => {
      const theme = new Theme();
      const newRadius = 8;
      theme.smallRadius = newRadius;
      expect(theme.smallRadius).toBe(newRadius);
    });
  });

  describe("mediumRadius", () => {
    it("should return the medium border radius", () => {
      const theme = new Theme();
      expect(typeof theme.mediumRadius).toBe("number");
    });

    it("should allow setting the medium border radius", () => {
      const theme = new Theme();
      const newRadius = 10;
      theme.mediumRadius = newRadius;
      expect(theme.mediumRadius).toBe(newRadius);
    });
  });

  describe("largeRadius", () => {
    it("should return the large border radius", () => {
      const theme = new Theme();
      expect(typeof theme.largeRadius).toBe("number");
    });

    it("should allow setting the large border radius", () => {
      const theme = new Theme();
      const newRadius = 15;
      theme.largeRadius = newRadius;
      expect(theme.largeRadius).toBe(newRadius);
    });
  });

  describe("buttonWidth", () => {
    it("should return the button width", () => {
      const theme = new Theme();
      expect(typeof theme.buttonWidth).toBe("number");
    });

    it("should allow setting the button width", () => {
      const theme = new Theme();
      const newWidth = 200;
      theme.buttonWidth = newWidth;
      expect(theme.buttonWidth).toBe(newWidth);
    });
  });

  describe("buttonHeight", () => {
    it("should return the button height", () => {
      const theme = new Theme();
      expect(typeof theme.buttonHeight).toBe("number");
    });

    it("should allow setting the button height", () => {
      const theme = new Theme();
      const newHeight = 60;
      theme.buttonHeight = newHeight;
      expect(theme.buttonHeight).toBe(newHeight);
    });
  });

  describe("popupWidthRatio", () => {
    it("should return the popup width ratio", () => {
      const theme = new Theme();
      expect(typeof theme.popupWidthRatio).toBe("number");
    });

    it("should allow setting the popup width ratio", () => {
      const theme = new Theme();
      const newRatio = 0.5;
      theme.popupWidthRatio = newRatio;
      expect(theme.popupWidthRatio).toBe(newRatio);
    });
  });

  describe("popupHeightRatio", () => {
    it("should return the popup height ratio", () => {
      const theme = new Theme();
      expect(typeof theme.popupHeightRatio).toBe("number");
    });

    it("should allow setting the popup height ratio", () => {
      const theme = new Theme();
      const newRatio = 0.6;
      theme.popupHeightRatio = newRatio;
      expect(theme.popupHeightRatio).toBe(newRatio);
    });
  });

  describe("form properties", () => {
    it("should provide formBackgroundAlpha", () => {
      const theme = new Theme();
      expect(typeof theme.formBackgroundAlpha).toBe("number");
    });

    it("should provide formBorderRadius", () => {
      const theme = new Theme();
      expect(typeof theme.formBorderRadius).toBe("number");
    });

    it("should provide formBorderColor", () => {
      const theme = new Theme();
      expect(typeof theme.formBorderColor).toBe("number");
    });

    it("should provide formBorderWidth", () => {
      const theme = new Theme();
      expect(typeof theme.formBorderWidth).toBe("number");
    });

    it("should provide formPadding", () => {
      const theme = new Theme();
      expect(typeof theme.formPadding).toBe("number");
    });
  });

  describe("input properties", () => {
    it("should provide inputPadding", () => {
      const theme = new Theme();
      expect(typeof theme.inputPadding).toBe("number");
    });

    it("should provide inputMargin", () => {
      const theme = new Theme();
      expect(typeof theme.inputMargin).toBe("number");
    });

    it("should provide inputBackgroundColor", () => {
      const theme = new Theme();
      expect(typeof theme.inputBackgroundColor).toBe("number");
    });

    it("should provide inputBackgroundAlpha", () => {
      const theme = new Theme();
      expect(typeof theme.inputBackgroundAlpha).toBe("number");
    });

    it("should provide inputBorderColor", () => {
      const theme = new Theme();
      expect(typeof theme.inputBorderColor).toBe("number");
    });

    it("should provide inputBorderWidth", () => {
      const theme = new Theme();
      expect(typeof theme.inputBorderWidth).toBe("number");
    });

    it("should provide inputBorderRadius", () => {
      const theme = new Theme();
      expect(typeof theme.inputBorderRadius).toBe("number");
    });
  });

  describe("button style properties", () => {
    it("should provide buttonPadding", () => {
      const theme = new Theme();
      expect(typeof theme.buttonPadding).toBe("number");
    });

    it("should provide buttonMarginTop", () => {
      const theme = new Theme();
      expect(typeof theme.buttonMarginTop).toBe("number");
    });

    it("should provide buttonGradientStart", () => {
      const theme = new Theme();
      expect(typeof theme.buttonGradientStart).toBe("number");
    });

    it("should provide buttonGradientEnd", () => {
      const theme = new Theme();
      expect(typeof theme.buttonGradientEnd).toBe("number");
    });

    it("should provide buttonHoverGradientStart", () => {
      const theme = new Theme();
      expect(typeof theme.buttonHoverGradientStart).toBe("number");
    });

    it("should provide buttonHoverGradientEnd", () => {
      const theme = new Theme();
      expect(typeof theme.buttonHoverGradientEnd).toBe("number");
    });

    it("should provide buttonLetterSpacing", () => {
      const theme = new Theme();
      expect(typeof theme.buttonLetterSpacing).toBe("number");
    });
  });

  describe("link style properties", () => {
    it("should provide linkMarginTop", () => {
      const theme = new Theme();
      expect(typeof theme.linkMarginTop).toBe("number");
    });

    it("should provide linkColor", () => {
      const theme = new Theme();
      expect(typeof theme.linkColor).toBe("number");
    });

    it("should provide linkHoverColor", () => {
      const theme = new Theme();
      expect(typeof theme.linkHoverColor).toBe("number");
    });
  });

  describe("errorColor", () => {
    it("should provide errorColor", () => {
      const theme = new Theme();
      expect(typeof theme.errorColor).toBe("number");
    });
  });

  describe("lighten", () => {
    it("should delegate to Colors.lighten", () => {
      const spy = jest.spyOn(Colors, "lighten");
      const theme = new Theme();
      const color = "#ff0000";
      const percent = 10;
      theme.lighten(color, percent);
      expect(spy).toHaveBeenCalledWith(color, percent);
      spy.mockRestore();
    });

    it("should return a numeric color value", () => {
      const theme = new Theme();
      const result = theme.lighten("#ff0000", 10);
      expect(typeof result).toBe("number");
    });
  });

  describe("darken", () => {
    it("should delegate to Colors.darken", () => {
      const spy = jest.spyOn(Colors, "darken");
      const theme = new Theme();
      const color = "#ff0000";
      const percent = 10;
      theme.darken(color, percent);
      expect(spy).toHaveBeenCalledWith(color, percent);
      spy.mockRestore();
    });

    it("should return a numeric color value", () => {
      const theme = new Theme();
      const result = theme.darken("#ff0000", 10);
      expect(typeof result).toBe("number");
    });
  });

  describe("toNumber", () => {
    it("should delegate to Colors.toNumber", () => {
      const spy = jest.spyOn(Colors, "toNumber");
      const theme = new Theme();
      const color = "#ff0000";
      theme.toNumber(color);
      expect(spy).toHaveBeenCalledWith(color);
      spy.mockRestore();
    });

    it("should return a numeric color value", () => {
      const theme = new Theme();
      const result = theme.toNumber("#ff0000");
      expect(typeof result).toBe("number");
    });
  });
});
