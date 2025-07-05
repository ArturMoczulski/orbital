// @ts-nocheck
/// <reference types="cypress" />
import { AreaMap } from "@orbital/core/src/types/area-map";
import { NotificationProvider, WorldProvider } from "@orbital/react-ui";
import AreaExplorer from "./AreaExplorer";
import { areaExplorer } from "./AreaExplorer.interactable";

describe("AreaExplorer Component", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mock data for testing
      const mockAreas = [
        {
          _id: "area1",
          parentId: null,
          name: "Main Area",
          worldId: "world1",
        },
        {
          _id: "area2",
          parentId: "area1",
          name: "Sub Area A",
          worldId: "world1",
        },
        {
          _id: "area3",
          parentId: "area1",
          name: "Sub Area B",
          worldId: "world1",
        },
      ];

      // Mock map data
      const mockMap: AreaMap = {
        _id: "map1",
        width: 10,
        height: 10,
        tileSize: 32,
        layers: [],
        tilesets: [],
      };

      // Stub for API calls
      cy.stub(window, "fetch").callsFake((url) => {
        if (url.includes("areas")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockAreas),
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
      const getAllQueryStub = cy.stub().returns({
        data: mockAreas,
        isLoading: false,
        error: null,
      });

      const getMapQueryStub = cy.stub().returns({
        data: mockMap,
        isLoading: false,
        error: null,
      });

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetAllQuery"
      ).returns({
        data: mockAreas,
        isLoading: false,
        error: null,
      });

      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetMapQuery"
      ).returns({
        data: mockMap,
        isLoading: false,
        error: null,
      });

      // Mount the component with mock data
      cy.mount(
        <NotificationProvider>
          <WorldProvider worldId="world1">
            <AreaExplorer onSelect={onSelectStub} />
          </WorldProvider>
        </NotificationProvider>
      );

      // Expand the root item to see its children
      areaExplorer().item("Main Area").click();
    });

    it("should display areas correctly", () => {
      const explorer = areaExplorer();

      // Verify the explorer exists
      explorer.getElement().should("exist");

      // Verify root item is expanded
      explorer.item("Main Area").shouldBeExpanded();

      // Verify children are visible
      explorer.item("Sub Area A").getElement().should("be.visible");
      explorer.item("Sub Area B").getElement().should("be.visible");
    });

    it("should load a map when clicking the map button", () => {
      const explorer = areaExplorer();

      // Load the map for Sub Area A
      explorer.loadMap("Sub Area A");

      // Verify the onSelect callback was called with the correct ID
      cy.get("@onSelectStub").should(
        "have.been.calledWith",
        "area2",
        Cypress.sinon.match.any
      );
    });
  });

  describe("Loading States", () => {
    it("should show loading state", () => {
      // Stub the API hooks to return loading state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetAllQuery"
      ).returns({
        data: null,
        isLoading: true,
        error: null,
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component with loading state
      cy.mount(
        <NotificationProvider>
          <WorldProvider worldId="world1">
            <AreaExplorer onSelect={onSelectStub} />
          </WorldProvider>
        </NotificationProvider>
      );

      // Verify loading state is shown
      areaExplorer().states.loading.shouldExist();
    });

    it("should show error state", () => {
      // Stub the API hooks to return error state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetAllQuery"
      ).returns({
        data: null,
        isLoading: false,
        error: { message: "Error loading areas" },
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component with error state
      cy.mount(
        <NotificationProvider>
          <WorldProvider worldId="world1">
            <AreaExplorer onSelect={onSelectStub} />
          </WorldProvider>
        </NotificationProvider>
      );

      // Verify error state is shown
      areaExplorer().states.error.shouldExist();
    });

    it("should show empty state", () => {
      // Stub the API hooks to return empty state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetAllQuery"
      ).returns({
        data: [],
        isLoading: false,
        error: null,
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component with empty state
      cy.mount(
        <NotificationProvider>
          <WorldProvider worldId="world1">
            <AreaExplorer onSelect={onSelectStub} />
          </WorldProvider>
        </NotificationProvider>
      );

      // Verify empty state is shown
      areaExplorer().states.empty.shouldExist();
    });
  });

  describe("Map Loading", () => {
    it("should handle map loading state", () => {
      // Mock areas
      const mockAreas = [
        {
          _id: "area1",
          parentId: null,
          name: "Main Area",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetAllQuery"
      ).returns({
        data: mockAreas,
        isLoading: false,
        error: null,
      });

      // Stub the map query to return loading state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetMapQuery"
      ).returns({
        data: null,
        isLoading: true,
        error: null,
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component
      cy.mount(
        <NotificationProvider>
          <WorldProvider worldId="world1">
            <AreaExplorer onSelect={onSelectStub} />
          </WorldProvider>
        </NotificationProvider>
      );

      // Load the map
      areaExplorer().loadMap("Main Area");

      // Verify the onSelect callback was not called yet (map is still loading)
      cy.get("@onSelectStub").should("not.have.been.called");
    });

    it("should handle map loading error", () => {
      // Mock areas
      const mockAreas = [
        {
          _id: "area1",
          parentId: null,
          name: "Main Area",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetAllQuery"
      ).returns({
        data: mockAreas,
        isLoading: false,
        error: null,
      });

      // Stub the map query to return error state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerGetMapQuery"
      ).returns({
        data: null,
        isLoading: false,
        error: { message: "Error loading map" },
      });

      // Stub for onSelect callback
      const onSelectStub = cy.stub().as("onSelectStub");

      // Mount the component
      cy.mount(
        <NotificationProvider>
          <WorldProvider worldId="world1">
            <AreaExplorer onSelect={onSelectStub} />
          </WorldProvider>
        </NotificationProvider>
      );

      // Load the map
      areaExplorer().loadMap("Main Area");

      // Verify the onSelect callback was not called (map loading failed)
      cy.get("@onSelectStub").should("not.have.been.called");
    });
  });
});
