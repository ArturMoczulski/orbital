import { faker } from "@faker-js/faker";

/**
 * Naming style options for fantasy area generation
 */
export enum FantasyNameStyle {
  /** Traditional fantasy names with race prefixes */
  TRADITIONAL = "traditional",
  /** Names based on elements (fire, water, etc.) */
  ELEMENTAL = "elemental",
  /** Names with mythological references */
  MYTHOLOGICAL = "mythological",
  /** Names with ancient or historical feel */
  ANCIENT = "ancient",
  /** Names with natural features as focus */
  NATURAL = "natural",
  /** Random mix of all styles */
  RANDOM = "random",
}

/**
 * Options for fantasy name generation
 */
export interface FantasyNameOptions {
  /** The naming style to use */
  style?: FantasyNameStyle;
  /** Whether to include a location type (default: true with 90% chance) */
  includeLocationType?: boolean;
  /** Whether to include an adjective (default: true with 70% chance) */
  includeAdjective?: boolean;
  /** Whether to use compound names (default: true with 30% chance) */
  allowCompoundNames?: boolean;
  /** Force a specific location type (optional) */
  locationType?: string;
}

/**
 * Generates a fantasy area name with rich variations
 *
 * This generator is browser-compatible and doesn't rely on Node.js-specific APIs.
 * It creates fantasy names with various styles, patterns, and optional elements.
 *
 * @param options Configuration options for name generation
 * @returns A fantasy area name with the requested characteristics
 */
export function generateFantasyAreaName(
  options: FantasyNameOptions = {}
): string {
  // Set defaults for options
  const style = options.style || randomEnum(FantasyNameStyle);
  const includeLocationType =
    options.includeLocationType !== false && Math.random() < 0.9;
  const includeAdjective =
    options.includeAdjective !== false && Math.random() < 0.5; // Reduced from 0.7 to 0.5
  const allowCompoundNames =
    options.allowCompoundNames !== false && Math.random() < 0.2; // Reduced from 0.3 to 0.2

  // Get name components based on style
  const { prefixes, suffixes, adjectives, locationTypes } =
    getNameComponents(style);

  // Generate base name
  let baseName = "";

  // Ensure we don't create names with conflicting themes
  // For example, don't mix "Orc" with "Elven" or "Dwarven" elements
  if (allowCompoundNames && Math.random() < 0.5) {
    // For compound names, ensure they're from the same thematic group
    // This prevents nonsensical combinations
    const prefix1 = randomItem(prefixes);

    // Filter prefixes that are thematically compatible
    // For simplicity, we'll just use prefixes from the same style
    const compatiblePrefixes = prefixes.filter(
      (p) =>
        // Don't combine race names with other race names
        !(
          isRaceName(prefix1 as string) &&
          isRaceName(p as string) &&
          prefix1 !== p
        )
    );

    const prefix2 = randomItem(compatiblePrefixes);

    // Avoid duplicate prefixes
    if (prefix1 === prefix2) {
      // Simple prefix + suffix
      const suffix = randomItem(suffixes);
      baseName = `${prefix1}${suffix}`;
    } else {
      // Different joining patterns for compound names
      // Removed the lowercase joining pattern as it often creates awkward names
      const joinPatterns = [
        () => `${prefix1}-${prefix2}`,
        () => `${prefix1} ${prefix2}`,
      ];
      baseName = randomItem(joinPatterns)();
    }
  } else {
    const prefix = randomItem(prefixes);
    const suffix = randomItem(suffixes);

    // Different ways to combine prefix and suffix
    // Prefer the simple concatenation for most cases
    const combinePatterns =
      Math.random() < 0.7
        ? [() => `${prefix}${suffix}`]
        : [
            () => `${prefix}${suffix}`,
            () => `${prefix}-${suffix}`,
            () => `${prefix} ${suffix}`,
          ];

    baseName = randomItem(combinePatterns)();
  }

  // Add adjective if requested, but ensure it's thematically appropriate
  if (includeAdjective) {
    // Filter adjectives to match the style of the base name
    const appropriateAdjectives = filterAppropriateAdjectives(
      adjectives,
      baseName,
      style
    );
    const adjective = randomItem(appropriateAdjectives);
    baseName = `${adjective} ${baseName}`;
  }

  // Add location type if requested
  if (includeLocationType) {
    const locationType =
      options.locationType ||
      selectAppropriateLocationType(locationTypes, baseName);

    // Check for redundancy - don't add "Forest" if the name already contains "wood", etc.
    if (hasRedundantLocationTerms(baseName, locationType)) {
      // Just return the base name if adding the location would be redundant
      return baseName;
    }

    // Format patterns for combining base name and location type
    // Simplified to the most natural-sounding patterns
    const patterns = [
      () => `${baseName} ${locationType}`,
      () => `The ${locationType} of ${baseName}`,
      () => `${baseName}'s ${locationType}`,
    ];

    // Special patterns that only apply with adjectives, but only use sometimes
    const adjectivePatterns =
      includeAdjective && Math.random() < 0.3
        ? [
            () => {
              // Extract the adjective from the base name
              const parts = baseName.split(" ");
              const adjective = parts[0];
              const nameWithoutAdjective = parts.slice(1).join(" ");
              return `The ${adjective} ${locationType} of ${nameWithoutAdjective}`;
            },
          ]
        : [];

    const allPatterns = [...patterns, ...adjectivePatterns];
    const randomPattern = randomItem(allPatterns);
    return randomPattern();
  }

  return baseName;
}

