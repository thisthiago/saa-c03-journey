# Plano de implementação: módulo de Redes ("Redes na AWS")

Plano para o módulo de redes do AWS Quest, escrito em 20/10/2026 e implementado em 21/10/2026, com as decisões recomendadas na seção 2. Diferenças em relação ao plano: a Fase 8 reaproveita o laboratório `edge` da Foundations em vez de um simulador `cdn` novo; os laboratórios de conectividade híbrida, de política de DNS e de escolha da solução usam um motor de escolha compartilhado; o preço do Direct Connect, cobrado por local de conexão, ficou fora da tabela. O plano segue o mesmo caminho da trilha de Computação (módulo `compute`), que é a referência de estrutura.

Documentos relacionados: [ARQUITETURA.md](ARQUITETURA.md), [CONTEUDO.md](CONTEUDO.md) e [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md).

## 1. Ponto de partida

- O território `redes` existe no catálogo ([catalog.ts](../src/content/catalog/catalog.ts)) com `status: 'planned'` e quatro serviços previstos: VPC, Elastic Load Balancing, Route 53 e CloudFront.
- Já estão em [services.ts](../src/content/catalog/services.ts): `aws.vpc`, `aws.elb`, `aws.route53`, `aws.cloudfront` e `aws.global-accelerator`.
- O Elastic Load Balancing já é ensinado na trilha de Computação (fase `cmp.f05`). A trilha de Redes **não o repete**: reaproveita os conceitos `elb.*` e cita a fase de Computação onde fizer sentido.
- Conceitos já existentes que a trilha reaproveita sem redeclarar (os IDs são globais): `edge.cloudfront`, `edge.global-accelerator`, `edge.route53`, `edge.pop`, `edge.regional-edge-cache`, `infra.az`, `infra.multi-az`, `infra.nat-zonal-regional`, `infra.alb-zones`, `infra.static-stability`.
- Simuladores que já existem e podem ser reaproveitados: `edge/` (CloudFront), `zones/` (zonas de disponibilidade), `architecture/` (desafio final) e o motor de políticas em `policy/` (política de endpoint).

### Escopo do exame

Conferido em 20/10/2026 na [lista de serviços no escopo do SAA-C03](https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-in-scope-services.html).

| Categoria | Serviços |
|---|---|
| **Networking and Content Delivery** | Client VPN, CloudFront, Direct Connect, Elastic Load Balancing, Global Accelerator, PrivateLink, Route 53, Site-to-Site VPN, Transit Gateway e Amazon VPC |
| **Security, Identity, and Compliance** (ligados a rede) | Certificate Manager (ACM), Firewall Manager, Network Firewall, Shield e WAF |
| **Front-End Web and Mobile** | API Gateway (fica fora da trilha; ver decisões) |

Faltam no catálogo e entram nesta trilha: Direct Connect, Site-to-Site VPN, Client VPN, Transit Gateway, PrivateLink, WAF, Shield, Network Firewall e Firewall Manager. O ACM aparece aqui só como citação (ver decisões).

## 2. Decisões

**Propostas, para o usuário confirmar antes de começar** (em cada uma, a primeira opção é a recomendada):

| Tema | Proposta | Alternativa |
|---|---|---|
| Tamanho | 9 fases mais um desafio final, como a trilha de Computação | 8 fases, juntando a fase 6 com a 5 |
| Segurança de borda (WAF, Shield, Network Firewall, Firewall Manager) | Entra na fase 9, junto com a escolha da solução; o [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md) reaproveita esses conceitos ao tratar de DDoS e injeção de SQL | Fica para o [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md) |
| ACM (certificados) | O [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md) ensina o ACM (fase 4), porque a tarefa 1.3 pede renovação de certificados; aqui a fase 8 só cita o ACM ao falar de HTTPS no CloudFront | Entra na fase 9, junto com a proteção de borda |
| API Gateway | Fica de fora; é um serviço de aplicação e entra com Lambda e integração | Entra na fase 8 |
| Preços | Preços reais da Price List API, como em Computação | Premissas fixas do cenário |

