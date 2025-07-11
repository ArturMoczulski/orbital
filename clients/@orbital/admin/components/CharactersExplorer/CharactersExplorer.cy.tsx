// @ts-nocheck
/// <reference types="cypress" />
import {
  NotificationProvider,
  ReduxProvider,
  WorldProvider,
} from "@orbital/react-ui";
import { adminApi } from "../../services/adminApi.generated";
import CharactersExplorer from "./CharactersExplorer";
import { charactersExplorer } from "./CharactersExplorer.interactable";

describe("CharactersExplorer Component", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mock data for testing
      const mockCharacters = [
        {
          _id: "char1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world1",
        },
        {
          _id: "char2",
          firstName: "Jane",
          lastName: "Smith",
          worldId: "world1",
        },
        {
          _id: "char3",
          firstName: "Bob",
          lastName: "Johnson",
          worldId: "world1",
        },
      ];

      // Mock character details
      const mockCharacterDetails = {
        _id: "char2",
        firstName: "Jane",
        lastName: "Smith",
        worldId: "world1",
        title: "Dr.",
        description: "A brilliant scientist",
      };

      // Stub for API calls
      cy.stub(window, "fetch").callsFake((url) => {
        if (url.includes("characters")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockCharacters),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Stub for query hooks
      const findQueryStub = cy.stub().returns({
        data: mockCharacters,
        isLoading: false,
        error: null,
      });

      const findByIdQueryStub = cy.stub().returns({
        data: mockCharacterDetails,
        isLoading: false,
        error: null,
      });

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: mockCharacters,
        isLoading: false,
        error: null,
      });

      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindByIdQuery"
      ).returns({
        data: mockCharacterDetails,
        isLoading: false,
        error: null,
      });

      // Mount the component with mock data
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );
    });

    it("should display characters correctly", () => {
      const explorer = charactersExplorer();

      // Verify the explorer exists
      explorer.getElement().should("exist");

      // Verify characters are visible
      explorer.item("John Doe").getElement().should("be.visible");
      explorer.item("Jane Smith").getElement().should("be.visible");
      explorer.item("Bob Johnson").getElement().should("be.visible");
    });

    it("should load character details when clicking the view details button", () => {
      const explorer = charactersExplorer();

      // Instead of using Character.mock, create a plain object that matches the interface
      const janeSmith = {
        _id: "char2",
        firstName: "Jane",
        lastName: "Smith",
        worldId: "world1",
      };

      // View the details for Jane Smith
      explorer.viewDetails(janeSmith);

      // Verify the onSelect callback was called
      cy.get("@onSelectStub").should("have.been.called");

      // Get the first call arguments using invoke
      cy.get("@onSelectStub")
        .invoke("getCall", 0)
        .then((call) => {
          const calledCharacter = call.args[0];

          // Check that the important properties match
          expect(calledCharacter._id).to.equal("char2");
          expect(calledCharacter.firstName).to.equal("Jane");
          expect(calledCharacter.lastName).to.equal("Smith");
          expect(calledCharacter.worldId).to.equal("world1");
        });
    });
  });

  describe("Loading States", () => {
    it("should show loading state", () => {
      // Stub the API hooks to return loading state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: null,
        isLoading: true,
        error: null,
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component with loading state
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Verify loading state is shown
      charactersExplorer().states.loading.shouldExist();
    });

    it("should show error state", () => {
      // Stub the API hooks to return error state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: null,
        isLoading: false,
        error: { message: "Error loading characters" },
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component with error state
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Verify error state is shown
      charactersExplorer().states.error.shouldExist();
    });

    it("should show empty state", () => {
      // Stub the API hooks to return empty state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: [],
        isLoading: false,
        error: null,
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component with empty state
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Verify empty state is shown
      charactersExplorer().states.empty.shouldExist();
    });
  });

  describe("Details Loading", () => {
    it("should handle details loading state", () => {
      // Mock characters
      const mockCharacters = [
        {
          _id: "char1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: mockCharacters,
        isLoading: false,
        error: null,
      });

      // Stub the details query to return loading state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindByIdQuery"
      ).returns({
        data: null,
        isLoading: true,
        error: null,
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Instead of using Character.mock, create a plain object that matches the interface
      const johnDoe = {
        _id: "char1",
        firstName: "John",
        lastName: "Doe",
        worldId: "world1",
      };

      // View the details
      charactersExplorer().viewDetails(johnDoe);

      // Verify the onSelect callback was not called yet (details are still loading)
      cy.get("@onSelectStub").should("not.have.been.called");
    });

    it("should handle details loading error", () => {
      // Mock characters
      const mockCharacters = [
        {
          _id: "char1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: mockCharacters,
        isLoading: false,
        error: null,
      });

      // Stub the details query to return error state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindByIdQuery"
      ).returns({
        data: null,
        isLoading: false,
        error: { message: "Error loading character details" },
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Instead of using Character.mock, create a plain object that matches the interface
      const johnDoe = {
        _id: "char1",
        firstName: "John",
        lastName: "Doe",
        worldId: "world1",
      };

      // View the details
      charactersExplorer().viewDetails(johnDoe);

      // Verify the onSelect callback was not called (details loading failed)
      cy.get("@onSelectStub").should("not.have.been.called");
    });
  });

  describe("Add Character Functionality", () => {
    it("should open the add character dialog when clicking the add button", () => {
      // Mock characters
      const mockCharacters = [
        {
          _id: "char1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: mockCharacters,
        isLoading: false,
        error: null,
      });

      // Stub the create mutation
      const createMutationStub = cy.stub().returns({
        unwrap: () => Promise.resolve({ _id: "new-char-id" }),
      });

      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerCreateMutation"
      ).returns([createMutationStub]);

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Get the explorer
      const explorer = charactersExplorer();

      // Click the add button
      explorer.buttons.add().click();

      // Verify the add dialog is open
      cy.get('[data-testid="TreeExplorerAddDialog"]').should("be.visible");
      cy.get('[data-testid="AddForm"]').should("be.visible");

      // Verify the dialog title
      cy.get('[data-testid="TreeExplorerAddDialog"]')
        .find(".MuiDialogTitle-root")
        .should("contain", "Add New Character");
    });

    it("should create a new character when submitting the form", () => {
      // Mock characters
      const mockCharacters = [
        {
          _id: "char1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: mockCharacters,
        isLoading: false,
        error: null,
      });

      // Stub the create mutation
      const createMutationStub = cy.stub().returns({
        unwrap: () => Promise.resolve({ _id: "new-char-id" }),
      });

      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerCreateMutation"
      ).returns([createMutationStub]);

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Get the explorer
      const explorer = charactersExplorer();

      // Use the addCharacter method to add a new character
      explorer.addCharacter({
        firstName: "Jane",
        lastName: "Smith",
        worldId: "world1",
      });

      // Verify the create mutation was called
      cy.wrap(createMutationStub).should("have.been.called");

      // Verify the dialog was closed
      cy.get('[data-testid="TreeExplorerAddDialog"]').should("not.exist");

      // Verify the character appears in the tree
      explorer.shouldHaveCharacter({
        firstName: "Jane",
        lastName: "Smith",
      });
    });

    it("should pass correct data to create mutation when adding a character", () => {
      // Mock characters
      const mockCharacters = [
        {
          _id: "char1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerFindQuery"
      ).returns({
        data: mockCharacters,
        isLoading: false,
        error: null,
      });

      // Stub the create mutation
      const createMutationStub = cy.stub().returns({
        unwrap: () => Promise.resolve({ _id: "new-char-id" }),
      });

      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useCharactersControllerCreateMutation"
      ).returns([createMutationStub]);

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component
      cy.mount(
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <CharactersExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Get the explorer
      const explorer = charactersExplorer();

      // Character data to add
      const characterData = {
        firstName: "Alice",
        lastName: "Johnson",
        worldId: "world1",
      };

      // Add the character
      explorer.addCharacter(characterData);

      // Verify the create mutation was called with the correct data
      cy.wrap(createMutationStub).should("have.been.called");
      cy.wrap(createMutationStub)
        .invoke("getCall", 0)
        .then((call) => {
          const mutationArg = call.args[0];

          // Verify the character data was correctly passed
          expect(mutationArg.firstName).to.equal(characterData.firstName);
          expect(mutationArg.lastName).to.equal(characterData.lastName);
          expect(mutationArg.worldId).to.equal(characterData.worldId);

          // Verify the name property was correctly derived
          expect(mutationArg.name).to.equal(
            `${characterData.firstName} ${characterData.lastName}`
          );
        });

      // Verify the character appears in the tree
      explorer.shouldHaveCharacter({
        firstName: characterData.firstName,
        lastName: characterData.lastName,
      });
    });
  });
});
