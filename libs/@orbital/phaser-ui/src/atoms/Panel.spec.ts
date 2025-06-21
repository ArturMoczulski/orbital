import Panel from "./Panel";
import { AtomConfig, AtomState } from "./Atom";
import Theme from "../theme/Theme";

describe("Panel", () => {
  // Mock dependencies
  let mockScene: any;
  let mockConfig: AtomConfig;

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
          }),
        },
      },
      events: {
        on: jest.fn(),
      },
      scale: {
        width: 800,
        height: 600,
      },
      tweens: {
        add: jest.fn(),
      },
    };

    // Setup mock config
    mockConfig = {
      scene: mockScene,
      theme: new Theme(),
      x: 100,
      y: 100,
      width: 400,
      height: 300,
      backgroundColor: "#ffffff",
      borderColor: "#000000",
      borderWidth: 2,
      borderRadius: 5,
      padding: 20,
    };
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      const panel = new Panel(mockConfig);
      expect(panel).toBeDefined();
    });

    it("should disable pointer interactions on background", () => {
      const panel = new Panel(mockConfig);
      // Verify background rect has pointer events disabled
      expect(mockScene.rexUI.add.roundRectangle().off).toHaveBeenCalledWith(
        "pointerover"
      );
      expect(mockScene.rexUI.add.roundRectangle().off).toHaveBeenCalledWith(
        "pointerout"
      );
      expect(
        mockScene.rexUI.add.roundRectangle().disableInteractive
      ).toHaveBeenCalled();
    });

    it("should use center position if x/y not provided", () => {
      const configWithoutPos = { ...mockConfig };
      delete configWithoutPos.x;
      delete configWithoutPos.y;
      const panel = new Panel(configWithoutPos);
      // Verify center position was used
      expect(mockScene.rexUI.add.sizer).toHaveBeenCalledWith(
        expect.objectContaining({
          x: mockScene.scale.width / 2,
          y: mockScene.scale.height / 2,
        })
      );
    });

    it("should create vertical sizer with background and padding", () => {
      const panel = new Panel(mockConfig);
      // Verify sizer was created with correct orientation and spacing
      expect(mockScene.rexUI.add.sizer).toHaveBeenCalledWith(
        expect.objectContaining({
          orientation: "y",
          space: expect.objectContaining({
            left: mockConfig.padding,
            right: mockConfig.padding,
            top: mockConfig.padding,
            bottom: mockConfig.padding,
          }),
        })
      );
    });

    it("should set origin to center", () => {
      const panel = new Panel(mockConfig);
      expect(mockScene.rexUI.add.sizer().setOrigin).toHaveBeenCalledWith(0.5);
    });

    it("should layout the panel", () => {
      const panel = new Panel(mockConfig);
      expect(mockScene.rexUI.add.sizer().layout).toHaveBeenCalled();
    });
  });

  describe("baseStyle", () => {
    it("should use theme.panel.borderColor for border color", () => {
      const panel = new Panel(mockConfig);
      expect(panel.style()[AtomState.Normal].borderColor).toBe(
        mockConfig.theme!.panel.borderColor
      );
    });

    it("should use theme.panel.borderWidth for border width", () => {
      const panel = new Panel(mockConfig);
      expect(panel.style()[AtomState.Normal].borderWidth).toBe(
        mockConfig.theme!.panel.borderWidth
      );
    });
  });

  describe("show", () => {
    it("should set initial scale to 0", () => {
      const panel = new Panel(mockConfig);
      panel.show();
      expect(mockScene.rexUI.add.sizer().setScale).toHaveBeenCalledWith(0);
    });

    it("should add tween to scale from 0 to 1", () => {
      const panel = new Panel(mockConfig);
      panel.show();
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          targets: expect.anything(),
          scaleX: 1,
          scaleY: 1,
          duration: 500, // default duration
          ease: "Back.easeOut",
        })
      );
    });

    it("should use provided duration for tween", () => {
      const panel = new Panel(mockConfig);
      const customDuration = 1000;
      panel.show(customDuration);
      expect(mockScene.tweens.add).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: customDuration,
        })
      );
    });

    it("should return this for chaining", () => {
      const panel = new Panel(mockConfig);
      const result = panel.show();
      expect(result).toBe(panel);
    });
  });

  describe("getElement", () => {
    it("should return the underlying sizer", () => {
      const panel = new Panel(mockConfig);
      const element = panel.getElement();
      expect(element).toBe(mockScene.rexUI.add.sizer());
    });
  });

  describe("constructor with custom element", () => {
    it("should use the provided element instead of creating a sizer", () => {
      // Create a mock element with necessary methods
      const mockElement = {
        setDepth: jest.fn().mockReturnThis(),
        setOrigin: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        off: jest.fn().mockReturnThis(),
        // Add methods needed for updateRender
        setFillStyle: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
      };

      // Create Panel with custom element
      const configWithElement = {
        ...mockConfig,
        element: mockElement as any,
      };

      const panel = new Panel(configWithElement);

      // Verify the element was used
      expect(panel.getElement()).toBe(mockElement);

      // Verify setOrigin was called on the custom element
      expect(mockElement.setOrigin).toHaveBeenCalledWith(0.5);
    });
  });
});
