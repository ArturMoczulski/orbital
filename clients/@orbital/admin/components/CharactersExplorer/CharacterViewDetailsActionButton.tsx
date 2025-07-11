import PersonIcon from "@mui/icons-material/Person";
import { Character } from "@orbital/characters/src/types/character";
import React from "react";
import { CharacterActionButton } from "./CharacterActionButton";
import { CharacterTreeNodeCustomAction } from "./CharacterActionsButtons";

/**
 * Props for the CharacterViewDetailsActionButton component
 */
export interface CharacterViewDetailsActionButtonProps {
  /**
   * The character object
   */
  character: Character;

  /**
   * Callback function when the view details button is clicked
   * Receives the React event and the character object
   */
  onClick: (e: React.MouseEvent, character: Character) => void;
}

/**
 * A specialized action button for viewing character details
 * Extends the base CharacterActionButton with character-specific functionality
 */
export function CharacterViewDetailsActionButton({
  character,
  onClick,
}: CharacterViewDetailsActionButtonProps) {
  return (
    <CharacterActionButton
      character={character}
      actionType={CharacterTreeNodeCustomAction.ViewDetails}
      icon={<PersonIcon fontSize="small" />}
      onClick={(e, character) => onClick(e, character)}
      title="View Details"
    />
  );
}
