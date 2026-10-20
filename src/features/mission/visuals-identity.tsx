/** Visuais didáticos da trilha IAM e Access Management. */
import { ArrowDown, ArrowRight, Building2, Check, CircleUserRound, Cloud, FileJson, KeyRound, Server, ShieldCheck, Smartphone, Ticket, User, Users, X } from 'lucide-react'
import type { ReactNode } from 'react'
import base from './visuals.module.css'
import s from './visuals-identity.module.css'

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className={base.frame} role="img" aria-label={label}>
      {children}
    </figure>
  )
}

export function IamEntities() {
  return (
    <Frame label="Entidades de uma conta AWS: o usuário raiz com acesso total; usuários IAM com senha e chaves de acesso; um grupo que reúne usuários e recebe políticas; uma role sem credenciais fixas, que entrega uma sessão temporária a quem a trust policy permite.">
      <div className={s.account}>
        <span className={s.tag}>Conta AWS</span>
        <div className={s.entities}>
          <div className={s.entity} data-tone="danger">
            <ShieldCheck size={18} aria-hidden="true" />
            <strong>Usuário raiz</strong>
            <small>e-mail + senha + MFA · acesso total · fica guardado</small>
          </div>
          <div className={s.entity} data-tone="accent">
            <Users size={18} aria-hidden="true" />
            <strong>Grupo Financeiro</strong>
            <div className={s.members}>
              <span>
                <User size={13} aria-hidden="true" /> ana
              </span>
              <span>
                <User size={13} aria-hidden="true" /> rui
              </span>
            </div>
            <small>políticas do grupo valem para os membros · não é principal</small>
          </div>
          <div className={s.entity} data-tone="info">
            <User size={18} aria-hidden="true" />
            <strong>Usuário IAM</strong>
            <small>senha + até 2 chaves de acesso · longo prazo</small>
          </div>
          <div className={s.entity} data-tone="success">
            <Ticket size={18} aria-hidden="true" />
            <strong>Role</strong>
            <small>trust policy: quem assume · política de permissões: o que faz</small>
            <span className={s.session}>sessão temporária, expira sozinha</span>
          </div>
        </div>
      </div>
    </Frame>
  )
}

const ANATOMY: [string, string, string][] = [
  ['"Effect": "Allow"', 'Effect', 'Allow ou Deny'],
  ['"Principal": { "AWS": "arn:aws:iam::111122223333:role/App" }', 'Principal', 'quem (só em políticas de recurso)'],
  ['"Action": "s3:GetObject"', 'Action', 'o que fazer (serviço:ação)'],
  ['"Resource": "arn:aws:s3:::relatorios/*"', 'Resource', 'em qual recurso (ARN)'],
  ['"Condition": { "Bool": { "aws:SecureTransport": "true" } }', 'Condition', 'quando vale (opcional)'],
]

export function PolicyAnatomy() {
  return (
    <Frame label="Anatomia de um statement: Effect diz se permite ou nega; Principal diz quem, só em políticas de recurso; Action diz o que; Resource diz em qual recurso; Condition diz quando o statement vale.">
      <div className={s.anatomy}>
        {ANATOMY.map(([code, name, what]) => (
          <div key={name} className={s.anatomyRow}>
            <code>{code}</code>
            <span>
              <strong>{name}</strong> {what}
            </span>
          </div>
        ))}
      </div>
      <small className={base.caption}>Vários statements numa política combinam com OU; dentro de um Condition, chaves diferentes combinam com E.</small>
    </Frame>
  )
}

const FLOW: [string, string][] = [
  ['Algum Deny explícito se aplica?', 'Sim: negado. Um Deny em qualquer política vence.'],
  ['RCPs da conta do recurso têm Allow em todos os níveis?', 'Não: negado.'],
  ['SCPs da conta do principal têm Allow em todos os níveis?', 'Não: negado.'],
  ['A política de recurso concede ao principal?', 'Concessão direta ao usuário ou à sessão, na mesma conta: permitido.'],
  ['Alguma política de identidade permite?', 'Não: negado (deny implícito).'],
  ['O permissions boundary permite?', 'Não: negado.'],
  ['A session policy permite?', 'Não: negado. Sim, ou não há session policy: permitido.'],
]

export function PolicyFlow() {
  return (
    <Frame label="Fluxo de avaliação na mesma conta: primeiro procura um Deny explícito em todas as políticas; depois exige Allow nas RCPs e nas SCPs; uma concessão direta da política de recurso pode decidir; senão, precisa de Allow na identidade, no boundary e na session policy.">
      <ol className={s.flow}>
        {FLOW.map(([q, a], i) => (
          <li key={q}>
            <span className={s.step}>{i + 1}</span>
            <span>
              <strong>{q}</strong>
              <small>{a}</small>
            </span>
          </li>
        ))}
      </ol>
      <small className={base.caption}>Resumo do fluxo documentado pela AWS para requisições dentro de uma conta. O usuário raiz começa com acesso total.</small>
    </Frame>
  )
}

