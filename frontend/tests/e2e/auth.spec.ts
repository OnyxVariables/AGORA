import { expect, test } from "@playwright/test";

/**
 * En desarrollo, `CertAuthController` fija un DNI de prueba (admin o ciudadano).
 * Este test asume el DNI configurado como administrador (redirección a /CRUDVotations).
 */
test("certificado de prueba: acceso y redirección post-login", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /INGRESAR/i }).click();
  await expect(page).toHaveURL(/\/(CRUDVotations|Home)/, { timeout: 20000 });
});
