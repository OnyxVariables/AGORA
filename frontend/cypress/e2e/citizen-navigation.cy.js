describe("Citizen navigation", () => {
  it("home shows parties or loading", () => {
    cy.loginAsCitizen();
    cy.visit("/Home");
    cy.get("main", { timeout: 30000 }).should("exist");
  });
});
