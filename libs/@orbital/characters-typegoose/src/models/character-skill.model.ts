import { prop } from "@typegoose/typegoose";

/**
 * Enum for skill names, duplicated from @orbital/characters to avoid circular dependencies
 */
export enum SkillName {
  // Aesthetics & Performance
  ACTING = "Acting",
  BODY_LANGUAGE = "Body Language",
  DANCE = "Dance",
  FAST_TALK = "Fast-Talk",
  FILM_TV = "Film/TV",
  MUSICAL_INSTRUMENT = "Musical Instrument",
  SING = "Sing",
  STAGECRAFT = "Stagecraft",

  // Body-Control
  CART = "Cart",
  CLIMBING = "Climbing",
  DRIVE = "Drive",
  DODGE = "Dodge",
  JUMP = "Jump",
  RIDE = "Ride",
  SWIM = "Swim",
  THROWING = "Throwing",
  WEIGHT_LIFTING = "Weight Lifting",

  // Combat & Weapon
  AXE_MACE = "Axe/Mace",
  BOW = "Bow",
  CLUB = "Club",
  CROSSBOW = "Crossbow",
  GUN_TL0_2 = "Gun: TL0-2",
  GUN_TL3 = "Gun: TL3",
  GUN_TL4 = "Gun: TL4",
  GUN_TL5 = "Gun: TL5",
  GUN_TL6 = "Gun: TL6",
  GUN_TL7 = "Gun: TL7",
  GUN_TL8 = "Gun: TL8",
  GUN_TL9_12 = "Gun: TL9-12",
  GRAPPLE = "Grapple",
  KNIFE = "Knife",
  SHIELD = "Shield",
  SPEAR = "Spear",
  STAFF = "Staff",
  SWORD = "Sword",
  WRESTLING = "Wrestling",

  // Communication
  ANIMAL_HANDLING = "Animal Handling",
  BEHAVIOR = "Behavior",
  CULTURAL_UNDERSTANDING = "Cultural Understanding",
  FLATTERY = "Flattery",
  FORGERY = "Forgery",
  INTIMIDATION = "Intimidation",
  LEADERSHIP = "Leadership",
  LOCALS = "Locals",
  OPINION = "Opinion",
  PERSUASION = "Persuasion",
  SEDUCTION = "Seduction",
  STREETWISE = "Streetwise",
  TEACHING = "Teaching",

  // Observation
  DETECT = "Detect",
  DISGUISE = "Disguise",
  HEARING = "Hearing",
  SEARCH = "Search",
  SHADOWING = "Shadowing",
  SPOT = "Spot",

  // Tradecraft
  ALERTNESS = "Alertness",
  CAMOUFLAGE = "Camouflage",
  CONCEALMENT = "Concealment",
  ESCAPOLOGY = "Escapology",
  HAZARD_HANDLING = "Hazard Handling",
  TAILING = "Tailing",
  TRACKING = "Tracking",

  // Crafting
  BLACKSMITH = "Blacksmith",
  CARPENTRY = "Carpentry",
  ELECTRONICS_REPAIR = "Electronics Repair",
  PAINTING = "Painting",
  PLUMBING = "Plumbing",
  SEWING = "Sewing",
  TAILORING = "Tailoring",
  WEAPONSMITH = "Weaponsmith",

  // Academic & Knowledge
  ARCHAEOLOGY = "Archaeology",
  BIOLOGY = "Biology",
  CHEMISTRY = "Chemistry",
  ECONOMICS = "Economics",
  ENGINEERING = "Engineering",
  HISTORY = "History",
  LAW = "Law",
  LANGUAGES = "Languages",
  MATHEMATICS = "Mathematics",
  MEDICINE = "Medicine",
  PHILOSOPHY = "Philosophy",
  PHYSICS = "Physics",
  PSYCHOLOGY = "Psychology",

  // Military
  COMMAND = "Command",
  DRILL = "Drill",
  EXPLOSIVES = "Explosives",
  MILITARY_TACTICS = "Military Tactics",
  RECONNAISSANCE = "Reconnaissance",
  SIGNALS = "Signals",
  SURVIVAL = "Survival",

  // Outdoorsman
  AGRICULTURE = "Agriculture",
  ANIMAL_HUSBANDRY = "Animal Husbandry",
  BOATING = "Boating",
  FISHING = "Fishing",
  HUNTING = "Hunting",
  NATURALIST = "Naturalist",
  TRAPPING = "Trapping",

  // Technical
  AUTOMOTIVE_REPAIR = "Automotive Repair",
  COMPUTER_OPERATION = "Computer Operation",
  LOCKPICKING = "Lockpicking",
  MECHANIC = "Mechanic",
  NAVIGATION = "Navigation",
  PHOTOGRAPHY = "Photography",
  ROBOTICS = "Robotics",
  SURVEILLANCE = "Surveillance",

  // Thief
  PICKPOCKET = "Pickpocket",
  SLEIGHT_OF_HAND = "Sleight of Hand",
  SNEAK = "Sneak",

  // Reaction
  REACTION_ROLLS = "Reaction Rolls",
}

/**
 * Interface for character skill properties
 */
export interface CharactersSkillProps {
  name: SkillName;
  level: number;
}

/**
 * TypeGoose model for embedded CharactersSkill sub-document.
 * Implements CharactersSkillProps directly to avoid circular dependencies.
 */
export class CharactersSkillModel implements CharactersSkillProps {
  @prop({ enum: SkillName, required: true })
  name!: SkillName;

  @prop({ required: true })
  level!: number;

  constructor(data: Partial<CharactersSkillProps> = {}) {
    if (data.name !== undefined) this.name = data.name;
    if (data.level !== undefined) this.level = data.level;
  }
}
