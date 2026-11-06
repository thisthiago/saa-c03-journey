import { expect, test } from '@playwright/test'
import { place, progressWithFirstMission, progressWithPhase1, seedProgress } from './helpers'

test('quem começa agora recebe a primeira missão da AWS Foundations', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Aprenda AWS tomando decisões de arquitetura' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Como funciona uma missão' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AWS Foundations' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Ver todas as \d+ trilhas/ })).toBeVisible()
  await page.getByRole('link', { name: 'Começar minha primeira missão' }).click()
  await expect(page.getByRole('heading', { name: 'Viajaí' })).toBeVisible()
})

test('o mapa lista todas as trilhas', async ({ page }) => {
  await page.goto('/#/mapa')
  await expect(page.getByRole('heading', { level: 1, name: 'Trilhas' })).toBeVisible()
  for (const name of ['AWS Foundations', 'S3 Expedition', 'IAM e Access Management', 'Computação na AWS', 'Bancos de dados na AWS']) {
    await expect(page.getByRole('link', { name: new RegExp(name) }).first()).toBeVisible()
  }
  // Cada trilha aparece uma vez só.
  await expect(page.locator('main a[href^="#/trilha/"]')).toHaveCount(12)
})

test('o mapa e a Base sugerem a mesma trilha e a mesma missão', async ({ page }) => {
  await seedProgress(page, progressWithFirstMission())
  await page.goto('/')
  const base = await page.getByRole('link', { name: 'Começar missão' }).first().getAttribute('href')
  await page.goto('/#/mapa')
  await expect(page.getByRole('link', { name: 'Começar missão' })).toHaveAttribute('href', base!)
  const suggested = page.locator('li[data-status="next"]')
  await expect(suggested).toHaveCount(1)
  await expect(suggested.getByRole('link', { name: 'S3 Expedition' })).toBeVisible()
})

test('o mapa de serviços abre pela aba, encontra um serviço e mostra os detalhes', async ({ page }) => {
  await page.goto('/#/mapa')
  await page.getByRole('link', { name: 'Mapa de serviços' }).click()
  await expect(page.locator('[data-service]')).toHaveCount(118)
  await page.getByRole('combobox', { name: 'Buscar serviço' }).fill('Lambda')
  await page.getByRole('option', { name: /AWS Lambda/ }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'AWS Lambda' })).toBeVisible()
  await expect(page).toHaveURL(/servico=aws\.lambda/)
  // Voltar para a ordem das trilhas mantém a lista de sempre.
  await page.getByRole('link', { name: 'Ordem das trilhas' }).click()
  await expect(page.locator('main a[href^="#/trilha/"]')).toHaveCount(12)
})

test('no celular, o mapa de serviços mantém busca, filtros, zoom e painel ao alcance', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/#/mapa?vista=servicos')
  await expect(page.locator('[data-service]').first()).toBeAttached()
  await expect(page.getByRole('combobox', { name: 'Buscar serviço' })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^Bloqueados/ })).toBeAttached()
  await expect(page.getByRole('button', { name: 'Aproximar' })).toBeVisible()
  await page.getByRole('button', { name: 'Aproximar' }).click()
  await page.getByRole('combobox', { name: 'Buscar serviço' }).fill('s3')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 2, name: 'Amazon S3' })).toBeInViewport()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
})

test('dossiê: primeiro acesso explica o que vai aparecer e sugere a primeira missão', async ({ page }) => {
  await page.goto('/#/dossie')
  await expect(page.getByRole('heading', { name: 'Sua jornada ainda não começou' })).toBeVisible()
  await expect(page.getByText(/^0 de \d+ desbloqueadas$/)).toBeVisible()
  await expect(page.getByText('Primeira Região', { exact: true }).first()).toBeVisible()
  await page.getByRole('link', { name: 'Começar minha primeira missão' }).click()
  await expect(page.getByRole('heading', { name: 'Viajaí' })).toBeVisible()
})

