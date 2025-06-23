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
var Position_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = exports.PositionSchema = void 0;
const zod_1 = require("zod");
const base_object_1 = require("./base-object");
const faker_1 = require("@faker-js/faker");
const zod_schema_decorator_1 = require("../decorators/zod-schema.decorator");
/** Zod schema for Position */
exports.PositionSchema = zod_1.z
    .object({
    x: zod_1.z
        .number()
        .describe("X coordinate of the position, in meters from origin"),
    y: zod_1.z
        .number()
        .describe("Y coordinate of the position, in meters from origin"),
    z: zod_1.z.number().describe("Z coordinate (height), in meters above ground"),
})
    .describe("3D position in cartesian space");
/**
 * Domain class for Position with auto-assignment and mock factory.
 */
let Position = Position_1 = class Position extends base_object_1.BaseObject {
    constructor(data) {
        var _a, _b, _c;
        super(data);
        this.x = 0;
        this.y = 0;
        this.z = 0;
        // Initialize with default values if not provided
        this.x = (_a = data === null || data === void 0 ? void 0 : data.x) !== null && _a !== void 0 ? _a : 0;
        this.y = (_b = data === null || data === void 0 ? void 0 : data.y) !== null && _b !== void 0 ? _b : 0;
        this.z = (_c = data === null || data === void 0 ? void 0 : data.z) !== null && _c !== void 0 ? _c : 0;
    }
    /** Create a fake Position instance */
    static mock(overrides = {}) {
        return new Position_1(Object.assign({ x: faker_1.faker.number.int({ min: -1000, max: 1000 }), y: faker_1.faker.number.int({ min: -1000, max: 1000 }), z: faker_1.faker.number.int({ min: -1000, max: 1000 }) }, overrides));
    }
};
exports.Position = Position;
exports.Position = Position = Position_1 = __decorate([
    (0, zod_schema_decorator_1.ZodSchema)(exports.PositionSchema),
    __metadata("design:paramtypes", [Object])
], Position);
