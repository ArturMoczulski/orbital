// @ts-nocheck
/// <reference types="cypress" />
import { NotificationProvider } from "../NotificationProvider/NotificationProvider";
import { TreeExplorer } from "./TreeExplorer";
// Import the objectExplorer function directly
import { treeExplorer } from "./TreeExplorer.interactable";
// Import IconButton for custom actions
import IconButton from "@mui/material/IconButton";
// Import zod for schema definition
import { z } from "zod";

describe("TreeExplorer Component", () => {
  // Define the schema for the form
  const simpleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    parentId: z.string().optional(),
    worldId: z.string().optional(),
  });
  describe("Basic Functionality", () => {
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
          <TreeExplorer
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
      treeExplorer("Item", simpleSchema).item("Root Item").click();
    });

    it("demonstrates the fluent API with consistent item() helper usage", () => {
      // Get the explorer using the imported function
      const explorer = treeExplorer("Item", simpleSchema);

      // Verify the explorer exists
      explorer.getElement().should("exist");

      // Verify children are visible
      explorer.item("Child A").getElement().should("be.visible");

      // Stub window.confirm to return true
      cy.on("window:confirm", () => true);

      // Delete a child item using our fluent API
      explorer.item("Child A").delete();

      // Verify the delete stub was called with the correct ID
      cy.get("@deleteStub").should("have.been.called");
    });

    it("should expand and collapse tree nodes", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Verify Root Item is expanded
      explorer.item("Root Item").shouldBeExpanded();

      // Verify children are visible
      explorer.item("Child A").getElement().should("be.visible");
      explorer.item("Child B").getElement().should("be.visible");

      // Collapse the root item
      explorer.item("Root Item").click();

      // Verify Root Item is collapsed
      // This will check that only one TreeNode is visible (the root)
      explorer.item("Root Item").shouldBeCollapsed();

      // Verify the total number of visible TreeNodes is 1 (just the root)
      explorer
        .getElement()
        .find('[data-testid="TreeNode"]:visible')
        .should("have.length", 1);
    });

    it("should verify node has correct number of children", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Verify Root Item has 2 children
      explorer.item("Root Item").shouldHaveChildCount(2);
    });
  });

  describe("Adding Tree Nodes", () => {
    beforeEach(() => {
      // Mock data for testing
      const mockObjects = [
        {
          _id: "1",
          parentId: null,
          name: "Root Item",
        },
      ];

      // Stub for add function
      const addStub = cy.stub().as("addStub");

      // Mount the component with mock data
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            queryResult={{
              data: mockObjects,
              isLoading: false,
              error: null,
            }}
            onAdd={addStub}
            type="Item"
            objectTypeName="Items"
          />
        </NotificationProvider>
      );
    });

    it("should open add dialog when clicking add button", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Click the add button using the nested API
      explorer.dialogs.add.open();

      // Verify the add dialog is open using the nested API
      explorer.dialogs.add.getElement().should("be.visible");
      // Get the form element using getElement() since form() returns an AutoFormInteractable instance
      explorer.dialogs.add.form().getElement().should("be.visible");
    });

    it("should add a new item", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Add a new item using the addWithData method
      explorer.add({ name: "New Item" });

      // Verify the add stub was called with data that includes the name
      // The form also includes worldId: undefined from the schema
      cy.get("@addStub").should("have.been.called");
      cy.get("@addStub").then((stub) => {
        const callArg = stub.firstCall.args[0];
        expect(callArg).to.have.property("name", "New Item");
      });
    });

    it("should add a new item with a parent", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Add a new item with a parent using the addWithData method
      explorer.add({ name: "New Child", parentId: "1" });

      // Verify the add stub was called with data that includes the name and parentId
      // The form also includes worldId: undefined from the schema
      cy.get("@addStub").should("have.been.called");
      cy.get("@addStub").then((stub) => {
        const callArg = stub.firstCall.args[0];
        expect(callArg).to.have.property("name", "New Child");
        expect(callArg).to.have.property("parentId", "1");
      });
    });
  });

  describe("Removing Tree Nodes", () => {
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
          <TreeExplorer
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
      treeExplorer("Item", simpleSchema).item("Root Item").click();
    });

    it("should delete a node when clicking delete button", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Stub window.confirm to return true
      cy.on("window:confirm", () => true);

      // Delete Child A
      explorer.item("Child A").delete();

      // Verify the delete stub was called with the correct ID
      cy.get("@deleteStub").should("have.been.calledWith", "2");
    });

    it("should delete a root node", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Stub window.confirm to return true
      cy.on("window:confirm", () => true);

      // Delete Root Item
      explorer.item("Root Item").delete();

      // Verify the delete stub was called with the correct ID
      cy.get("@deleteStub").should("have.been.calledWith", "1");
    });

    it("should confirm before deleting", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Stub window.confirm to return false
      cy.on("window:confirm", () => false);

      // Get the delete button and click it
      explorer
        .item("Child A")
        .buttons.delete()
        .should("be.visible")
        .click({ force: true });

      // Verify the delete stub was not called
      cy.get("@deleteStub").should("not.have.been.called");
    });
  });

  describe("Custom Actions for Tree Nodes", () => {
    beforeEach(() => {
      // Mock data for testing
      const mockObjects = [
        {
          _id: "1",
          parentId: null,
          name: "Root Item",
        },
      ];

      // Stub for custom action
      const customActionStub = cy.stub().as("customActionStub");

      // Create custom item actions using React elements
      const customItemActions = (object, defaultActions) => {
        // Use React.createElement instead of DOM manipulation
        return (
          <div>
            {defaultActions}
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                customActionStub(object._id);
              }}
              title="Custom Action"
              data-testid="CustomAction"
              data-object-id={object._id}
              sx={{ mx: 0.5 }}
            >
              Custom
            </IconButton>
          </div>
        );
      };

      // Mount the component with mock data and custom actions
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            queryResult={{
              data: mockObjects,
              isLoading: false,
              error: null,
            }}
            type="Item"
            objectTypeName="Items"
            itemActions={customItemActions}
          />
        </NotificationProvider>
      );
    });

    it("should trigger custom action when clicking custom action button", () => {
      // Create explorer with custom action type
      const explorer = treeExplorer<"CustomAction", typeof simpleSchema>(
        "Item",
        simpleSchema,
        ["CustomAction"]
      );

      // Get the custom action button and click it using the nested structure
      explorer
        .item("Root Item")
        .buttons.custom.CustomAction()
        .click({ force: true });

      // Verify the custom action stub was called with the correct ID
      cy.get("@customActionStub").should("have.been.calledWith", "1");
    });
  });

  describe("Loading States", () => {
    it("should show loading state", () => {
      // Mount the component with loading state
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            queryResult={{
              data: null,
              isLoading: true,
              error: null,
            }}
            type="Item"
            objectTypeName="Items"
          />
        </NotificationProvider>
      );

      // Verify loading state is shown using the nested API
      treeExplorer("Item", simpleSchema).states.loading.shouldExist();
    });

    it("should show error state", () => {
      // Mount the component with error state
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            queryResult={{
              data: null,
              isLoading: false,
              error: { message: "Error loading items" },
            }}
            type="Item"
            objectTypeName="Items"
          />
        </NotificationProvider>
      );

      // Verify error state is shown using the nested API
      treeExplorer("Item", simpleSchema).states.error.shouldExist();
    });

    it("should show empty state", () => {
      // Mount the component with empty state
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            queryResult={{
              data: [],
              isLoading: false,
              error: null,
            }}
            type="Item"
            objectTypeName="Items"
          />
        </NotificationProvider>
      );

      // Verify empty state is shown using the nested API
      treeExplorer("Item", simpleSchema).states.empty.shouldExist();
    });
  });

  describe("RTK Query Integration", () => {
    it("should use RTK Query hooks for fetching data", () => {
      // Create mock RTK Query hooks
      const queryHookStub = cy
        .stub()
        .returns({
          data: [
            {
              _id: "1",
              parentId: null,
              name: "RTK Root Item",
            },
            {
              _id: "2",
              parentId: "1",
              name: "RTK Child",
            },
          ],
          isLoading: false,
          error: null,
        })
        .as("queryHookStub");

      // Mount the component with RTK Query API
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            type="Item"
            objectTypeName="Items"
            api={{
              queryHook: queryHookStub,
            }}
          />
        </NotificationProvider>
      );

      // Verify the query hook was called
      cy.get("@queryHookStub").should("have.been.called");

      // Verify the data was rendered
      const explorer = treeExplorer("Item", simpleSchema);
      explorer.item("RTK Root Item").getElement().should("exist");

      // Expand the root item
      explorer.item("RTK Root Item").click();

      // Verify the child is visible
      explorer.item("RTK Child").getElement().should("be.visible");
    });

    it("should use RTK Query hooks for adding items", () => {
      // Create mock unwrap function
      const unwrapStub = cy
        .stub()
        .resolves({ _id: "new-id", name: "New RTK Item" })
        .as("unwrapStub");

      // Create mock RTK Query hooks
      const queryHookStub = cy.stub().returns({
        data: [
          {
            _id: "1",
            parentId: null,
            name: "RTK Root Item",
          },
        ],
        isLoading: false,
        error: null,
      });

      const createHookStub = cy
        .stub()
        .returns([
          cy.stub().returns({ unwrap: unwrapStub }).as("createMutationStub"),
          { isLoading: false },
        ])
        .as("createHookStub");

      // Mount the component with RTK Query API
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            type="Item"
            objectTypeName="Items"
            api={{
              queryHook: queryHookStub,
              createHook: createHookStub,
            }}
          />
        </NotificationProvider>
      );

      // Add a new item
      const explorer = treeExplorer("Item", simpleSchema);
      explorer.add({ name: "New RTK Item" });

      // Verify the create hook was called
      cy.get("@createHookStub").should("have.been.called");

      // Verify the create mutation was called with data that includes createItemDto
      cy.get("@createMutationStub").should("have.been.called");
      cy.get("@createMutationStub").then((stub) => {
        const callArg = stub.firstCall.args[0];
        expect(callArg).to.have.property("createItemDto");
        expect(callArg.createItemDto).to.have.property("name", "New RTK Item");
      });

      // Verify unwrap was called
      cy.get("@unwrapStub").should("have.been.called");
    });

    it("should use RTK Query hooks for deleting items", () => {
      // Create mock unwrap function
      const unwrapStub = cy.stub().resolves({ success: true }).as("unwrapStub");

      // Create mock RTK Query hooks
      const queryHookStub = cy.stub().returns({
        data: [
          {
            _id: "1",
            parentId: null,
            name: "RTK Root Item",
          },
        ],
        isLoading: false,
        error: null,
      });

      const deleteHookStub = cy
        .stub()
        .returns([
          cy.stub().returns({ unwrap: unwrapStub }).as("deleteMutationStub"),
          { isLoading: false },
        ])
        .as("deleteHookStub");

      // Mount the component with RTK Query API
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            type="Item"
            objectTypeName="Items"
            api={{
              queryHook: queryHookStub,
              deleteHook: deleteHookStub,
            }}
          />
        </NotificationProvider>
      );

      // Delete the root item
      const explorer = treeExplorer("Item", simpleSchema);

      // Stub window.confirm to return true
      cy.on("window:confirm", () => true);

      explorer.item("RTK Root Item").delete();

      // Verify the delete hook was called
      cy.get("@deleteHookStub").should("have.been.called");

      // Verify the delete mutation was called with the correct ID
      cy.get("@deleteMutationStub").should("have.been.calledWith", {
        _id: "1",
      });

      // Verify unwrap was called
      cy.get("@unwrapStub").should("have.been.called");
    });
  });

  describe("Item Selection", () => {
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
      ];

      // Stub for select function
      const selectStub = cy.stub().as("selectStub");

      // Mount the component with mock data
      cy.mount(
        <NotificationProvider>
          <TreeExplorer
            queryResult={{
              data: mockObjects,
              isLoading: false,
              error: null,
            }}
            onSelect={selectStub}
            type="Item"
            objectTypeName="Items"
          />
        </NotificationProvider>
      );

      // Expand the root item to see its children
      treeExplorer("Item", simpleSchema).item("Root Item").click();
    });

    it("should select a node when clicking on it", () => {
      const explorer = treeExplorer("Item", simpleSchema);

      // Select Child A
      explorer.item("Child A").select();

      // Verify the select stub was called with the correct ID
      cy.get("@selectStub").should("have.been.calledWith", "2");
    });
  });
});
