declare module "humanize-duration" {
  function humanizeDuration(
    milliseconds: number,
    options?: {
      language?: string;
      fallbacks?: string[];
      delimiter?: string;
      spacer?: string;
      largest?: number;
      units?: string[];
      round?: boolean;
      decimal?: string;
      conjunction?: string;
      serialComma?: boolean;
      unitMeasures?: {
        y?: number;
        mo?: number;
        w?: number;
        d?: number;
        h?: number;
        m?: number;
        s?: number;
        ms?: number;
      };
    }
  ): string;

  export = humanizeDuration;
}