**Seguidas por padrão, como nas outras trilhas**
- A trilha recomenda a AWS Foundations e a Computação, sem exigir.
- Entra em `MODULES` depois do `compute`.
- Todo fato tem fonte e data; valores do cenário levam o selo "Premissa do cenário".
- Texto para o jogador em PT-BR didático: sem jargão, sem setas, sem frases telegráficas.
- Sem commit nem push sem pedido explícito.

## 3. Estrutura da trilha

**Identificação**
- Módulo `network`; trilha `network.aws-network` ("Redes na AWS", subtítulo "VPC, conectividade, DNS e entrega de conteúdo").
- Território `redes`, glifo `network`, `recommends: ['foundations.aws-foundations', 'compute.aws-compute']`.
- Prefixo das fases: `net.f0N`. Prefixos dos conceitos novos: `vpc.*`, `rt.*`, `sg.*`, `tgw.*`, `pl.*`, `hyb.*`, `dns.*`, `cdn.*`, `edgesec.*` e `net.*`.
- Pasta `src/content/modules/network/`, com a mesma organização de `compute/` (conceitos por fase, fases, achievements, questions, index).

### Fases

| Fase | Tema | Conceitos principais | Laboratório |
|---|---|---|---|
| **F1** | VPC e endereçamento | VPC, bloco CIDR, sub-redes, AZ, IPv4 e IPv6, VPC padrão, IPs reservados em cada sub-rede | `vpc-planner`: dividir um CIDR em sub-redes sem sobreposição |
| **F2** | Roteamento e saída para a internet | tabelas de rotas, rota mais específica, Internet Gateway, NAT Gateway, Egress-only Internet Gateway, sub-rede pública × privada, um NAT Gateway por AZ × um só compartilhado, NAT instance × NAT Gateway (custo, banda e manutenção) | `route-table`: montar as rotas para que cada sub-rede chegue onde deve |
| **F3** | Segurança dentro da VPC | security group × network ACL, com e sem estado, ordem das regras, VPC Flow Logs | `reach`: dizer por que um pacote chega ou não chega |
| **F4** | Conectando VPCs | VPC peering, não transitividade, Transit Gateway, CIDRs sobrepostos, compartilhamento com RAM | `connect`: escolher peering ou Transit Gateway e montar as rotas |
| **F5** | Acesso privado a serviços | Gateway endpoint (S3 e DynamoDB), interface endpoint, PrivateLink, política de endpoint, custo do NAT × endpoint | `endpoints`: tirar o tráfego da internet e comparar o custo |
| **F6** | Conectividade híbrida | Site-to-Site VPN, Direct Connect, VPN sobre Direct Connect, Client VPN, resiliência da conexão, banda: uma VPN × várias VPNs e a velocidade certa do Direct Connect | `hybrid`: escolher e dimensionar a conexão com o escritório |
| **F7** | DNS com Route 53 | zona pública e privada, tipos de registro, alias × CNAME, políticas de roteamento, health checks, failover | `dns`: aplicar a política de roteamento certa a cada requisição |
| **F8** | Entrega de conteúdo | CloudFront (origem, cache, OAC, HTTPS com certificado do ACM, URLs e cookies assinados), processamento na borda (CloudFront Functions e Lambda@Edge), Global Accelerator, quando usar cada um (reaproveita `edge.*`) | `cdn`: cache e latência; CloudFront × Global Accelerator |
| **F9** | Proteção de borda e escolha | WAF (inclusive as regras contra injeção de SQL e cross-site scripting), Shield contra DDoS, Network Firewall, Firewall Manager; quadro de escolha da solução de rede | `net-chooser`: requisito para solução |
| **Final** | Arquitetura de Rede | integração | Varejo fictício, com `architecture` em 8 etapas |

Toda fase segue o formato das outras trilhas: cada missão traz briefing, intel (até 80 palavras), atividades e debrief, com empresas fictícias, e toda fase termina num chefe. Conceitos ensinados só por laboratórios ganham `reviewItems` escritos à mão.

