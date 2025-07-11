import {
  Character,
  CharacterSchema,
} from "@orbital/characters/src/types/character";
import { TreeExplorer, useWorld } from "@orbital/react-ui";
import { useEffect, useState } from "react";
import {
  useCharactersControllerFindByIdQuery,
  useCharactersControllerFindQuery,
} from "../../services/adminApi.generated";
import { CharacterActionsButtons } from "./CharacterActionsButtons";

// Define an interface that extends Character to include the required name property
interface CharacterWithName extends Character {
  name: string;
}

interface CharactersExplorerProps {
  onSelect: (character: Character, characterDetails: Character) => void;
}

/**
 * Character-specific implementation of TreeExplorer
 * Fetches character list and on-demand character details, then notifies parent via onSelect.
 */
export default function CharactersExplorer({
  onSelect,
}: CharactersExplorerProps) {
  const { worldId } = useWorld();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(
    null
  );

  const {
    data: characterDetails,
    isLoading: isDetailsLoading,
    error: detailsError,
  } = useCharactersControllerFindByIdQuery(
    { _id: selectedCharacter?._id! },
    { skip: !selectedCharacter }
  ) as { data?: Character; isLoading: boolean; error?: unknown };

  useEffect(() => {
    if (selectedCharacter && characterDetails) {
      onSelect(selectedCharacter, characterDetails);
    }
  }, [selectedCharacter, characterDetails, onSelect]);

  // Use the enhanced TreeExplorer with API-based functionality
  return (
    <TreeExplorer<CharacterWithName>
      type="Character"
      schema={CharacterSchema as any}
      itemActions={(
        character: CharacterWithName,
        defaultActions: React.ReactNode
      ) => (
        <CharacterActionsButtons
          character={character}
          onViewDetails={(e: React.MouseEvent, characterObj: Character) =>
            setSelectedCharacter(characterObj)
          }
          defaultActions={defaultActions}
        />
      )}
      // Custom query function to filter by worldId
      query={() => {
        // Use the built-in query hook
        const result = useCharactersControllerFindQuery({
          worldId: worldId || undefined,
        });

        // Create a properly typed version of the query result
        const typedResult = result as unknown as {
          data?: Character[];
          isLoading: boolean;
          error?: any;
        };

        // If we have data and a worldId, filter the characters by worldId and add name property
        if (typedResult.data && worldId) {
          return {
            ...typedResult,
            data: typedResult.data
              .filter((character: Character) => character.worldId === worldId)
              .map((character: Character) => ({
                ...character,
                // Create a name property from firstName and lastName
                name: `${character.firstName} ${character.lastName}`,
              })) as CharacterWithName[],
          };
        }

        // If we have data but no worldId filter, still need to add name property
        if (typedResult.data) {
          return {
            ...typedResult,
            data: typedResult.data.map((character: Character) => ({
              ...character,
              name: `${character.firstName} ${character.lastName}`,
            })) as CharacterWithName[],
          };
        }

        return {
          ...typedResult,
          data: [],
        };
      }}
    />
  );
}
