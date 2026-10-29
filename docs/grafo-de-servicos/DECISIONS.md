# Decisões

## Do usuário (29/10/2026)

- **"Domínio" é o território.** Cada serviço tem exatamente um território; os domínios do exame não têm dono por serviço (o S3 tem 22/19/19/17 questões em D1 a D4, há 8 empates e 7 serviços sem questão). Os domínios do exame aparecem no painel, por contagem de questões.
- **O grafo é uma aba em `/mapa`** (`?vista=servicos`); a lista atual continua como padrão.
- **Layout com d3-force**, rodado uma vez de forma determinística. Zoom e arraste próprios, sem d3-zoom.

## Técnicas

- **Tamanho do nó:** número de questões distintas do banco que citam o serviço pelo conceito principal ou por um relacionado. Uma questão conta no máximo uma vez por serviço (pelo id). Raio `7 + 15·log1p(q)/log1p(max)`, entre 7 e 22, para nenhum nó dominar.
- **Relações:** dois serviços se ligam quando pelo menos um conceito cita os dois (`ConceptDef.serviceIds`). A espessura e a opacidade crescem com o número de conceitos em comum. Inclui os conceitos de escolha entre serviços (por exemplo, "como escolher o banco de dados"), porque comparar serviços é uma relação que o exame cobra.
- **Fases de ensino de um serviço:** a primeira fase disponível que ensina cada conceito dele (`registry.conceptPhase`, a mesma regra do Codex).
- **Estado:** concluído quando todas as fases de ensino estão concluídas; em andamento quando alguma está em andamento ou concluída; desbloqueado quando alguma está disponível; bloqueado no resto. "Em andamento" usa o status oficial da fase, que considera a missão aberta (como no mapa da trilha); abrir o Codex não conta.
- **Serviço sem fase de ensino** não entra no grafo (hoje são zero).
- **Revelação:** o painel só mostra o título de conceitos descobertos; os demais aparecem como contagem, como no Codex.
- **Cores:** 10 tokens `--territory-<id>` nos três escopos de tema. Paleta escolhida por busca e validada com `validate_palette.js` (skill dataviz) nos pares vizinhos do anel de territórios, inclusive o par que fecha o anel: no escuro (fundo `#0f1830`) pior CVD 11,9 e normal 22,9; no claro (fundo `#ffffff`) pior CVD 15,1 e normal 24,3; contraste ≥ 3:1 em todos. São 10 categorias (acima das 8 recomendadas), então a cor nunca é o único sinal: o nome do território aparece no mapa, nos chips, no painel e na lista.
- **Ordem do anel** (calculada do conteúdo em 29/10/2026): segurança, monitoramento, fundamentos, arquitetura, integração, computação, redes, bancos de dados, análise, armazenamento. Se o conteúdo mudar a ordem, as cores continuam presas ao território.
- **Zoom com a roda:** só com Ctrl ou ⌘ (a pinça do trackpad também), para não prender a rolagem da página.

## Fora do escopo

- Arestas por `ConceptDef.comparisons` (acrescentariam 43 pares).
- Filtro por serviço no banco de questões.
- Filtro por domínio do exame.
