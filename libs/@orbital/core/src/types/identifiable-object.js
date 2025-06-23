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
var IdentifiableObject_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifiableObject = exports.IdentifiableObjectSchema = void 0;
const crypto_1 = require("crypto");
const faker_1 = require("@faker-js/faker");
const base_object_1 = require("./base-object");
const zod_1 = require("zod");
const zod_schema_decorator_1 = require("../decorators/zod-schema.decorator");
/** Zod schema for IdentifiableObject */
exports.IdentifiableObjectSchema = zod_1.z
    .object({
    id: zod_1.z.string().describe("Unique identifier for the object"),
})
    .describe("An object with a unique identifier");
/**
 * IdentifiableObject provides id generation and assignment on top of BaseObject.
 */
let IdentifiableObject = IdentifiableObject_1 = class IdentifiableObject extends base_object_1.BaseObject {
    constructor(data) {
        var _a;
        const id = (_a = data === null || data === void 0 ? void 0 : data.id) !== null && _a !== void 0 ? _a : (0, crypto_1.randomUUID)();
        super(Object.assign(Object.assign({}, data), { id }));
        this.id = id;
    }
    /** Create a mock IdentifiableObject with a random UUID */
    static mock(overrides = {}) {
        var _a;
        return new IdentifiableObject_1(Object.assign({ id: (_a = overrides.id) !== null && _a !== void 0 ? _a : faker_1.faker.string.uuid() }, overrides));
    }
};
exports.IdentifiableObject = IdentifiableObject;
exports.IdentifiableObject = IdentifiableObject = IdentifiableObject_1 = __decorate([
    (0, zod_schema_decorator_1.ZodSchema)(exports.IdentifiableObjectSchema),
    __metadata("design:paramtypes", [Object])
], IdentifiableObject);
