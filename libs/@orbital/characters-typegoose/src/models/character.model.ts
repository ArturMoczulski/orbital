import { Reference } from "@orbital/typegoose/src/decorators/reference.decorator";
import { modelOptions, prop } from "@typegoose/typegoose";
import { AttributesModel } from "./attributes.model";
import { BeliefModel } from "./belief.model";
import { CharactersSkillModel } from "./character-skill.model";

/**
 * Enum for creature types, duplicated from @orbital/characters to avoid circular dependencies
 */
export enum CreatureType {
  Humanoid = "humanoid",
  Animal = "animal",
}

/**
 * Enum for gender options, duplicated from @orbital/characters to avoid circular dependencies
 */
export enum Gender {
  Male = "male",
  Female = "female",
  Nonbinary = "nonbinary",
  Other = "other",
  None = "none",
}

/**
 * Enum for race options, duplicated from @orbital/characters to avoid circular dependencies
 */
export enum Race {
  Human = "human",
  Elf = "elf",
  Dwarf = "dwarf",
  Orc = "orc",
}

/**
 * Interface for history event properties
 */
export interface HistoryEventProps {
  event: string;
  date?: string;
  location?: string;
  significance?: number;
}

/**
 * TypeGoose model for embedded HistoryEvent sub-document.
 */
@modelOptions({
  schemaOptions: {
    _id: false,
  },
})
export class HistoryEventModel implements HistoryEventProps {
  @prop({ required: true })
  event!: string;

  @prop()
  date?: string;

  @prop()
  location?: string;

  @prop()
  significance?: number;
}

/**
 * Interface for character properties
 */
export interface CharacterProps {
  _id: string;
  title?: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
  gender: Gender;
  race: Race;
  currentLocation?: string;
  attributes: AttributesModel;
  psychologicalProfile: any; // Will be replaced with PsychologicalProfileModel
  skills?: CharactersSkillModel[];
  inventory?: string[];
  beliefs?: BeliefModel[];
  desires?: any[]; // Will be replaced with DesireModel
  intentions?: any[]; // Will be replaced with IntentionModel
  goals?: any[]; // Will be replaced with GoalModel
  memories?: any[]; // Will be replaced with MemoryModel
  historyEvents?: HistoryEventModel[];
  history?: HistoryEventProps[];
  relations?: any[]; // Will be replaced with RelationModel
  tags?: string[];
  creatureType: CreatureType;
  worldId: string;
}

/**
 * TypeGoose model for Character document.
 * Implements CharacterProps directly to avoid circular dependencies.
 */
@modelOptions({
  schemaOptions: {
    collection: "Character",
    timestamps: true,
    _id: true, // Allow MongoDB to override the _id
  },
})
export class CharacterModel implements CharacterProps {
  @prop({ auto: true })
  _id!: string;

  @prop()
  title?: string;

  @prop({ required: true })
  firstName!: string;

  @prop({ required: true })
  lastName!: string;

  @prop()
  createdAt!: Date;

  @prop()
  updatedAt!: Date;

  @prop({ enum: Object.values(Gender), required: true })
  gender!: Gender;

  @prop({ enum: Object.values(Race), required: true })
  race!: Race;

  @prop()
  currentLocation?: string;

  @prop({ _id: false, type: () => AttributesModel, required: true })
  attributes!: AttributesModel;

  @prop({ _id: false, type: () => Object, required: true })
  psychologicalProfile!: any; // Will be replaced with PsychologicalProfileModel

  @prop({ _id: false, type: () => [CharactersSkillModel] })
  skills?: CharactersSkillModel[];

  @prop({ type: () => [String] })
  inventory?: string[];

  @prop({ type: () => [BeliefModel], _id: false })
  beliefs?: BeliefModel[];

  @prop({ type: () => [Object], _id: false })
  desires?: any[]; // Will be replaced with DesireModel

  @prop({ type: () => [Object], _id: false })
  intentions?: any[]; // Will be replaced with IntentionModel

  @prop({ type: () => [Object], _id: false })
  goals?: any[]; // Will be replaced with GoalModel

  @prop({ type: () => [Object], _id: false })
  memories?: any[]; // Will be replaced with MemoryModel

  @prop({ type: () => [HistoryEventModel], _id: false })
  historyEvents?: HistoryEventModel[];

  // Original history property from Character class
  @prop({ type: () => [Object], _id: false })
  history?: HistoryEventProps[];

  @prop({ type: () => [Object], _id: false })
  relations?: any[]; // Will be replaced with RelationModel

  @prop({ type: () => [String] })
  tags?: string[];

  @prop({ enum: Object.values(CreatureType), required: true })
  creatureType!: CreatureType;

  @prop({ required: true })
  @Reference({ collection: "World" })
  worldId!: string;

  /**
   * Converts this object to a plain JavaScript object without methods or non-enumerable properties.
   * This is useful for serialization, especially when saving to databases.
   *
   * @returns A plain JavaScript object representation of this instance
   */
  toPlainObject(): Record<string, any> {
    const plainObject: Record<string, any> = {};

    // Copy all enumerable properties
    for (const key in this) {
      const value = this[key];
      plainObject[key] = this.convertValueToPlain(value);
    }

    return plainObject;
  }

  /**
   * Helper method to convert a value to its plain representation
   * Handles nested objects, arrays, and primitive values
   *
   * @param value The value to convert
   * @returns The plain representation of the value
   */
  convertValueToPlain(value: any): any {
    // Handle null or undefined
    if (value == null) {
      return value;
    }

    // Handle arrays by mapping each element
    if (Array.isArray(value)) {
      return value.map((item) => this.convertValueToPlain(item));
    }

    // Handle objects with toPlainObject method
    if (
      typeof value === "object" &&
      "toPlainObject" in value &&
      typeof value.toPlainObject === "function"
    ) {
      return value.toPlainObject();
    }

    // Handle other objects (like Date, Map, etc.)
    if (typeof value === "object" && value.constructor !== Object) {
      return value;
    }

    // Handle plain objects recursively
    if (typeof value === "object") {
      const plainObj: Record<string, any> = {};
      for (const key in value) {
        plainObj[key] = this.convertValueToPlain(value[key]);
      }
      return plainObj;
    }

    // Return primitive values as-is
    return value;
  }
}