/**
 * Check if a prefix is a fantasy race name
 */
function isRaceName(prefix: string): boolean {
  const raceNames = [
    "Dwar",
    "Elf",
    "Orc",
    "Gob",
    "Troll",
    "Gnome",
    "Hob",
    "Fae",
  ];
  return raceNames.some((race) => prefix.includes(race));
}

/**
 * Filter adjectives to be thematically appropriate for the base name
 */
function filterAppropriateAdjectives(
  adjectives: string[],
  baseName: string,
  style: FantasyNameStyle
): string[] {
  // For elemental names, prefer elemental adjectives
  if (
    style === FantasyNameStyle.ELEMENTAL ||
    /flame|frost|storm|thunder|ember|blaze|ice|wind|crystal|stone|iron|steel|silver|gold/i.test(
      baseName
    )
  ) {
    return adjectives.filter(
      (adj) =>
        /fiery|blazing|burning|scorching|freezing|icy|frosty|stormy|thunderous|misty|foggy|steamy|molten|crystalline|metallic|golden|silver/i.test(
          adj
        ) || /ancient|forgotten|lost|hidden|secret|mystic|enchanted/i.test(adj)
    );
  }

  // For mythological names, prefer mythological adjectives
  if (
    style === FantasyNameStyle.MYTHOLOGICAL ||
    /elys|olym|asgard|valhall|hades|styx|titan|chrono|zeus|odin|thor|loki|freya|hera|athena|apollo|artemis/i.test(
      baseName
    )
  ) {
    return adjectives.filter(
      (adj) =>
        /divine|celestial|infernal|olympian|titanic|godly|demonic|angelic|heroic|legendary|mythic|fabled|storied|epic/i.test(
          adj
        ) || /ancient|forgotten|lost|hidden|secret|mystic|enchanted/i.test(adj)
    );
  }

  // For ancient names, prefer ancient adjectives
  if (
    style === FantasyNameStyle.ANCIENT ||
    /babel|byzan|carcas|carth|thebes|memphis|luxor|knossos|troy|sparta|athens|rome|pompeii|babylon/i.test(
      baseName
    )
  ) {
    return adjectives.filter(
      (adj) =>
        /primordial|primeval|antediluvian|archaic|classical|medieval|feudal|imperial|royal|noble|regal|majestic|sovereign/i.test(
          adj
        ) || /ancient|forgotten|lost|hidden|secret/i.test(adj)
    );
  }

  // For natural names, prefer natural adjectives
  if (
    style === FantasyNameStyle.NATURAL ||
    /oak|pine|cedar|willow|birch|maple|aspen|rowan|elm|rose|lily|iris|fern|moss|briar|thorn|ivy|thistle|river|lake|sea|ocean/i.test(
      baseName
    )
  ) {
    return adjectives.filter(
      (adj) =>
        /verdant|lush|barren|desolate|fertile|fecund|abundant|sparse|dense|thick|thin|overgrown|withered|blooming/i.test(
          adj
        ) || /ancient|forgotten|lost|hidden|secret|mystic|enchanted/i.test(adj)
    );
  }

  // For traditional fantasy names, use a wider range but avoid modern-sounding adjectives
  return adjectives.filter((adj) => !/orderly|cheerful/i.test(adj));
}

