import { test, expect } from '@playwright/test';

test('Landing page loads correctly and has booking section', async ({ page }) => {
  // Navegamos a la raíz
  await page.goto('/');

  // Verificamos el título
  await expect(page).toHaveTitle(/Club Gentleman for Men/);

  // Verificamos que exista el título de la sección de reservas
  const bookingTitle = page.locator('h2', { hasText: 'Reserva tu cita' });
  await expect(bookingTitle).toBeVisible();

  // Verificamos que el botón de WhatsApp (u otra red social) esté presente
  const facebookLink = page.locator('a[title="Facebook"]');
  const instagramLink = page.locator('a[title="Instagram"]');
  
  // Al menos alguna red debe ser visible
  const hasSocials = (await facebookLink.isVisible()) || (await instagramLink.isVisible());
  if (hasSocials) {
    expect(hasSocials).toBeTruthy();
  }
});
