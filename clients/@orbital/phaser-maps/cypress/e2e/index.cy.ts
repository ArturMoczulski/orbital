import { generateFantasyAreaName } from "@orbital/core/src/utils/data-generators";

describe("Index page area creation", () => {
  // Store the test area name to use in afterEach for cleanup
  let testAreaName: string;

  beforeEach(() => {
    cy.visit("/");
  });

  // Clean up after each test by deleting the created area
  afterEach(() => {
    if (testAreaName) {
      cy.log(`Cleaning up: Deleting area "${testAreaName}"`);
      cy.deleteObjectByName("area", testAreaName);
    }
  });

  it("adds a new area", () => {
    // Generate test data using our enhanced fantasy name generator with random style
    const testName = generateFantasyAreaName({
      // Style is random by default
      includeAdjective: true,
      includeLocationType: true,
    });
    // Use "world1" to match the default world in WorldExplorer
    const testWorldId = "world1";

    // Log the generated area name to see what's being produced
    cy.log(`Generated random fantasy area name: ${testName}`);
    console.log(`Generated random fantasy area name: ${testName}`);

    // Store the test name for cleanup in afterEach
    testAreaName = testName;

    // Log the final test data
    cy.log(`Using test name: ${testName}`);
    cy.log(`Using worldId: ${testWorldId}`);

    cy.intercept("POST", "/api/admin/areas").as("createArea");

    // Use custom commands to interact with the TreeExplorer
    // Use 'area' as the type prefix since we're working with the AreaExplorer
    cy.openAddObjectDialog("area");
    cy.getAddObjectInput("area", "name").type(testName);
    cy.getAddObjectInput("area", "worldId").type(testWorldId);
    cy.getAddObjectSubmitButton("area").click();

    // Intercept the response to log what was actually created
    cy.wait("@createArea").then((interception) => {
      cy.log(`API Response: ${JSON.stringify(interception.response?.body)}`);
      expect(interception.response?.statusCode).to.eq(201);
    });

    cy.contains(testName).should("exist");
  });
});
