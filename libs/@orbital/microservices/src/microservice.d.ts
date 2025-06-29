import { ClientProxy, RpcException } from "@nestjs/microservices";
import { BulkCountedResponse, BulkItemizedResponse, BulkResponse } from "@orbital/bulk-operations";
export declare class MicroserviceUnavailable extends RpcException {
    microservice: string;
    constructor(microservice: string);
}
export declare class UnrecognizedMicroserviceMessagePattern extends RpcException {
    microservice: string;
    messagePattern: string;
    args: any;
    constructor(microservice: string, messagePattern: string, args: any);
}
export declare abstract class Microservice {
    protected readonly clientProxy: ClientProxy;
    readonly microservice?: string | undefined;
    static RPC_TIMEOUT: number;
    private readonly isDebugMode;
    constructor(clientProxy: ClientProxy, microservice?: string | undefined);
    private rpcPipeline;
    /**
     * Sends a request to the microservice and returns the response.
     * @param message The message pattern to send to the microservice.
     * @param params The data to send with the message.
     */
    request<T>(message: string, params?: any, msTimeout?: number): Promise<T | null>;
    /**
     * Sends a request to the microservice and wraps the result in a BulkResponse.
     */
    statusBulkRequest(message: string, params: any): Promise<BulkResponse>;
    /**
     * Sends a request to the microservice and wraps the result in a BulkCountedResponse.
     */
    countedBulkRequest(message: string, params: any): Promise<BulkCountedResponse>;
    /**
     * Sends a request to the microservice and wraps the result in a BulkItemizedResponse.
     */
    itemizedBulkRequest<DataItemType = any, ResultItemDataType = any>(message: string, params: any): Promise<BulkItemizedResponse<DataItemType, ResultItemDataType>>;
}
