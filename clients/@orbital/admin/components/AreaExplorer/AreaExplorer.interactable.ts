// AreaExplorer Cypress Helpers
// This file provides a fluent API for interacting with the AreaExplorer component in tests

import { AreaSchema } from "@orbital/core/src/types/area";
import { TreeExplorerInteractable, treeExplorer } from "@orbital/react-ui";
import { z } from "zod";
import { AreaTreeNodeCustomAction } from "./AreaActionsButtons";

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
   * @param area The area object to load the map for
   */
  loadMap(area: z.infer<typeof AreaSchema>): AreaExplorerInteractable {
    // Use the area's ID directly to find and click the button
    cy.get(`[data-testid="${AreaTreeNodeCustomAction.LoadMap}Button"]`)
      .filter(`[data-object-id="${area._id}"]`)
      .first() // Ensure we only get one element
      .click({ force: true });

    return this;
  }

  /**
   * Verify that a map was loaded for a specific area
   * @param area The area object to verify
   */
  shouldHaveLoadedMap(
    area: z.infer<typeof AreaSchema>
  ): AreaExplorerInteractable {
    // Check that the onSelect callback was called
    cy.get("@onSelectStub").should("have.been.called");

    // Get the first call arguments
    cy.get("@onSelectStub")
      .invoke("getCall", 0)
      .then((call) => {
        const calledArea = call.args[0];

        // Check that the important properties match
        expect(calledArea._id).to.equal(area._id);
        if (area.parentId) expect(calledArea.parentId).to.equal(area.parentId);
        if (area.name) expect(calledArea.name).to.equal(area.name);
        if (area.worldId) expect(calledArea.worldId).to.equal(area.worldId);
      });
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
  // Convert enum to array using Object.values
  const explorer = treeExplorer<AreaTreeNodeCustomAction, typeof AreaSchema>(
    "Area",
    AreaSchema,
    Object.values(AreaTreeNodeCustomAction) as AreaTreeNodeCustomAction[]
  );

  // Create a new instance of our specialized class
  const areaExplorerInstance = new AreaExplorerInteractable(
    "Area",
    AreaSchema,
    Object.values(AreaTreeNodeCustomAction) as AreaTreeNodeCustomAction[]
  );

  // Copy properties from the explorer to our instance
  Object.assign(areaExplorerInstance, {
    ...explorer,
    // Preserve the specialized methods
    loadMap: areaExplorerInstance.loadMap.bind(areaExplorerInstance),
    shouldHaveLoadedMap:
      areaExplorerInstance.shouldHaveLoadedMap.bind(areaExplorerInstance),
  });

  return areaExplorerInstance;
}
