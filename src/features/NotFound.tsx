import { ButtonLink } from '../ui/kit'

export function NotFound() {
  return (
    <div className="page">
      <p className="eyebrow">Coordenada desconhecida</p>
      <h1>Este lugar não existe no mapa</h1>
      <p className="muted">O endereço pode estar incorreto ou o conteúdo foi reorganizado.</p>
      <ButtonLink to="/">Voltar para a Base</ButtonLink>
    </div>
  )
}
