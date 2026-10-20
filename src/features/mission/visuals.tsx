/** Visuais didáticos das cartas de intel (referenciados por id no conteúdo). */
import { File, Folder, HardDrive, Server } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatUSD } from '../../simulators/cost/model'
import { regionPrices } from '../../simulators/cost/prices'
import { STORAGE_CLASSES, STORAGE_CLASS_ORDER } from '../../simulators/shared/storageClasses'
import { Glyph } from '../../ui/Glyph'
import s from './visuals.module.css'
import { AzIsolation, EdgeFlow, GlobalHierarchy, RegionMap, SrmStack, SupportLadder } from './visuals-foundations'
import { AssumeRoleFlow, CognitoPools, ConfusedDeputy, CrossAccountEval, FederationFlow, IamEntities, OrgTree, PermissionLayers, PolicyAnatomy, PolicyFlow } from './visuals-identity'

function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className={s.frame} role="img" aria-label={label}>
      {children}
    </figure>
  )
}

function StorageTypes() {
  return (
    <Frame label="Comparação: objeto guarda itens inteiros com etiqueta num espaço plano; bloco entrega um disco a um servidor; arquivo oferece pastas compartilhadas por vários servidores.">
      <div className={s.three}>
        <div className={s.col} data-tone="accent">
          <Glyph name="bucket" size={30} />
          <strong>Objeto</strong>
          <div className={s.objects}>
            {['foto.jpg', 'nf.pdf', 'log.gz'].map((n) => (
              <span key={n} className={s.objectBox}>
                {n}
              </span>
            ))}
          </div>
          <small>item inteiro + metadados, via API</small>
        </div>
        <div className={s.col} data-tone="info">
          <Server size={28} aria-hidden="true" />
          <strong>Bloco</strong>
          <div className={s.blocks}>
            {Array.from({ length: 12 }, (_, i) => (
              <span key={i} data-on={[1, 4, 5, 9].includes(i)} />
            ))}
          </div>
          <small>
            <HardDrive size={12} aria-hidden="true" /> disco de um servidor
          </small>
        </div>
        <div className={s.col} data-tone="mastery">
          <div className={s.servers}>
            <Server size={22} aria-hidden="true" />
            <Server size={22} aria-hidden="true" />
          </div>
          <strong>Arquivo</strong>
          <div className={s.tree}>
            <span>
              <Folder size={13} aria-hidden="true" /> /equipe
            </span>
            <span className={s.indent}>
              <File size={13} aria-hidden="true" /> capa.psd
            </span>
          </div>
          <small>pastas compartilhadas (NFS/SMB)</small>
        </div>
      </div>
    </Frame>
  )
}

function BucketAnatomy() {
  return (
    <Frame label="Um bucket na Região sa-east-1 contém objetos; cada objeto tem key, dados e metadados.">
      <div className={s.bucket}>
        <div className={s.bucketTop}>
          <Glyph name="bucket" size={20} /> <code>lumen-acervo-prod</code>
          <span className={s.region}>sa-east-1</span>
        </div>
        <div className={s.object}>
          <div>
            <span className={s.lbl}>key</span>
            <code>ensaios/2026/album.zip</code>
          </div>
          <div>
            <span className={s.lbl}>dados</span>
            <span className={s.bytes}>1011 0100 0110…</span>
          </div>
          <div>
            <span className={s.lbl}>metadados</span>
            <code>Content-Type: application/zip</code>
            <code>x-amz-meta-cliente: familia-davi</code>
          </div>
        </div>
      </div>
    </Frame>
  )
}

function FlatNamespace() {
  return (
    <Frame label="À esquerda, as keys reais, planas. À direita, as pastas que o console mostra agrupando pelo delimitador barra.">
      <div className={s.two}>
        <div>
          <span className={s.lbl}>O que existe (keys)</span>
          <ul className={s.keys}>
            <li>
              <code>
                <b>ensaios/2026/</b>a.zip
              </code>
            </li>
            <li>
              <code>
                <b>ensaios/2026/</b>b.zip
              </code>
            </li>
            <li>
              <code>
                <b>contratos/</b>c.pdf
              </code>
            </li>
            <li>
              <code>leia-me.txt</code>
            </li>
          </ul>
        </div>
        <div className={s.arrow} aria-hidden="true">
          →
        </div>
        <div>
          <span className={s.lbl}>O que o console mostra</span>
          <div className={s.tree}>
            <span>
              <Folder size={13} aria-hidden="true" /> ensaios/
            </span>
            <span className={s.indent}>
              <Folder size={13} aria-hidden="true" /> 2026/
            </span>
            <span>
              <Folder size={13} aria-hidden="true" /> contratos/
            </span>
            <span>
              <File size={13} aria-hidden="true" /> leia-me.txt
            </span>
          </div>
        </div>
      </div>
    </Frame>
  )
}

