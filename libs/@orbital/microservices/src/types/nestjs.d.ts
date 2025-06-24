import { Observable } from "rxjs";

declare module "@nestjs/common" {
  export function Global(): ClassDecorator;
  export function Injectable(): ClassDecorator;
  export function Catch(...exceptions: any[]): ClassDecorator;
  export interface OnModuleInit {
    onModuleInit(): any;
  }
  export interface RpcExceptionFilter<T = any> {
    catch(exception: T, host: ArgumentsHost): Observable<any>;
  }
  export interface ArgumentsHost {
    getType(): string;
    switchToRpc(): RpcArgumentsHost;
    getArgs<T extends Array<any> = any[]>(): T;
  }
  export interface RpcArgumentsHost {
    getData<T = any>(): T;
    getContext<T = any>(): T;
  }
}

declare module "@nestjs/event-emitter" {
  export class EventEmitter2 {
    emit(event: string, payload: any): any;
  }
}

declare module "@nestjs/microservices" {
  import { Observable } from "rxjs";
  export interface ClientProxy {
    send<T>(pattern: string, data: any): Observable<T>;
  }
  export class RpcException {
    constructor(error: any);
    getError(): any;
  }
  export function MessagePattern(pattern: string): MethodDecorator;
}
