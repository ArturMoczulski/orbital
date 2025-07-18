// @ts-nocheck
/// <reference types="cypress" />
import { Area } from "@orbital/core/src/types/area";
import {
  NotificationProvider,
  ReduxProvider,
  WorldProvider,
} from "@orbital/react-ui";
import { adminApi } from "../../services/adminApi.generated";
import AreaExplorer from "./AreaExplorer";
import { areaExplorer } from "./AreaExplorer.interactable";

describe("AreaExplorer Component", () => {
  describe("Basic Functionality", () => {
    beforeEach(() => {
      // Mock data for testing
      const mockAreas = [
        {
          _id: "area1",
          name: "Forest",
          worldId: "world1",
        },
        {
          _id: "area2",
          name: "Castle",
          worldId: "world1",
        },
        {
          _id: "area3",
          name: "Village",
          worldId: "world1",
        },
      ];

      // Mock area map data
      const mockAreaMap = {
        width: 10,
        height: 10,
        grid: Array(10).fill(Array(10).fill(0)),
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
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerFindQuery"
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
        data: mockAreaMap,
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
              <AreaExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );
    });

    it("should display areas correctly", () => {
      const explorer = areaExplorer();

      // Verify the explorer exists
      explorer.getElement().should("exist");

      // Verify areas are visible
      explorer.item("Forest").getElement().should("be.visible");
      explorer.item("Castle").getElement().should("be.visible");
      explorer.item("Village").getElement().should("be.visible");
    });

    it("should load area map when clicking the load map button", () => {
      const explorer = areaExplorer();

      // Get the Castle mock area - convert to Area object for loadMap
      const castle = Area.mock({
        _id: "area2",
        name: "Castle",
        worldId: "world1",
      });

      // Load the map for Castle
      explorer.loadMap(castle);

      // Verify the onSelect callback was called
      cy.get("@onSelectStub").should("have.been.called");

      // Get the first call arguments using invoke
      cy.get("@onSelectStub")
        .invoke("getCall", 0)
        .then((call) => {
          const calledArea = call.args[0];
          const calledMap = call.args[1];

          // Check that the important properties match
          expect(calledArea._id).to.equal("area2");
          expect(calledArea.name).to.equal("Castle");
          expect(calledArea.worldId).to.equal("world1");

          // Check that the map was passed
          expect(calledMap).to.exist;
          expect(calledMap.width).to.equal(10);
          expect(calledMap.height).to.equal(10);
        });
    });
  });

  describe("Loading States", () => {
    it("should show loading state", () => {
      // Stub the API hooks to return loading state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerFindQuery"
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
              <AreaExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Verify loading state is shown
      areaExplorer().states.loading.shouldExist();
    });

    it("should show error state", () => {
      // Stub the API hooks to return error state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerFindQuery"
      ).returns({
        data: null,
        isLoading: false,
        error: { message: "Error loading areas" },
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
              <AreaExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Verify error state is shown
      areaExplorer().states.error.shouldExist();
    });

    it("should show empty state", () => {
      // Stub the API hooks to return empty state
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerFindQuery"
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
              <AreaExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
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
          name: "Forest",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerFindQuery"
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
        <ReduxProvider
          reducers={{ [adminApi.reducerPath]: adminApi.reducer }}
          middleware={[adminApi.middleware]}
        >
          <NotificationProvider>
            <WorldProvider worldId="world1">
              <AreaExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Get the Forest mock area - convert to Area object for loadMap
      const forest = Area.mock({
        _id: "area1",
        name: "Forest",
        worldId: "world1",
      });

      // Load the map
      areaExplorer().loadMap(forest);

      // Verify the onSelect callback was not called yet (map is still loading)
      cy.get("@onSelectStub").should("not.have.been.called");
    });

    it("should handle map loading error", () => {
      // Mock areas
      const mockAreas = [
        {
          _id: "area1",
          name: "Forest",
          worldId: "world1",
        },
      ];

      // Stub the API hooks
      cy.stub(
        // @ts-ignore - Stub the imported hooks
        require("../../services/adminApi.generated"),
        "useAreasControllerFindQuery"
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
        error: { message: "Error loading area map" },
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
              <AreaExplorer onSelect={onSelectStub} />
            </WorldProvider>
          </NotificationProvider>
        </ReduxProvider>
      );

      // Get the Forest mock area - convert to Area object for loadMap
      const forest = Area.mock({
        _id: "area1",
        name: "Forest",
        worldId: "world1",
      });

      // Load the map
      areaExplorer().loadMap(forest);

      // Verify the onSelect callback was not called (map loading failed)
      cy.get("@onSelectStub").should("not.have.been.called");
    });
  });
});