export function CrossAccountEval() {
  return (
    <Frame label="Acesso entre contas: a AWS avalia a conta de quem pede (políticas de identidade, boundary, sessão e SCPs) e a conta do recurso (política de recurso e RCPs). A requisição só passa se as duas avaliações permitirem.">
      <div className={s.two}>
        <div className={s.box} data-tone="info">
          <span className={s.tag}>Conta A (de quem pede)</span>
          <ul>
            <li>política de identidade permite?</li>
            <li>boundary e session policy permitem?</li>
            <li>SCPs permitem?</li>
          </ul>
        </div>
        <div className={s.box} data-tone="accent">
          <span className={s.tag}>Conta B (do recurso)</span>
          <ul>
            <li>política de recurso cita a conta A ou a identidade?</li>
            <li>RCPs permitem?</li>
          </ul>
        </div>
      </div>
      <p className={s.both}>
        <Check size={14} aria-hidden="true" /> Só passa se as duas contas permitirem. Um Deny em qualquer uma nega.
      </p>
    </Frame>
  )
}

export function AssumeRoleFlow() {
  const steps: [ReactNode, string, string][] = [
    [<CircleUserRound key="u" size={18} aria-hidden="true" />, 'Quem chama', 'usuário, sessão, serviço ou outra conta'],
    [<Ticket key="t" size={18} aria-hidden="true" />, 'sts:AssumeRole', 'a trust policy precisa permitir; quem chama precisa de permissão (com exceções na mesma conta)'],
    [<KeyRound key="k" size={18} aria-hidden="true" />, 'Credenciais temporárias', 'chave, segredo, token de sessão e prazo: de 15 min até o máximo da role'],
    [<Cloud key="c" size={18} aria-hidden="true" />, 'Ações com as permissões da role', 'as permissões de quem chamou ficam de fora'],
  ]
  return (
    <Frame label="Fluxo do AssumeRole: quem chama pede ao STS; a trust policy é conferida; o STS devolve credenciais temporárias; as ações seguintes usam só as permissões da role.">
      <ol className={s.chain}>
        {steps.map(([icon, title, note], i) => (
          <li key={title}>
            <span className={s.node}>
              {icon}
              <strong>{title}</strong>
              <small>{note}</small>
            </span>
            {i < steps.length - 1 && <ArrowRight className={s.arrow} size={16} aria-hidden="true" />}
          </li>
        ))}
      </ol>
    </Frame>
  )
}

export function ConfusedDeputy() {
  return (
    <Frame label="Assistente confuso: um fornecedor acessa as contas dos clientes por roles. Sem External ID, um cliente mal-intencionado informa o ARN da role de outra empresa e o fornecedor acessa a conta errada. Com um External ID único por cliente, conferido na trust policy, o pedido falha.">
      <div className={s.two}>
        <div className={s.box} data-tone="danger">
          <span className={s.tag}>Sem External ID</span>
          <p>
            O cliente malicioso cadastra no fornecedor o ARN da <strong>sua</strong> role. O fornecedor assume a role com as próprias credenciais e acessa a sua conta.
          </p>
        </div>
        <div className={s.box} data-tone="success">
          <span className={s.tag}>Com External ID</span>
          <p>
            O fornecedor gera um ID único para cada cliente e o envia ao assumir a role. A sua trust policy exige <code>sts:ExternalId</code> igual ao seu ID: o pedido do impostor falha.
          </p>
        </div>
      </div>
      <small className={base.caption}>Entre serviços da AWS, a mesma proteção usa aws:SourceArn e aws:SourceAccount nas políticas de recurso.</small>
    </Frame>
  )
}

