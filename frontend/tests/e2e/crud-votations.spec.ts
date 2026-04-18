import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /INGRESAR/i }).click();
  await page.waitForURL(/\/(CRUDVotations|Home)/, { timeout: 20000 });
});

test("admin: abrir CRUD y ver botón crear", async ({ page }) => {
  const url = page.url();
  if (!url.includes("CRUDVotations")) {
    test.skip(true, "Sesión de prueba no es administrador; omitir CRUD.");
  }
  await page.goto("/CRUDVotations");
  await expect(
    page.getByRole("button", { name: /crear/i }).or(page.locator(".crudvotations")),
  ).toBeVisible({ timeout: 15000 });
});
