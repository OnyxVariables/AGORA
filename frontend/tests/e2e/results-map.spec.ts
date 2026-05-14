import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /INGRESAR/i }).click();
  await page.waitForURL(/\/(CRUDVotations|Home)/, { timeout: 20000 });
});

test("ciudadano: /Resultados con votación finalizada muestra tabla al clicar mapa", async ({
  page,
}) => {
  if (!page.url().includes("Home")) {
    test.skip(true, "Sesión de prueba no es ciudadano; omitir mapa de resultados.");
  }
  await page.goto("/Resultados");
  await expect(page.locator(".electionsMap")).toBeVisible({ timeout: 15000 });

  await page.waitForSelector("#map-container svg path[data-name]", {
    timeout: 20000,
  });

  await page.locator("#map-container svg path[data-name]").first().click({
    timeout: 10000,
    force: true,
  });

  const table = page.locator("dialog .results-table");
  await expect(table).toBeVisible({ timeout: 8000 });
  await expect(table.locator("th", { hasText: /partido/i })).toBeVisible();
  await expect(table.locator("th", { hasText: /escaños/i })).toBeVisible();
});
