import { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
/**
 * Catches all exceptions in RPC context and wraps them in an observable error object.
 */
export declare class MicroserviceExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: any, host: ArgumentsHost): any;
}
