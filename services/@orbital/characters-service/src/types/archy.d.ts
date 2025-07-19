declare module "archy" {
  interface ArchyData {
    label: string;
    nodes?: (ArchyData | string)[];
  }

  function archy(data: ArchyData, prefix?: string, opts?: any): string;

  export = archy;
}