test('dossiê: resumo, conquistas por trilha e o mesmo progresso depois de recarregar', async ({ page }) => {
  await seedProgress(page, progressWithFirstMission())
  await page.goto('/#/dossie')
  await expect(page.getByRole('heading', { level: 2, name: 'S3 Expedition' })).toBeVisible()
  await expect(page.getByText(/^1 de \d+ desbloqueadas$/)).toBeVisible()
  await expect(page.getByText('Primeiros passos', { exact: true }).first()).toBeVisible()
  const group = page.locator('details', { has: page.getByText('S3 Expedition', { exact: true }) })
  await group.locator('summary').click()
  await expect(group.getByText('Leitura de bucket', { exact: true })).toBeVisible()
  const stored = await page.evaluate(() => localStorage.getItem('aws-quest/progress'))
  await page.reload()
  await expect(page.getByText(/^1 de \d+ desbloqueadas$/)).toBeVisible()
  expect(JSON.parse((await page.evaluate(() => localStorage.getItem('aws-quest/progress')))!).missions).toEqual(JSON.parse(stored!).missions)
  await page.getByRole('link', { name: /Começar missão|Continuar missão/ }).click()
  await expect(page).toHaveURL(/#\/missao\/s3x\.f01\.m2/)
})

test('a S3 Expedition recomenda a AWS Foundations sem bloquear', async ({ page }) => {
  await page.goto('/#/trilha/storage.s3-expedition')
  await expect(page.getByText('Recomendado antes')).toBeVisible()
  await expect(page.getByRole('link', { name: 'AWS Foundations' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Jogar|Iniciar/ }).first()).toBeVisible()
})

test('a trilha IAM recomenda a AWS Foundations sem bloquear', async ({ page }) => {
  await page.goto('/#/trilha/identity.iam-access')
  await expect(page.getByText('Recomendado antes')).toBeVisible()
  await expect(page.getByRole('link', { name: 'AWS Foundations' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Jogar|Iniciar/ }).first()).toBeVisible()
})

test('a trilha Computação recomenda a AWS Foundations sem bloquear', async ({ page }) => {
  await page.goto('/#/trilha/compute.aws-compute')
  await expect(page.getByText('Recomendado antes')).toBeVisible()
  await expect(page.getByRole('link', { name: 'AWS Foundations' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Jogar|Iniciar/ }).first()).toBeVisible()
})

test('a trilha Bancos de dados recomenda a AWS Foundations e a Computação sem bloquear', async ({ page }) => {
  await page.goto('/#/trilha/database.aws-database')
  await expect(page.getByText('Recomendado antes')).toBeVisible()
  await expect(page.getByRole('link', { name: 'AWS Foundations' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Computação na AWS' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Jogar|Iniciar/ }).first()).toBeVisible()
})

test('jogar a primeira missão, errar, acertar e manter o progresso após recarregar', async ({ page }) => {
  await page.goto('/#/missao/s3x.f01.m1')

  await expect(page.getByRole('heading', { name: 'Estúdio Lumen' })).toBeVisible()
  await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
  await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()

  // Desafio 1 — classificação: primeiro uma resposta com erro.
  await expect(page.getByRole('heading', { name: 'Triagem do servidor lotado' })).toBeVisible()
  const correct: [string, string][] = [
    ['Fotos de produtos exibidas', 'Objeto (Amazon S3)'],
    ['Disco de dados do PostgreSQL', 'Bloco (Amazon EBS)'],
    ['Pasta de rede em que a equipe', 'Arquivo (Amazon EFS/FSx)'],
    ['Backups diários compactados', 'Objeto (Amazon S3)'],
    ['Volume de boot', 'Bloco (Amazon EBS)'],
    ['Arquivos CSV e Parquet', 'Objeto (Amazon S3)'],
    ['Diretório /home montado', 'Arquivo (Amazon EFS/FSx)'],
    ['Vídeos dos ensaios', 'Objeto (Amazon S3)'],
  ]
  const wrong = correct.map(([item, bin], i) => [item, i === 1 ? 'Objeto (Amazon S3)' : bin] as [string, string])
  for (const [item, bin] of wrong) await place(page, item, bin)
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByText('Resultado: 88%', { exact: true })).toBeVisible()
  await expect(page.getByText('+35 XP').first()).toBeVisible()

  // Nova tentativa com tudo certo: só a melhoria de XP é concedida.
  await page.getByRole('button', { name: 'Tentar 100%' }).click()
  for (const [item, bin] of correct) await place(page, item, bin)
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByText('Perfeito!')).toBeVisible()
  await expect(page.getByText('Sem XP adicional nesta tentativa')).toBeVisible()
  await page.getByRole('button', { name: /Próximo desafio/ }).click()

  // Desafio 2 — decisão com justificativa.
  await page.getByRole('radio', { name: /Manter os dados do banco num volume Amazon EBS/ }).click()
  await page.getByRole('radio', { name: /Bancos transacionais fazem muitas leituras/ }).click()
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByText('Perfeito!')).toBeVisible()
  await expect(page.getByText('O que aconteceria')).toBeVisible()
  // XP da atividade + bônus da missão + conquista levam ao nível 2: a celebração aparece.
  const levelUp = page.getByRole('dialog', { name: 'Cadete da Nuvem' })
  await expect(levelUp).toBeVisible()
  await levelUp.getByRole('button', { name: 'Continuar' }).click()
  await page.getByRole('button', { name: 'Ver resultado' }).click()

  await expect(page.getByRole('heading', { name: 'Missão aprovada' })).toBeVisible()
  await expect(page.getByText('Conquista desbloqueada')).toBeVisible()

  // Recarregar: o progresso continua lá, e a sugestão segue na trilha em andamento.
  await page.goto('/')
  await page.reload()
  await expect(page.getByText('Anatomia de um bucket')).toBeVisible()
  await expect(page.getByRole('link', { name: /Nível 2/ })).toContainText('XP')
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('aws-quest/progress') ?? '{}'))
  expect(stored.missions['s3x.f01.m1'].passedAt).toBeTruthy()
  expect(stored.xp).toBeGreaterThan(0)
})

