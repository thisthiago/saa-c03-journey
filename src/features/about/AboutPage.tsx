import { CONTENT_VERSION, registry } from '../../content'
import { EXAM_INFO } from '../../content/catalog/catalog'
import { trackPhases } from '../../engine/registry'
import { ATTEMPT_FACTORS, HINT_PENALTY, REVIEW_XP } from '../../engine/xp'
import { LEITNER_DAYS } from '../../engine/mastery'
import { useDocumentTitle } from '../../app/hooks'
import { Callout, Card } from '../../ui/kit'
import { phaseRef } from '../../app/format'

export function AboutPage() {
  useDocumentTitle('Sobre')
  const phases = [...registry.tracks.values()].flatMap(trackPhases).filter((p) => p.availability === 'available' && p.simplifications?.length)
  // Os conceitos com status descrevem os produtos e recursos com disponibilidade restrita (e suas alternativas).
  const unavailable = [...registry.concepts.values()]
    .filter((c) => c.availability && c.availability.kind !== 'current')
    .map((c) => ({ id: c.id, name: c.officialName, availability: c.availability! }))
  return (
    <div className="page" style={{ maxWidth: 860 }}>
      <p className="eyebrow">Sobre</p>
      <h1>Como o AWS Quest funciona</h1>
      <p>
        O AWS Quest é uma plataforma de aprendizagem por desafios: cada fase apresenta um problema de uma empresa fictícia, entrega o mínimo de teoria necessário e pede que você decida, configure, investigue ou preveja o
        resultado. Os simuladores rodam no seu navegador — nenhuma conta, credencial ou recurso da AWS é usado.
      </p>

      <Card>
        <h2>Pontuação</h2>
        <ul>
          <li>XP vem apenas de respostas avaliadas. Ler cartas ou avançar telas não pontua.</li>
          <li>
            Tentativas valem {ATTEMPT_FACTORS.map((f) => `${Math.round(f * 100)}%`).join(', ')} do XP (da 1ª à 4ª em diante). Cada dica reduz {Math.round(HINT_PENALTY * 100)}%.
          </li>
          <li>Repetir uma atividade só concede a melhoria sobre o seu melhor resultado.</li>
          <li>
            Na revisão, cada item correto de um conceito vencido vale {REVIEW_XP} XP. Os intervalos de revisão são de {LEITNER_DAYS.join(', ')} dias, conforme os acertos.
          </li>
          <li>Um conceito só é "Dominado" depois de acertos em dias diferentes.</li>
        </ul>
      </Card>

      <h2 style={{ marginTop: 32 }}>Simplificações</h2>
      <p className="muted">Toda simulação simplifica a AWS real. As simplificações de cada fase liberada:</p>
      {phases.map((p) => (
        <Card key={p.id} style={{ marginBottom: 12 }}>
          <h3>
            {phaseRef(p)} — {p.title}
          </h3>
          <ul>
            {p.simplifications!.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </Card>
      ))}

      {unavailable.length > 0 && (
        <>
          <h2 style={{ marginTop: 32 }}>Produtos com disponibilidade restrita</h2>
          {unavailable.map((sv) => (
            <Callout key={sv.id} kind="warning" title={sv.name}>
              {sv.availability.kind === 'no-new-customers' ? (
                <>
                  <p>
                    Sem novos clientes{sv.availability.since ? ` desde ${sv.availability.since}` : ''}. {sv.availability.note}
                  </p>
                  {sv.availability.alternatives && <p>Alternativas: {sv.availability.alternatives.join('; ')}.</p>}
                </>
              ) : sv.availability.kind === 'discontinued' ? (
                <>
                  <p>
                    Encerrado em {sv.availability.since}. {sv.availability.note}
                  </p>
                  {sv.availability.alternatives && <p>Alternativas: {sv.availability.alternatives.join('; ')}.</p>}
                </>
              ) : (
                sv.availability.kind === 'legacy' && <p>{sv.availability.note}</p>
              )}
            </Callout>
          ))}
        </>
      )}

      <h2 style={{ marginTop: 32 }}>Fontes e certificação</h2>
      <p>
        O conteúdo é conferido na documentação oficial da AWS; cada conceito do Codex lista as fontes usadas. A referência de certificação é o exame{' '}
        <a href={EXAM_INFO.url} target="_blank" rel="noopener noreferrer">
          {EXAM_INFO.name} ({EXAM_INFO.code})
        </a>
        , conforme o{' '}
        <a href={EXAM_INFO.guideUrl} target="_blank" rel="noopener noreferrer">
          guia oficial do exame
        </a>{' '}
        consultado em {new Date(EXAM_INFO.checkedAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}.
      </p>
      <Callout kind="info" title="Aviso">
        <p>
          Projeto educacional independente, sem afiliação com a Amazon Web Services. Os desafios seguem o estilo de raciocínio arquitetural cobrado na certificação, mas não reproduzem questões oficiais e não garantem
          aprovação. AWS e os nomes dos serviços são marcas da Amazon.com, Inc. ou de suas afiliadas.
        </p>
      </Callout>
      <p className="muted" style={{ marginTop: 16 }}>
        Versão do conteúdo: {CONTENT_VERSION}
      </p>
    </div>
  )
}