function DurabilityAvailability() {
  return (
    <Frame label="Durabilidade: cópias em várias zonas mantêm os dados existindo. Disponibilidade: fração do tempo em que é possível acessá-los.">
      <div className={s.two}>
        <div className={s.col} data-tone="success">
          <strong>Durabilidade</strong>
          <small>os dados continuam existindo?</small>
          <div className={s.azs}>
            {['AZ a', 'AZ b', 'AZ c'].map((az) => (
              <span key={az}>
                <Glyph name="object" size={14} /> {az}
              </span>
            ))}
          </div>
          <span className={s.big}>11 noves</span>
        </div>
        <div className={s.col} data-tone="info">
          <strong>Disponibilidade</strong>
          <small>consigo acessar agora?</small>
          <div className={s.uptime} aria-hidden="true">
            {Array.from({ length: 30 }, (_, i) => (
              <span key={i} data-down={i === 17} />
            ))}
          </div>
          <span className={s.big}>99,99%</span>
          <small>S3 Standard (projetado)</small>
        </div>
      </div>
    </Frame>
  )
}

function ClassSpectrum() {
  const prices = regionPrices('us-east-1')
  const order = STORAGE_CLASS_ORDER.filter((c) => c !== 'EXPRESS_ONEZONE')
  return (
    <Frame label="Espectro das classes: do acesso frequente ao arquivo profundo, com preço por GB-mês em us-east-1, latência e número de zonas.">
      <div className={s.spectrumAxis} aria-hidden="true">
        <span>acesso frequente</span>
        <span>arquivo: guardar barato, ler caro ou lento</span>
      </div>
      <ol className={s.spectrum}>
        {order.map((id) => {
          const c = STORAGE_CLASSES[id]
          return (
            <li key={id} data-restore={c.requiresRestore} data-zones={c.zones}>
              <strong>{c.shortName}</strong>
              <span>{formatUSD(prices.storageGBMonth[id])}/GB</span>
              <small>
                {c.requiresRestore ? 'restaurar' : 'ms'} · {c.zones === '1' ? '1 AZ' : '≥3 AZs'}
              </small>
            </li>
          )
        })}
      </ol>
      <small className={s.caption}>Preços de armazenamento da AWS Price List (us-east-1), primeira faixa. Express One Zone ({formatUSD(prices.storageGBMonth.EXPRESS_ONEZONE)}/GB) fica fora do eixo: é a classe de desempenho.</small>
    </Frame>
  )
}

const VISUALS: Record<string, () => ReactNode> = {
  'class-spectrum': ClassSpectrum,
  'storage-types': StorageTypes,
  'bucket-anatomy': BucketAnatomy,
  'flat-namespace': FlatNamespace,
  'durability-availability': DurabilityAvailability,
  'global-hierarchy': GlobalHierarchy,
  'region-map': RegionMap,
  'az-isolation': AzIsolation,
  'edge-flow': EdgeFlow,
  'srm-stack': SrmStack,
  'support-ladder': SupportLadder,
  'iam-entities': IamEntities,
  'policy-anatomy': PolicyAnatomy,
  'policy-flow': PolicyFlow,
  'cross-account-eval': CrossAccountEval,
  'assume-role-flow': AssumeRoleFlow,
  'confused-deputy': ConfusedDeputy,
  'federation-flow': FederationFlow,
  'cognito-pools': CognitoPools,
  'org-tree': OrgTree,
  'permission-layers': PermissionLayers,
}

export function Visual({ id }: { id: string }) {
  const V = VISUALS[id]
  return V ? <V /> : null
}

