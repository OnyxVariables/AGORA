describe("Resultados vote verification UI", () => {
  it("shows verification code search for citizens", () => {
    cy.loginAsCitizen();
    cy.visit("/resultados");
    cy.contains("código de verificación", { matchCase: false }).should("be.visible");
    cy.get("#verification-code").should("exist");
    cy.contains("button", "Verificar mi voto").should("be.visible");
  });
});
