import {
  Character as BaseCharacter,
  Character,
  CreatureType,
  Gender,
  Race,
} from "@orbital/characters";
import { World } from "@orbital/core";
import { modelOptions, prop } from "@typegoose/typegoose";
import { Reference } from "../decorators/reference.decorator";
import { AttributesModel } from "./attributes.model";
import { BeliefModel } from "./belief.model";
import { CharactersSkillModel } from "./character-skill.model";
import { DesireModel } from "./desire.model";
import { GoalModel } from "./goal.model";
import { HistoryEventModel } from "./history-event.model";
import { IntentionModel } from "./intention.model";
import { MemoryModel } from "./memory.model";
import { PsychologicalProfileModel } from "./psychological-profile.model";
import { RelationModel } from "./relation.model";

@modelOptions({
  schemaOptions: {
    collection: Character.name,
    timestamps: true,
    _id: true, // Allow MongoDB to override the _id
  },
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
  currentLocation?: string;

  @prop({ _id: false, type: () => AttributesModel, required: true })
  attributes!: AttributesModel;

  @prop({ _id: false, type: () => PsychologicalProfileModel, required: true })
  psychologicalProfile!: PsychologicalProfileModel;

  @prop({ _id: false, type: () => [CharactersSkillModel] })
  override skills?: CharactersSkillModel[];

  // Additional BaseCharacter properties
  @prop({ type: () => [String] })
  inventory?: string[];

  @prop({ type: () => [BeliefModel], _id: false })
  beliefs?: BeliefModel[];

  @prop({ type: () => [DesireModel], _id: false })
  desires?: DesireModel[];

  @prop({ type: () => [IntentionModel], _id: false })
  intentions?: IntentionModel[];

  @prop({ type: () => [GoalModel], _id: false })
  goals?: GoalModel[];

  @prop({ type: () => [MemoryModel], _id: false })
  memories?: MemoryModel[];

  @prop({ type: () => [HistoryEventModel], _id: false })
  historyEvents?: HistoryEventModel[];

  // Original history property from Character class
  override history?: {
    event: string;
    date?: string;
    location?: string;
    significance?: number;
  }[];

  @prop({ type: () => [RelationModel], _id: false })
  relations?: RelationModel[];

  @prop({ type: () => [String] })
  tags?: string[];

  @prop({ enum: Object.values(CreatureType), required: true })
  creatureType!: CreatureType;

  @prop({ required: true })
  @Reference({ collection: World.name })
  worldId!: string;
}