test('fases bloqueadas não podem ser iniciadas', async ({ page }) => {
  await page.goto('/#/trilha/storage.s3-expedition?fase=s3x.f02')
  await expect(page.getByRole('heading', { name: 'Classes de armazenamento e custos' })).toBeVisible()
  await expect(page.getByText('Bloqueada').first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Jogar/ })).toHaveCount(0)
  await page.goto('/#/missao/s3x.f01.m2')
  await expect(page.getByRole('heading', { name: 'Missão bloqueada' })).toBeVisible()
})

test('laboratório do bucket: encontrar objeto, responder e verificar', async ({ page }) => {
  await seedProgress(page, progressWithFirstMission())
  await page.goto('/#/missao/s3x.f01.m2')
  await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
  await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
  await page.getByRole('button', { name: /^contratos\// }).click()
  await page.getByRole('button', { name: /^2026\// }).click()
  await page.getByRole('button', { name: 'contrato-ana-leo.pdf' }).click()
  await expect(page.getByText('x-amz-meta-cliente: ana-e-leo')).toBeVisible()
  await page.getByRole('button', { name: 'Marcar como resposta da tarefa 1' }).click()
  await page.getByLabel('Resposta da tarefa 7').fill('sa-east-1')
  await page.getByLabel('Resposta da tarefa 3').fill('4')
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByRole('alert')).toContainText('Responda a todas as tarefas')
})

test('fase bloqueada: marcar como concluída também conclui a anterior e libera a Revisão', async ({ page }) => {
  await page.goto('/#/fase/s3x.f02')
  await expect(page.getByText('Bloqueada').first()).toBeVisible()
  await page.getByRole('button', { name: 'Já fiz esta fase: marcar como concluída' }).click()
  const dialog = page.getByRole('dialog', { name: 'Marcar a fase como concluída?' })
  await expect(dialog).toContainText('Esta fase está bloqueada')
  await expect(dialog).toContainText('Fase 1')
  await dialog.getByRole('button', { name: 'Marcar como concluída' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('Concluída').first()).toBeVisible()
  await expect(page.getByText('marcada como concluída sem jogar').first()).toBeVisible()
  // As conquistas de conclusão dão XP e podem subir o nível.
  await page.getByRole('button', { name: 'Continuar' }).click()
  await page.goto('/#/revisao')
  await page.getByRole('button', { name: 'Começar revisão' }).click()
  await expect(page.getByText(/item 1 de/)).toBeVisible()
})

test('missão: marcar como concluída pede confirmação e libera a seguinte', async ({ page }) => {
  await page.goto('/#/fase/s3x.f01')
  await page.getByRole('button', { name: 'Já fiz: marcar como concluída' }).first().click()
  const dialog = page.getByRole('dialog', { name: 'Marcar a missão como concluída?' })
  await dialog.getByRole('button', { name: 'Cancelar' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByText('marcada como concluída sem jogar')).toHaveCount(0)
  await page.getByRole('button', { name: 'Já fiz: marcar como concluída' }).first().click()
  await dialog.getByRole('button', { name: 'Marcar como concluída' }).click()
  await expect(page.getByText('marcada como concluída sem jogar')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Refazer' })).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Jogar' })).toHaveCount(1)
})

test('revisão aparece para conceitos fracos e concede domínio', async ({ page }) => {
  await seedProgress(page, progressWithFirstMission())
  await page.goto('/#/revisao')
  await expect(page.getByRole('heading', { name: 'Treino de memória' })).toBeVisible()
  await page.getByRole('button', { name: 'Começar revisão' }).click()
  await expect(page.getByText(/item 1 de/)).toBeVisible()
})

test('revisão: o conceito só aparece depois da resposta', async ({ page }) => {
  // Antes da resposta, o nome do conceito entregaria a resposta de questões do tipo "qual classe atende".
  const old = new Date(Date.now() - 3 * 86_400_000).toISOString()
  await seedProgress(page, { ...progressWithFirstMission(), concepts: { 'sc.standard-ia': { mastery: 0.4, evidence: 1, box: 1, nextReviewAt: old, lastSeenAt: old, recentErrors: 0 } } })
  await page.goto('/#/revisao')
  await page.getByRole('button', { name: 'Começar revisão' }).click()
  await expect(page.getByText('item 1 de 1')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Questão de revisão' })).toBeAttached()
  await expect(page.getByRole('heading', { level: 1, name: 'S3 Standard-IA' })).toHaveCount(0)
  await page.getByRole('radio').first().click()
  await page.getByRole('radio', { name: 'Tenho certeza' }).check()
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'S3 Standard-IA' })).toBeVisible()
})

test('revisão: o resultado mostra a nota da rodada com acertos, confiança e ritmo', async ({ page }) => {
  const old = new Date(Date.now() - 3 * 86_400_000).toISOString()
  await seedProgress(page, { ...progressWithFirstMission(), concepts: { 'sc.standard-ia': { mastery: 0.4, evidence: 1, box: 1, nextReviewAt: old, lastSeenAt: old, recentErrors: 0 } } })
  await page.goto('/#/revisao')
  await page.getByRole('button', { name: 'Começar revisão' }).click()
  await page.getByRole('radio').first().click()
  await page.getByRole('radio', { name: 'Tenho certeza' }).check()
  await page.getByRole('button', { name: 'Verificar' }).click()
  await page.getByRole('button', { name: 'Ver resultado' }).click()
  await expect(page.getByText(/de 10 · (Excelente|Bom|Regular|Precisa revisar)/)).toBeVisible()
  await expect(page.getByText(/^Ritmo: \d+ s por questão/)).toBeVisible()
  await page.getByText('Como a nota é calculada').click()
  await expect(page.getByText(/acerto com certeza vale 1/)).toBeVisible()
})

test('revisão: a confiança é pedida antes de verificar', async ({ page }) => {
  const old = new Date(Date.now() - 3 * 86_400_000).toISOString()
  await seedProgress(page, { ...progressWithFirstMission(), concepts: { 'sc.standard-ia': { mastery: 0.4, evidence: 1, box: 1, nextReviewAt: old, lastSeenAt: old, recentErrors: 0 } } })
  await page.goto('/#/revisao')
  await page.getByRole('button', { name: 'Começar revisão' }).click()
  await page.getByRole('radio').first().click()
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByRole('alert')).toContainText('Escolha o seu nível de confiança')
  await page.getByRole('radio', { name: 'Chutei' }).check()
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'S3 Standard-IA' })).toBeVisible()
})

