/**
 * Capturas de tela em três larguras para revisão visual (pasta screenshots/).
 * Rode com: npm run e2e -- screens
 */
import { expect, test } from '@playwright/test'
import { progressWithFirstMission, progressWithPhase1, seedProgress } from './helpers'

const VIEWPORTS = [
  { name: 'celular', width: 390, height: 844 },
  { name: 'tablet', width: 820, height: 1180 },
  { name: 'desktop', width: 1440, height: 900 },
]

const SCREENS = [
  { name: 'base', path: '/' },
  { name: 'mapa-trilha', path: '/#/trilha/storage.s3-expedition' },
  { name: 'fase-1', path: '/#/fase/s3x.f01' },
  { name: 'codex', path: '/#/codex' },
  { name: 'conceito', path: '/#/codex/storage.object' },
  { name: 'dossie', path: '/#/dossie' },
  { name: 'revisao', path: '/#/revisao' },
]

for (const vp of VIEWPORTS) {
  test.describe(`telas — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height }, colorScheme: 'dark' })

    test('páginas principais', async ({ page }) => {
      await seedProgress(page, progressWithFirstMission())
      for (const screen of SCREENS) {
        await page.goto(screen.path)
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Carregando…')).toHaveCount(0)
        await page.waitForTimeout(250)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${screen.name}`).toBeLessThanOrEqual(0)
        await page.screenshot({ path: `screenshots/${vp.name}-${screen.name}.png`, fullPage: true })
      }
    })

    test('missão: intel, laboratório e feedback', async ({ page }) => {
      await seedProgress(page, progressWithFirstMission())
      await page.goto('/#/missao/s3x.f01.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.screenshot({ path: `screenshots/${vp.name}-intel.png`, fullPage: true })
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      await page.getByRole('button', { name: /^ensaios\// }).click()
      await page.getByRole('button', { name: /^2026\// }).click()
      await page.getByRole('button', { name: /^aniversario-davi\// }).click()
      await page.getByRole('button', { name: 'album.zip' }).click()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-lab.png`, fullPage: true })
      for (let i = 1; i <= 7; i++) {
        const field = page.getByLabel(`Resposta da tarefa ${i}`)
        if (await field.count()) await field.fill(i === 7 ? 'sa-east-1' : '1')
      }
      await page.getByRole('button', { name: 'Marcar como resposta da tarefa 1' }).click()
      await page.getByRole('button', { name: 'Marcar como resposta da tarefa 5' }).click()
      await page.getByRole('button', { name: 'Verificar' }).click()
      await page.waitForTimeout(400)
      await page.screenshot({ path: `screenshots/${vp.name}-feedback.png`, fullPage: true })
    })
  })
}

test.describe('fase 2 — custos', () => {
  for (const vp of VIEWPORTS) {
    test(`laboratório de custos — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      await seedProgress(page, progressWithPhase1(new Date(), { activities: ['s3x.f02.m1.a1', 's3x.f02.m1.a2', 's3x.f02.m1.a3'], missions: ['s3x.f02.m1'] }))
      await page.goto('/#/missao/s3x.f02.m1')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.screenshot({ path: `screenshots/${vp.name}-f2-intel.png`, fullPage: true })
      await page.goto('/#/missao/s3x.f02.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      const groups = page.getByRole('radiogroup', { name: /Classe para/ })
      await groups.nth(0).getByRole('radio', { name: /Standard-IA/ }).click()
      await groups.nth(1).getByRole('radio', { name: /Glacier IR/ }).click()
      await groups.nth(2).getByRole('radio', { name: /Deep Archive/ }).click()
      await groups.nth(3).getByRole('radio', { name: /One Zone-IA/ }).click()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f2-custos.png`, fullPage: true })
      await page.getByRole('button', { name: 'Verificar' }).click()
      await expect(page.getByText('Comparação de todas as classes para este perfil').first()).toBeVisible()
      await page.screenshot({ path: `screenshots/${vp.name}-f2-custos-feedback.png`, fullPage: true })
    })
  }
})

test('tema claro', async ({ page }) => {
  const p = progressWithFirstMission()
  p.settings.theme = 'light'
  await seedProgress(page, p)
  await page.setViewportSize({ width: 1440, height: 900 })
  for (const screen of [SCREENS[0], SCREENS[1]]) {
    await page.goto(screen.path)
    await page.waitForLoadState('networkidle')
    await expect(page.getByText('Carregando…')).toHaveCount(0)
    await page.waitForTimeout(250)
    await page.screenshot({ path: `screenshots/claro-${screen.name}.png`, fullPage: true })
  }
})

test.describe('fase 3 — acesso', () => {
  for (const vp of VIEWPORTS) {
    test(`laboratório de acesso — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const f3m1 = ['s3x.f03.m1.a1', 's3x.f03.m1.a2', 's3x.f03.m1.a3', 's3x.f03.m1.a4']
      const f3m2 = ['s3x.f03.m2.a1', 's3x.f03.m2.a2', 's3x.f03.m2.a3']
      const f3m3 = ['s3x.f03.m3.a1', 's3x.f03.m3.a2', 's3x.f03.m3.a3', 's3x.f03.m3.a4', 's3x.f03.m3.a5']
      await seedProgress(page, progressWithPhase1(new Date(), { activities: [...f3m1, ...f3m2, ...f3m3], missions: ['s3x.f03.m1', 's3x.f03.m2', 's3x.f03.m3'] }))
      await page.goto('/#/missao/s3x.f03.m1')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      // Pula as duas predições para chegar ao laboratório.
      for (let i = 0; i < 2; i++) {
        await page.getByRole('radio', { name: 'Permitido' }).first().click()
        await page.getByRole('button', { name: 'Verificar' }).click()
        await page.getByRole('button', { name: /Próximo desafio|Continuar mesmo assim/ }).first().click()
      }
      await page.getByRole('button', { name: 'Remover a declaração AppTudo' }).click()
      await page.getByRole('button', { name: 'Adicionar a declaração AppGravaEntrada' }).click()
      await page.getByRole('button', { name: /^app-contabil, Ler clientes/ }).click()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f3-acesso.png`, fullPage: true })

      await page.goto('/#/missao/s3x.f03.boss')
      await page.getByRole('button', { name: 'Começar o desafio' }).click()
      const ov2 = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(ov2).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f3-chefe.png`, fullPage: true })
    })
  }
})

test.describe('fase 4 — KMS', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`laboratório de KMS — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const f3 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4', 'm2.a1', 'm2.a2', 'm2.a3', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'm3.a5', 'boss.a1', 'boss.a2', 'boss.a3', 'boss.a4'].map((x) => `s3x.f03.${x}`)
      const f4 = ['m1.a1', 'm1.a2', 'm1.a3', 'm2.a1', 'm2.a2', 'm2.a3', 'm2.a4'].map((x) => `s3x.f04.${x}`)
      await seedProgress(page, progressWithPhase1(new Date(), { activities: [...f3, ...f4], missions: ['s3x.f03.m1', 's3x.f03.m2', 's3x.f03.m3', 's3x.f03.boss', 's3x.f04.m1', 's3x.f04.m2'] }))
      await page.goto('/#/missao/s3x.f04.m3')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      for (let i = 0; i < 2; i++) {
        await page.getByRole('radio', { name: 'Permitido' }).first().click()
        await page.getByRole('button', { name: 'Verificar' }).click()
        await page.getByRole('button', { name: /Próximo desafio|Continuar mesmo assim/ }).first().click()
      }
      await page.getByRole('button', { name: 'Adicionar a declaração TodosUsam' }).click()
      await page.getByRole('button', { name: 'Verificar' }).click()
      await page.waitForTimeout(400)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f4-kms.png`, fullPage: true })
    })
  }
})

