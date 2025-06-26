describe("Index page area creation", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("adds a new area", () => {
    cy.intercept("POST", "/api/admin/areas").as("createArea");

    // Use custom commands to interact with the ObjectExplorer
    // Use 'area' as the type prefix since we're working with the AreaExplorer
    cy.openAddObjectDialog("area");
    cy.getAddObjectInput("area", "name").type("Test Area");
    cy.getAddObjectSubmitButton("area").click();

    cy.wait("@createArea").its("response.statusCode").should("eq", 201);
    cy.contains("Test Area").should("exist");
  });
});
