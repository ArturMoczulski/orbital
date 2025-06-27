declare module "json-stringify-safe" {
  function stringify(
    obj: any,
    replacer?: (key: string, value: any) => any | null,
    space?: string | number,
    cycleReplacer?: (key: string, value: any) => any
  ): string;

  export default stringify;
  export = stringify;
}
