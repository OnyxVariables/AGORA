import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /INGRESAR/i }).click();
  await page.waitForURL(/\/(CRUDVotations|Home)/, { timeout: 20000 });
});

test("admin: /metrics muestra desglose con columna Escaños", async ({
  page,
}) => {
  if (!page.url().includes("CRUDVotations")) {
    await page.goto("/CRUDVotations");
  }
  if (!page.url().includes("CRUDVotations")) {
    test.skip(true, "No hay sesión admin.");
  }
  await page.goto("/metrics");
  await expect(
    page.getByRole("heading", { name: /Participación y desglose/i }),
  ).toBeVisible({ timeout: 15000 });

  const escañosHeader = page.locator("#votes-by-party thead th", {
    hasText: /escaños/i,
  });
  await expect(escañosHeader).toBeVisible();

  const creadoHeader = page.locator("#blocks-chain thead th", {
    hasText: /creado/i,
  });
  await expect(creadoHeader).toBeVisible();
});

test("toast copiado usa clase CMC", async ({ page, context }) => {
  if (!page.url().includes("CRUDVotations")) {
    await page.goto("/CRUDVotations");
  }
  if (!page.url().includes("CRUDVotations")) {
    test.skip(true, "No hay sesión admin.");
  }
  await page.goto("/metrics");
  await page.waitForSelector("#votation-summary", { timeout: 15000 });
  const copyBtn = page.locator("#votation-summary button[title='Copiar al portapapeles']").first();
  const count = await copyBtn.count();
  if (count === 0) {
    test.skip(true, "Sin fila con botón copiar en resumen (p. ej. sin txHash).");
  }
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await copyBtn.click();
  await expect(page.locator(".cmc-toast")).toBeVisible({ timeout: 5000 });
});
