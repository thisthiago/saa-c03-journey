# Revisão da trilha Redes na AWS: achados

Achados das três revisões de 05/11/2026. Cada item recebe uma marca: **[pendente]**, **[feito]** ou **[descartado: motivo]**. Todos começam pendentes.


## f01
- `m3.a1`: as caixas "Vem pronto na VPC padrão" e "Não vem em nenhuma das duas" confundem. Trocar por "Já vem pronto na VPC padrão" e "Você configura à mão, mesmo na VPC padrão". **[feito]**
- `boss` (`PONTO_CERTO_PLAN`): a opção `10.40.0.0/8` tem bits de host. Usar `10.0.0.0/8`. **[feito]**
- **Diagramas:**
  - Região, VPC, duas zonas e sub-redes por camada (intel `vpc.what`); **[feito]**
  - régua de uma /24 com .0, .1, .2, .3 e .255 reservados (intel `vpc.reserved-ips`); **[feito]**
  - dois blocos sobrepostos na régua (`m2.a3`). **[feito, no cartão `vpc.subnet` da missão 2: no `m2.a3` o desenho entregaria a resposta]**

- Montagem "Monte a VPC da loja" (`net.f01.m1.a5`, no lugar de `m1.a1`). **[feito]**
- Régua de endereços no laboratório do chefe. **[feito]**

## f02
- **Intel:**
  - `m1.a3`: explicar rota estática e rota propagada; citar o Transit Gateway (fase 4) e a VPN (fase 6) como coisas que virão. **[feito]**
  - Briefing de `m1`: explicar peering. **[feito]**
  - `m2`: tirar o "=" de "Pública = …". **[feito]**
- **Atividades:**
  - `m2.a2`: título vira "Rota certa, e nada sai"; os distratores passam a ser "NAT na mesma sub-rede" e "regra de entrada no SG para as respostas". **[feito]**
  - `m2.a3`: o enunciado diz que já existe um NAT; tirar "endpoints" da explicação. **[feito]**
  - `m3.a1`: deixar explícito "modo zonal" (vira montagem). **[feito: virou a montagem `net.f02.m3.a5`]**
  - `m3.a3`: falta intel da NAT instance e da verificação de origem e destino; reescrever o par que entrega a resposta. **[feito]**
  - `m3.a4`: intel do NAT regional, com expansão de até 60 minutos; equilibrar as opções; conferir o fato. **[feito]**
- **Chefe:**
  - `boss.a1`: o critério vira "Cada zona de aplicação sai pelo NAT da própria zona". **[feito]**
  - `boss.a2`: o enunciado diz que a rota já aponta para a instância nova; a opção b vira "IP público em cada instância privada". **[feito]**
- **Diagramas:**
  - VPC por zona com IGW, EIGW, NATs e cartões de rota (intel `m2`); **[feito, no cartão `rt.public-private`; o EIGW ganhou desenho próprio no cartão `rt.eigw`]**
  - um NAT para duas zonas com a zona a caída, ao lado de um NAT por zona (`m3.a2`). **[feito, no cartão `rt.nat-per-az`: no `m3.a2` o desenho entregaria a resposta]**
- Desenho vivo das rotas no laboratório do chefe (`routeDiagram`). **[feito]**

## f03
- **Missão 1:**
  - `m1.a1`: o sg-web sem nenhuma regra de saída; a opção b passa a ser `sg-out` no spec. **[feito]**
  - `m1` intel: faltam as fichas de sg-rel e sg-db. **[feito, no cartão `sg.reference` da missão 1]**
- **Missão 2:**
  - `m2` intel: incluir a regra do asterisco. **[feito]**
  - `m2.a3`: o item "res" vira "interface de rede de uma instância" (vira montagem). **[feito: virou a montagem `net.f03.m2.a6`]**
  - `m2.a4`: citar só a regra 100. **[feito]**
  - `m2.a5`: reescrever enunciado e opção sem "sem abrir demais" nem "portas maliciosas". **[feito]**
- **Missão 3:**
  - `m3.a1`: Flow Logs ligados há um mês; nomear o Traffic Mirroring. **[feito]**
  - `m3.a3`: separar a linha da ACL num segundo artefato. **[feito]**
- **Chefe (grave):**
  - acrescentar a instância "relatório" (sg-rel) na sub-rede pública e o fluxo relatório→banco 5432 `deny`; **[feito]**
  - tirar `pub-out-db` da solução e da explicação; **[feito]**
  - objetivo: "cada fluxo com o resultado pedido, sem abrir nada além disso". **[feito]**
- **Diagramas:**
  - ida e volta com porta efêmera, onde o SG lembra e a ACL não (intel `m2`); **[feito]**
  - fichas sg-web, sg-rel e sg-db (`m1.a2`). **[feito, no cartão `sg.reference` da missão 1]**
- Desenho vivo do caminho de cada fluxo no laboratório do chefe (`flowDiagram`, botão "Ver caminho"). **[feito]**