### Dependências

O mapa desenha só `requires`, com redução transitiva.

- F2 exige F1.
- F3 exige F2.
- F4 exige F2.
- F5 exige F2.
- F6 exige F4.
- F9 exige F7 e F8.
- O final exige as nove.
- As demais só recomendam a anterior.

### Mapa

Quatro colunas, como em Computação.

- x=90: F1.
- x=300: F2, F3, F7 e F8.
- x=560: F4, F5 e F9.
- x=820: F6 e final.

Ajustar `mapHeight` se preciso. As posições finais são validadas pelo `layoutProblems` em `content.test.ts`. Esta é uma proposta inicial: o desenho definitivo sai da primeira rodada do teste de layout.

### Desafio final: Arquitetura de Rede

- Empresa fictícia com matriz, filiais e aplicação pública em várias VPCs.
- Etapas do `architecture`:
  1. Endereçamento e sub-redes.
  2. Saída para a internet.
  3. Segurança na VPC.
  4. Conexão entre VPCs.
  5. Acesso privado a serviços.
  6. Conexão com o escritório.
  7. DNS e entrega de conteúdo.
  8. Proteção de borda e custo.
- Dimensões: Seguro (d1), Resiliente (d2), Alto desempenho (d3), Custo (d4) e Requisitos. Os limiares seguem os da trilha de Computação (`minDimension` 0,5; `passThreshold` 0,7).

### Tamanho estimado

Em torno de 36 missões, 95 atividades, 70 conceitos novos, 8 laboratórios novos, 20 conquistas (`ach.net-*`) e 36 questões no `questions.ts`, cobrindo as três dificuldades e incluindo resposta múltipla. O teste genérico do banco já exige isso.

## 4. Simuladores

Todos seguem o padrão de `src/simulators/<nome>/`:
- `model.ts` puro e testado, com cabeçalho "Conferido em DD/MM/AAAA" e as URLs da documentação;
- `lab.ts`;
- interface `.tsx` e CSS Module;
- painel "Simplificações".

Cada um é ligado em:
- `activities/lab/specs.ts`;
- `lab/evaluate.ts` (`evaluateLab`, `labSolution` e `labInitialResponse`);
- `activities/registry.tsx`;
- `activities/ui-logic.ts`;
- `predict/specs.ts` e `predict/resolve.ts`, quando houver predição.

O teste de conteúdo já garante que a solução chega a 100%, que o estado inicial fica abaixo de 70% e que cada predição tem uma única opção certa.

| Simulador | O que modela |
|---|---|
| `vpcnet/` | Cálculo de CIDR (primeiro e último endereço, quantidade de IPs, sobreposição), IPs reservados por sub-rede e verificação de um plano de sub-redes. Resolução de rota pela regra do prefixo mais específico. |
| `reach/` | Dado um pacote (origem, destino, porta, protocolo), percorre rota, network ACL e security group, nos dois sentidos, e diz onde ele para. Reaproveita a ideia do motor de `policy/`: regras ordenadas e explicação do resultado. |
| `connect/` | Topologias com peering e Transit Gateway: quem alcança quem, não transitividade e conflito de CIDR. |
| `endpoints/` | Caminho do tráfego (internet, NAT, gateway endpoint, interface endpoint) e custo mensal do caminho escolhido. A política de endpoint reaproveita o motor de políticas. |
| `hybrid/` | Opções de conexão (VPN, Direct Connect, ambos, Client VPN) contra requisitos de prazo, largura de banda, criptografia e disponibilidade; falha de um link e de uma localização. |
| `dns/` | Resolução por política de roteamento (simples, ponderada, latência, failover, geolocalização, múltiplas respostas) com health checks. |
| `cdn/` | Cache, taxa de acerto e latência; reaproveita o modelo de `edge/`. |
| `netchooser/` | Escolha da solução de rede, no padrão de `compute/chooser`: melhor opção vale 1, "funciona, mas não é a melhor" vale 0,5. |

