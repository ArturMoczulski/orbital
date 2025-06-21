import * as stringify from "json-stringify-safe";
import { updateAndVerifyMany } from "../prisma/extensions";
import * as _ from "lodash";

export class PrismaExtensions {
  static extend(client: any) {
    if (client.verbose) {
      client.$use(async (params, next) => {
        const before = Date.now();
        const result = await next(params);
        const after = Date.now();
        client.logger?.log(
          `Query ${params.model}.${params.action} ${stringify(
            params.args
          )} took ${after - before}ms`,
          "PrismaService"
        );
        return result;
      });
    }
    client.$extends(updateAndVerifyMany);
  }

  static options(options: any, verbose: boolean = false) {
    const defaults: any = {};

    if (verbose) {
      options.log = ["query"];
    }

    _.defaultsDeep(options, defaults);

    return options;
  }
}
