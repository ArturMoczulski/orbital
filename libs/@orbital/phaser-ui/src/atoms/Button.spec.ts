import Button, { ButtonConfig } from "./Button";
import Atom, { AtomState } from "./Atom";
import Theme from "../theme/Theme";
import Colors from "../utils/Colors";

describe("Button", () => {
  // Mock dependencies
  let mockScene: any;
  let mockConfig: ButtonConfig;

  beforeEach(() => {
    // Prevent updateRender in Atom constructor
    jest
      .spyOn(Atom.prototype as any, "updateRender")
      .mockImplementation(() => {});
    // Prevent Atom.updateRender during Button constructor
    jest
      .spyOn(Atom.prototype as any, "updateRender")
      .mockImplementation(() => {});
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
            setInnerPadding: jest.fn().mockReturnThis(),
            getChildren: jest.fn().mockReturnValue([]),
            setScale: jest.fn().mockReturnThis(),
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
      add: {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          disableInteractive: jest.fn().mockReturnThis(),
        }),
      },
    };

    // Setup mock config
    mockConfig = {
      scene: mockScene,
      theme: new Theme(),
      text: "Button Text",
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      backgroundColor: "#ffffff",
      onClick: jest.fn(),
    };
  });

  describe("constructor", () => {
    it("should initialize with provided config", () => {
      const button = new Button(mockConfig);
      expect(button).toBeDefined();
    });

    it("should create text object with button text", () => {
      const button = new Button(mockConfig);
      expect(mockScene.add.text).toHaveBeenCalledWith(
        0,
        0,
        mockConfig.text,
        expect.objectContaining({
          fontFamily: expect.any(String),
          fontSize: expect.any(String),
          color: expect.any(String),
          align: "center",
        })
      );
    });

    it("should add text to sizer with center alignment and expand", () => {
      const button = new Button(mockConfig);
      // Verify text was added to sizer with correct options
      expect(mockScene.rexUI.add.sizer().add).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          align: "center",
          expand: true,
        })
      );
    });

    it("should layout the sizer after adding text", () => {
      const button = new Button(mockConfig);
      expect(mockScene.rexUI.add.sizer().layout).toHaveBeenCalled();
    });
  });

  describe("baseStyle", () => {
    it("should return style with theme button properties", () => {
      // Access the protected baseStyle method using type assertion
      const button = new Button(mockConfig);
      const baseStyle = (button as any).baseStyle();

      // Check normal state
      expect(baseStyle[AtomState.Normal]).toMatchObject({
        padding: expect.any(Number),
        width: expect.any(Number),
        height: expect.any(Number),
        backgroundColor: expect.anything(),
        borderColor: expect.anything(),
        borderWidth: expect.any(Number),
        backgroundAlpha: expect.any(Number),
      });

      // Check hover state
      expect(baseStyle[AtomState.Hover]).toMatchObject({
        backgroundColor: expect.anything(),
      });
    });

    it("should use theme button properties", () => {
      const theme = new Theme();
      mockConfig.theme = theme;

      const button = new Button(mockConfig);
      const baseStyle = (button as any).baseStyle();

      expect(baseStyle[AtomState.Normal].padding).toBe(theme.button.padding);
      expect(baseStyle[AtomState.Normal].width).toBe(theme.button.width);
      expect(baseStyle[AtomState.Normal].height).toBe(theme.button.height);
    });
  });

  describe("init", () => {
    it("should call super.init()", () => {
      // Use type assertion to access the protected init method
      const superInitSpy = jest.spyOn(Atom.prototype as any, "init");
      const button = new Button(mockConfig);

      expect(superInitSpy).toHaveBeenCalled();

      superInitSpy.mockRestore();
    });

    it("should create and add text object", () => {
      const createTextSpy = jest.spyOn(
        Button.prototype as any,
        "createTextObject"
      );
      const button = new Button(mockConfig);

      expect(createTextSpy).toHaveBeenCalledWith(mockConfig.text);
      expect(mockScene.rexUI.add.sizer().add).toHaveBeenCalled();
      expect(mockScene.rexUI.add.sizer().layout).toHaveBeenCalled();

      createTextSpy.mockRestore();
    });
  });

  describe("createTextObject", () => {
    it("should create a text object with correct properties", () => {
      const button = new Button(mockConfig);
      const textObject = (button as any).createTextObject("Test Text");

      expect(mockScene.add.text).toHaveBeenCalledWith(
        0,
        0,
        "Test Text",
        expect.objectContaining({
          fontFamily: expect.any(String),
          fontSize: expect.any(String),
          color: expect.any(String),
          align: "center",
        })
      );

      // Just verify that setOrigin was called at least once
      expect(textObject.setOrigin).toHaveBeenCalled();
    });
  });
});