O que cada laboratório avalia e as predições (por exemplo "o pacote chega?", "essa rota vence?") são detalhados no início de cada marco, junto com a verificação dos fatos.

### Preços

- Novo script `scripts/fetch-network-prices.mjs` (`npm run prices:network`), no padrão de `fetch-compute-prices.mjs`: Price List Bulk API, sem credenciais, gravando `src/content/pricing/network-prices.json` com a data de publicação.
- Itens previstos: NAT Gateway (hora e GB processado), endpoints de interface (hora e GB), Transit Gateway (anexo e GB), VPN (conexão por hora), Direct Connect (porta por hora e saída de dados), transferência de dados entre AZs e para a internet, Route 53 (zona e consultas) e CloudFront (saída por GB e requisições).
- O script falha se faltar qualquer preço e nunca inventa valores. Os nomes exatos das ofertas e dos atributos são conferidos na primeira execução.
- A interface mostra a data da tabela e o aviso de estimativa (primeira faixa, sem nível gratuito nem impostos).

## 5. Fatos a conferir

Nenhum fato abaixo está verificado ainda. Cada um é conferido em docs.aws.amazon.com, na hora de escrever a fase correspondente, e registrado em [VERIFICACAO-DE-CONTEUDO.md](VERIFICACAO-DE-CONTEUDO.md) com data e URL. O site da AWS devolve 200 para páginas inexistentes: conferir pelo título da página.

| Fase | O que conferir |
|---|---|
| F1 | tamanho mínimo e máximo do CIDR da VPC e da sub-rede; endereços reservados por sub-rede; CIDRs secundários; VPC padrão; IPv6 |
| F2 | prioridade da rota mais específica; NAT Gateway público × privado, zonal × regional (o catálogo já traz `infra.nat-zonal-regional`); egress-only para IPv6; cobrança do IPv4 público; NAT instance (desativar a verificação de origem e destino, banda limitada ao tipo da instância, sem alta disponibilidade gerenciada) × NAT Gateway; custo de um NAT por AZ × tráfego entre AZs com um só NAT |
| F3 | security group (com estado, só regras de permissão) × network ACL (sem estado, permite e nega, ordem por número); regras padrão; VPC Flow Logs e destinos; Reachability Analyzer |
| F4 | peering sem transitividade, entre contas e Regiões, sem CIDR sobreposto; Transit Gateway (tabelas de rotas, anexos, peering entre Regiões, multicast) |
| F5 | gateway endpoints só para S3 e DynamoDB e sem custo de hora; interface endpoints e PrivateLink; política de endpoint; DNS privado |
| F6 | VPN (túneis, criptografia, BGP e rota estática, VPN acelerada); Direct Connect (conexão dedicada × hospedada, VIFs privada, pública e de trânsito, Direct Connect gateway, prazo de provisionamento, resiliência máxima); MACsec; Client VPN; banda por túnel de VPN e como somar túneis (ECMP no Transit Gateway); velocidades de porta do Direct Connect e agregação de links (LAG) |
| F7 | tipos de registro; alias × CNAME e o ápice da zona; políticas de roteamento; health checks; zona privada e resolver (inbound e outbound); DNSSEC |
| F8 | CloudFront (origens, comportamentos, TTL, invalidação, OAC, URLs e cookies assinados, geo-restriction, Região do certificado do ACM); CloudFront Functions × Lambda@Edge (onde rodam, limites, casos de uso); Global Accelerator (IPs anycast estáticos, TCP e UDP, failover por saúde); quando cada um é a resposta |
| F9 | WAF (regras, regras gerenciadas, ACL web, onde se associa); Shield Standard × Advanced (o que cada um protege contra DDoS); Network Firewall; Firewall Manager |
| Todas | disponibilidade atual de cada serviço (restrições a novos clientes entram como `availability: 'no-new-customers'`) e variantes novas (por exemplo, NAT regional e novidades de conectividade): só entram com fonte e data |

## 6. Mudanças na plataforma

