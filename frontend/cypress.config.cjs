const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || "http://localhost:8080",
    supportFile: "cypress/support/e2e.js",
    specPattern: "cypress/e2e/**/*.cy.js",
    defaultCommandTimeout: 15000,
    video: false,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
