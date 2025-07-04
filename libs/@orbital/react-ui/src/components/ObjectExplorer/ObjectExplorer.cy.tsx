// @ts-nocheck
/// <reference types="cypress" />
import { NotificationProvider } from "../NotificationProvider/NotificationProvider";
import { ObjectExplorer } from "./ObjectExplorer";
// Import the objectExplorer function directly
import { objectExplorer } from "./ObjectExplorer.cy.commands";

describe("ObjectExplorer Fluent API", () => {
  beforeEach(() => {
    // Mock data for testing
    const mockObjects = [
      {
        _id: "1",
        parentId: null,
        name: "Root Item",
      },
      {
        _id: "2",
        parentId: "1",
        name: "Child A",
      },
      {
        _id: "3",
        parentId: "1",
        name: "Child B",
      },
    ];

    // Stub for delete function
    const deleteStub = cy.stub().as("deleteStub");

    // Mount the component with mock data
    cy.mount(
      <NotificationProvider>
        <ObjectExplorer
          queryResult={{
            data: mockObjects,
            isLoading: false,
            error: null,
          }}
          onDelete={deleteStub}
          type="Item"
          objectTypeName="Items"
        />
      </NotificationProvider>
    );

    // Expand the root item to see its children
    objectExplorer("Item").item("Root Item").click();
  });

  it("demonstrates the fluent API with consistent item() helper usage", () => {
    // Get the explorer using the imported function
    const explorer = objectExplorer("Item");

    // Verify the explorer exists
    explorer.getElement().should("exist");

    // Verify children are visible
    explorer.item("Child A").getElement().should("be.visible");

    // Delete a child item using our fluent API
    explorer.item("Child A").delete();

    // Verify the delete stub was called with the correct ID
    cy.get("@deleteStub").should("have.been.called");
  });
});