test.describe('fase 5 — versionamento', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`laboratório de versionamento — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const m1 = ['a1', 'a2', 'a3', 'a4'].map((x) => `s3x.f05.m1.${x}`)
      await seedProgress(page, progressWithPhase1(new Date(), { activities: m1, missions: ['s3x.f05.m1'] }))
      await page.goto('/#/missao/s3x.f05.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      await page.getByRole('button', { name: /^Excluir para sempre a versão .* de contrato.pdf/ }).first().click()
      await page.getByRole('button', { name: /^GET de contrato.pdf/ }).click()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f5-versoes.png`, fullPage: true })
    })
  }
})

test.describe('fase 6 — lifecycle', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`laboratório de lifecycle — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const f2 = ['m1.a1', 'm1.a2', 'm1.a3', 'm2.a1', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'm3.a5', 'boss.a1', 'boss.a2'].map((x) => `s3x.f02.${x}`)
      const f5 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4', 'm2.a1', 'm2.a2', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'boss.a1', 'boss.a2', 'boss.a3', 'boss.a4'].map((x) => `s3x.f05.${x}`)
      const f6 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4', 'm2.a1', 'm2.a2', 'm3.a1', 'm3.a2', 'm3.a3', 'boss.a1'].map((x) => `s3x.f06.${x}`)
      const missions = ['s3x.f02.m1', 's3x.f02.m2', 's3x.f02.m3', 's3x.f02.boss', 's3x.f05.m1', 's3x.f05.m2', 's3x.f05.m3', 's3x.f05.boss', 's3x.f06.m1', 's3x.f06.m2', 's3x.f06.m3']
      const seeded = { ...progressWithPhase1(new Date(), { activities: [...f2, ...f5, ...f6], missions }), resume: { missionId: 's3x.f06.boss', step: 2, at: new Date().toISOString() } }
      await seedProgress(page, seeded)
      await page.goto('/#/missao/s3x.f06.boss')
      await expect(page.getByText('PutBucketLifecycleConfiguration rejeitado', { exact: false })).toBeVisible()
      await page.screenshot({ path: `screenshots/${vp.name}-f6-chefe.png`, fullPage: true })
      await page.goto('/#/missao/s3x.f06.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      await page.getByRole('button', { name: 'Adicionar regra' }).click()
      await page.getByLabel('Prefixo').first().selectOption('telemetria/')
      await page.getByRole('button', { name: 'Transição' }).first().click()
      await page.getByRole('button', { name: 'Transição' }).first().click()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f6-lifecycle.png`, fullPage: true })
    })
  }
})