## f04
- **Missão 1:**
  - `m1` intel: reescrever a não transitividade em frase completa. **[feito]**
  - `m1.a1`: "as três" vira "as duas". **[feito]**
  - `m1.a4`: contar pares nos dois sentidos; não citar o Transit Gateway antes da hora. **[feito]**
- **Missão 2:**
  - `m2` intel: associação e propagação mais claras. **[feito]**
  - `m2.a4`: vira montagem. **[feito: virou a montagem `net.f04.m2.a5`]**
- **Missão 3 e chefe (grave):** o intel diz "isolar = Transit Gateway", mas o chefe dá 1 ao hub de peering. Reescrever o intel dizendo que as duas formas isolam e que a do Transit Gateway custa mais. **[feito]**
- **Diagramas:**
  - peering A–B e A–C, com B–C riscado; **[feito]**
  - Transit Gateway com anexos e tabelas, associação contínua e propagação tracejada. **[feito, genérico (VPCs A e B), para não entregar a montagem]**
- Desenho vivo da topologia de cada cenário no laboratório do chefe (`topologyDiagram`). **[feito]**

## f05
- **Intel:**
  - `pl.endpoint-policy`: tirar o "soma"; o acesso só passa se as três políticas permitirem. **[feito]**
  - Interface: citar o PrivateLink. **[feito]**
- **Missão 1:**
  - `m1.a2`: novo distrator "endpoint de interface do S3". **[feito]**
- **Missão 2:**
  - Briefing de `m2`: tirar o Secrets Manager. **[feito; o `m2.a2` passou a falar do endpoint do SQS]**
  - `m2.a1`: tirar "sem NAT". **[feito]**
  - `m2.a3`: dizer "endpoint de gateway" e esclarecer as credenciais de outra conta. **[feito]**
  - `m2.a4`: vira montagem. **[feito: virou a montagem `net.f05.m2.a5`]**
- **Missão 3:**
  - `m3.a1`: encurtar a correta; novo distrator "Transit Gateway compartilhado". **[feito]**
- **Chefe (grave):** o cenário "segredos" deve dizer que a auditoria aceita o NAT. **[feito]**
- **Diagramas:**
  - tabela da sub-rede privada com pl-s3 indo para o endpoint de gateway e 0.0.0.0/0 para o NAT; o escritório pela VPN chega ao endpoint de interface (intel `m1`); **[feito, em dois desenhos: rota pl-s3 no cartão `pl.gateway-endpoint` e escritório pela VPN no cartão `pl.interface-endpoint`]**
  - VPCs consumidoras com o mesmo bloco, endpoint de interface, serviço de endpoint, NLB e API (`m3`). **[feito]**

## f06
- **Missão 1:**
  - `m1.a1`: corrigir a consequência de c. **[feito]**
  - `m1.a2`: explicar que cada conexão tem dois túneis. **[feito]**
  - `m1.a3`: intel do virtual private gateway; a opção c vira "túneis de grande largura de banda com rotas estáticas". **[feito, com outra opção c (ver DECISIONS)]**
- **Missão 2:**
  - `m2` intel: explicar o que é uma interface virtual e que o Direct Connect gateway é global (exceto China). **[feito]**
  - `m2.a1`: vira montagem. **[feito: virou a montagem `net.f06.m2.a5`]**
  - `m2.a2`: a opção a fala em associar aos virtual private gateways. **[feito]**
  - `m2.a3`: equilibrar as três opções. **[feito]**
  - `m2.a4`: "porta física exclusiva de 100 ou 400 Gbps". **[feito]**
- **Missão 3:**
  - `m3.a1`: intel do modelo de desenvolvimento e teste. **[feito]**
  - `m3.a2` e briefing de `m3`: falar da fábrica, não do laboratório; terceira opção "duas conexões no mesmo local". **[feito]**
- **Chefe:** `replica` vira 40 Gbps contínuos (acima dos 25 do hospedado) ou ajustar o `meets`. **[feito: 40 Gbps, e o simulador corrigido]**
- **Fatos a conferir:** o hospedado vai até 25 Gbps; portas de 1, 10, 100 e 400 Gbps; MACsec; DX gateway global. **[conferidos em 05/11/2026]**
- **Diagramas:**
  - customer gateway, 2 túneis, VGW ou Transit Gateway com ECMP; **[feito]**
  - local do DX com as três interfaces virtuais; **[feito]**
  - modelos de resiliência. **[feito]**

## f07
- **Intel e estilo:**
  - `m2` intel: "a área mais específica vence"; tirar o "="; intel de multivalor e de latência. **[feito]**
  - Na fase toda, "sem saúde" vira "não saudável". **[feito]**
- **Missão 1:**
  - `m1.a2`: reescrever o item `two`. **[feito]**
  - `m1.a3`: distrator "zona pública com subdomínio difícil". **[feito]**
- **Missão 2:**
  - `m2.a2`: nomes das cidades e "respectivamente". **[feito]**
