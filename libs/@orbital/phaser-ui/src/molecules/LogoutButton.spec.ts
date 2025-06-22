/// <reference types="jest" />
// Mock the base Button to simplify UI logic in tests
jest.mock("../atoms/Button", () => {
  return {
    default: class {
      scene: any;
      container: any;
      constructor(config: any) {
        this.scene = config.scene;
        const handlers: Record<string, Function> = {};
        this.container = {
          on: (event: string, cb: Function) => {
            handlers[event] = cb;
            return this.container;
          },
          emit: (event: string) => {
            handlers[event]?.();
          },
        };
        if (config.onClick) {
          this.container.on("pointerdown", config.onClick);
        }
      }
      getElement() {
        return this.container;
      }
    },
  };
});

import { describe, expect, it, beforeEach, jest } from "@jest/globals";
import { ClientEvent } from "../events";
const PhaserMock: any = require("phaser");
import LogoutButton, { LogoutButtonConfig } from "./LogoutButton";

describe("LogoutButton", () => {
  let config: LogoutButtonConfig;
  let themeMock: any;
  let sceneMock: any;

  beforeEach(() => {
    jest.clearAllMocks();
    themeMock = {
      buttonWidth: 10,
      buttonHeight: 10,
      background: 0,
      formBackgroundAlpha: 1,
      formBorderColor: 0,
      formBorderWidth: 1,
      smallRadius: 1,
      spacing: { sm: 1 },
      colors: { text: 0 },
      fontSizes: { md: "12px" },
    } as any;
    sceneMock = PhaserMock.createMockScene();
    config = { scene: sceneMock, theme: themeMock };
  });

  it("should be instance of LogoutButton", () => {
    const lb = new LogoutButton(config);
    expect(lb.constructor.name).toBe("LogoutButton");
  });

  it("emits the AuthLogout event on click", () => {
    const lb = new LogoutButton(config);
    const container = (lb as any).getElement();
    container.emit("pointerdown");
    expect(sceneMock.events.emit).toHaveBeenCalledWith(ClientEvent.AuthLogout);
  });
});