test.describe('fase 7 — replicação', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`laboratório de replicação — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const f3 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4', 'm2.a1', 'm2.a2', 'm2.a3', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'm3.a5', 'boss.a1', 'boss.a2', 'boss.a3', 'boss.a4'].map((x) => `s3x.f03.${x}`)
      const f5 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4', 'm2.a1', 'm2.a2', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'boss.a1', 'boss.a2', 'boss.a3', 'boss.a4'].map((x) => `s3x.f05.${x}`)
      const missions = ['s3x.f03.m1', 's3x.f03.m2', 's3x.f03.m3', 's3x.f03.boss', 's3x.f05.m1', 's3x.f05.m2', 's3x.f05.m3', 's3x.f05.boss', 's3x.f07.m1']
      await seedProgress(page, progressWithPhase1(new Date(), { activities: [...f3, ...f5, 's3x.f07.m1.a1', 's3x.f07.m1.a2'], missions }))
      await page.goto('/#/missao/s3x.f07.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      await page.getByLabel('Versionamento da origem').selectOption('Enabled')
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f7-replicacao.png`, fullPage: true })
    })
  }
})

test.describe('fase 8 — eventos', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`laboratório de eventos — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const f3 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4', 'm2.a1', 'm2.a2', 'm2.a3', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'm3.a5', 'boss.a1', 'boss.a2', 'boss.a3', 'boss.a4'].map((x) => `s3x.f03.${x}`)
      const f8 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4'].map((x) => `s3x.f08.${x}`)
      const missions = ['s3x.f03.m1', 's3x.f03.m2', 's3x.f03.m3', 's3x.f03.boss', 's3x.f08.m1']
      await seedProgress(page, progressWithPhase1(new Date(), { activities: [...f3, ...f8], missions }))
      await page.goto('/#/missao/s3x.f08.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      await page.getByLabel('Enviar os eventos do bucket ao EventBridge').check()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f8-eventos.png`, fullPage: true })
    })
  }
})

test.describe('fases 9 a 11 — laboratórios', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`requester pays, gateway e transferência — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const f2 = ['m1.a1', 'm1.a2', 'm1.a3', 'm2.a1', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'm3.a5', 'boss.a1', 'boss.a2'].map((x) => `s3x.f02.${x}`)
      const f3 = ['m1.a1', 'm1.a2', 'm1.a3', 'm1.a4', 'm2.a1', 'm2.a2', 'm2.a3', 'm3.a1', 'm3.a2', 'm3.a3', 'm3.a4', 'm3.a5', 'boss.a1', 'boss.a2', 'boss.a3', 'boss.a4'].map((x) => `s3x.f03.${x}`)
      const extra = ['s3x.f10.m1.a1', 's3x.f10.m1.a2', 's3x.f11.m1.a1', 's3x.f11.m1.a2', 's3x.f11.m1.a3']
      const missions = ['s3x.f02.m1', 's3x.f02.m2', 's3x.f02.m3', 's3x.f02.boss', 's3x.f03.m1', 's3x.f03.m2', 's3x.f03.m3', 's3x.f03.boss', 's3x.f10.m1', 's3x.f11.m1']
      const at = new Date().toISOString()
      await seedProgress(page, { ...progressWithPhase1(new Date(), { activities: [...f2, ...f3, ...extra], missions }), resume: { missionId: 's3x.f09.m1', step: 4, at } })
      await page.goto('/#/missao/s3x.f09.m1')
      await page.getByLabel('Resposta do S3').first().selectOption('200')
      let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f9-rp.png`, fullPage: true })
      await page.goto('/#/missao/s3x.f10.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      await page.getByLabel(/^Gateway para Servidor de desenhos/).selectOption('s3-file')
      overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f10-gateway.png`, fullPage: true })
      await page.goto('/#/missao/s3x.f11.m2')
      await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
      await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
      await page.getByLabel('Método para Acervo digitalizado').selectOption('datasync-dx')
      await page.getByLabel('Método para Servidor de edição').selectOption('internet-cli')
      await page.getByLabel('Método para Gravações de campo').selectOption('terminal')
      await page.getByRole('button', { name: 'Verificar' }).click()
      await page.waitForTimeout(300)
      overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-f11-transfer.png`, fullPage: true })
    })
  }
})

test.describe('desafio final', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`Projeto Atlas — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      // Carrega o registro de conteúdo pelo Vite (resolve JSON e TS como o app).
      const { createServer } = await import('vite')
      const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'silent' })
      const { registry } = (await vite.ssrLoadModule('/src/content/index.ts')) as typeof import('../../src/content')
      await vite.close()
      const phases = ['s3x.f02', 's3x.f03', 's3x.f04', 's3x.f05', 's3x.f06', 's3x.f07', 's3x.f08', 's3x.f09']
      const missions = phases.flatMap((id) => registry.phases.get(id)!.phase.missions)
      await seedProgress(page, progressWithPhase1(new Date(), { activities: missions.flatMap((m) => m.activities.map((a) => a.id)), missions: missions.map((m) => m.id) }))
      await page.goto('/#/missao/s3x.final.atlas')
      await page.getByRole('button', { name: 'Começar o desafio' }).click()
      const pick = async (label: RegExp) => page.getByRole('radio', { name: label }).first().click()
      await pick(/^Amazon S3$/)
      await pick(/Um bucket para documentos/)
      await page.getByRole('button', { name: 'Próxima etapa' }).click()
      await pick(/^S3 Standard$/)
      await page.getByRole('radiogroup', { name: /Resultados de simulação/ }).getByRole('radio', { name: /^S3 One Zone-IA$/ }).click()
      await page.getByRole('radiogroup', { name: /Projetos encerrados/ }).getByRole('radio', { name: /^S3 Glacier Deep Archive$/ }).click()
      await page.getByRole('button', { name: 'Próxima etapa' }).click()
      await pick(/Block Public Access na conta/)
      await pick(/URLs pré-assinadas/)
      await pick(/Role com ações/)
      await page.getByRole('button', { name: 'Próxima etapa' }).click()
      await pick(/SSE-KMS com chave do cliente e S3 Bucket Key/)
      await pick(/Deny quando/)
      await page.getByRole('button', { name: 'Próxima etapa' }).click()
      await pick(/Versionamento \+ expiração/)
      await pick(/AbortIncompleteMultipartUpload/)
      await page.getByRole('button', { name: 'Próxima etapa' }).click()
      await pick(/sem opções extras/)
      await pick(/Não replicar delete markers/)
      await page.screenshot({ path: `screenshots/${vp.name}-final-etapa.png`, fullPage: true })
      await page.getByRole('button', { name: 'Próxima etapa' }).click()
      await pick(/fila SQS consumida/)
      await pick(/Fan-out/)
      await page.getByRole('button', { name: 'Próxima etapa' }).click()
      await pick(/Manter as URLs/)
      await pick(/Batch Replication/)
      await page.getByRole('button', { name: 'Verificar' }).click()
      await expect(page.getByText('Relatório do Projeto Atlas')).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-final-relatorio.png`, fullPage: true })
    })
  }
})

