Cypress.Commands.add("loginAsAdmin", () => {
  cy.visit("/");
  cy.contains("INGRESAR").click();
  cy.url({ timeout: 20000 }).should("include", "CRUDVotations");
});

Cypress.Commands.add("loginAsCitizen", () => {
  cy.visit("/");
  cy.contains("INGRESAR").click();
  cy.url({ timeout: 20000 }).should("satisfy", (u) =>
    u.includes("Home") || u.includes("home"),
  );
});
