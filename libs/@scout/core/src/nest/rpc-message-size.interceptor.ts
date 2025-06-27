import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import stringify from "json-stringify-safe";
import * as client from "prom-client";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

// Histogram for RPC request message sizes
const rpcRequestSizeHistogram = new client.Histogram({
  name: "rpc_request_message_size_bytes",
  help: "Size of incoming RPC request messages in bytes",
  labelNames: ["pattern"],
  buckets: [100, 500, 1000, 2000, 5000, 10000],
});

// Histogram for RPC response message sizes
const rpcResponseSizeHistogram = new client.Histogram({
  name: "rpc_response_message_size_bytes",
  help: "Size of outgoing RPC response messages in bytes",
  labelNames: ["pattern"],
  buckets: [100, 500, 1000, 2000, 5000, 10000],
});

@Injectable()
export class RpcMessageSizeInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RpcMessageSizeInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Only apply this interceptor to RPC messages
    if (context.getType() !== "rpc") {
      return next.handle();
    }

    // Typically, for microservices, context.getArgs() returns an array where:
    // - args[0]: The message pattern (subject)
    // - args[1]: The actual payload
    const args = context.getArgs();
    const pattern = args[0] || "unknown";
    const payload = args[1];

    if (payload) {
      let requestSize = 0;
      if (Buffer.isBuffer(payload)) {
        requestSize = payload.length;
      } else if (typeof payload === "string") {
        requestSize = Buffer.byteLength(payload, "utf8");
      } else {
        requestSize = Buffer.byteLength(stringify(payload), "utf8");
      }

      rpcRequestSizeHistogram.labels(String(pattern)).observe(requestSize);
    }

    return next.handle().pipe(
      tap((response) => {
        if (response) {
          let responseSize = 0;
          if (Buffer.isBuffer(response)) {
            responseSize = response.length;
          } else if (typeof response === "string") {
            responseSize = Buffer.byteLength(response, "utf8");
          } else {
            responseSize = Buffer.byteLength(stringify(response), "utf8");
          }

          rpcResponseSizeHistogram
            .labels(String(pattern))
            .observe(responseSize);
        }
      })
    );
  }
}
