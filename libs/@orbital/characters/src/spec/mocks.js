"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockCharacter = createMockCharacter;
const faker_1 = require("@faker-js/faker");
const index_1 = require("../index");
function createMockCharacter() {
    const mockCharacter = new index_1.Character();
    mockCharacter._id = faker_1.faker.string.uuid();
    mockCharacter.firstName = faker_1.faker.person.firstName();
    mockCharacter.lastName = faker_1.faker.person.lastName();
    mockCharacter.gender = faker_1.faker.helpers.enumValue(index_1.Gender);
    mockCharacter.race = faker_1.faker.helpers.enumValue(index_1.Race);
    mockCharacter.creatureType = faker_1.faker.helpers.enumValue(index_1.CreatureType);
    mockCharacter.position = {
        x: faker_1.faker.number.float(),
        y: faker_1.faker.number.float(),
        z: faker_1.faker.number.float(),
    };
    mockCharacter.attributes = {
        ST: faker_1.faker.number.int({ min: 1, max: 20 }),
        DX: faker_1.faker.number.int({ min: 1, max: 20 }),
        IQ: faker_1.faker.number.int({ min: 1, max: 20 }),
        HT: faker_1.faker.number.int({ min: 1, max: 20 }),
    };
    mockCharacter.psychologicalProfile = {
        normAdherence: faker_1.faker.number.float({ min: 0, max: 1 }),
        altruism: faker_1.faker.number.float({ min: 0, max: 1 }),
        selfCenteredness: faker_1.faker.number.float({ min: 0, max: 1 }),
        ambition: faker_1.faker.number.float({ min: 0, max: 1 }),
        happiness: faker_1.faker.number.float({ min: 0, max: 1 }),
        selfDrive: faker_1.faker.number.float({ min: 0, max: 1 }),
        authorityNeed: faker_1.faker.number.float({ min: 0, max: 1 }),
        authorityObedience: faker_1.faker.number.float({ min: 0, max: 1 }),
        entrepreneurialTendency: faker_1.faker.number.float({ min: 0, max: 1 }),
        sociability: faker_1.faker.number.float({ min: 0, max: 1 }),
        romanticAttractionTriggers: {},
    };
    mockCharacter.skills = [
        {
            name: faker_1.faker.helpers.enumValue(index_1.SkillName),
            level: faker_1.faker.number.int({ min: 1, max: 25 }),
        },
    ];
    mockCharacter.desires = [
        {
            goal: faker_1.faker.lorem.sentence(),
            priority: faker_1.faker.number.int({ min: 1, max: 10 }),
        },
    ];
    mockCharacter.intentions = [
        { plan: faker_1.faker.lorem.sentence(), due: faker_1.faker.date.future() },
    ];
    mockCharacter.goals = [
        { purpose: faker_1.faker.lorem.sentence(), timeRange: "long-term" },
    ];
    mockCharacter.memories = [
        {
            timestamp: faker_1.faker.date.past(),
            description: faker_1.faker.lorem.sentence(),
            valence: faker_1.faker.number.int({ min: -10, max: 10 }),
        },
    ];
    mockCharacter.relations = [
        {
            targetId: faker_1.faker.string.uuid(),
            type: faker_1.faker.lorem.word(),
            strength: faker_1.faker.number.int({ min: 1, max: 10 }),
        },
    ];
    mockCharacter.tags = faker_1.faker.lorem.words(3).split(" ");
    mockCharacter.createdAt = faker_1.faker.date.past();
    return mockCharacter;
}