export function FederationFlow() {
  const steps: [ReactNode, string, string][] = [
    [<User key="u" size={18} aria-hidden="true" />, 'Funcionário', 'abre o portal de acesso'],
    [<Building2 key="b" size={18} aria-hidden="true" />, 'Provedor de identidade', 'login da empresa, com MFA'],
    [<FileJson key="f" size={18} aria-hidden="true" />, 'Asserção SAML ou token OIDC', 'diz quem é e a que grupos pertence'],
    [<Ticket key="t" size={18} aria-hidden="true" />, 'Role na conta AWS', 'credenciais temporárias, sem usuário IAM'],
  ]
  return (
    <Frame label="Federação: o funcionário entra no provedor de identidade da empresa; o provedor emite uma asserção SAML ou um token OIDC; a AWS troca isso por credenciais temporárias de uma role. No IAM Identity Center, cada permission set vira uma role nas contas atribuídas.">
      <ol className={s.chain}>
        {steps.map(([icon, title, note], i) => (
          <li key={title}>
            <span className={s.node}>
              {icon}
              <strong>{title}</strong>
              <small>{note}</small>
            </span>
            {i < steps.length - 1 && <ArrowRight className={s.arrow} size={16} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <small className={base.caption}>No IAM Identity Center, cada permission set atribuído a uma conta vira uma role nessa conta.</small>
    </Frame>
  )
}

export function CognitoPools() {
  return (
    <Frame label="Amazon Cognito: o user pool cadastra e autentica os clientes do aplicativo e emite tokens JWT; o identity pool troca um token por credenciais temporárias da AWS, inclusive para visitantes sem login; as credenciais acessam recursos como S3 e DynamoDB.">
      <div className={s.cognito}>
        <div className={s.box} data-tone="info">
          <Smartphone size={18} aria-hidden="true" />
          <strong>App do cliente</strong>
        </div>
        <ArrowDown className={s.arrowDown} size={16} aria-hidden="true" />
        <div className={s.box} data-tone="accent">
          <Users size={18} aria-hidden="true" />
          <strong>User pool</strong>
          <small>quem é o usuário: cadastro, login (inclusive social, SAML e OIDC) e tokens JWT</small>
        </div>
        <ArrowDown className={s.arrowDown} size={16} aria-hidden="true" />
        <div className={s.box} data-tone="success">
          <KeyRound size={18} aria-hidden="true" />
          <strong>Identity pool</strong>
          <small>troca o token por credenciais temporárias da AWS, também para visitantes</small>
        </div>
        <ArrowDown className={s.arrowDown} size={16} aria-hidden="true" />
        <div className={s.box} data-tone="mastery">
          <Server size={18} aria-hidden="true" />
          <strong>Recursos AWS</strong>
          <small>S3, DynamoDB… com as permissões da role escolhida</small>
        </div>
      </div>
    </Frame>
  )
}

export function OrgTree() {
  return (
    <Frame label="Árvore de uma organização: a raiz tem a SCP FullAWSAccess; abaixo, a conta de gerenciamento, que as SCPs não afetam, e as OUs Produção e Sandbox com suas contas. Para uma ação ser permitida numa conta, todas as SCPs do caminho da raiz até a conta precisam permitir.">
      <div className={s.tree}>
        <div className={s.treeNode} data-kind="root">
          <strong>Raiz</strong>
          <small>SCP FullAWSAccess</small>
        </div>
        <div className={s.treeChildren}>
          <div className={s.treeNode} data-kind="mgmt">
            <strong>Conta de gerenciamento</strong>
            <small>SCPs não a afetam</small>
          </div>
          <div className={s.treeNode} data-kind="ou">
            <strong>OU Produção</strong>
            <small>SCP: negar Regiões fora de sa-east-1</small>
            <div className={s.treeLeaves}>
              <span>conta Pagamentos</span>
              <span>conta Site</span>
            </div>
          </div>
          <div className={s.treeNode} data-kind="ou">
            <strong>OU Sandbox</strong>
            <small>SCP: permitir só EC2 e S3</small>
            <div className={s.treeLeaves}>
              <span>conta Testes</span>
            </div>
          </div>
        </div>
      </div>
      <small className={base.caption}>SCP não concede nada: ela limita. É preciso Allow em todos os níveis do caminho, e um Deny em qualquer nível vence.</small>
    </Frame>
  )
}

export function PermissionLayers() {
  const layers: [string, string, boolean][] = [
    ['Política de identidade', 'concede', true],
    ['Permissions boundary', 'limita (máximo do usuário ou role)', false],
    ['SCP da organização', 'limita (máximo da conta)', false],
    ['Session policy', 'limita (máximo da sessão)', false],
  ]
  return (
    <Frame label="Camadas de permissão: a permissão efetiva é a interseção do que a política de identidade concede com o que o boundary, as SCPs e a session policy permitem. Só a identidade e a política de recurso concedem; as outras camadas apenas limitam.">
      <ul className={s.layers}>
        {layers.map(([name, role, grants]) => (
          <li key={name} data-grants={grants}>
            {grants ? <Check size={14} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
            <strong>{name}</strong>
            <small>{role}</small>
          </li>
        ))}
      </ul>
      <p className={s.both}>Permissão efetiva: a interseção de todas as camadas. Um Deny explícito em qualquer uma nega.</p>
    </Frame>
  )
}