/** Progresso com missões da AWS Foundations aprovadas e, opcionalmente, um ponteiro de retomada. */
function foundationsProgress(passed: string[], resume?: { missionId: string; step: number }) {
  const at = new Date().toISOString()
  const base = progressWithFirstMission()
  return {
    ...base,
    missions: { ...base.missions, ...Object.fromEntries(passed.map((id) => [id, { startedAt: at, passedAt: at, bonusAwarded: true }])) },
    ...(resume ? { resume: { ...resume, at } } : {}),
  }
}

const F1 = ['fnd.f01.m1', 'fnd.f01.m2', 'fnd.f01.m3', 'fnd.f01.m4', 'fnd.f01.m5', 'fnd.f01.m6', 'fnd.f01.boss']
const F2 = ['fnd.f02.m1', 'fnd.f02.m2', 'fnd.f02.m3', 'fnd.f02.boss']
const F3 = ['fnd.f03.m1', 'fnd.f03.m2', 'fnd.f03.m3', 'fnd.f03.boss']

/** Telas da AWS Foundations: cada laboratório aberto direto pelo ponteiro de retomada (passo da missão). */
const FOUNDATIONS_LABS: { name: string; passed: string[]; missionId: string; step: number; after?: (page: import('@playwright/test').Page) => Promise<void> }[] = [
  { name: 'fnd-intel-hierarquia', passed: [], missionId: 'fnd.f01.m1', step: 1 },
  {
    name: 'fnd-regioes',
    passed: [],
    missionId: 'fnd.f01.m1',
    step: 3,
    after: async (page) => {
      await page.getByRole('radiogroup').first().getByRole('radio').nth(1).click()
    },
  },
  {
    name: 'fnd-zonas',
    passed: F1.slice(0, 1),
    missionId: 'fnd.f01.m2',
    step: 2,
    after: async (page) => {
      await page.getByRole('radio', { name: /Falha da AZ a/ }).click()
    },
  },
  { name: 'fnd-intel-borda', passed: F1.slice(0, 5), missionId: 'fnd.f01.m6', step: 1 },
  { name: 'fnd-borda', passed: F1.slice(0, 5), missionId: 'fnd.f01.m6', step: 4 },
  { name: 'fnd-infra-chefe', passed: F1.slice(0, 6), missionId: 'fnd.f01.boss', step: 1 },
  {
    name: 'fnd-suporte',
    passed: [...F2.slice(0, 1)],
    missionId: 'fnd.f02.m2',
    step: 2,
    after: async (page) => {
      await page.getByRole('radiogroup').first().getByRole('radio').nth(1).click()
    },
  },
  {
    name: 'fnd-responsabilidade',
    passed: [...F3.slice(0, 2)],
    missionId: 'fnd.f03.m3',
    step: 2,
    // Algumas camadas marcadas para mostrar o estado selecionado e o contador do cartão.
    after: async (page) => {
      const groups = page.getByRole('radiogroup')
      await groups.nth(0).getByRole('radio', { name: 'AWS' }).click()
      await groups.nth(1).getByRole('radio', { name: 'AWS' }).click()
      await groups.nth(4).getByRole('radio', { name: 'Cliente' }).click()
      await groups.nth(5).getByRole('radio', { name: 'Compartilhado' }).click()
      await expect(groups.nth(0).getByRole('radio', { name: 'AWS' })).toHaveAttribute('aria-checked', 'true')
    },
  },
  { name: 'fnd-incidente', passed: [...F3.slice(0, 3)], missionId: 'fnd.f03.boss', step: 2 },
]

