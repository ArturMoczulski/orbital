/**
 * @jest-environment jsdom
 */
import Atom, { AtomConfig, AtomState } from "./Atom";
import Theme from "../theme/Theme";
import Colors from "../utils/Colors";

const phaserMock = require(`phaser-mock`);

describe("Atom", () => {
  let mockScene: any;
  let mockConfig: AtomConfig;

  beforeEach(() => {
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
      add: {
        text: jest.fn().mockReturnValue({
          setOrigin: jest.fn().mockReturnThis(),
          disableInteractive: jest.fn().mockReturnThis(),
          // Mock style setters for updateRender
          setFillStyle: jest.fn().mockReturnThis(),
          setAlpha: jest.fn().mockReturnThis(),
          setStrokeStyle: jest.fn().mockReturnThis(),
        }),
      },
      tweens: {
        add: jest.fn(),
      },
    };

    mockConfig = {
      scene: mockScene,
      theme: new Theme(),
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
      const atom = new Atom(mockConfig);
      expect(atom).toBeDefined();
    });

    it("should use default theme if none provided", () => {
      const configWithoutTheme = { ...mockConfig } as any;
      delete configWithoutTheme.theme;
      const atom = new Atom(configWithoutTheme);
      expect(atom).toBeDefined();
    });

    it("should set up event listeners", () => {
      const atom = new Atom(mockConfig);
      expect(mockScene.events.on).toHaveBeenCalledWith(
        "update",
        expect.any(Function),
        expect.any(Object)
      );
    });

    it("should add content if provided", () => {
      // Restore the original add implementation for this test
      jest.spyOn(Atom.prototype, "add").mockRestore();

      // Create a mock that properly implements the expected interface
      const contentMock = new Atom({ scene: mockScene });

      const configWithContent = {
        ...mockConfig,
        content: [contentMock],
      };

      // Spy on add to verify it's called
      const spy = jest.spyOn(Atom.prototype, "add");

      // Create the atom with content
      const atom = new Atom(configWithContent);

      // Verify add was called with our mock
      expect(spy).toHaveBeenCalledWith(contentMock);
    });
  });

  describe("constructor with custom element", () => {
    it("should use the provided element instead of creating a sizer", () => {
      // Create a mock element with all required methods
      const mockElement = {
        setDepth: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        off: jest.fn().mockReturnThis(),
        // Add methods needed for updateRender
        setFillStyle: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
      };

      // Create Atom with custom element
      const configWithElement = {
        ...mockConfig,
        element: mockElement as any,
      };

      const atom = new Atom(configWithElement);

      // Verify the element was used
      expect(atom.getElement()).toBe(mockElement);
    });

    it("should call setDepth on custom element when adding content", () => {
      // Create a mock element with all required methods
      const mockElement = {
        setDepth: jest.fn().mockReturnThis(),
        setPosition: jest.fn().mockReturnThis(),
        setInteractive: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        off: jest.fn().mockReturnThis(),
        add: jest.fn().mockReturnThis(),
        // Add methods needed for updateRender
        setFillStyle: jest.fn().mockReturnThis(),
        setAlpha: jest.fn().mockReturnThis(),
        setStrokeStyle: jest.fn().mockReturnThis(),
      };

      // Create Atom with custom element
      const configWithElement = {
        ...mockConfig,
        element: mockElement as any,
      };

      const atom = new Atom(configWithElement);

      // Create a content element with setDepth
      const contentElement = {
        setDepth: jest.fn().mockReturnThis(),
      };

      // Mock getElement to return our content element
      const contentAtom = new Atom(mockConfig);
      jest
        .spyOn(contentAtom, "getElement")
        .mockReturnValue(contentElement as any);

      // Add the content
      atom.add(contentAtom);

      // Verify setDepth was called on the content element
      expect(contentElement.setDepth).toHaveBeenCalledWith(1);
    });
  });

  describe("recalculateProperties", () => {
    it("should compute properties based on current state", () => {
      // We don't need to restore the mock here since we're using the global mock
      // from beforeEach which safely returns 'this'

      const atom = new Atom(mockConfig);
      const props = atom.recalculateProperties();
      expect(props).toBeDefined();
      expect(props.width).toBeDefined();
      expect(props.height).toBeDefined();
    });

    it("should normalize fontSize when provided as number", () => {
      const configWithNumFontSize = {
        ...mockConfig,
        fontSize: 16,
      };
      const atom = new Atom(configWithNumFontSize);
      const props = atom.recalculateProperties();
      expect(props.fontSize).toBe("16px");
    });

    it("should normalize fontSize when provided as string", () => {
      const configWithStrFontSize = {
        ...mockConfig,
        fontSize: "1.5rem",
      };
      const atom = new Atom(configWithStrFontSize);
      const props = atom.recalculateProperties();
      expect(props.fontSize).toBe("1.5rem");
    });

    it("should use theme default fontSize when none provided", () => {
      const atom = new Atom(mockConfig);
      const props = atom.recalculateProperties();
      expect(props.fontSize).toBe(mockConfig.theme?.fontSizes.md);
    });

    it("should normalize color when provided as number", () => {
      const configWithNumColor = {
        ...mockConfig,
        color: 0xff0000,
      };
      const atom = new Atom(configWithNumColor);
      const props = atom.recalculateProperties();
      expect(props.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it("should normalize color when provided as string", () => {
      const configWithStrColor = {
        ...mockConfig,
        color: "#ff0000",
      };
      const atom = new Atom(configWithStrColor);
      const props = atom.recalculateProperties();
      expect(props.color).toBe("#ff0000");
    });

    it("should use theme default color when none provided", () => {
      const atom = new Atom(mockConfig);
      const props = atom.recalculateProperties();
      expect(props.color).toBeDefined();
    });

    it("should update calculatedProperties property", () => {
      const atom = new Atom(mockConfig);
      atom.recalculateProperties();
      expect((atom as any).calculatedProperties).toBeDefined();
      expect((atom as any).calculatedProperties.width).toBeDefined();
    });
  });

  describe("computeDimension", () => {
    let atom: any;
    beforeEach(() => {
      atom = new Atom(mockConfig);
    });

    it("should return percentage of reference when value is percentage string", () => {
      const result = atom.computeDimension("50%", 200);
      expect(result).toBe(100);
    });

    it("should return value directly when value is number", () => {
      expect(atom.computeDimension(42, 200)).toBe(42);
    });

    it("should return reference value when value is undefined", () => {
      expect(atom.computeDimension(undefined, 150)).toBe(150);
    });
  });

  describe("getReferenceDimensions", () => {
    it("should return parent container dimensions when available", () => {
      const atom = new Atom(mockConfig);
      (atom as any).element.parentContainer = { width: 10, height: 20 };
      const ref = (atom as any).getReferenceDimensions();
      expect(ref).toEqual({ width: 10, height: 20 });
    });

    it("should return scene scale dimensions when parent container not available", () => {
      const atom = new Atom(mockConfig);
      delete (atom as any).element.parentContainer;
      const ref = (atom as any).getReferenceDimensions();
      expect(ref).toEqual({
        width: mockScene.scale.width,
        height: mockScene.scale.height,
      });
    });

    it("should return theme defaults when neither parent nor scene scale available", () => {
      const atom = new Atom(mockConfig);
      delete (atom as any).element.parentContainer;
      mockScene.scale = undefined;
      const ref = (atom as any).getReferenceDimensions();
      expect(ref).toEqual({
        width: mockConfig.theme!.buttonWidth,
        height: mockConfig.theme!.buttonHeight,
      });
    });
  });

  describe("baseStyle", () => {
    it("should return default style properties for normal and hover states", () => {
      const atom = new Atom(mockConfig);
      const base = (atom as any).baseStyle();
      expect(base[AtomState.Normal]).toEqual(base[AtomState.Hover]);
      expect(base[AtomState.Normal].width).toBe(mockConfig.theme!.buttonWidth);
    });
  });

  describe("defaultStyle", () => {
    it("should return empty style overrides for normal and hover states", () => {
      const atom = new Atom(mockConfig);
      const def = (atom as any).defaultStyle();
      expect(def[AtomState.Normal]).toEqual({});
      expect(def[AtomState.Hover]).toEqual({});
    });
  });

  describe("buildStyleProps", () => {
    it("should merge base, subclass, and user styles correctly", () => {
      const custom = { ...mockConfig, width: 99, hover: { width: 50 } };
      const atom = new Atom(custom);
      const props = (atom as any).buildStyleProps(custom);
      expect(props[AtomState.Normal].width).toBe(99);
      expect(props[AtomState.Hover].width).toBe(50);
    });

    it("should apply hover styles to hover state", () => {
      const custom = { ...mockConfig, hover: { backgroundColor: 12345 } };
      const atom = new Atom(custom);
      const props = (atom as any).buildStyleProps(custom);
      expect(props[AtomState.Hover].backgroundColor).toBe(12345);
    });
  });

  describe("style", () => {
    let atom: any;
    beforeEach(() => {
      atom = new Atom(mockConfig);
    });

    it("should return current style properties when called without arguments", () => {
      const style = atom.style();
      expect(style).toEqual(atom.styleProps);
    });

    it("should update normal state style when called with style object", () => {
      atom.style({ backgroundColor: "#ff0000" });
      const style = atom.style();
      expect(style[AtomState.Normal].backgroundColor).toBe("#ff0000");
    });

    it("should update specific state style when called with state and style object", () => {
      atom.style(AtomState.Hover, { backgroundColor: "#00ff00" });
      const style = atom.style();
      expect(style[AtomState.Hover].backgroundColor).toBe("#00ff00");
    });
  });

  describe("getElement", () => {
    it("should return the underlying game object", () => {
      const atom = new Atom(mockConfig);
      const element = atom.getElement();
      expect(element).toBe((atom as any).element);
    });
  });

  describe("updateRender", () => {
    // We need to temporarily remove the mock to test the actual updateRender method
    let originalMock: jest.SpyInstance;

    beforeEach(() => {
      // Store the original mock and remove it
      originalMock = jest.spyOn(Atom.prototype as any, "updateRender");
      originalMock.mockRestore();
    });

    afterEach(() => {
      // Re-mock updateRender after tests
      jest
        .spyOn(Atom.prototype as any, "updateRender")
        .mockImplementation(() => {});
    });

    it("should update background color when defined", () => {
      const atom = new Atom(mockConfig);
      const bg = {
        setFillStyle: jest.fn(),
        setAlpha: jest.fn(),
        setStrokeStyle: jest.fn(),
      };
      (atom as any).backgroundRect = bg;
      atom.style({
        backgroundColor: 999,
        backgroundAlpha: 0.5,
        borderWidth: 2,
        borderColor: 111,
      });
      (atom as any).state = AtomState.Normal;
      (atom as any).updateRender();
      expect(bg.setFillStyle).toHaveBeenCalledWith(999);
    });

    it("should update background alpha when defined", () => {
      const atom = new Atom(mockConfig);
      const bg = {
        setFillStyle: jest.fn(),
        setAlpha: jest.fn(),
        setStrokeStyle: jest.fn(),
      };
      (atom as any).backgroundRect = bg;
      atom.style({ backgroundAlpha: 0.25 });
      (atom as any).state = AtomState.Normal;
      (atom as any).updateRender();
      expect(bg.setAlpha).toHaveBeenCalledWith(0.25);
    });

    it("should update border style when width and color defined", () => {
      const atom = new Atom(mockConfig);
      const bg = {
        setFillStyle: jest.fn(),
        setAlpha: jest.fn(),
        setStrokeStyle: jest.fn(),
      };
      (atom as any).backgroundRect = bg;
      atom.style({ borderWidth: 3, borderColor: 654 });
      (atom as any).state = AtomState.Normal;
      (atom as any).updateRender();
      expect(bg.setStrokeStyle).toHaveBeenCalledWith(3, 654);
    });
  });

  describe("add", () => {
    let atom: any;
    let sizer: any;
    beforeEach(() => {
      // Restore the original add implementation for these tests
      jest.spyOn(Atom.prototype, "add").mockRestore();

      atom = new Atom(mockConfig);
      sizer = (atom as any).sizer;
    });

    it("should add Atom element to sizer", () => {
      const childAtom = new Atom(mockConfig);
      // Mock the getElement method to return an object with setDepth
      jest.spyOn(childAtom, "getElement").mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
      } as any);
      atom.add(childAtom);
      expect(sizer.add).toHaveBeenCalledWith(childAtom.getElement(), {
        align: "center",
        expand: true,
      });
      expect(sizer.layout).toHaveBeenCalled();
    });

    it("should not call setDepth if element doesn't have the method", () => {
      const childAtom = new Atom(mockConfig);
      // Mock the getElement method to return an object WITHOUT setDepth
      const elementWithoutSetDepth = {};
      jest
        .spyOn(childAtom, "getElement")
        .mockReturnValue(elementWithoutSetDepth as any);

      // This should not throw an error
      atom.add(childAtom);

      // Verify the element was still added to the sizer
      expect(sizer.add).toHaveBeenCalledWith(elementWithoutSetDepth, {
        align: "center",
        expand: true,
      });
    });

    it("should add GameObject directly to sizer", () => {
      // Create a mock GameObject
      const mockSetDepth = jest.fn().mockReturnThis();
      const gameObject = new phaserMock.GameObjects.GameObject(mockScene);
      gameObject.setDepth = mockSetDepth;

      // Add the object to the atom
      atom.add(gameObject as any);

      // Verify it was added directly to the sizer
      expect(sizer.add).toHaveBeenCalledWith(gameObject, {
        align: "center",
        expand: true,
      });
      expect(sizer.layout).toHaveBeenCalled();
      expect(mockSetDepth).toHaveBeenCalledWith(1);
    });

    it("should use provided alignment", () => {
      const childAtom = new Atom(mockConfig);
      // Mock the getElement method to return an object with setDepth
      jest.spyOn(childAtom, "getElement").mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
      } as any);
      atom.add(childAtom, "left");
      expect(sizer.add).toHaveBeenCalledWith(childAtom.getElement(), {
        align: "left",
        expand: true,
      });
    });

    it("should use provided expand setting", () => {
      const childAtom = new Atom(mockConfig);
      // Mock the getElement method to return an object with setDepth
      jest.spyOn(childAtom, "getElement").mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
      } as any);
      atom.add(childAtom, "center", false);
      expect(sizer.add).toHaveBeenCalledWith(childAtom.getElement(), {
        align: "center",
        expand: false,
      });
    });

    it("should layout sizer after adding content", () => {
      const childAtom = new Atom(mockConfig);
      // Mock the getElement method to return an object with setDepth
      jest.spyOn(childAtom, "getElement").mockReturnValue({
        setDepth: jest.fn().mockReturnThis(),
      } as any);
      sizer.layout.mockClear();
      atom.add(childAtom);
      expect(sizer.layout).toHaveBeenCalled();
    });

    it("should reproduce the browser TypeError issue", () => {
      // Create an object that mimics what's happening in the browser
      // This object has a getElement method that returns an object that would cause
      // the TypeError: Cannot read properties of undefined (reading 'length')
      const problematicObject = {
        getElement: jest.fn().mockReturnValue({
          // This object doesn't have the expected properties
          // It's missing setDepth and other required methods
          // When trying to access properties of this object, it should cause a TypeError
          // similar to what happens in the browser
        }),
      };

      // This should work with our fix, but would fail without it
      atom.add(problematicObject as any);

      // If we get here, the test passes (with our fix)
      // Without our fix, it would throw a TypeError
      expect(true).toBe(true);
    });
  });
});
