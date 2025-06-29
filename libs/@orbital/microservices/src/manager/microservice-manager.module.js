"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var MicroserviceManagerModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroserviceManagerModule = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const microservice_manager_service_1 = require("./microservice-manager.service");
const event_emitter_1 = require("@nestjs/event-emitter");
/**
 * Module for microservice discovery and health monitoring.
 * Provides the MicroserviceManagerService which monitors microservice availability
 * and emits events when services go up or down.
 */
let MicroserviceManagerModule = MicroserviceManagerModule_1 = class MicroserviceManagerModule {
    /**
     * Configure the MicroserviceManagerModule to use existing NATS client and connection
     * from the application module.
     *
     * @param options Configuration options
     * @returns Dynamic module configuration
     */
    static forRoot(options = {}) {
        const clientToken = options.clientToken || "NATS_CLIENT";
        const connectionToken = options.connectionToken || "NatsConnection";
        const natsUrl = options.natsUrl || "nats://localhost:4222";
        return {
            module: MicroserviceManagerModule_1,
            imports: [microservices_1.ClientsModule],
            providers: [
                {
                    provide: microservice_manager_service_1.MicroserviceManagerService,
                    useFactory: (clientProxy, natsConnection, eventEmitter) => {
                        return new microservice_manager_service_1.MicroserviceManagerService(clientProxy, natsConnection, eventEmitter);
                    },
                    inject: [clientToken, connectionToken, event_emitter_1.EventEmitter2.name],
                },
            ],
            exports: [microservice_manager_service_1.MicroserviceManagerService],
        };
    }
};
exports.MicroserviceManagerModule = MicroserviceManagerModule;
exports.MicroserviceManagerModule = MicroserviceManagerModule = MicroserviceManagerModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], MicroserviceManagerModule);
//# sourceMappingURL=microservice-manager.module.js.map