test.describe('AWS Foundations', () => {
  for (const vp of [VIEWPORTS[0], VIEWPORTS[2]]) {
    test(`mapa e laboratórios — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      await seedProgress(page, foundationsProgress([]))
      for (const path of ['/#/trilha/foundations.aws-foundations', '/#/mapa']) {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Carregando…')).toHaveCount(0)
      }
      await page.goto('/#/trilha/foundations.aws-foundations')
      await page.screenshot({ path: `screenshots/${vp.name}-fnd-mapa.png`, fullPage: true })
    })

    for (const lab of FOUNDATIONS_LABS) {
      test(`${lab.name} — ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.emulateMedia({ colorScheme: 'dark' })
        await seedProgress(page, foundationsProgress(lab.passed, { missionId: lab.missionId, step: lab.step }))
        await page.goto(`/#/missao/${lab.missionId}`)
        await page.waitForLoadState('networkidle')
        await expect(page.getByText('Carregando…')).toHaveCount(0)
        if (lab.after) await lab.after(page)
        await page.waitForTimeout(250)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${lab.name}`).toBeLessThanOrEqual(0)
        await page.screenshot({ path: `screenshots/${vp.name}-${lab.name}.png`, fullPage: true })
      })
    }

    test(`Architecture Foundations — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      await seedProgress(page, foundationsProgress([...F1, ...F2, ...F3], { missionId: 'fnd.final.pulso', step: 2 }))
      await page.goto('/#/missao/fnd.final.pulso')
      await expect(page.getByRole('heading', { name: /Etapa 1 de 8/ })).toBeVisible()
      for (let i = 0; i < 8; i++) {
        await expect(page.getByRole('heading', { name: new RegExp(`Etapa ${i + 1} de 8`) })).toBeVisible()
        const groups = page.locator('fieldset [role="radiogroup"]')
        const n = await groups.count()
        for (let g = 0; g < n; g++) await groups.nth(g).getByRole('radio').first().click()
        if (i < 7) await page.getByRole('button', { name: 'Próxima etapa' }).click()
      }
      await page.getByRole('button', { name: 'Verificar' }).click()
      await expect(page.getByText('Relatório do Architecture Foundations').first()).toBeVisible()
      await expect(page.getByText('Relação com o SAA-C03')).toBeVisible()
      await expect(page.getByText('Responsabilidades atribuídas incorretamente', { exact: false })).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-fnd-final-relatorio.png`, fullPage: true })
    })
  }
})

/** Missões da trilha IAM na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const IAM_MISSIONS = [
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `iax.f01.${m}`),
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `iax.f02.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `iax.f03.${m}`),
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `iax.f04.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `iax.f05.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `iax.f06.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `iax.f07.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'm5', 'boss'].map((m) => `iax.f08.${m}`),
  'iax.final.ipe',
]

test.describe('trilha IAM e Access Management', () => {
  const CASES = [
    { name: 'iam-mapa', path: '/#/trilha/identity.iam-access' },
    { name: 'iam-f1-previsao', mission: 'iax.f01.m2', step: 4 },
    { name: 'iam-f1-credenciais', mission: 'iax.f01.boss', step: 3 },
    { name: 'iam-f2-construtor', mission: 'iax.f02.m3', step: 2 },
    { name: 'iam-f2-intel', mission: 'iax.f02.m2', step: 1 },
    { name: 'iam-f3-condicoes', mission: 'iax.f03.m4', step: 2 },
    { name: 'iam-f4-camadas', mission: 'iax.f04.m2', step: 2 },
    { name: 'iam-f4-kms', mission: 'iax.f04.boss', step: 3 },
    { name: 'iam-f5-confianca', mission: 'iax.f05.m2', step: 2 },
    { name: 'iam-f6-cloudtrail', mission: 'iax.f06.boss', step: 2 },
    { name: 'iam-f7-identidade', mission: 'iax.f07.boss', step: 1 },
    { name: 'iam-f7-abac', mission: 'iax.f07.m4', step: 2 },
    { name: 'iam-f8-org', mission: 'iax.f08.m2', step: 2 },
    { name: 'iam-final', mission: 'iax.final.ipe', step: 2 },
  ]
  for (const vp of VIEWPORTS) {
    for (const c of CASES) {
      test(`${c.name} — ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.emulateMedia({ colorScheme: 'dark' })
        const before = c.mission ? IAM_MISSIONS.slice(0, IAM_MISSIONS.indexOf(c.mission)) : []
        const base = progressWithPhase1(new Date(), { missions: before })
        const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
        await seedProgress(page, seeded)
        await page.goto(c.path ?? `/#/missao/${c.mission}`)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(250)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
        await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
      })
    }
  }
})

