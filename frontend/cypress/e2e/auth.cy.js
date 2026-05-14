describe("Auth", () => {
  it("shows landing and login button", () => {
    cy.visit("/");
    cy.contains("INGRESAR").should("be.visible");
  });
});
