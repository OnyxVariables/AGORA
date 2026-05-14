describe("Citizen vote flow", () => {
  it("citizen reaches votar page", () => {
    cy.loginAsCitizen();
    cy.visit("/Votar");
    cy.contains("Enviar", { timeout: 30000 }).should("be.visible");
  });
});