/** Missões da trilha Computação na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const CMP_MISSIONS = [
  ...['f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `cmp.${f}.${m}`)),
  ...['m1', 'm2', 'boss'].map((m) => `cmp.f09.${m}`),
  'cmp.final.varejo',
]

test.describe('trilha Computação na AWS', () => {
  const CASES = [
    { name: 'cmp-mapa', path: '/#/trilha/compute.aws-compute' },
    { name: 'cmp-f1-ciclo', mission: 'cmp.f01.m2', step: 1 },
    { name: 'cmp-f2-tipos', mission: 'cmp.f02.boss', step: 2 },
    { name: 'cmp-f3-volumes', mission: 'cmp.f03.m2', step: 2 },
    { name: 'cmp-f4-compra', mission: 'cmp.f04.boss', step: 2 },
    { name: 'cmp-f5-regras', mission: 'cmp.f05.m2', step: 2 },
    { name: 'cmp-f6-escala', mission: 'cmp.f06.m2', step: 2 },
    { name: 'cmp-f6-zonas', mission: 'cmp.f06.m3', step: 4 },
    { name: 'cmp-f7-concorrencia', mission: 'cmp.f07.m2', step: 2 },
    { name: 'cmp-f9-espectro', mission: 'cmp.f09.m1', step: 1 },
    { name: 'cmp-f9-escolha', mission: 'cmp.f09.boss', step: 2 },
    { name: 'cmp-final', mission: 'cmp.final.varejo', step: 2 },
  ]
  for (const vp of VIEWPORTS) {
    for (const c of CASES) {
      test(`${c.name} — ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.emulateMedia({ colorScheme: 'dark' })
        const before = c.mission ? CMP_MISSIONS.slice(0, CMP_MISSIONS.indexOf(c.mission)) : []
        const base = progressWithPhase1(new Date(), { missions: before })
        const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
        await seedProgress(page, seeded)
        await page.goto(c.path ?? `/#/missao/${c.mission}`)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(250)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
        await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
      })
    }
  }
})

/** Missões da trilha Bancos de dados na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const DB_MISSIONS = [
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `db.f01.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `db.f02.${m}`),
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `db.f03.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `db.f04.${m}`),
  ...['f05', 'f06', 'f07', 'f08'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `db.${f}.${m}`)),
  ...['m1', 'm2', 'boss'].map((m) => `db.f09.${m}`),
  'db.final.varejo',
]

test.describe('trilha Bancos de dados na AWS', () => {
  const CASES = [
    { name: 'db-mapa', path: '/#/trilha/database.aws-database' },
    { name: 'db-f1-dimensionamento', mission: 'db.f01.boss', step: 2 },
    { name: 'db-f2-falha', mission: 'db.f02.m1', step: 2 },
    { name: 'db-f2-continuidade', mission: 'db.f02.boss', step: 2 },
    { name: 'db-f3-escolha', mission: 'db.f03.boss', step: 2 },
    { name: 'db-f4-chaves', mission: 'db.f04.boss', step: 2 },
    { name: 'db-f6-cache', mission: 'db.f06.boss', step: 2 },
    { name: 'db-f8-seguranca', mission: 'db.f08.boss', step: 2 },
    { name: 'db-f9-migracao', mission: 'db.f09.m2', step: 4 },
    { name: 'db-final', mission: 'db.final.varejo', step: 2 },
  ]
  for (const vp of VIEWPORTS) {
    for (const c of CASES) {
      test(`${c.name} — ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.emulateMedia({ colorScheme: 'dark' })
        const before = c.mission ? DB_MISSIONS.slice(0, DB_MISSIONS.indexOf(c.mission)) : []
        const base = progressWithPhase1(new Date(), { missions: before })
        const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
        await seedProgress(page, seeded)
        await page.goto(c.path ?? `/#/missao/${c.mission}`)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(250)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
        await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
      })
    }
  }
})

/** Missões da trilha Monitoramento e governança na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const GOV_MISSIONS = [
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `gov.f01.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `gov.f02.${m}`),
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `gov.f03.${m}`),
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `gov.f04.${m}`),
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `gov.f05.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `gov.f06.${m}`),
  ...['m1', 'm2', 'm3', 'boss'].map((m) => `gov.f07.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `gov.f08.${m}`),
  ...['m1', 'm2', 'm3', 'm4', 'boss'].map((m) => `gov.f09.${m}`),
  'gov.final.operacoes',
]

test.describe('trilha Monitoramento e governança na AWS', () => {
  const CASES: { name: string; mission?: string; step?: number; path?: string }[] = [
    { name: 'gov-f1-previsao', mission: 'gov.f01.m3', step: 2 },
    { name: 'gov-f1-alarmes', mission: 'gov.f01.boss', step: 2 },
    { name: 'gov-f2-logs', mission: 'gov.f02.boss', step: 2 },
    { name: 'gov-f3-investigacao', mission: 'gov.f03.m3', step: 6 },
    { name: 'gov-f3-trilha', mission: 'gov.f03.boss', step: 2 },
    { name: 'gov-f4-regras', mission: 'gov.f04.boss', step: 2 },
    { name: 'gov-f5-ferramentas', mission: 'gov.f05.boss', step: 2 },
    { name: 'gov-f6-atualizacao', mission: 'gov.f06.boss', step: 2 },
    { name: 'gov-f7-conta', mission: 'gov.f07.boss', step: 2 },
    { name: 'gov-f8-orcamentos', mission: 'gov.f08.boss', step: 2 },
    { name: 'gov-f9-escolha', mission: 'gov.f09.boss', step: 2 },
    { name: 'gov-final', mission: 'gov.final.operacoes', step: 2 },
    { name: 'gov-mapa', path: '/#/trilha/governance.aws-governance' },
  ]
  for (const vp of VIEWPORTS) {
    for (const c of CASES) {
      test(`${c.name} — ${vp.name}`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height })
        await page.emulateMedia({ colorScheme: 'dark' })
        const before = c.mission ? GOV_MISSIONS.slice(0, GOV_MISSIONS.indexOf(c.mission)) : []
        const base = progressWithPhase1(new Date(), { missions: before })
        const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
        await seedProgress(page, seeded)
        await page.goto(c.path ?? `/#/missao/${c.mission}`)
        await page.waitForLoadState('networkidle')
        await page.waitForTimeout(250)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
        await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
      })
    }
  }
})

/** Missões da trilha Redes na AWS na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const NET_MISSIONS = [
  ...['f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08', 'f09'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `net.${f}.${m}`)),
  'net.final.projeto',
]

// Módulo novo: por enquanto, só o desktop (tablet e celular ficam para uma etapa própria).
test.describe('trilha Redes na AWS', () => {
  const CASES: { name: string; mission?: string; step?: number; path?: string }[] = [
    { name: 'net-f1-plano', mission: 'net.f01.boss', step: 2 },
    { name: 'net-f2-rotas', mission: 'net.f02.boss', step: 2 },
    { name: 'net-f3-fluxos', mission: 'net.f03.boss', step: 2 },
    { name: 'net-f4-topologias', mission: 'net.f04.boss', step: 2 },
    { name: 'net-f5-endpoints', mission: 'net.f05.boss', step: 2 },
    { name: 'net-f6-hibrida', mission: 'net.f06.boss', step: 2 },
    { name: 'net-f7-politicas', mission: 'net.f07.boss', step: 2 },
    { name: 'net-f8-cache', mission: 'net.f08.boss', step: 2 },
    { name: 'net-f9-escolha', mission: 'net.f09.boss', step: 2 },
    { name: 'net-final', mission: 'net.final.projeto', step: 2 },
    { name: 'net-mapa', path: '/#/trilha/network.aws-network' },
  ]
  const vp = VIEWPORTS.find((v) => v.name === 'desktop')!
  for (const c of CASES) {
    test(`${c.name} — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const before = c.mission ? NET_MISSIONS.slice(0, NET_MISSIONS.indexOf(c.mission)) : []
      const base = progressWithPhase1(new Date(), { missions: before })
      const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
      await seedProgress(page, seeded)
      await page.goto(c.path ?? `/#/missao/${c.mission}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(250)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
    })
  }
})

/** Missões da trilha Análise de dados na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const ANA_MISSIONS = [
  ...['f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `ana.${f}.${m}`)),
  ...['m1', 'm2', 'boss'].map((m) => `ana.f09.${m}`),
  'ana.final.plataforma',
]

// Módulo novo: por enquanto, só o desktop (tablet e celular ficam para uma etapa própria).
test.describe('trilha Análise de dados', () => {
  const CASES: { name: string; mission?: string; step?: number; path?: string }[] = [
    { name: 'ana-f1-lago', mission: 'ana.f01.boss', step: 2 },
    { name: 'ana-f2-madrugada', mission: 'ana.f02.boss', step: 2 },
    { name: 'ana-f3-fatura', mission: 'ana.f03.boss', step: 3 },
    { name: 'ana-f4-permissoes', mission: 'ana.f04.boss', step: 2 },
    { name: 'ana-f5-clusters', mission: 'ana.f05.boss', step: 2 },
    { name: 'ana-f6-ingestao', mission: 'ana.f06.boss', step: 2 },
    { name: 'ana-f7-painel', mission: 'ana.f07.boss', step: 2 },
    { name: 'ana-f8-servicos', mission: 'ana.f08.boss', step: 2 },
    { name: 'ana-f9-escolha', mission: 'ana.f09.boss', step: 2 },
    { name: 'ana-final', mission: 'ana.final.plataforma', step: 2 },
    { name: 'ana-mapa', path: '/#/trilha/analytics.aws-analytics' },
  ]
  const vp = VIEWPORTS.find((v) => v.name === 'desktop')!
  for (const c of CASES) {
    test(`${c.name} — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const before = c.mission ? ANA_MISSIONS.slice(0, ANA_MISSIONS.indexOf(c.mission)) : []
      const base = progressWithPhase1(new Date(), { missions: before })
      const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
      await seedProgress(page, seeded)
      await page.goto(c.path ?? `/#/missao/${c.mission}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(250)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
    })
  }
})

/** Missões da trilha Segurança na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const SEC_MISSIONS = [
  ...['f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `sec.${f}.${m}`)),
  ...['m1', 'm2', 'boss'].map((m) => `sec.f09.${m}`),
  'sec.final.auditoria',
]

// Módulo novo: por enquanto, só o desktop (tablet e celular ficam para uma etapa própria).
test.describe('trilha Segurança', () => {
  const CASES: { name: string; mission?: string; step?: number; path?: string }[] = [
    { name: 'sec-f1-chave', mission: 'sec.f01.boss', step: 2 },
    { name: 'sec-f2-madrugada', mission: 'sec.f02.boss', step: 2 },
    { name: 'sec-f3-rotacao', mission: 'sec.f03.boss', step: 2 },
    { name: 'sec-f4-certificados', mission: 'sec.f04.boss', step: 2 },
    { name: 'sec-f5-achados', mission: 'sec.f05.boss', step: 2 },
    { name: 'sec-f6-macie', mission: 'sec.f06.boss', step: 2 },
    { name: 'sec-f7-painel', mission: 'sec.f07.boss', step: 2 },
    { name: 'sec-f8-ataque', mission: 'sec.f08.boss', step: 2 },
    { name: 'sec-f9-escolha', mission: 'sec.f09.boss', step: 2 },
    { name: 'sec-final', mission: 'sec.final.auditoria', step: 2 },
    { name: 'sec-mapa', path: '/#/trilha/security.aws-security' },
  ]
  const vp = VIEWPORTS.find((v) => v.name === 'desktop')!
  for (const c of CASES) {
    test(`${c.name} — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const before = c.mission ? SEC_MISSIONS.slice(0, SEC_MISSIONS.indexOf(c.mission)) : []
      const base = progressWithPhase1(new Date(), { missions: before })
      const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
      await seedProgress(page, seeded)
      await page.goto(c.path ?? `/#/missao/${c.mission}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(250)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
    })
  }
})

/** Missões da trilha Integração na ordem do mapa (as anteriores ficam aprovadas no progresso semeado). */
const INT_MISSIONS = [
  ...(
    [
      ['f01', 3],
      ['f02', 3],
      ['f03', 3],
      ['f04', 4],
      ['f05', 4],
      ['f06', 4],
      ['f07', 4],
      ['f08', 3],
      ['f09', 4],
    ] as const
  ).flatMap(([f, n]) => [...Array.from({ length: n }, (_, i) => `int.${f}.m${i + 1}`), `int.${f}.boss`]),
  'int.final.vitrine',
]

