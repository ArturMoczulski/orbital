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
var HistoryEvent_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoryEvent = exports.HistoryEventSchema = void 0;
const zod_1 = require("zod");
const faker_1 = require("@faker-js/faker");
const position_1 = require("./position");
const base_object_1 = require("./base-object");
const zod_schema_decorator_1 = require("../decorators/zod-schema.decorator");
/** Zod schema for HistoryEvent */
exports.HistoryEventSchema = zod_1.z
    .object({
    eventId: zod_1.z.string().describe("Unique identifier for the event"),
    participants: zod_1.z
        .array(zod_1.z.string())
        .describe("IDs of participants involved in the event"),
    outcome: zod_1.z.string().optional().describe("Optional outcome description"),
    timestamp: zod_1.z.date().describe("Timestamp when the event occurred"),
    locationId: zod_1.z
        .string()
        .optional()
        .describe("Optional reference to location identifier"),
    coordinates: position_1.PositionSchema.describe("Coordinates where the event took place"),
})
    .describe("A historical event in the world");
/** Represents a historical event in the world as a class with auto-assign and validation */
let HistoryEvent = HistoryEvent_1 = class HistoryEvent extends base_object_1.BaseObject {
    /** Generate a fake HistoryEvent with random data */
    static mock(overrides = {}) {
        const base = {
            eventId: faker_1.faker.string.uuid(),
            participants: [faker_1.faker.string.uuid()],
            outcome: faker_1.faker.lorem.sentence(),
            timestamp: faker_1.faker.date.past(),
            locationId: faker_1.faker.string.uuid(),
            coordinates: position_1.Position.mock(),
        };
        return new HistoryEvent_1(Object.assign(Object.assign({}, base), overrides));
    }
    constructor(data) {
        // Validate the data
        const validated = exports.HistoryEventSchema.parse(data);
        // Pass empty data to the parent constructor
        super();
        this.eventId = "";
        this.participants = [];
        this.timestamp = new Date();
        this.coordinates = new position_1.Position();
        // Ensure coordinates is properly instantiated as a Position class
        const coordinatesData = validated.coordinates;
        const coordinates = coordinatesData instanceof position_1.Position
            ? coordinatesData
            : new position_1.Position(coordinatesData);
        // Assign properties directly
        this.eventId = validated.eventId;
        this.participants = validated.participants;
        this.outcome = validated.outcome;
        this.timestamp = validated.timestamp;
        this.locationId = validated.locationId;
        this.coordinates = coordinates;
    }
};
exports.HistoryEvent = HistoryEvent;
exports.HistoryEvent = HistoryEvent = HistoryEvent_1 = __decorate([
    (0, zod_schema_decorator_1.ZodSchema)(exports.HistoryEventSchema),
    __metadata("design:paramtypes", [Object])
], HistoryEvent);
