import { Character } from "@orbital/characters/src/types/character";
import React from "react";
import { CharacterViewDetailsActionButton } from "./CharacterViewDetailsActionButton";

/**
 * Enum for Character Tree Node Custom Actions
 * Currently only supports ViewDetails action
 *
 * Using an enum provides better type safety and maintainability
 * than string literals
 */
export enum CharacterTreeNodeCustomAction {
  ViewDetails = "ViewDetails",
}

/**
 * Props for the CharacterActionsButtons component
 */
interface CharacterActionsButtonsProps {
  /**
   * The character object
   */
  character: Character;

  /**
   * Callback function when the view details button is clicked
   * Receives the React event and the character object
   */
  onViewDetails: (e: React.MouseEvent, character: Character) => void;

  /**
   * Default actions from TreeExplorer
   */
  defaultActions: React.ReactNode;
}

/**
 * Maps custom action types to their corresponding components
 */
const ACTION_COMPONENTS = {
  [CharacterTreeNodeCustomAction.ViewDetails]: CharacterViewDetailsActionButton,
};

/**
 * Component that renders all actions for a character in the TreeExplorer
 * Dynamically creates buttons based on the CharacterTreeNodeCustomAction enum
 */
export function CharacterActionsButtons({
  character,
  onViewDetails,
  defaultActions,
}: CharacterActionsButtonsProps) {
  // Create a mapping of action handlers
  const actionHandlers = {
    [CharacterTreeNodeCustomAction.ViewDetails]: onViewDetails,
  };

  return (
    <>
      {/* Dynamically render buttons for each custom action */}
      {Object.values(CharacterTreeNodeCustomAction).map((actionType) => {
        const ActionComponent = ACTION_COMPONENTS[actionType];

        // If we have a specialized component for this action, use it
        if (ActionComponent) {
          return (
            <ActionComponent
              key={actionType}
              character={character}
              onClick={actionHandlers[actionType]}
            />
          );
        }

        // Otherwise, use the default TreeNodeActionButton (fallback case)
        return null;
      })}
      {defaultActions}
    </>
  );
}
