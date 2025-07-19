declare module "json-stringify-safe" {
  function stringify(
    obj: any,
    replacer?: (key: string, value: any) => any,
    spaces?: string | number,
    cycleReplacer?: (key: string, value: any) => any
  ): string;

  export = stringify;
}