// Módulo novo: por enquanto, só o desktop (tablet e celular ficam para uma etapa própria).
test.describe('trilha Integração', () => {
  const CASES: { name: string; mission?: string; step?: number; path?: string }[] = [
    { name: 'int-f1-filas', mission: 'int.f01.boss', step: 2 },
    { name: 'int-f2-lambda', mission: 'int.f02.boss', step: 2 },
    { name: 'int-f3-filtros', mission: 'int.f03.boss', step: 2 },
    { name: 'int-f4-regras', mission: 'int.f04.boss', step: 2 },
    { name: 'int-f5-fluxo', mission: 'int.f05.boss', step: 2 },
    { name: 'int-f6-planos', mission: 'int.f06.boss', step: 2 },
    { name: 'int-f7-streams', mission: 'int.f07.boss', step: 2 },
    { name: 'int-f8-broker', mission: 'int.f08.boss', step: 2 },
    { name: 'int-f9-escolha', mission: 'int.f09.boss', step: 2 },
    { name: 'int-final', mission: 'int.final.vitrine', step: 2 },
    { name: 'int-mapa', path: '/#/trilha/integration.aws-integration' },
  ]
  const vp = VIEWPORTS.find((v) => v.name === 'desktop')!
  for (const c of CASES) {
    test(`${c.name} — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      const before = c.mission ? INT_MISSIONS.slice(0, INT_MISSIONS.indexOf(c.mission)) : []
      const base = progressWithPhase1(new Date(), { missions: before })
      const seeded = c.mission ? { ...base, resume: { missionId: c.mission, step: c.step, at: new Date().toISOString() } } : base
      await seedProgress(page, seeded)
      await page.goto(c.path ?? `/#/missao/${c.mission}`)
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(250)
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `rolagem horizontal em ${c.name}`).toBeLessThanOrEqual(0)
      await page.screenshot({ path: `screenshots/${vp.name}-${c.name}.png`, fullPage: true })
    })
  }
})