- **`content/catalog/catalog.ts`:** `redes` passa para `active` e deixa de ter `plannedServices`.
- **`content/catalog/services.ts`:** novos serviços `aws.direct-connect`, `aws.site-to-site-vpn`, `aws.client-vpn`, `aws.transit-gateway`, `aws.privatelink`, `aws.waf`, `aws.shield`, `aws.network-firewall` e `aws.firewall-manager`. O `aws.acm` entra pelo [plano de Segurança](PLANO-IMPLEMENTACAO-MODULO-SEGURANCA.md); se esta trilha for implementada antes, ela o declara e o plano de Segurança o reaproveita. Cada um com `docsUrl` conferido.
- **Glifos** (`GlyphName` e `ui/Glyph.tsx`): avaliar `route`, `plug` e `lock` no lucide instalado, só se os existentes não servirem.
- **`content/index.ts`:** `MODULES = [..., computeModule, networkModule]` e novo `CONTENT_VERSION`.
- **`engine/types.ts`:** nenhuma mudança prevista. `mapHeight` já existe em `TrackDef`.
- **`package.json`:** script `prices:network`. **`vite.config.ts`:** chunk `content-network`. **`index.html`:** meta description.
- **Testes:** `tests/e2e/map-layout.spec.ts` ganha a trilha nova; `smoke.spec.ts` e `screens.spec.ts` ganham os laboratórios novos em 390, 820 e 1440 px.
- **Elastic Load Balancing:** `aws.elb` continua no território `redes` e é ensinado em Computação. Conferir se a trilha de Redes pode listá-lo em `serviceIds` sem duplicar a contagem no Codex.

## 7. Ordem de implementação

Cada marco termina com typecheck, lint, testes e build. Fases ainda não prontas ficam com `availability: 'in-construction'`, para os testes passarem a cada etapa.

| Marco | Conteúdo |
|---|---|
| **M1** | Plataforma e preços: catálogo, serviços, esqueleto do módulo e mapa (nove fases em construção), script de preços, JSON e loader com teste de forma |
| **M2** | F1 e F2, com `vpcnet` |
| **M3** | F3 e F4, com `reach` e `connect` |
| **M4** | F5 e F6, com `endpoints` e `hybrid` |
| **M5** | F7 e F8, com `dns` e `cdn` |
| **M6** | F9 e desafio final, com `netchooser`, conquistas e banco de questões |
| **M7** | Acabamento: e2e, capturas revisadas, docs (README, CONTEUDO, ARQUITETURA, VERIFICACAO, EXECUTAR) e memória |

## 8. Verificação ponta a ponta

```
npm run prices:network   # gera a tabela; confere data e ausência de lacunas
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test tests/e2e/map-layout.spec.ts tests/e2e/smoke.spec.ts
npm run e2e              # capturas em screenshots/
npm run dev              # jogar F1 a F9 e o final
```

Conferir à mão:
- **progresso:** o progresso salvo nas outras trilhas continua intacto;
- **recomendação:** a trilha mostra "Recomendado antes" com Foundations e Computação;
- **Codex:** não duplica os conceitos reaproveitados;
- **preços:** os valores nos laboratórios batem com o JSON e mostram a data;
- **mapa:** sem sobreposições em 680, 1000, 1100 e 1440 px.

## 9. Riscos

- **Fidelidade dos simuladores de rede:** `reach` e `connect` modelam regras reais (prefixo mais específico, ordem das network ACLs, não transitividade). Cada regra tem teste que reproduz o exemplo da documentação. O que for simplificação aparece no painel "Simplificações".
- **Serviços com mudança recente:** NAT Gateway regional, endpoints e variantes de conectividade evoluem rápido. Só entram com fonte e data, e o que não for confirmado fica fora.
- **Sobreposição com Computação e Foundations:** ELB e `edge.*` já existem. Reaproveitar os conceitos em vez de redeclarar, para não duplicar o Codex nem quebrar o progresso salvo.
- **Tamanho:** é uma trilha do porte de Computação. As fases em construção permitem entregar por marcos.