/**
 * Select a location type that's appropriate for the base name
 */
function selectAppropriateLocationType(
  locationTypes: string[],
  baseName: string
): string {
  // Don't put a port in a mountain or a forest in the sea
  if (/sea|ocean|lake|river|tide|flood|bay|cove|fjord/i.test(baseName)) {
    // Water-related base name
    return randomItem(
      locationTypes.filter((type) =>
        /port|harbor|bay|cove|inlet|fjord|delta|estuary|island|archipelago|peninsula|isthmus/i.test(
          type
        )
      )
    );
  }

  if (/mountain|peak|hill|ridge|highland/i.test(baseName)) {
    // Mountain-related base name
    return randomItem(
      locationTypes.filter((type) =>
        /mountains|peaks|ridge|highland|pass|valley|canyon|gorge|fortress|outpost|citadel|stronghold/i.test(
          type
        )
      )
    );
  }

  if (
    /forest|wood|tree|oak|pine|cedar|willow|birch|maple|aspen|rowan|elm/i.test(
      baseName
    )
  ) {
    // Forest-related base name
    return randomItem(
      locationTypes.filter((type) =>
        /forest|woods|grove|thicket|copse|glade|clearing|sanctuary|outpost/i.test(
          type
        )
      )
    );
  }

  if (/castle|fort|keep|tower|hold|citadel|stronghold/i.test(baseName)) {
    // Castle-related base name
    return randomItem(
      locationTypes.filter((type) =>
        /castle|fortress|tower|keep|palace|citadel|stronghold|outpost|settlement|town|city/i.test(
          type
        )
      )
    );
  }

  // For other cases, return a random location type
  return randomItem(locationTypes);
}

/**
 * Check if adding a location type would be redundant
 */