test.describe('banco de questões', () => {
  for (const vp of VIEWPORTS) {
    test(`treino e simulado — ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.emulateMedia({ colorScheme: 'dark' })
      await seedProgress(page, progressWithFirstMission())
      const noOverflow = async (what: string) => {
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, `rolagem horizontal em ${what}`).toBeLessThanOrEqual(0)
      }
      const options = page.locator('[aria-label="Alternativas"] button')

      await page.goto('/#/revisao')
      await page.getByRole('link', { name: 'Abrir o banco de questões' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Banco de questões' })).toBeVisible()
      await noOverflow('banco')
      await page.screenshot({ path: `screenshots/${vp.name}-questoes-banco.png`, fullPage: true })

      // Treino filtrado por conceito (link do Codex): o enunciado traz dificuldade e conceito.
      await page.goto('/#/revisao/questoes?conceito=iam.trust-policy')
      await expect(page.getByText(/questões? atende/)).toBeVisible()
      await page.getByRole('button', { name: 'Começar treino' }).click()
      await expect(page.getByText(/^Dificuldade: (Fácil|Média|Difícil)$/).first()).toBeVisible()
      await expect(page.getByText('Conceito:').first()).toBeVisible()
      await expect(page.locator('article a[href^="#/codex/"]').first()).toBeVisible()
      await options.first().click()
      const verify = page.getByRole('button', { name: 'Verificar' })
      if (await verify.isDisabled()) await options.nth(1).click()
      await verify.click()
      await expect(page.getByRole('heading', { name: 'Explicação' })).toBeVisible()
      await noOverflow('treino')
      await page.screenshot({ path: `screenshots/${vp.name}-questoes-treino.png`, fullPage: true })

      // Simulado de 10 questões da trilha IAM, com cronômetro.
      await page.goto('/#/revisao/questoes?trilha=identity.iam-access')
      await page.reload()
      await page.getByRole('button', { name: 'Começar simulado' }).click()
      await expect(page.getByRole('timer')).toBeVisible()
      await noOverflow('simulado')
      await page.screenshot({ path: `screenshots/${vp.name}-questoes-simulado.png`, fullPage: true })
      for (let i = 0; i < 10; i++) {
        await options.first().click()
        if (i < 9) await page.getByRole('button', { name: 'Próxima' }).click()
      }
      await page.getByRole('button', { name: 'Finalizar simulado' }).click()
      await expect(page.getByRole('heading', { level: 1, name: /de 10 acertos/ })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Por domínio do exame' })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Correção comentada' })).toBeVisible()
      await noOverflow('resultado do simulado')
      await page.screenshot({ path: `screenshots/${vp.name}-questoes-resultado.png`, fullPage: true })
    })
  }
})
