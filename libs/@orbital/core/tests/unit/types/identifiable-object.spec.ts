import { IdentifiableObject } from "../../../src/types/identifiable-object";

describe("IdentifiableObject", () => {
  it("should generate a UUID when no id is provided", () => {
    const obj = new IdentifiableObject();

    expect(obj.id).toBeDefined();
    expect(typeof obj.id).toBe("string");
    expect(obj.id.length).toBe(36); // UUID format
  });

  it("should use the provided id when available", () => {
    const obj = new IdentifiableObject({ id: "custom-id" });

    expect(obj.id).toBe("custom-id");
  });

  it("should create a mock object with a random UUID", () => {
    const mock = IdentifiableObject.mock();

    expect(mock).toBeInstanceOf(IdentifiableObject);
    expect(mock.id).toBeDefined();
    expect(typeof mock.id).toBe("string");
    expect(mock.id.length).toBe(36); // UUID format
  });

  it("should create a mock object with custom properties", () => {
    const mock = IdentifiableObject.mock({ id: "custom-mock-id" });

    expect(mock).toBeInstanceOf(IdentifiableObject);
    expect(mock.id).toBe("custom-mock-id");
  });
});
