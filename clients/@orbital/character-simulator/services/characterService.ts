import { Character, ConversationThread, LifeEvent } from "../store";

// Function to load all available characters
export const loadCharacters = async (): Promise<Character[]> => {
  try {
    const response = await fetch("/api/characters");
    if (!response.ok) {
      throw new Error(`Error loading characters: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to load characters:", error);
    // For development, return some mock data
    return [
      {
        id: "lexiblake",
        name: "Lexi Blake",
        filePath: "lexiblake",
      },
    ];
  }
};

// Function to load life events for a specific character
export const loadLifeEvents = async (
  characterId: string
): Promise<LifeEvent[]> => {
  try {
    // Get the character's file path from the characters list
    const characters = await loadCharacters();
    const character = characters.find((char) => char.id === characterId);

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // Load all timeline files for the character
    return await loadLifeEventsFromPath(character.filePath);
  } catch (error) {
    console.error(
      `Failed to load life events for character ${characterId}:`,
      error
    );
    // Return empty array if there's an error
    return [];
  }
};

// Function to load character data from a file path
export const loadCharacterFromPath = async (
  filePath: string
): Promise<Character | null> => {
  try {
    // For lexiblake, we need to transform the character data to match our Character interface
    if (filePath === "lexiblake") {
      // Try both possible paths for character data
      let response = await fetch(`/data/${filePath}/character.json`);

      // If the first path fails, try an alternative path
      if (!response.ok) {
        console.log(`Trying alternative path for character data`);
        response = await fetch(`/public/data/${filePath}/character.json`);

        if (!response.ok) {
          throw new Error(
            `Error loading character data: ${response.statusText}`
          );
        }
      }

      const characterData = await response.json();

      // Transform the data to match our Character interface
      return {
        id: filePath,
        name: `${characterData.firstName} ${characterData.lastName}`,
        filePath: filePath,
      };
    } else {
      // For other characters, try both paths
      let response = await fetch(`/data/${filePath}/character.json`);

      // If the first path fails, try an alternative path
      if (!response.ok) {
        console.log(`Trying alternative path for character data`);
        response = await fetch(`/public/data/${filePath}/character.json`);

        if (!response.ok) {
          throw new Error(
            `Error loading character data: ${response.statusText}`
          );
        }
      }

      return await response.json();
    }
  } catch (error) {
    console.error(`Failed to load character from path ${filePath}:`, error);
    return null;
  }
};

// Function to load life events for a character from a file path
export const loadLifeEventsFromPath = async (
  filePath: string
): Promise<LifeEvent[]> => {
  try {
    // For lexiblake, we need to load multiple timeline files
    if (filePath === "lexiblake") {
      // Get all timeline files
      const allEvents: LifeEvent[] = [];

      // We know there are timeline files for dates from 2025-07-18 to 2025-07-30
      // This could be made more dynamic by fetching a list of available files
      const dates = [
        "2025-07-18",
        "2025-07-19",
        "2025-07-20",
        "2025-07-21",
        "2025-07-22",
        "2025-07-23",
        "2025-07-24",
        "2025-07-25",
        "2025-07-26",
        "2025-07-27",
        "2025-07-28",
        "2025-07-29",
        "2025-07-30",
      ];

      // Load each timeline file and combine the events
      for (const date of dates) {
        try {
          // Try both possible paths for timeline files
          let response = await fetch(`/data/${filePath}/timeline/${date}.json`);

          // If the first path fails, try an alternative path
          if (!response.ok) {
            console.log(`Trying alternative path for ${date}`);
            response = await fetch(
              `/public/data/${filePath}/timeline/${date}.json`
            );
          }

          if (response.ok) {
            const events = await response.json();
            // Use the events directly as they already match our LifeEvent interface
            const transformedEvents = events.map((event: any) => ({
              timestamp: event.timestamp,
              location: event.location || "",
              activity: event.activity,
              emotionalState: event.emotionalState || "",
              thoughts: event.thoughts || "",
              decisions: event.decisions || "",
              needsFulfilled: event.needsFulfilled || [],
              socialMediaContent: event.socialMediaContent || undefined,
            }));
            allEvents.push(...transformedEvents);
          } else {
            console.error(
              `Failed to load timeline for date ${date}: ${response.status} ${response.statusText}`
            );
          }
        } catch (innerError) {
          console.error(
            `Failed to load timeline for date ${date}:`,
            innerError
          );
          // Continue with other dates even if one fails
        }
      }

      // Sort events by timestamp
      return allEvents.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    } else {
      // For other characters, try the original approach
      const response = await fetch(`/data/${filePath}/life_events.json`);
      if (!response.ok) {
        throw new Error(`Error loading life events: ${response.statusText}`);
      }
      return await response.json();
    }
  } catch (error) {
    console.error(`Failed to load life events from path ${filePath}:`, error);
    return [];
  }
};

// Function to load conversation threads for a specific character
export const loadConversationThreads = async (
  characterId: string
): Promise<ConversationThread[]> => {
  try {
    // Get the character's file path from the characters list
    const characters = await loadCharacters();
    const character = characters.find((char) => char.id === characterId);

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // Try to load the conversation threads file
    try {
      // Try both possible paths for conversation threads
      let response = await fetch(
        `/data/${character.filePath}/conversations/threads.json`
      );

      // If the first path fails, try an alternative path
      if (!response.ok) {
        console.log(`Trying alternative path for conversation threads`);
        response = await fetch(
          `/public/data/${character.filePath}/conversations/threads.json`
        );
      }

      if (response.ok) {
        return await response.json();
      } else {
        console.log(
          `No existing conversation threads found, returning empty array`
        );
        return [];
      }
    } catch (innerError) {
      console.error(`Failed to load conversation threads:`, innerError);
      return [];
    }
  } catch (error) {
    console.error(
      `Failed to load conversation threads for character ${characterId}:`,
      error
    );
    return [];
  }
};

// Function to save conversation threads for a specific character
export const saveConversationThreads = async (
  characterId: string,
  threads: ConversationThread[]
): Promise<boolean> => {
  try {
    // Get the character's file path from the characters list
    const characters = await loadCharacters();
    const character = characters.find((char) => char.id === characterId);

    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    // Save the conversation threads
    const response = await fetch(`/api/conversations/${characterId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(threads),
    });

    if (!response.ok) {
      throw new Error(
        `Error saving conversation threads: ${response.statusText}`
      );
    }

    return true;
  } catch (error) {
    console.error(
      `Failed to save conversation threads for character ${characterId}:`,
      error
    );
    return false;
  }
};

// Function to validate thread name (ensure it's filesystem safe)
export const validateThreadName = (name: string): boolean => {
  // Check if the name is empty or contains invalid characters
  if (!name || name.trim() === "") {
    return false;
  }

  // Check for filesystem-unsafe characters
  const unsafeChars = /[<>:"/\\|?*\x00-\x1F]/g;
  if (unsafeChars.test(name)) {
    return false;
  }

  // Check if the name is too long (max 255 characters)
  if (name.length > 255) {
    return false;
  }

  return true;
};
