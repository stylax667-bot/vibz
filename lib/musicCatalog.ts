// Catalogue unique des styles et instruments — utilisé par le vinyle
// (Découvrir), le créateur de salon Mix et la recherche. Les `id` servent
// à construire la clé des salons : ne pas les renommer.

export type CatalogItem = {
  id: string
  label: string
  emoji: string
  color: string
  kind: 'style' | 'instrument'
  // Termes utilisés pour relier l'élément aux profils (instruments / genres saisis)
  match?: string[]
}

export const STYLES: CatalogItem[] = [
  { id:'rock',      label:'Rock',          emoji:'🎸', color:'#E8395A' },
  { id:'metal',     label:'Métal',         emoji:'🤘', color:'#CC2200', match:['metal'] },
  { id:'punk',      label:'Punk',          emoji:'⚡', color:'#FF5722' },
  { id:'grunge',    label:'Grunge',        emoji:'🌧️', color:'#795548' },
  { id:'indie',     label:'Indie Rock',    emoji:'🌿', color:'#9C27B0', match:['indie'] },
  { id:'blues',     label:'Blues',         emoji:'🎵', color:'#1565C0' },
  { id:'jazz',      label:'Jazz',          emoji:'🎷', color:'#6BB8E8' },
  { id:'soul',      label:'Soul · Gospel', emoji:'🎤', color:'#FF8F00', match:['soul','gospel'] },
  { id:'rnb',       label:'R&B · Funk',    emoji:'🕺', color:'#7B1FA2', match:['r&b','rnb','funk'] },
  { id:'hiphop',    label:'Hip-Hop',       emoji:'🎤', color:'#A78BDB', match:['hip-hop','hip hop','rap'] },
  { id:'disco',     label:'Disco',         emoji:'🪩', color:'#E91E63' },
  { id:'house',     label:'House',         emoji:'🏠', color:'#FF4081' },
  { id:'techno',    label:'Techno',        emoji:'🔊', color:'#546E7A' },
  { id:'electro',   label:'Électro',       emoji:'🎧', color:'#00ACC1', match:['électro','electro'] },
  { id:'trance',    label:'Trance',        emoji:'🌌', color:'#7C4DFF' },
  { id:'dnb',       label:'Drum & Bass',   emoji:'🥁', color:'#FF6D00', match:['drum','dnb'] },
  { id:'dubstep',   label:'Dubstep',       emoji:'🔈', color:'#64DD17' },
  { id:'ambient',   label:'Ambient',       emoji:'🌊', color:'#80CBC4' },
  { id:'synthwave', label:'Synthwave',     emoji:'🌆', color:'#CE93D8' },
  { id:'lofi',      label:'Lo-fi',         emoji:'☁️', color:'#A5D6A7', match:['lo-fi','lofi'] },
  { id:'trap',      label:'Trap',          emoji:'🎤', color:'#607D8B' },
  { id:'pop',       label:'Pop',           emoji:'🌸', color:'#F06292' },
  { id:'kpop',      label:'K-Pop',         emoji:'💫', color:'#FF80AB', match:['k-pop','kpop','j-pop'] },
  { id:'classique', label:'Classique',     emoji:'🎻', color:'#A1887F' },
  { id:'folk',      label:'Folk',          emoji:'🪕', color:'#8BC34A' },
  { id:'country',   label:'Country',       emoji:'🤠', color:'#FFA726' },
  { id:'reggae',    label:'Reggae',        emoji:'🌴', color:'#4CAF50' },
  { id:'latin',     label:'Latin',         emoji:'💃', color:'#F44336', match:['latin','bossa'] },
  { id:'world',     label:'Afrobeat',      emoji:'🌍', color:'#E65100', match:['afro','world'] },
].map(i => ({ ...i, kind: 'style' as const }))

