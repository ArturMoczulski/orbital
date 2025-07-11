import { Character } from "@orbital/characters/src/types/character";
import { TreeNodeActionButton } from "@orbital/react-ui";
import { CharacterTreeNodeCustomAction } from "./CharacterTypes";

/**
 * Base props for all Character action buttons
 */
export interface CharacterActionButtonProps {
  /**
   * The character object
   */
  character: Character;

  /**
   * The custom action type this button represents
   */
  actionType: CharacterTreeNodeCustomAction;

  /**
   * Icon to display in the button
   */
  icon: JSX.Element;

  /**
   * Title/tooltip for the button
   */
  title: string;

  /**
   * Click handler that receives the React event and the character object
   */
  onClick: (e: React.MouseEvent, character: Character) => void;

  /**
   * Optional test ID override
   * If not provided, a default test ID will be generated based on the action type
   */
  testId?: string;
}

/**
 * Abstract base component for Character action buttons
 * Provides a standardized API for all character action buttons
 */
export function CharacterActionButton({
  character,
  actionType,
  icon,
  onClick,
  title,
  testId,
}: CharacterActionButtonProps) {
  return (
    <TreeNodeActionButton
      icon={icon}
      onClick={(e: React.MouseEvent) => onClick(e, character)}
      title={title}
      testId={testId || actionType + "Button"}
      object={character}
    />
  );
}
