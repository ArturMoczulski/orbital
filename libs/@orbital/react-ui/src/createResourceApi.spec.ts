/// <reference types="jest" />
import { describe, it, expect } from "@jest/globals";
import { createResourceApi } from "./createResourceApi";

class Test {
  constructor(public id: number, public name: string) {}
}

describe("createResourceApi", () => {
  const api = createResourceApi(Test);

  it("sets correct reducerPath", () => {
    expect(api.reducerPath).toBe("testApi");
  });

  it("includes correct tagTypes", () => {
    expect((api as any).tagTypes).toEqual(["Test"]);
  });

  it("generates getList endpoint", () => {
    const names = Object.keys((api as any).endpoints);
    expect(names).toContain("getTests");
  });

  it("generates getById endpoint", () => {
    const names = Object.keys((api as any).endpoints);
    expect(names).toContain("getTest");
  });

  it("generates create endpoint", () => {
    const names = Object.keys((api as any).endpoints);
    expect(names).toContain("createTest");
  });

  it("generates update endpoint", () => {
    const names = Object.keys((api as any).endpoints);
    expect(names).toContain("updateTest");
  });

  it("generates patch endpoint", () => {
    const names = Object.keys((api as any).endpoints);
    expect(names).toContain("patchTest");
  });
});
