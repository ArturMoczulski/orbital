// AreaExplorer Cypress Helpers
// This file provides a fluent API for interacting with the AreaExplorer component in tests

import { AreaSchema } from "@orbital/core/src/types/area";
import {
  TreeExplorerInteractable,
  treeExplorer,
} from "@orbital/react-ui/src/components/TreeExplorer/TreeExplorer.interactable";

/**
 * Type definition for Area Explorer custom actions
 * Currently only supports "LoadMap" action
 *
 * This type is used to ensure type safety when using custom actions
 * If you need to add more actions, add them to this type and to the AREA_EXPLORER_CUSTOM_ACTIONS array
 */
export type AreaTreeNodeCustomAction = "LoadMap";

/**
 * Array of all available custom actions for the AreaExplorer
 * This array is derived from the AreaTeeNodeCustomAction type
 * If you update the type, make sure to update this array as well
 */
export const AREA_EXPLORER_CUSTOM_ACTIONS: AreaTreeNodeCustomAction[] = [
  "LoadMap",
];

/**
 * AreaExplorerInteractable class extends TreeExplorerInteractable
 * to provide area-specific functionality with "LoadMap" as the only custom action
 */
export class AreaExplorerInteractable extends TreeExplorerInteractable<
  AreaTreeNodeCustomAction,
  typeof AreaSchema
> {
  /**
   * Load a map for a specific area
   * @param areaName The name of the area to load the map for
   */
  loadMap(areaName: string): AreaExplorerInteractable {
    // Find the area by name and click its map button
    // Use the typed custom action
    this.item(areaName).action("LoadMap" as AreaTreeNodeCustomAction);
    return this;
  }

  /**
   * Verify that a map was loaded for a specific area
   * @param areaId The ID of the area to verify
   */
  shouldHaveLoadedMap(areaId: string): AreaExplorerInteractable {
    // This would check that the onSelect callback was called with the correct area ID
    cy.get("@onSelectStub").should(
      "have.been.calledWith",
      areaId,
      Cypress.sinon.match.any
    );
    return this;
  }
}

/**
 * Create an AreaExplorer helper for interacting with the component
 * @returns An AreaExplorerInteractable instance with the defined custom actions
 */
export function areaExplorer(): AreaExplorerInteractable {
  // Use the treeExplorer helper with "Area" as the type prefix
  // Only the actions defined in AreaTreeNodeCustomAction are supported
  const explorer = treeExplorer<AreaTreeNodeCustomAction, typeof AreaSchema>(
    "Area",
    AreaSchema,
    AREA_EXPLORER_CUSTOM_ACTIONS
  );

  // Cast to our specialized class
  return explorer as unknown as AreaExplorerInteractable;
}
