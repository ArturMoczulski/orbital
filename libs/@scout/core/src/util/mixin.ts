export function applyMixins(derivedCtor: any, baseCtors: any[]) {
  baseCtors.forEach((baseCtor) => {
    Object.getOwnPropertyNames(baseCtor.prototype).forEach((name) => {
      if (
        name !== "constructor" &&
        // Only copy if the property is not already defined on the derived prototype.
        !Object.prototype.hasOwnProperty.call(derivedCtor.prototype, name)
      ) {
        Object.defineProperty(
          derivedCtor.prototype,
          name,
          Object.getOwnPropertyDescriptor(
            baseCtor.prototype,
            name
          ) as PropertyDescriptor
        );
      }
    });
  });
}