test('revisão: no máximo 30 itens por dia', async ({ page }) => {
  const p = progressWithFirstMission()
  const old = new Date(Date.now() - 3 * 86_400_000).toISOString()
  ;(p.concepts as Record<string, unknown>)['sc.standard-ia'] = { mastery: 0.4, evidence: 1, box: 1, nextReviewAt: old, lastSeenAt: old, recentErrors: 0 }
  ;(p.reviews as Record<string, unknown>).today = { day: new Date().toISOString().slice(0, 10), answered: 30 }
  await seedProgress(page, p)
  await page.goto('/#/revisao')
  await expect(page.getByText('Você fez as 30 revisões de hoje.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Começar revisão' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Treinar agora' })).toBeVisible()
})

test('revisão: escolher quantos itens entram na rodada', async ({ page }) => {
  const p = progressWithFirstMission()
  const old = new Date(Date.now() - 3 * 86_400_000).toISOString()
  for (const id of ['s3.metadata', 's3.storage-class-analysis', 's3.version-id', 'storage.object', 'storage.block', 'storage.file', 's3.service', 's3.object-key', 's3.bucket-naming', 's3.durability', 's3.availability', 's3.object', 's3.consistency', 's3.region']) {
    ;(p.concepts as Record<string, unknown>)[id] = { mastery: 0.4, evidence: 1, box: 1, nextReviewAt: old, lastSeenAt: old, recentErrors: 0 }
  }
  await seedProgress(page, p)
  await page.goto('/#/revisao')
  const sizes = page.getByRole('group', { name: 'Itens nesta rodada' }).first()
  await expect(sizes.getByRole('radio', { name: '8' })).toBeChecked()
  await sizes.getByRole('radio', { name: '5' }).check()
  await page.getByRole('button', { name: 'Começar revisão' }).click()
  await expect(page.getByText('item 1 de 5')).toBeVisible()
})

test('arrastar com o mouse: o bloco fica colado no cursor e cai no destino', async ({ page }) => {
  // Item e destino precisam caber juntos na tela, ao lado do painel de contexto.
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/#/missao/s3x.f01.m1')
  await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
  await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()

  const chip = page.getByRole('button', { name: /Volume de boot/ })
  const box = (await chip.boundingBox())!
  // Segura o item perto do canto esquerdo, não no centro, para conferir que esse ponto é mantido.
  const grab = { x: box.x + 20, y: box.y + box.height / 2 }
  await page.mouse.move(grab.x, grab.y)
  await page.mouse.down()
  const to = { x: grab.x + 150, y: grab.y + 120 }
  await page.mouse.move(to.x, to.y, { steps: 8 })

  const ghost = page.locator('body > div[aria-hidden="true"]', { hasText: 'Volume de boot' })
  const g = (await ghost.boundingBox())!
  expect(Math.abs(g.x - (to.x - 20))).toBeLessThanOrEqual(2)
  expect(Math.abs(g.y + g.height / 2 - to.y)).toBeLessThanOrEqual(4)

  const target = (await page.getByRole('button', { name: 'Posicionar em Bloco (Amazon EBS)' }).boundingBox())!
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 })
  await page.mouse.up()
  await expect(ghost).toHaveCount(0)
  await expect(page.locator('[data-drop]').filter({ hasText: 'Bloco (Amazon EBS)' }).getByRole('button', { name: /Volume de boot/ })).toBeVisible()
})

