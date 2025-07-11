import { faker } from "@faker-js/faker";
import {
  Attributes,
  Character,
  CharactersSkill,
  CreatureType,
  Desire,
  Gender,
  Goal,
  Intention,
  Memory,
  PsychologicalProfile,
  Race,
  Relation,
  SkillName,
} from "../index";

export function createMockCharacter(): Character {
  const mockCharacter = new Character({ worldId: "test" });
  mockCharacter._id = faker.string.uuid();
  mockCharacter.firstName = faker.person.firstName();
  mockCharacter.lastName = faker.person.lastName();
  mockCharacter.gender = faker.helpers.enumValue(Gender);
  mockCharacter.race = faker.helpers.enumValue(Race);
  mockCharacter.creatureType = faker.helpers.enumValue(CreatureType);
  mockCharacter.attributes = {
    ST: faker.number.int({ min: 1, max: 20 }),
    DX: faker.number.int({ min: 1, max: 20 }),
    IQ: faker.number.int({ min: 1, max: 20 }),
    HT: faker.number.int({ min: 1, max: 20 }),
  } as Attributes;
  mockCharacter.psychologicalProfile = {
    normAdherence: faker.number.float({ min: 0, max: 1 }),
    altruism: faker.number.float({ min: 0, max: 1 }),
    selfCenteredness: faker.number.float({ min: 0, max: 1 }),
    ambition: faker.number.float({ min: 0, max: 1 }),
    happiness: faker.number.float({ min: 0, max: 1 }),
    selfDrive: faker.number.float({ min: 0, max: 1 }),
    authorityNeed: faker.number.float({ min: 0, max: 1 }),
    authorityObedience: faker.number.float({ min: 0, max: 1 }),
    entrepreneurialTendency: faker.number.float({ min: 0, max: 1 }),
    sociability: faker.number.float({ min: 0, max: 1 }),
    romanticAttractionTriggers: {},
  } as PsychologicalProfile;
  mockCharacter.skills = [
    {
      name: faker.helpers.enumValue(SkillName),
      level: faker.number.int({ min: 1, max: 25 }),
    },
  ] as CharactersSkill[];
  mockCharacter.desires = [
    {
      goal: faker.lorem.sentence(),
      priority: faker.number.int({ min: 1, max: 10 }),
    },
  ] as Desire[];
  mockCharacter.intentions = [
    { plan: faker.lorem.sentence(), due: faker.date.future() },
  ] as Intention[];
  mockCharacter.goals = [
    { purpose: faker.lorem.sentence(), timeRange: "long-term" },
  ] as Goal[];
  mockCharacter.memories = [
    {
      timestamp: faker.date.past(),
      description: faker.lorem.sentence(),
      valence: faker.number.int({ min: -10, max: 10 }),
    },
  ] as Memory[];
  mockCharacter.relations = [
    {
      targetId: faker.string.uuid(),
      type: faker.lorem.word(),
      strength: faker.number.int({ min: 1, max: 10 }),
    },
  ] as Relation[];
  mockCharacter.tags = faker.lorem.words(3).split(" ");
  mockCharacter.createdAt = faker.date.past();
  return mockCharacter;
}
