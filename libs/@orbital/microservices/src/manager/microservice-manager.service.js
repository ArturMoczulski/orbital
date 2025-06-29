"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var MicroserviceManagerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MicroserviceManagerService = exports.MicroserviceRegistry = exports.MicroserviceManagerEvents = void 0;
const common_1 = require("@nestjs/common");
const event_emitter_1 = require("@nestjs/event-emitter");
const microservices_1 = require("@nestjs/microservices");
const microservice_1 = require("../microservice");
/**
 * Events emitted when microservices go up or down.
 */
var MicroserviceManagerEvents;
(function (MicroserviceManagerEvents) {
    MicroserviceManagerEvents["Available"] = "microservice.available";
    MicroserviceManagerEvents["Unavailable"] = "microservice.unavailable";
})(MicroserviceManagerEvents || (exports.MicroserviceManagerEvents = MicroserviceManagerEvents = {}));
/**
 * Watches the NATS Service Framework for service-heartbeats
 * and emits Nest events when service status changes.
 */
/**
 * Registry of known microservices for health monitoring.
 */
class MicroserviceRegistry {
    constructor() {
        this.services = new Set();
    }
    static getInstance() {
        if (!MicroserviceRegistry.instance) {
            MicroserviceRegistry.instance = new MicroserviceRegistry();
        }
        return MicroserviceRegistry.instance;
    }
    register(serviceName) {
        this.services.add(serviceName);
    }
    getAll() {
        return Array.from(this.services);
    }
}
exports.MicroserviceRegistry = MicroserviceRegistry;
/**
 * Watches the NATS Service Framework for service-heartbeats
 * and emits Nest events when service status changes.
 */
let MicroserviceManagerService = MicroserviceManagerService_1 = class MicroserviceManagerService extends microservice_1.Microservice {
    constructor(clientProxy, nc, eventEmitter) {
        super(clientProxy);
        this.nc = nc;
        this.eventEmitter = eventEmitter;
        this.logger = new common_1.Logger(MicroserviceManagerService_1.name);
        this.registry = MicroserviceRegistry.getInstance();
        this.statusMap = {};
    }
    /**
     * Register a microservice for health monitoring
     */
    registerService(serviceName) {
        this.registry.register(serviceName);
        this.logger.log(`Registered service for monitoring: ${serviceName}`);
    }
    async onModuleInit() {
        try {
            // Check if NATS services API is available
            // @ts-ignore - Ignore TypeScript error for NATS services API
            if (this.nc.services && typeof this.nc.services.watch === "function") {
                // Get a service watcher for all services (*)
                // @ts-ignore - Ignore TypeScript error for NATS services API
                const iter = this.nc.services.watch("*");
                // Start async processing of service events
                (async () => {
                    var _a, e_1, _b, _c;
                    try {
                        for (var _d = true, iter_1 = __asyncValues(iter), iter_1_1; iter_1_1 = await iter_1.next(), _a = iter_1_1.done, !_a; _d = true) {
                            _c = iter_1_1.value;
                            _d = false;
                            const ev = _c;
                            // Check if service is up based on status
                            const up = ev.status === "OK";
                            // Emit the appropriate event with service info
                            this.eventEmitter.emit(up
                                ? MicroserviceManagerEvents.Available
                                : MicroserviceManagerEvents.Unavailable, { microservice: ev.name });
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (!_d && !_a && (_b = iter_1.return)) await _b.call(iter_1);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                })().catch((err) => {
                    console.error("Error in microservice watcher:", err);
                });
            }
            else {
                console.log("NATS services API not available, microservice watcher disabled");
            }
        }
        catch (err) {
            console.error("Failed to initialize microservice watcher:", err);
        }
    }
    /**
     * Clean up resources on module destroy
     */
    onModuleDestroy() {
        // Close any resources if needed
        this.logger.log("Cleaning up microservice manager resources");
    }
};
exports.MicroserviceManagerService = MicroserviceManagerService;
exports.MicroserviceManagerService = MicroserviceManagerService = MicroserviceManagerService_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)("NATS_CLIENT")),
    __param(1, (0, common_1.Inject)("NatsConnection")),
    __metadata("design:paramtypes", [microservices_1.ClientProxy, Object, event_emitter_1.EventEmitter2])
], MicroserviceManagerService);
//# sourceMappingURL=microservice-manager.service.js.map