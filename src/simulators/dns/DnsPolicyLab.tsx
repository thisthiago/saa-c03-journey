/** Interface do laboratório "A política certa". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag } from '../shared/Tags'
import { DNS_POLICIES, type DnsPolicyLabConfig, type DnsPolicyLabResponse } from './policy'

interface Props {
  config: DnsPolicyLabConfig
  value: DnsPolicyLabResponse
  onChange: (v: DnsPolicyLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function DnsPolicyLab(props: Props) {
  return (
    <ChoiceLab
      catalog={DNS_POLICIES}
      {...props}
      legend={
        <>
          <FactTag date="21/10/2026" /> o que cada política de roteamento do Route 53 faz · <JudgementTag /> desempate pela política mais simples
        </>
      }
      simplifications={['Cada cartão tem um requisito que decide; na vida real, políticas podem ser combinadas em árvore (por exemplo, latência e, dentro de cada Região, ponderada).', 'As verificações de saúde aparecem só onde mudam a resposta.']}
    />
  )
}
