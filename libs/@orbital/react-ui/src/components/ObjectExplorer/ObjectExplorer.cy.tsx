// @ts-nocheck
/// <reference types="cypress" />
import React from "react";
import { ObjectExplorer } from "./ObjectExplorer/ObjectExplorer";

describe("ObjectExplorer Component", () => {
  beforeEach(() => {
    // Mock data for testing
    const mockObjects = [
      {
        id: "1",
        parentId: null,
        name: "Root Item",
      },
      {
        id: "2",
        parentId: "1",
        name: "Child A",
      },
      {
        id: "3",
        parentId: "1",
        name: "Child B",
      },
    ];

    // Mount the component with mock data
    cy.mount(
      <ObjectExplorer
        queryResult={{
          data: mockObjects,
          isLoading: false,
          error: null,
        }}
        onSelect={cy.stub().as("selectStub")}
        objectTypeName="Items"
      />
    );
  });

  it("renders the list of root objects", () => {
    cy.contains("Items loaded: 3");
    cy.contains("Root Item");
  });

  it("expands and collapses nodes when clicked", () => {
    // Expand "Root Item"
    cy.contains("Root Item").click();
    cy.contains("Child A").should("be.visible");
    cy.contains("Child B").should("be.visible");

    // Collapse
    cy.contains("Root Item").click();
    cy.contains("Child A").should("not.exist");
    cy.contains("Child B").should("not.exist");
  });

  it("invokes onSelect callback when clicking select icon", () => {
    cy.get('[data-testid="select-button-1"]').click();
    cy.get("@selectStub").should("have.been.calledWith", "1");
  });

  it("applies hover styles from theme on node", () => {
    cy.contains("Root Item").trigger("mouseover");
    cy.contains("Root Item")
      .should("have.css", "background-color")
      .and("match", /rgba?\(\d+,\s*\d+,\s*\d+,\s*[\d.]+\)/);
  });

  it("shows loading state when isLoading is true", () => {
    // Remount with loading state
    cy.mount(
      <ObjectExplorer
        queryResult={{
          data: undefined,
          isLoading: true,
          error: null,
        }}
        onSelect={cy.stub()}
        objectTypeName="Items"
      />
    );

    cy.get('[data-testid="loading-state"]').should("be.visible");
    cy.contains("Loading items...");
  });

  it("shows error state when there is an error", () => {
    // Remount with error state
    cy.mount(
      <ObjectExplorer
        queryResult={{
          data: undefined,
          isLoading: false,
          error: new Error("Test error"),
        }}
        onSelect={cy.stub()}
        objectTypeName="Items"
      />
    );

    cy.get('[data-testid="error-state"]').should("be.visible");
    cy.contains("Error loading items");
  });

  it("shows empty state when there are no objects", () => {
    // Remount with empty data
    cy.mount(
      <ObjectExplorer
        queryResult={{
          data: [],
          isLoading: false,
          error: null,
        }}
        onSelect={cy.stub()}
        objectTypeName="Items"
      />
    );

    cy.get('[data-testid="empty-state"]').should("be.visible");
    cy.contains("No items available");
  });

  it("supports custom node rendering", () => {
    // Remount with custom renderer
    const customRender = (object, toggleExpand, handleSelect) => (
      <div
        key={object.id}
        className="custom-node"
        data-testid={`custom-node-${object.id}`}
        onClick={toggleExpand}
      >
        <span>{object.name}</span>
        <button onClick={(e) => handleSelect(e)}>Select</button>
      </div>
    );

    cy.mount(
      <ObjectExplorer
        queryResult={{
          data: [
            {
              id: "1",
              parentId: null,
              name: "Custom Item",
            },
          ],
          isLoading: false,
          error: null,
        }}
        onSelect={cy.stub().as("customSelectStub")}
        objectTypeName="Items"
        renderNode={customRender}
      />
    );

    cy.get('[data-testid="custom-node-1"]').should("be.visible");
    cy.contains("Custom Item");
    cy.get('[data-testid="custom-node-1"] button').click();
    cy.get("@customSelectStub").should("have.been.calledWith", "1");
  });
});
