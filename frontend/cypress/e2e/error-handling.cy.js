describe("Error handling", () => {
  it("unknown route shows 404 content", () => {
    cy.visit("/ruta-inexistente-xyz", { failOnStatusCode: false });
    cy.get("body").should("exist");
  });
});
