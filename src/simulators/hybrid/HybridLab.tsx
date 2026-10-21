/** Interface do laboratório "A conexão com o escritório". */
import type { Evaluation } from '../../engine/types'
import { ChoiceLab } from '../shared/ChoiceLab'
import { FactTag, JudgementTag, PremiseTag } from '../shared/Tags'
import { HYBRID, type HybridLabConfig, type HybridLabResponse } from './model'

interface Props {
  config: HybridLabConfig
  value: HybridLabResponse
  onChange: (v: HybridLabResponse) => void
  disabled: boolean
  evaluation?: Evaluation | null
}

export function HybridLab(props: Props) {
  return (
    <ChoiceLab
      catalog={HYBRID}
      {...props}
      legend={
        <>
          <FactTag date="21/10/2026" /> banda, criptografia e resiliência de cada conexão · <PremiseTag /> o Direct Connect não fica pronto em poucos dias · <JudgementTag /> desempate pela solução mais simples
        </>
      }
      simplifications={[
        'Cada cartão tem um requisito que decide e alguns requisitos rígidos; na vida real também pesam contrato, distância até o local do Direct Connect e a equipe.',
        'O prazo do Direct Connect é uma premissa: a porta é revisada pela AWS, mas o circuito até o local depende do parceiro.',
        'Os túneis de grande largura de banda da VPN (até 5 Gbps no Transit Gateway) ficam de fora.',
      ]}
    />
  )
}