test('montagem: posicionar as peças sobre o desenho da VPC, errar uma zona e chegar a 100%', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await seedProgress(page, progressWithFirstMission())
  await page.goto('/#/missao/net.f01.m1')
  await page.getByRole('button', { name: 'Ver conceitos-chave' }).click()
  await expect(page.getByRole('img', { name: /VPC 10\.40\.0\.0\/16 ocupando a Região inteira/ })).toBeVisible()
  await page.getByRole('button', { name: 'Entendi, ir para o desafio' }).click()
  await expect(page.getByRole('heading', { name: 'Monte a VPC da loja' })).toBeVisible()

  // Cópias iguais: a última ficha com o nome é a que ainda está na lista de peças.
  const put = async (piece: string, target: string) => {
    await page.getByRole('button', { name: piece, exact: true }).last().click()
    await page.getByRole('button', { name: `Posicionar em ${target}` }).click()
  }
  const correct: [string, string][] = [
    ['Internet gateway', 'Borda da VPC'],
    ['Security group dos servidores web', 'Toda a VPC, em qualquer zona'],
    ['Sub-rede web', 'Dentro da zona a'],
    ['Sub-rede web', 'Dentro da zona b'],
    ['Servidor web (instância EC2)', 'Dentro da zona a'],
    ['Servidor web (instância EC2)', 'Dentro da zona b'],
    ['Sub-rede web que cobre as duas zonas', 'Não entra nesta rede'],
    ['Segundo internet gateway, um para cada zona', 'Não entra nesta rede'],
  ]
  // Primeiro, os dois servidores na mesma zona.
  for (const [piece, target] of correct.map(([p, t], i) => [p, i === 5 ? 'Dentro da zona a' : t] as [string, string])) await put(piece, target)
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByText('Resultado: 88%', { exact: true })).toBeVisible()
  await expect(page.getByText('A zona b também precisa da própria sub-rede web e de um servidor lançado nela.')).toBeVisible()
  await page.screenshot({ path: 'screenshots/desktop-net-f1-montagem-resultado.png', fullPage: true })

  await page.getByRole('button', { name: 'Tentar 100%' }).click()
  for (const [piece, target] of correct) await put(piece, target)
  await page.getByRole('button', { name: 'Verificar' }).click()
  await expect(page.getByText('Perfeito!')).toBeVisible()
})

