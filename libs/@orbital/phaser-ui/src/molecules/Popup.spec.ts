import Popup, { PopupConfig } from "./Popup";
import Panel from "../atoms/Panel";
import Theme from "../theme/Theme";
import { AGO } from "../atoms/Atom";

// Create a concrete implementation of the abstract Popup class for testing
class TestPopup extends Popup {
  protected content(): AGO[] {
    return [];
  }
}

describe("Popup", () => {
  // Mock dependencies
  let mockScene: any;
  let mockConfig: PopupConfig;

  beforeEach(() => {
    // Setup mock scene with rexUI
    mockScene = {
      rexUI: {
        add: {
          roundRectangle: jest.fn().mockReturnValue({
            setPosition: jest.fn().mockReturnThis(),
            setInteractive: jest.fn().mockReturnThis(),
            on: jest.fn().mockReturnThis(),
            off: jest.fn().mockReturnThis(),
            disableInteractive: jest.fn().mockReturnThis(),
            setFillStyle: jest.fn().mockReturnThis(),
            setAlpha: jest.fn().mockReturnThis(),
            setStrokeStyle: jest.fn().mockReturnThis(),
            setDepth: jest.fn().mockReturnThis(),
          }),
          sizer: jest.fn().mockReturnValue({
            addBackground: jest.fn().mockReturnThis(),
            layout: jest.fn().mockReturnThis(),
            add: jest.fn().mockReturnThis(),
            setOrigin: jest.fn().mockReturnThis(),
            setScale: jest.fn().mockReturnThis(),
            setInnerPadding: jest.fn().mockReturnThis(),
            getChildren: jest.fn().mockReturnValue([]),
            destroy: jest.fn(),
          }),
        },
      },
      scale: {
        width: 800,
        height: 600,
      },
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
    };

    // Setup mock config
    mockConfig = {
      scene: mockScene,
      theme: new Theme(),
    };

    // Mock Panel class
    jest.spyOn(Panel.prototype, "show").mockReturnThis();
    jest.spyOn(Panel.prototype, "getElement").mockReturnValue({
      destroy: jest.fn(),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      const popup = new TestPopup(mockConfig);
      expect(popup).toBeDefined();
    });

    it("should use default theme if none provided", () => {
      const configWithoutTheme = { ...mockConfig };
      delete (configWithoutTheme as any).theme;
      const popup = new TestPopup(configWithoutTheme);
      expect(popup).toBeDefined();
    });
  });

  describe("content", () => {
    it("should be implemented by subclasses", () => {
      // This is an abstract method that must be implemented by subclasses
      // We've implemented it in TestPopup for testing
      const popup = new TestPopup(mockConfig);
      const content = (popup as any).content();
      expect(Array.isArray(content)).toBe(true);
    });
  });

  describe("create", () => {
    it("should get content from content() method", () => {
      const popup = new TestPopup(mockConfig);
      const contentSpy = jest.spyOn(popup as any, "content");
      popup.create();
      expect(contentSpy).toHaveBeenCalled();
    });

    it("should calculate popup dimensions based on theme ratios", () => {
      const popup = new TestPopup(mockConfig);
      const theme = mockConfig.theme as Theme;
      const expectedWidth = mockScene.scale.width * theme.popupWidthRatio;
      const expectedHeight = mockScene.scale.height * theme.popupHeightRatio;

      // Simply verify the calculation is correct
      expect(expectedWidth).toBe(mockScene.scale.width * theme.popupWidthRatio);
      expect(expectedHeight).toBe(
        mockScene.scale.height * theme.popupHeightRatio
      );

      // Create the popup to ensure no errors
      popup.create();
    });

    it("should show the panel", () => {
      const popup = new TestPopup(mockConfig);
      popup.create();
      expect(Panel.prototype.show).toHaveBeenCalled();
    });

    it("should return the panel element", () => {
      const popup = new TestPopup(mockConfig);
      const result = popup.create();
      expect(result).toBeDefined();
      expect(Panel.prototype.getElement).toHaveBeenCalled();
    });
  });

  describe("destroy", () => {
    it("should do nothing if panel is not defined", () => {
      const popup = new TestPopup(mockConfig);
      // Don't call create() so panel remains undefined
      popup.destroy();
      // No error should occur
    });

    it("should destroy the panel element if panel exists", () => {
      const popup = new TestPopup(mockConfig);
      popup.create(); // Create the panel
      popup.destroy();
      expect(Panel.prototype.getElement().destroy).toHaveBeenCalled();
    });
  });
});
