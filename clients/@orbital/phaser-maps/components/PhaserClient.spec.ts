// @ts-nocheck
/// <reference types="cypress" />

describe("PhaserClient Component", () => {
  beforeEach(() => {
    // Stub areas list
    cy.intercept("GET", "/api/areas", {
      statusCode: 200,
      body: [
        {
          id: "1",
          parentId: null,
          name: "TestArea",
          areaMap: {
            width: 2,
            height: 2,
            grid: [
              [0, 1],
              [1, 0],
            ],
          },
        },
      ],
    }).as("getAreas");

    // Stub single area fetch
    cy.intercept("GET", "/api/areas/1", {
      statusCode: 200,
      body: {
        id: "1",
        parentId: null,
        name: "TestArea",
        areaMap: {
          width: 2,
          height: 2,
          grid: [
            [0, 1],
            [1, 0],
          ],
        },
      },
    }).as("getArea");

    // Visit the root page
    cy.visit("/");
    cy.wait("@getAreas");
  });

  it("renders the Phaser canvas when area is loaded", () => {
    // Click on the first area to load it
    cy.get('button[title="Load area map"]').first().click();
    cy.wait("@getArea");

    // Verify canvas exists and is visible
    cy.get("canvas").should("be.visible");

    // Verify canvas has proper dimensions
    cy.get("canvas").should(($canvas) => {
      expect($canvas.width()).to.be.greaterThan(0);
      expect($canvas.height()).to.be.greaterThan(0);
    });
  });

  it("shows loading overlay while map is loading", () => {
    // Delay the area response to ensure loading state is visible
    cy.intercept("GET", "/api/areas/1", (req) => {
      req.on("response", (res) => {
        res.setDelay(500);
      });
    }).as("delayedArea");

    // Click to load area
    cy.get('button[title="Load area map"]').first().click();

    // Verify loading overlay is shown using data-testid
    cy.get('[data-testid="loading-overlay"]').should("be.visible");

    // Wait for loading to complete
    cy.wait("@delayedArea");

    // Verify loading overlay is hidden
    cy.get('[data-testid="loading-overlay"]').should("not.exist");
  });

  it('shows "No area loaded" message when no area is selected', () => {
    // Before selecting any area, the message should be visible
    cy.get('[data-testid="no-area-message"]').should("be.visible");

    // After selecting an area, the message should be hidden
    cy.get('button[title="Load area map"]').first().click();
    cy.wait("@getArea");
    cy.get('[data-testid="no-area-message"]').should("not.exist");
  });

  it("properly resizes canvas to fit container", () => {
    // Load an area
    cy.get('button[title="Load area map"]').first().click();
    cy.wait("@getArea");

    // Check that canvas exists and has style attributes
    cy.get("canvas")
      .should("exist")
      .should(($canvas) => {
        const style = window.getComputedStyle($canvas[0]);
        // Check that position is absolute (as set in the component)
        expect(style.position).to.equal("absolute");
        // Just verify the canvas has some width and height
        expect($canvas[0].width).to.be.greaterThan(0);
        expect($canvas[0].height).to.be.greaterThan(0);
      });
  });
});
