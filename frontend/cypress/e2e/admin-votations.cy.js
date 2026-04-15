describe("Admin CRUD votations", () => {
  it("admin can open CRUD after login", () => {
    cy.loginAsAdmin();
    cy.contains("Cargando votaciones", { timeout: 30000 }).should("not.exist");
  });
});