test('plano de endereços: a régua mostra sub-redes sobrepostas e fora da VPC', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const base = progressWithPhase1(new Date(), { missions: ['net.f01.m1', 'net.f01.m2', 'net.f01.m3'] })
  await seedProgress(page, { ...base, resume: { missionId: 'net.f01.boss', step: 2, at: new Date().toISOString() } })
  await page.goto('/#/missao/net.f01.boss')
  await expect(page.getByText('Escolha um bloco de VPC aceito para ver a régua de endereços.')).toBeVisible()
  await page.getByLabel('Bloco CIDR da VPC').selectOption('10.40.0.0/22')
  await page.getByLabel('Bloco da sub-rede aplicação A').fill('10.40.0.0/24')
  await page.getByLabel('Bloco da sub-rede web A').fill('10.40.0.128/25')
  await page.getByLabel('Bloco da sub-rede banco A').fill('10.50.0.0/27')
  await expect(page.getByRole('img', { name: /web A em 10\.40\.0\.128\/25, sobreposta a outra sub-rede/ })).toBeVisible()
  await expect(page.getByText('Fora do bloco da VPC: banco A (10.50.0.0/27).')).toBeVisible()
  await page.screenshot({ path: 'screenshots/desktop-net-f1-regua.png', fullPage: true })
})

