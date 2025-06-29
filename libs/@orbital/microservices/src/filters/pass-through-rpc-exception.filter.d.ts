import { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { OrbitalMicroservices } from "@orbital/contracts";
import { Observable } from "rxjs";
/**
 * Exception filter for microservices that preserves original error details in RPC responses.
 *
 * This filter is designed to be used in microservices to ensure that error details,
 * including stack traces and additional context, are properly serialized and passed
 * through to the client. This makes debugging easier by preserving the original
 * error information across service boundaries.
 */
export declare class PassThroughRpcExceptionFilter implements ExceptionFilter {
    private readonly logger;
    private readonly serviceName;
    /**
     * Creates a new instance of the PassThroughRpcExceptionFilter.
     *
     * @param serviceName The name of the microservice using this filter.
     *                    Used to identify the source of errors.
     *                    Can be a string or an OrbitalMicroservices enum value.
     */
    constructor(serviceName?: string | OrbitalMicroservices);
    catch(exception: any, host: ArgumentsHost): Observable<never> | void;
}