function hasRedundantLocationTerms(
  baseName: string,
  locationType: string
): boolean {
  const lowercaseBaseName = baseName.toLowerCase();
  const lowercaseLocationType = locationType.toLowerCase();

  // Check for direct redundancy (e.g., "Oakwood Forest")
  if (lowercaseBaseName.includes(lowercaseLocationType)) {
    return true;
  }

  // Check for semantic redundancy
  const redundantPairs = [
    { term: "wood", redundantWith: ["forest", "grove", "thicket", "copse"] },
    { term: "peak", redundantWith: ["mountain", "mountains", "highlands"] },
    { term: "port", redundantWith: ["harbor", "bay", "dock"] },
    {
      term: "castle",
      redundantWith: ["fortress", "citadel", "stronghold", "keep"],
    },
    { term: "village", redundantWith: ["town", "settlement", "hamlet"] },
    { term: "river", redundantWith: ["stream", "brook", "creek"] },
    { term: "lake", redundantWith: ["pond", "reservoir"] },
  ];

  for (const pair of redundantPairs) {
    if (
      lowercaseBaseName.includes(pair.term) &&
      pair.redundantWith.includes(lowercaseLocationType)
    ) {
      return true;
    }

    if (
      pair.redundantWith.some((term) => lowercaseBaseName.includes(term)) &&
      lowercaseLocationType === pair.term
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Get name components based on the selected style
 */
function getNameComponents(style: FantasyNameStyle) {
  // Traditional fantasy race prefixes
  const traditionalPrefixes = [
    "Dwar",
    "Elf",
    "Orc",
    "Gob",
    "Troll",
    "Dragon",
    "Gnome",
    "Hob",
    "Fae",
    "Tir",
    "Gal",
    "Mor",
    "Ith",
    "Zar",
    "Kaz",
    "Thur",
    "Bal",
    "Dol",
    "Bor",
    "Grim",
    "Thal",
    "Dun",
    "Khaz",
    "Ered",
    "Mith",
    "Loth",
    "Gond",
    "Aman",
  ];

  // Elemental-themed prefixes
  const elementalPrefixes = [
    "Flame",
    "Frost",
    "Storm",
    "Thunder",
    "Ember",
    "Blaze",
    "Ice",
    "Wind",
    "Gale",
    "Mist",
    "Ash",
    "Cinder",
    "Spark",
    "Tide",
    "Flood",
    "Torrent",
    "Crystal",
    "Stone",
    "Iron",
    "Steel",
    "Silver",
    "Gold",
    "Copper",
    "Bronze",
  ];

  // Mythological prefixes
  const mythologicalPrefixes = [
    "Elys",
    "Olym",
    "Asgard",
    "Valhall",
    "Hades",
    "Styx",
    "Titan",
    "Chrono",
    "Prome",
    "Atlas",
    "Posei",
    "Zeus",
    "Odin",
    "Thor",
    "Loki",
    "Freya",
    "Hera",
    "Athena",
    "Apollo",
    "Artemis",
    "Hermes",
    "Ares",
    "Heph",
    "Aphro",
    "Demeter",
  ];

  // Ancient/historical prefixes
  const ancientPrefixes = [
    "Babel",
    "Byzan",
    "Carcas",
    "Carth",
    "Thebes",
    "Memphis",
    "Luxor",
    "Knossos",
    "Troy",
    "Sparta",
    "Athens",
    "Rome",
    "Pompeii",
    "Persep",
    "Babylon",
    "Ur",
    "Assur",
    "Nineveh",
    "Hattusa",
    "Antioch",
    "Alexand",
    "Constan",
    "Jerusa",
  ];

  // Nature-focused prefixes
  const naturalPrefixes = [
    "Oak",
    "Pine",
    "Cedar",
    "Willow",
    "Birch",
    "Maple",
    "Aspen",
    "Rowan",
    "Elm",
    "Rose",
    "Lily",
    "Iris",
    "Fern",
    "Moss",
    "Briar",
    "Thorn",
    "Ivy",
    "Thistle",
    "River",
    "Lake",
    "Sea",
    "Ocean",
    "Stream",
    "Brook",
    "Spring",
    "Falls",
  ];

  // Common suffixes for all styles
  const commonSuffixes = [
    "heim",
    "wood",
    "forge",
    "vale",
    "peak",
    "dale",
    "glen",
    "haven",
    "hold",
    "gard",
    "wick",
    "ton",
    "field",
    "ford",
    "bridge",
    "cross",
    "shire",
    "borough",
    "ville",
    "town",
    "port",
    "gate",
    "keep",
    "tower",
    "spire",
    "fall",
    "rise",
    "run",
    "way",
    "path",
    "road",
    "trail",
    "pass",
    "gap",
    "rift",
    "hollow",
  ];

  // Style-specific suffixes
  const elementalSuffixes = [
    "heart",
    "soul",
    "core",
    "crown",
    "veil",
    "shroud",
    "cloak",
    "mantle",
    "shield",
    "blade",
    "edge",
    "point",
    "shard",
    "fragment",
    "splinter",
    "ember",
    "spark",
  ];

  const mythologicalSuffixes = [
    "realm",
    "domain",
    "sphere",
    "plane",
    "world",
    "kingdom",
    "empire",
    "dynasty",
    "legacy",
    "heritage",
    "birthright",
    "throne",
    "crown",
    "scepter",
    "altar",
  ];

  const ancientSuffixes = [
    "ruin",
    "remain",
    "relic",
    "artifact",
    "monument",
    "pillar",
    "column",
    "arch",
    "temple",
    "shrine",
    "sanctuary",
    "haven",
    "refuge",
    "asylum",
    "citadel",
  ];

  const naturalSuffixes = [
    "bloom",
    "blossom",
    "leaf",
    "root",
    "branch",
    "trunk",
    "stem",
    "grove",
    "copse",
    "thicket",
    "meadow",
    "glade",
    "clearing",
    "hollow",
    "den",
    "nest",
    "burrow",
  ];

  // Adjectives for all styles
  const commonAdjectives = [
    "Ancient",
    "Forgotten",
    "Lost",
    "Hidden",
    "Secret",
    "Mystic",
    "Enchanted",
    "Cursed",
    "Blessed",
    "Sacred",
    "Holy",
    "Unholy",
    "Dark",
    "Bright",
    "Shadowy",
    "Luminous",
    "Radiant",
    "Gloomy",
    "Dismal",
    "Cheerful",
    "Peaceful",
    "Violent",
    "Serene",
    "Turbulent",
    "Tranquil",
    "Chaotic",
    "Orderly",
    "Wild",
    "Tame",
  ];

  // Style-specific adjectives
  const elementalAdjectives = [
    "Fiery",
    "Blazing",
    "Burning",
    "Scorching",
    "Freezing",
    "Icy",
    "Frosty",
    "Stormy",
    "Thunderous",
    "Tempestuous",
    "Misty",
    "Foggy",
    "Steamy",
    "Molten",
    "Crystalline",
    "Metallic",
    "Golden",
    "Silver",
    "Copper",
    "Iron",
    "Steel",
  ];

  const mythologicalAdjectives = [
    "Divine",
    "Celestial",
    "Infernal",
    "Olympian",
    "Titanic",
    "Godly",
    "Demonic",
    "Angelic",
    "Heroic",
    "Legendary",
    "Mythic",
    "Fabled",
    "Storied",
    "Epic",
  ];

  const ancientAdjectives = [
    "Primordial",
    "Primeval",
    "Antediluvian",
    "Archaic",
    "Classical",
    "Medieval",
    "Feudal",
    "Imperial",
    "Royal",
    "Noble",
    "Regal",
    "Majestic",
    "Sovereign",
  ];

  const naturalAdjectives = [
    "Verdant",
    "Lush",
    "Barren",
    "Desolate",
    "Fertile",
    "Fecund",
    "Abundant",
    "Sparse",
    "Dense",
    "Thick",
    "Thin",
    "Overgrown",
    "Withered",
    "Blooming",
  ];

  // Location types for all styles
  const commonLocationTypes = [
    "Forest",
    "Mountains",
    "Valley",
    "Hills",
    "Caverns",
    "Ruins",
    "Castle",
    "Village",
    "Citadel",
    "Stronghold",
    "Woods",
    "Highlands",
    "Lowlands",
    "Marsh",
    "Swamp",
    "Peaks",
    "Ridge",
    "Canyon",
    "Gorge",
    "Grotto",
    "Fortress",
    "Tower",
    "Keep",
    "Palace",
    "Temple",
    "Shrine",
    "Cathedral",
    "Monastery",
    "Abbey",
    "Priory",
    "Outpost",
    "Settlement",
    "Town",
    "City",
    "Metropolis",
    "Capital",
    "Port",
    "Harbor",
    "Bay",
    "Cove",
    "Inlet",
    "Fjord",
    "Delta",
    "Estuary",
    "River",
    "Stream",
    "Brook",
    "Creek",
    "Lake",
    "Pond",
    "Reservoir",
    "Sea",
    "Ocean",
    "Island",
    "Archipelago",
    "Peninsula",
    "Isthmus",
    "Plains",
    "Savanna",
    "Steppe",
    "Tundra",
    "Desert",
    "Oasis",
    "Jungle",
    "Rainforest",
    "Glade",
    "Clearing",
    "Meadow",
    "Field",
    "Pasture",
    "Farmland",
  ];

  // Style-specific location types
  const elementalLocationTypes = [
    "Volcano",
    "Caldera",
    "Glacier",
    "Icefield",
    "Thunderpeak",
    "Stormvale",
    "Firepit",
    "Lavapools",
    "Frostgorge",
    "Steamvents",
    "Geysers",
    "Hotsprings",
    "Crystalcaves",
    "Gemfields",
    "Minedeeps",
    "Forgeworks",
    "Foundry",
    "Smithy",
  ];

  const mythologicalLocationTypes = [
    "Pantheon",
    "Necropolis",
    "Underworld",
    "Otherworld",
    "Afterlife",
    "Paradise",
    "Elysium",
    "Valhalla",
    "Olympus",
    "Asgard",
    "Tartarus",
    "Hades",
    "Niflheim",
    "Helheim",
    "Folkvangr",
    "Avalon",
    "Tir na nOg",
    "Annwn",
    "Camelot",
  ];

  const ancientLocationTypes = [
    "Ziggurat",
    "Pyramid",
    "Colosseum",
    "Amphitheater",
    "Aqueduct",
    "Bathhouse",
    "Forum",
    "Agora",
    "Acropolis",
    "Parthenon",
    "Pantheon",
    "Library",
    "Academy",
    "Observatory",
    "Lighthouse",
    "Mausoleum",
    "Tomb",
    "Crypt",
    "Catacomb",
  ];

  const naturalLocationTypes = [
    "Grove",
    "Thicket",
    "Copse",
    "Orchard",
    "Vineyard",
    "Garden",
    "Arboretum",
    "Conservatory",
    "Nursery",
    "Sanctuary",
    "Reserve",
    "Preserve",
    "Habitat",
    "Ecosystem",
    "Biome",
    "Watershed",
    "Basin",
    "Floodplain",
    "Wetland",
    "Bog",
  ];

  // Select components based on style
  let prefixes, suffixes, adjectives, locationTypes;

  switch (style) {
    case FantasyNameStyle.ELEMENTAL:
      prefixes = elementalPrefixes;
      suffixes = [...commonSuffixes, ...elementalSuffixes];
      adjectives = [...commonAdjectives, ...elementalAdjectives];
      locationTypes = [...commonLocationTypes, ...elementalLocationTypes];
      break;
    case FantasyNameStyle.MYTHOLOGICAL:
      prefixes = mythologicalPrefixes;
      suffixes = [...commonSuffixes, ...mythologicalSuffixes];
      adjectives = [...commonAdjectives, ...mythologicalAdjectives];
      locationTypes = [...commonLocationTypes, ...mythologicalLocationTypes];
      break;
    case FantasyNameStyle.ANCIENT:
      prefixes = ancientPrefixes;
      suffixes = [...commonSuffixes, ...ancientSuffixes];
      adjectives = [...commonAdjectives, ...ancientAdjectives];
      locationTypes = [...commonLocationTypes, ...ancientLocationTypes];
      break;
    case FantasyNameStyle.NATURAL:
      prefixes = naturalPrefixes;
      suffixes = [...commonSuffixes, ...naturalSuffixes];
      adjectives = [...commonAdjectives, ...naturalAdjectives];
      locationTypes = [...commonLocationTypes, ...naturalLocationTypes];
      break;
    case FantasyNameStyle.TRADITIONAL:
      prefixes = traditionalPrefixes;
      suffixes = commonSuffixes;
      adjectives = commonAdjectives;
      locationTypes = commonLocationTypes;
      break;
    case FantasyNameStyle.RANDOM:
    default:
      // Combine all options for random style
      prefixes = [
        ...traditionalPrefixes,
        ...elementalPrefixes,
        ...mythologicalPrefixes,
        ...ancientPrefixes,
        ...naturalPrefixes,
      ];
      suffixes = [
        ...commonSuffixes,
        ...elementalSuffixes,
        ...mythologicalSuffixes,
        ...ancientSuffixes,
        ...naturalSuffixes,
      ];
      adjectives = [
        ...commonAdjectives,
        ...elementalAdjectives,
        ...mythologicalAdjectives,
        ...ancientAdjectives,
        ...naturalAdjectives,
      ];
      locationTypes = [
        ...commonLocationTypes,
        ...elementalLocationTypes,
        ...mythologicalLocationTypes,
        ...ancientLocationTypes,
        ...naturalLocationTypes,
      ];
      break;
  }

  return { prefixes, suffixes, adjectives, locationTypes };
}

/**
 * Helper function to get a random item from an array
 */
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Helper function to get a random enum value
 */
function randomEnum<T extends object>(enumObj: T): T[keyof T] {
  const values = Object.values(enumObj).filter(
    (v) => typeof v === "string"
  ) as T[keyof T][];
  return values[Math.floor(Math.random() * values.length)];
}

/**
 * Generate a browser-compatible UUID
 *
 * This function is safe to use in both Node.js and browser environments
 *
 * @returns A UUID string
 */
export function generateUUID(): string {
  return faker.string.uuid();
}
