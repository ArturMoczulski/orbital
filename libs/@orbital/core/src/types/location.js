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
var Location_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Location = exports.LocationSchema = void 0;
const zod_1 = require("zod");
const faker_1 = require("@faker-js/faker");
const base_object_1 = require("./base-object");
const area_1 = require("./area");
const position_1 = require("./position");
const zod_schema_decorator_1 = require("../decorators/zod-schema.decorator");
/** Zod schema for Location */
exports.LocationSchema = zod_1.z
    .object({
    area: area_1.AreaSchema.describe("Area this location belongs to"),
    position: position_1.PositionSchema.describe("Position of this location"),
    name: zod_1.z.string().describe("Name of the location"),
    description: zod_1.z
        .string()
        .optional()
        .describe("Optional description of the location"),
})
    .describe("A location with an area and position");
/**
 * Domain class for Location with auto-assignment and validation.
 */
let Location = Location_1 = class Location extends base_object_1.BaseObject {
    /** Create a fake Location instance with randomized data */
    static mock(overrides = {}) {
        const base = {
            area: area_1.Area.mock(),
            position: position_1.Position.mock(),
            name: faker_1.faker.location.street(),
            description: faker_1.faker.lorem.sentence(),
        };
        return new Location_1(Object.assign(Object.assign({}, base), overrides));
    }
    constructor(data) {
        // Validate the data
        const validated = exports.LocationSchema.parse(data);
        // Pass empty data to the parent constructor
        super();
        this.area = new area_1.Area({ name: "", position: new position_1.Position() });
        this.position = new position_1.Position();
        this.name = "";
        // Ensure area is properly instantiated as an Area class
        const areaData = validated.area;
        const area = areaData instanceof area_1.Area ? areaData : new area_1.Area(areaData);
        // Ensure position is properly instantiated as a Position class
        const positionData = validated.position;
        const position = positionData instanceof position_1.Position
            ? positionData
            : new position_1.Position(positionData);
        // Assign properties directly
        this.area = area;
        this.position = position;
        this.name = validated.name;
        this.description = validated.description;
    }
};
exports.Location = Location;
exports.Location = Location = Location_1 = __decorate([
    (0, zod_schema_decorator_1.ZodSchema)(exports.LocationSchema),
    __metadata("design:paramtypes", [Object])
], Location);
