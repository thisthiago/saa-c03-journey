# Revisão da trilha Redes na AWS: decisões

Cada decisão tem a data e o motivo.

## Do usuário (05/11/2026)

- **Escopo:** a trilha inteira, com as fases `net.f01` a `net.f09` e o final.
- **Montagens:** substituem perguntas fracas do mesmo assunto. Recebem ids novos, porque trocar o tipo de uma atividade com o mesmo id quebra rascunhos salvos. As missões já aprovadas continuam aprovadas, porque `passedAt` fica salvo.
- **Desenho vivo:** nos labs principais (f01, f02, f03, f04 e final).
- **Ritmo:** trabalho em partes, com o status salvo no PROGRESS, sem pausa para aprovação. Uma tarefa agendada retoma o trabalho em 06/11/2026 à 01:00.

## Durante o trabalho

- **05/11/2026, desenho vivo por fase:** o item 1e foi feito junto de cada fase, no passo 5 do ciclo, e não todo na Parte 1. Assim cada desenho é conferido com o conteúdo da fase que ele ilustra. A troca da seta do feedback do lab de arquitetura vai junto com o final.
- **05/11/2026, situação de cada ficha da montagem:** o resultado lista uma linha por tipo de peça, para não repetir a mesma explicação em cada cópia, e uma linha por lugar errado, com a explicação do lugar. A marca de certo ou errado em cada ficha vem de `chipStatus`.
- **05/11/2026, ícones nas peças da montagem:** a peça só leva ícone quando o ícone é a própria peça (um gateway, um NAT). Regras e rotas ficam sem ícone, porque o escudo do security group ou a parede da ACL entregariam o lugar certo.
- **05/11/2026, desenhos que entregariam a resposta:** quando o achado pedia um desenho numa atividade e ele mostraria a resposta (`net.f01.m2.a3`, `net.f02.m3.a2`), o desenho foi para o cartão de conceito da missão, que ensina antes da atividade.
- **05/11/2026, chefe da fase 3:** entrou o servidor de relatórios (grupo sg-rel, na sub-rede pública) e o fluxo dele até o banco, que precisa ser barrado. Assim a regra "5432 de 0.0.0.0/0" perde nota, porque só o sg-db barra esse fluxo. A regra de saída 110 (5432 para a privada) saiu da solução, porque a 100 (1024-65535) já cobre a porta 5432; ela continua na lista como opção redundante.
- **05/11/2026, `net.f06.m1.a3`, opção c:** o achado sugeria "túneis de grande largura de banda com rotas estáticas". Essa opção também resolveria os 4 Gbps (um túnel de 5 Gbps basta), e a questão ficaria com duas respostas. Entrou "ligar a aceleração das VPNs", que existe no Transit Gateway e não faz o ECMP dividir o tráfego.
- **05/11/2026, simulador híbrido:** a conexão hospedada passou a atender "10 Gbps (até 25 Gbps)", como na documentação, e entrou a necessidade "acima de 25 Gbps", que só a dedicada atende. O cenário `replica` do chefe passou a 40 Gbps.
- **05/11/2026, geoproximidade na fase 7:** o simulador de DNS não calcula a geoproximidade, então o ensino do viés antes do chefe virou uma decisão (`net.f07.m2.a5`), e não uma previsão.
- **05/11/2026, desenho do DNS híbrido:** o desenho dos endpoints de entrada e de saída ficou só como fundo da montagem `net.f07.m3.a4`. Um desenho igual no cartão do Resolver entregaria a montagem.
- **05/11/2026, "sem saúde":** virou "não saudável" ou "deixa de estar saudável" na fase 7, nos conceitos e nas questões da Revisão da fase, e numa opção do final.
- **06/11/2026, achados da fase 8 desmentidos pela documentação:** o tempo do Lambda@Edge é de até 30 segundos nos eventos do ouvinte e nos da origem (o "5 s no ouvinte" do achado estava desatualizado), e validar JWT está entre os usos documentados das CloudFront Functions. Por isso o texto dos 30 s e o item do JWT ficaram. O item "ler o corpo para decidir a origem" mudou, porque hoje as CloudFront Functions também trocam a origem.
- **06/11/2026, invalidação no chefe da fase 8:** com a invalidação automática, qualquer TTL cumpria a meta de atraso. A opção saiu deste laboratório (`allowInvalidation: false`), porque a fase ensina nomes versionados; a invalidação continua na decisão `boss.a2`.
- **06/11/2026, montagem da fase 9 na missão 3:** a montagem "Defesa em camadas" usa o Network Firewall e o Firewall Manager, que só a missão 3 ensina. Por isso ela ficou no lugar de `net.f09.m3.a3` (a associação "Cada ameaça, sua proteção", do mesmo assunto), e o achado de `m1.a3` (a API HTTP do API Gateway) foi aplicado na própria classificação.
- **06/11/2026, desenho vivo do final:** `ArchConfig.diagram` é o fundo, e `ArchOption.draw` acrescenta o que cada escolha representa. Os tons são neutros: o desenho mostra a escolha, e a avaliação continua só no relatório, depois do envio. Só o final de redes tem desenho; os outros 11 finais não mudam.
- **06/11/2026, seta do feedback dos finais:** "pergunta → resposta" virou "pergunta Resposta: …" no feedback e "Sua resposta: …" no relatório, para todos os finais.
- **06/11/2026, final de redes, Virgínia:** a etapa de DNS passou a dizer que a cópia da loja virtual fica numa quarta VPC, na Virgínia. As conexões das lojas passaram ao plural ("as VPNs das lojas e o Direct Connect do centro de distribuição"), o que resolve a dúvida entre uma conexão e 80 VPNs.