export const INSTRUMENTS: CatalogItem[] = [
  { id:'guit_e',      label:'Guitare élec.',   emoji:'🎸', color:'#52C07A', match:['guitare'] },
  { id:'guit_a',      label:'Guitare acous.',  emoji:'🎸', color:'#6DBF6D', match:['guitare'] },
  { id:'basse',       label:'Basse',           emoji:'🎸', color:'#3DAD7A' },
  { id:'violon',      label:'Violon',          emoji:'🎻', color:'#8BC34A' },
  { id:'violonc',     label:'Violoncelle',     emoji:'🎻', color:'#558B2F' },
  { id:'uke',         label:'Ukulélé',         emoji:'🪕', color:'#9CCC65', match:['ukulélé','ukulele'] },
  { id:'piano',       label:'Piano',           emoji:'🎹', color:'#29B6F6' },
  { id:'piano_d',     label:'Claviers',        emoji:'🎹', color:'#0288D1', match:['clavier'] },
  { id:'synth',       label:'Synthétiseur',    emoji:'🎛️', color:'#7C4DFF', match:['synth'] },
  { id:'orgue',       label:'Orgue',           emoji:'🎹', color:'#5E35B1' },
  { id:'accordeon',   label:'Accordéon',       emoji:'🪗', color:'#AB47BC' },
  { id:'beatmaking',  label:'Beatmaking',      emoji:'🎧', color:'#8E24AA', match:['beat'] },
  { id:'batt',        label:'Batterie',        emoji:'🥁', color:'#EF5350' },
  { id:'batt_e',      label:'Batterie élec.',  emoji:'🥁', color:'#E53935', match:['batterie'] },
  { id:'cajon',       label:'Cajon · Djembé',  emoji:'🪘', color:'#FF7043', match:['cajon','djembé','djembe'] },
  { id:'perc_lat',    label:'Percus. latines', emoji:'🪘', color:'#FF5722', match:['percu'] },
  { id:'sax',         label:'Saxophone',       emoji:'🎷', color:'#FF8F00', match:['saxo'] },
  { id:'trompette',   label:'Trompette',       emoji:'🎺', color:'#FFA000' },
  { id:'trombone',    label:'Trombone · Tuba', emoji:'🎺', color:'#F57F17', match:['trombone','tuba'] },
  { id:'clarinette',  label:'Clarinette',      emoji:'🎵', color:'#6D4C41' },
  { id:'flute',       label:'Flûte',           emoji:'🎵', color:'#80CBC4', match:['flûte','flute'] },
  { id:'harpe',       label:'Harpe · Sitar',   emoji:'🎵', color:'#AED581', match:['harpe','sitar'] },
  { id:'chant_class', label:'Chant lyrique',   emoji:'🎤', color:'#EC407A', match:['chant'] },
  { id:'chant_pop',   label:'Chant pop',       emoji:'🎤', color:'#E91E63', match:['chant'] },
  { id:'rap',         label:'Rap · Slam',      emoji:'🎤', color:'#AD1457', match:['rap','slam'] },
  { id:'beatbox',     label:'Beatbox',         emoji:'🎤', color:'#880E4F' },
  { id:'choeurs',     label:'Chœurs',          emoji:'🎶', color:'#F06292', match:['chœur','choeur'] },
  { id:'dj',          label:'DJ · Platines',   emoji:'🎧', color:'#546E7A', match:['dj'] },
  { id:'prod',        label:'Producteur',      emoji:'💻', color:'#37474F', match:['produc'] },
].map(i => ({ ...i, kind: 'instrument' as const }))

export const CATALOG: CatalogItem[] = [...STYLES, ...INSTRUMENTS]
export const CATALOG_BY_ID: Record<string, CatalogItem> = Object.fromEntries(CATALOG.map(i => [i.id, i]))

// Normalise pour une recherche insensible aux accents et à la casse
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

export function searchCatalog(query: string, kind?: CatalogItem['kind']): CatalogItem[] {
  const q = norm(query)
  const pool = kind ? CATALOG.filter(i => i.kind === kind) : CATALOG
  if (!q) return pool
  return pool.filter(i => norm(i.label).includes(q) || (i.match || []).some(m => norm(m).includes(q)))
}

// Termes de correspondance d'un élément avec les champs texte d'un profil
export function matchTerms(item: CatalogItem): string[] {
  return (item.match && item.match.length ? item.match : [item.label.split(/[ ·.]/)[0]]).map(norm)
}
