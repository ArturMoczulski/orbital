// CharactersExplorer Cypress Helpers
// This file provides a fluent API for interacting with the CharactersExplorer component in tests

import { CharacterSchema } from "@orbital/characters/src/types/character";
import { TreeExplorerInteractable, treeExplorer } from "@orbital/react-ui";
import { z } from "zod";
import { CharacterTreeNodeCustomAction } from "./CharacterActionsButtons";

/**
 * CharactersExplorerInteractable class extends TreeExplorerInteractable
 * to provide character-specific functionality with "ViewDetails" as the only custom action
 */
export class CharactersExplorerInteractable extends TreeExplorerInteractable<
  CharacterTreeNodeCustomAction,
  typeof CharacterSchema
> {
  /**
   * Add a new character to the explorer
   * @param character The character data to add
   */
  addCharacter(character: {
    firstName: string;
    lastName: string;
    worldId?: string;
  }): CharactersExplorerInteractable {
    // Construct the data object with name property derived from firstName and lastName
    const data = {
      ...character,
      name: `${character.firstName} ${character.lastName}`,
    };

    // Use the base add method from TreeExplorerInteractable
    this.dialogs.add.open();
    this.dialogs.add.submitAndReturnExplorer(
      data as Partial<z.infer<typeof CharacterSchema>>
    );

    return this;
  }

  /**
   * View details for a specific character
   * @param character The character object to view details for
   */
  viewDetails(
    character: z.infer<typeof CharacterSchema>
  ): CharactersExplorerInteractable {
    // Use the character's ID directly to find and click the button
    cy.get(`[data-testid="${CharacterTreeNodeCustomAction.ViewDetails}Button"]`)
      .filter(`[data-object-id="${character._id}"]`)
      .first() // Ensure we only get one element
      .click({ force: true });

    return this;
  }

  /**
   * Verify that character details were loaded for a specific character
   * @param character The character object to verify
   */
  shouldHaveLoadedDetails(
    character: z.infer<typeof CharacterSchema>
  ): CharactersExplorerInteractable {
    // Check that the onSelect callback was called
    cy.get("@onSelectStub").should("have.been.called");

    // Get the first call arguments
    cy.get("@onSelectStub")
      .invoke("getCall", 0)
      .then((call) => {
        const calledCharacter = call.args[0];

        // Check that the important properties match
        expect(calledCharacter._id).to.equal(character._id);
        if (character.firstName)
          expect(calledCharacter.firstName).to.equal(character.firstName);
        if (character.lastName)
          expect(calledCharacter.lastName).to.equal(character.lastName);
        if (character.worldId)
          expect(calledCharacter.worldId).to.equal(character.worldId);
      });
    return this;
  }

  /**
   * Verify that a character with the given properties exists in the tree
   * @param character The character properties to verify
   */
  shouldHaveCharacter(character: {
    firstName: string;
    lastName: string;
  }): CharactersExplorerInteractable {
    // Construct the expected name from firstName and lastName
    const expectedName = `${character.firstName} ${character.lastName}`;

    // Check that a tree node with this name exists
    this.item(expectedName).get().should("exist");

    return this;
  }
}

/**
 * Create a CharactersExplorer helper for interacting with the component
 * @returns A CharactersExplorerInteractable instance with the defined custom actions
 */
export function charactersExplorer(): CharactersExplorerInteractable {
  // Use the treeExplorer helper with "Character" as the type prefix
  // Only the actions defined in CharacterTreeNodeCustomAction are supported
  // Convert enum to array using Object.values
  const explorer = treeExplorer<
    CharacterTreeNodeCustomAction,
    typeof CharacterSchema
  >(
    "Character",
    CharacterSchema,
    Object.values(
      CharacterTreeNodeCustomAction
    ) as CharacterTreeNodeCustomAction[]
  );

  // Create a new instance of our specialized class
  const charactersExplorerInstance = new CharactersExplorerInteractable(
    "Character",
    CharacterSchema,
    Object.values(
      CharacterTreeNodeCustomAction
    ) as CharacterTreeNodeCustomAction[]
  );

  // Copy properties from the explorer to our instance
  Object.assign(charactersExplorerInstance, {
    ...explorer,
    // Preserve the specialized methods
    viewDetails: charactersExplorerInstance.viewDetails.bind(
      charactersExplorerInstance
    ),
    shouldHaveLoadedDetails:
      charactersExplorerInstance.shouldHaveLoadedDetails.bind(
        charactersExplorerInstance
      ),
    addCharacter: charactersExplorerInstance.addCharacter.bind(
      charactersExplorerInstance
    ),
    shouldHaveCharacter: charactersExplorerInstance.shouldHaveCharacter.bind(
      charactersExplorerInstance
    ),
  });

  return charactersExplorerInstance;
}
