import { Mobile } from "./mobile";
import { Gender } from "../enums/gender.enum";
import { Race } from "../enums/race.enum";
import { CreatureType } from "../enums/creature-type.enum";
import { Attributes } from "./attributes";
import { PsychologicalProfile } from "./psychological-profile";
import { CharactersSkill } from "./character-skill";
import { Goal } from "./goal";
import { Intention } from "./intention";
import { Desire } from "./desire";
import { Memory } from "./memory";
import { Relation } from "./relation";

/**
 * Represents a living creature in the world.
 */
export class Creature extends Mobile {
  /** Type of creature (e.g., humanoid, animal) */
  creatureType!: CreatureType;

  /** Biological race of the creature */
  race!: Race;

  /** Gender of the creature */
  gender!: Gender;

  /** Core attributes (e.g., ST, DX, IQ, HT) */
  attributes!: Attributes;

  /** Psychological profile scales */
  psychologicalProfile!: PsychologicalProfile;

  /** Learned skills */
  skills?: CharactersSkill[];

  /** Goals the creature is pursuing */
  goals?: Goal[];

  /** Intentions formed by the creature */
  intentions?: Intention[];

  /** Desires motivating the creature */
  desires?: Desire[];

  /** Memories stored by the creature */
  memories?: Memory[];

  /** Relationships to other world objects */
  relations?: Relation[];
}