test('tabelas de rotas: o desenho mostra cada rota, a sub-rede pública e o NAT sem saída', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const before = ['f01', 'f02'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `net.${f}.${m}`)).filter((m) => m !== 'net.f02.boss')
  await seedProgress(page, { ...progressWithPhase1(new Date(), { missions: before }), resume: { missionId: 'net.f02.boss', step: 2, at: new Date().toISOString() } })
  await page.goto('/#/missao/net.f02.boss')
  await expect(page.getByRole('img', { name: /Sem saída para a internet: NAT Gateway A e NAT Gateway B/ })).toBeVisible()
  await page.getByLabel('Rota 0.0.0.0/0 de pública A (balanceador)').selectOption('igw')
  await page.getByLabel('Rota 0.0.0.0/0 de aplicação A').selectOption('nat-a')
  await page.getByLabel('Rota 0.0.0.0/0 de aplicação B').selectOption('nat-b')
  await page.getByLabel('Rota ::/0 de aplicação A').selectOption('eigw')
  await expect(page.getByRole('img', { name: /aplicação A: 0\.0\.0\.0\/0 para NAT Gateway A, ::\/0 para egress-only internet gateway.*Sem saída para a internet: NAT Gateway B\./ })).toBeVisible()
  await page.screenshot({ path: 'screenshots/desktop-net-f2-rotas-desenho.png', fullPage: true })
})

test('topologias: o desenho mostra as ligações escolhidas e risca o que não alcança', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const before = ['f01', 'f02', 'f03', 'f04'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `net.${f}.${m}`)).filter((m) => m !== 'net.f04.boss')
  await seedProgress(page, { ...progressWithPhase1(new Date(), { missions: before }), resume: { missionId: 'net.f04.boss', step: 2, at: new Date().toISOString() } })
  await page.goto('/#/missao/net.f04.boss')
  const doze = page.getByRole('region', { name: 'Doze VPCs e o escritório' })
  await doze.getByRole('combobox').selectOption({ label: 'Peering da VPC 1 com cada uma das outras, com a VPN ligada à VPC 1' })
  await expect(doze.getByRole('img', { name: /VPC 3 não alcança escritório/ })).toBeVisible()
  const amb = page.getByRole('region', { name: 'Produção, desenvolvimento e serviços compartilhados' })
  await amb.getByRole('combobox').selectOption({ label: 'Transit Gateway com tabelas separadas: produção e desenvolvimento só veem os serviços compartilhados' })
  await expect(amb.getByRole('img', { name: /Transit Gateway com 3 tabelas\./ })).toBeVisible()
  await page.screenshot({ path: 'screenshots/desktop-net-f4-topologias-desenho.png', fullPage: true })
})

test('desafio final de redes: o desenho do projeto cresce a cada escolha', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const before = ['f01', 'f02', 'f03', 'f04', 'f05', 'f06', 'f07', 'f08', 'f09'].flatMap((f) => ['m1', 'm2', 'm3', 'boss'].map((m) => `net.${f}.${m}`))
  await seedProgress(page, { ...progressWithPhase1(new Date(), { missions: before }), resume: { missionId: 'net.final.projeto', step: 2, at: new Date().toISOString() } })
  await page.goto('/#/missao/net.final.projeto')
  await expect(page.getByRole('img', { name: /Nenhuma escolha feita ainda/ })).toBeVisible()
  const pick = (label: string) => page.getByRole('radio', { name: label, exact: true }).click()
  const next = () => page.getByRole('button', { name: 'Próxima etapa' }).click()
  await pick('10.64.0.0/16, 10.65.0.0/16 e 10.66.0.0/16')
  await pick('Sub-redes públicas, de aplicação e de banco em cada uma das três zonas')
  await next()
  await pick('Um NAT Gateway regional (ou um zonal em cada zona), com as sub-redes de aplicação apontando para ele')
  await next()
  await pick('Security group do banco aceitando a porta 5432 do security group da aplicação')
  await pick('VPC Flow Logs enviados ao S3')
  await next()
  await pick('Um Transit Gateway com as VPCs e as conexões das lojas anexadas')
  await next()
  await pick('Endpoint de gateway do S3')
  await pick('Endpoint de interface do SQS com DNS privado, em duas zonas')
  await expect(page.getByRole('img', { name: /Escolhas até aqui: 10\.64\.0\.0\/16/ })).toBeVisible()
  await page.screenshot({ path: 'screenshots/desktop-net-final-desenho.png', fullPage: true })
})
