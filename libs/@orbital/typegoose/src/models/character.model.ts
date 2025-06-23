import { prop, modelOptions } from "@typegoose/typegoose";
import {
  Character as BaseCharacter,
  Gender,
  Race,
  CreatureType,
} from "@orbital/characters";
import { AttributesModel } from "./attributes.model";
import { PsychologicalProfileModel } from "./psychological-profile.model";
import { CharactersSkillModel } from "./character-skill.model";
import { GoalModel } from "./goal.model";
import { IntentionModel } from "./intention.model";
import { DesireModel } from "./desire.model";
import { MemoryModel } from "./memory.model";
import { RelationModel } from "./relation.model";

@modelOptions({
  schemaOptions: { collection: "characters", timestamps: true },
})
export class CharacterModel extends BaseCharacter {
  @prop({ auto: true })
  _id!: string;

  @prop()
  title?: string;

  @prop({ required: true })
  firstName!: string;

  @prop({ required: true })
  lastName!: string;

  @prop()
  override createdAt!: Date;

  @prop({ enum: Object.values(Gender), required: true })
  override gender!: Gender;

  @prop({ enum: Object.values(Race), required: true })
  override race!: Race;

  @prop()
  override currentLocation?: string;

  @prop({ _id: false, type: () => AttributesModel, required: true })
  attributes!: AttributesModel;

  @prop({ _id: false, type: () => PsychologicalProfileModel, required: true })
  psychologicalProfile!: PsychologicalProfileModel;

  @prop({ _id: false, type: () => [CharactersSkillModel] })
  override skills?: CharactersSkillModel[];

  // Additional BaseCharacter properties
  @prop({ type: () => [String] })
  inventory?: string[];

  @prop({ type: () => [Object], _id: false })
  beliefs?: { statement: string; certainty: number }[];

  @prop({ type: () => [DesireModel], _id: false })
  desires?: DesireModel[];

  @prop({ type: () => [IntentionModel], _id: false })
  intentions?: IntentionModel[];

  @prop({ type: () => [GoalModel], _id: false })
  goals?: GoalModel[];

  @prop({ type: () => [MemoryModel], _id: false })
  memories?: MemoryModel[];

  @prop({ type: () => [Object], _id: false })
  history?: {
    eventId: string;
    role: string;
    outcome?: string;
    timestamp: Date;
    locationId?: string;
    coordinates?: { x: number; y: number; z: number };
  }[];

  @prop({ type: () => [RelationModel], _id: false })
  relations?: RelationModel[];

  @prop({ type: () => [String] })
  tags?: string[];

  @prop({ enum: Object.values(CreatureType), required: true })
  creatureType!: CreatureType;
}
