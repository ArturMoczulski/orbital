declare module "errio" {
  export function toObject(error: Error): any;
  export function fromObject(obj: any): Error;
  export function stringify(error: Error): string;
  export function parse(string: string): Error;
  export function register(errorClass: any, options?: any): void;
}
