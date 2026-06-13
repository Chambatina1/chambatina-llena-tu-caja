const { chromium } = require('/home/z/my-project/node_modules/playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
  
  const logs = [];
  page.on('console', msg => { if (msg.type() === 'error') logs.push(msg.text().substring(0, 120)); });
  page.on('pageerror', err => logs.push('ERR: ' + err.message.substring(0, 120)));

  console.log('=== Going to /crear-web ===');
  await page.goto('https://plataformachambatina.onrender.com/crear-web', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(5000);

  // Step 1: Select type
  console.log('\n--- STEP 1 ---');
  const tipoBtn = page.locator('button:has-text("Tienda Online")');
  if (await tipoBtn.count() > 0) {
    await tipoBtn.first().click();
    console.log('Selected: Tienda Online');
    await page.waitForTimeout(500);
  }

  // Click Continuar
  const cont1 = page.locator('button:has-text("Continuar")').first();
  if (await cont1.count() > 0) {
    await cont1.click();
    console.log('Clicked Continuar');
    await page.waitForTimeout(1000);
  }

  // Step 2: Fill business data
  console.log('\n--- STEP 2 ---');
  const nameInput = page.locator('input[placeholder*="Carlos"]');
  if (await nameInput.count() > 0) {
    await nameInput.fill('Mi Tienda Test');
    console.log('Filled name: Mi Tienda Test');
    await page.waitForTimeout(1500); // wait for slug check
  }

  const slugInput = page.locator('input[placeholder*="mi-negocio"]');
  if (await slugInput.count() > 0) {
    const slugVal = await slugInput.inputValue();
    console.log('Slug auto-filled:', slugVal);
  }

  const whatsappInput = page.locator('input[placeholder*="70000000"]');
  if (await whatsappInput.count() > 0) {
    await whatsappInput.fill('+17869426904');
    console.log('Filled WhatsApp');
  }

  // Click Continuar to Step 3
  const cont2 = page.locator('button:has-text("Continuar")').first();
  if (await cont2.count() > 0) {
    const disabled = await cont2.isDisabled();
    console.log('Continuar button disabled:', disabled);
    if (!disabled) {
      await cont2.click();
      console.log('Clicked Continuar -> Step 3');
      await page.waitForTimeout(1000);
    } else {
      console.log('CANNOT PROCEED - button disabled');
    }
  }

  // Step 3: Domain
  console.log('\n--- STEP 3 ---');
  const step3Title = await page.locator('text=Tu Dominio Propio').count();
  console.log('Step 3 visible:', step3Title > 0);

  const domainInput = page.locator('input[placeholder*="tunegocio"]');
  console.log('Domain input count:', await domainInput.count());
  if (await domainInput.count() > 0) {
    const visible = await domainInput.isVisible();
    const enabled = await domainInput.isEnabled();
    console.log('Domain input visible:', visible, 'enabled:', enabled);

    if (visible && enabled) {
      // Try typing
      await domainInput.fill('mitienda');
      const val = await domainInput.inputValue();
      console.log('Typed value:', val);

      // Click Buscar
      const buscarBtn = page.locator('button:has-text("Buscar")');
      if (await buscarBtn.count() > 0) {
        await buscarBtn.first().click();
        console.log('Clicked Buscar');
        await page.waitForTimeout(5000);

        // Check result
        const resultText = await page.evaluate(() => document.body.innerText);
        const hasDisponible = resultText.includes('Disponible');
        const hasNoDisponible = resultText.includes('No disponible');
        const hasSeleccionar = resultText.includes('Seleccionar');
        console.log('Has Disponible:', hasDisponible);
        console.log('Has No disponible:', hasNoDisponible);
        console.log('Has Seleccionar:', hasSeleccionar);
      }
    }
  }

  await page.screenshot({ path: '/home/z/my-project/download/crear-step3.png', fullPage: true });
  console.log('\nScreenshot saved');

  if (logs.length) console.log('ERRORS:', logs.slice(0, 5));
  await browser.close();
})();
