import { test, expect } from "@playwright/test";

const owner = "10000000-0000-0000-0000-000000000001";
async function mock(page, role = "proprietario", fixtures = {}) {
  const clientes = [];
  let fail = true;
  await page.addInitScript(({ owner }) => {
    localStorage.setItem("sb-pilot-test-auth-token", JSON.stringify({
      access_token: "test-token", refresh_token: "test-refresh", expires_at: 4102444800, token_type: "bearer",
      user: { id: owner, email: "owner@example.test", aud: "authenticated", role: "authenticated" },
    }));
  }, { owner });
  await page.route("https://pilot-test.supabase.co/**", async route => {
    const req = route.request(), url = new URL(req.url());
    const table = url.pathname.split("/").at(-1);
    const json = body => route.fulfill({ contentType: "application/json", body: JSON.stringify(body) });
    if (table === "workspace") return json({ owner_id: owner, nome: "Petshop do teste", acesso: "piloto", papel: role, limite_membros: 5 });
    if (table === "configuracoes") return json({ owner_id: owner, horario_abertura: 8, horario_fechamento: 18 });
    if (table === "clientes") {
      if (req.method() === "POST") {
        if (fail) { fail = false; return route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ message: "Falha simulada de conexão" }) }); }
        const row = { id: "cliente-1", owner_id: owner, ...req.postDataJSON() };
        clientes.push(row); return json(row);
      }
      return json(clientes);
    }
    if (table === "user") return json({ id: owner, email: "owner@example.test" });
    return json(fixtures[table] || []);
  });
}

test("login acessível, recuperação e tela pequena", async ({ page }) => {
  await page.route("https://pilot-test.supabase.co/auth/v1/recover**", route => route.fulfill({ contentType: "application/json", body: "{}" }));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Entrar", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Esqueci minha senha" }).click();
  await page.getByLabel("E-mail", { exact: true }).fill("owner@example.test");
  await page.getByRole("button", { name: "Enviar link" }).click();
  await expect(page.getByRole("status")).toContainText("receberá um link");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/login-mobile.png", fullPage: true });
});

test("falha ao salvar preserva rascunho; retry salva cliente", async ({ page }) => {
  await mock(page);
  await page.goto("/#/clientes");
  await page.getByRole("button", { name: "Novo Cliente" }).click();
  await page.getByPlaceholder("Nome", { exact: true }).fill("Ana");
  await page.getByPlaceholder(/Telefone/).fill("11999999999");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Falha simulada");
  await expect(page.getByPlaceholder("Nome", { exact: true })).toHaveValue("Ana");
  await page.getByRole("button", { name: "Adicionar", exact: true }).click();
  await expect(page.getByPlaceholder("Nome", { exact: true })).toHaveValue("");
  await expect(page.getByText("Ana", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/clientes-desktop.png", fullPage: true });
});

test("atendente não recebe navegação de gestão", async ({ page }) => {
  await mock(page, "atendente");
  await page.goto("/#/settings");
  await expect(page.getByText("Esta área é restrita à gestão.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Financeiro", exact: true })).toHaveCount(0);
});

test("venda com falha mantém dados e reutiliza a chave ao tentar novamente", async ({ page }) => {
  const produto = { id: "50000000-0000-0000-0000-000000000005", nome: "Ração", quantidade: 5, estoque_minimo: 1, preco_custo: 5, preco_venda: 10 };
  await mock(page, "proprietario", { produtos: [produto] });
  const requests = [];
  await page.route("**/rest/v1/rpc/registrar_venda", async route => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: requests.length === 1 ? 409 : 200, contentType: "application/json",
      body: JSON.stringify(requests.length === 1 ? { message: "Conflito simulado. Tente novamente." } : {}),
    });
  });
  await page.goto("/#/vendas");
  await page.getByRole("combobox").nth(1).selectOption(`produto:${produto.id}`);
  await page.getByPlaceholder("Quantidade").fill("2");
  await page.getByRole("button", { name: "Registrar Venda" }).click();
  await expect(page.getByRole("alert")).toContainText("Conflito simulado");
  await expect(page.getByPlaceholder("Quantidade")).toHaveValue("2");
  await page.getByRole("button", { name: "Registrar Venda" }).click();
  await expect(page.getByPlaceholder("Quantidade")).toHaveValue("1");
  expect(requests).toHaveLength(2);
  expect(requests[0].p_request).toBe(requests[1].p_request);
  expect(requests[0].p_produto).toBe(produto.id);
});
