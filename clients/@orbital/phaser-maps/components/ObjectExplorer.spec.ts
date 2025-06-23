// @ts-nocheck
/// <reference types="cypress" />

describe("ObjectExplorer Component", () => {
  beforeEach(() => {
    // Intercept the areas API to return a predictable list
    cy.intercept("GET", "/api/areas", {
      statusCode: 200,
      body: [
        {
          id: "1",
          parentId: null,
          name: "World",
          areaMap: {
            width: 2,
            height: 2,
            grid: [
              [0, 1],
              [1, 0],
            ],
          },
        },
        {
          id: "2",
          parentId: "1",
          name: "Subarea A",
          areaMap: { width: 1, height: 1, grid: [[0]] },
        },
        {
          id: "3",
          parentId: "1",
          name: "Subarea B",
          areaMap: { width: 1, height: 1, grid: [[1]] },
        },
      ],
    }).as("getAreas");

    // Intercept single-area fetch
    cy.intercept("GET", /\/api\/areas\/\d+/, (req: any) => {
      const id = req.url.match(/\/api\/areas\/(\d+)/)?.[1];
      req.reply({
        statusCode: 200,
        body: {
          id,
          parentId: id === "1" ? null : "1",
          name: `Area ${id}`,
          areaMap: {
            width: 2,
            height: 2,
            grid: [
              [0, 1],
              [1, 0],
            ],
          },
        },
      });
    }).as("getArea");

    // Visit the root page of the client
    cy.visit("/");
    cy.wait("@getAreas");
  });

  it("renders the list of root areas", () => {
    cy.contains("Areas loaded: 3");
    cy.contains("World");
  });

  it("expands and collapses nodes when clicked", () => {
    // Expand “World”
    cy.contains("World").click();
    cy.contains("Subarea A").should("be.visible");
    cy.contains("Subarea B").should("be.visible");

    // Collapse
    cy.contains("World").click();
    cy.contains("Subarea A").should("not.exist");
    cy.contains("Subarea B").should("not.exist");
  });

  it("invokes API to load map when clicking load icon", () => {
    cy.get('button[title="Load area map"]').first().click();
    cy.wait("@getArea");
    cy.get("canvas").should("exist");
  });

  it("applies hover styles from theme on node", () => {
    cy.contains("World").trigger("mouseover");
    cy.contains("World")
      .should("have.css", "background-color")
      .and("match", /rgba?\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/);
  });
});