- **Missão 3:**
  - `m3.a2`: o intel entrega a resposta; reescrever como princípio. **[feito]**
  - `m3.a3`: vira montagem; intel do Resolver (.2); briefing nos dois sentidos. **[feito: virou a montagem `net.f07.m3.a4`]**
- **Chefe:**
  - `boss.a1`: ensinar geoproximidade e política por IP antes (um predict de viés na `m2`); **[feito: intel e decisão `net.f07.m2.a5` (ver DECISIONS)]**
  - `deslocar` vira "ampliar a área geográfica atendida". **[feito]**
- **Diagramas:**
  - "O que decide?", com as políticas; **[feito]**
  - DNS híbrido com endpoints de entrada e saída. **[feito como fundo da montagem (ver DECISIONS)]**
- Desenho extra: geolocalização com áreas uma dentro da outra (cartão `dns.geolocation`). **[feito]**

## f08
- **Intel:**
  - `m1`: explicar POP e cache regional. **[feito]**
  - `m2`: expandir OAC e OAI; intel da restrição geográfica. **[feito]**
- **Missão 1:**
  - `m1.a3` e `boss.a2`: o custo da invalidação está errado. Os primeiros 1.000 caminhos por mês são grátis, e `/*` conta como um. Reescrever o motivo do nome versionado. **[feito]**
- **Missão 2:**
  - `m2.a3`: vira montagem; o caso do "álbum" vira "arquivo .zip". **[feito: virou a montagem `net.f08.m2.a4`; o .zip aparece na explicação da URL assinada]**
- **Missão 3:**
  - `m3.a1`: trocar o item do JWT; "decidir a origem" vira "ler o corpo de um POST"; o Lambda@Edge tem 5 s nos eventos do ouvinte e 30 s nos da origem. **[feito em parte: o item do corpo mudou; o JWT e os 30 s ficaram, conforme a documentação (ver DECISIONS)]**
- **Chefe:**
  - `boss.a1`: o critério vira "Playlists sempre vêm da origem"; tratar a invalidação automática que passa em tudo; aceitar 0, 60 ou 300 s na explicação. **[feito: invalidação fora do laboratório (ver DECISIONS)]**
  - `boss.a2`: nova opção de invalidação; o aplicativo guarda o arquivo por 1 hora. **[feito]**
- **Fatos a conferir:** CloudFront Functions mudando a origem; HMAC e JWT; tempos do Lambda@Edge; invalidação grátis. **[conferidos em 06/11/2026]**
- **Diagramas:**
  - ouvinte, POP, cache regional e origem com OAC, mais os quatro ganchos de evento; **[feito em dois desenhos: caminho do pedido no cartão `edge.cloudfront` e os quatro eventos no cartão `cdn.edge-functions`]**
  - CloudFront e Global Accelerator lado a lado. **[feito]**

## f09
- **Intel:**
  - `m1`: definir "pacote de proteção" (o antigo web ACL). **[feito]**
  - `m2`: explicar as camadas 3, 4 e 7. **[feito]**
  - `m3`: explicar o Suricata. **[feito]**
- **Missão 1:**
  - `m1.a2`: reescrever; distratores "ACL negando os IPs de hoje" e "Shield Advanced". **[feito]**
  - `m1.a3`: vira montagem; incluir a "API HTTP do API Gateway" no lado que não aceita. **[feito na própria classificação; a montagem foi para `net.f09.m3.a4` (ver DECISIONS)]**
- **Missão 2:**
  - `m2.a3`: distratores "WAF em cada recurso" e "ativar o Shield Standard". **[feito]**
- **Missão 3:**
  - `m3.a2`: distrator "SCP exigindo o WAF". **[feito]**
- **Diagramas:**
  - defesa em camadas; **[feito: camadas 3, 4 e 7 no cartão `edgesec.shield-standard`; a defesa completa é o fundo da montagem]**
  - Network Firewall no caminho das rotas. **[feito]**

## Final
- **Questões com a resposta entregue ou com cenário incompleto:**
  - `blocos`: tirar "fora da faixa das lojas"; distrator 10.1/10.2/10.3 dentro de 10.0.0.0/12. **[feito]**
  - `registro`: "a cada trimestre, os meses anteriores". **[feito]**
  - `cd`: o centro de distribuição roda o sistema de pedidos. **[feito]**
  - `ddos`: o intro diz a exigência de especialistas e créditos; encurtar o rótulo. **[feito]**
  - `waf`: citar os robôs no intro. **[feito]**
- **Questões com cenário contraditório:**
  - `roteamento`: resolver a Virgínia (quarta VPC ou tirar); rótulo "Avaliar a saúde do alvo". **[feito]**
  - `pequenas` e `hub`: decidir entre uma conexão e 80 VPNs. **[feito]**
- **Questões de duas opções com distrator absurdo:** `camadas`, `registro`, `fotos`, `waf` e `pequenas`, que ganham uma terceira opção plausível. **[feito]**
- **Seta no feedback:** a seta "→" do feedback sai (Parte 1e). **[feito]**
- **Desenho vivo:** a rede das três VPCs crescendo por etapa. **[feito]**
