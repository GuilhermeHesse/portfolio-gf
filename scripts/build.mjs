// Gera o site estático em dist/ a partir de site.config.json e das fichas em atletas/.
// Cada atleta é um arquivo atletas/<endereço>.md (editado pelo painel Pages CMS ou à mão),
// com as fotos em fotos/. O formato antigo atletas/<pasta>/ficha.md continua aceito.
// Páginas em português (raiz), inglês (/en/) e espanhol (/es/).
// Uso: npm run build
import { readFile, writeFile, mkdir, readdir, rm, cp, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { IDIOMAS, UI, tradutor } from './idiomas.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const SRC = path.join(RAIZ, 'src');
const PASTA_ATLETAS = path.join(RAIZ, 'atletas');
const LOGO = path.join(SRC, 'assets', 'logo-gf-original.png');
const HOJE = new Date();

const avisos = [];
function aviso(msg) {
  avisos.push(msg);
  console.warn('  ⚠ ' + msg);
}

let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch {
  aviso('Pacote "sharp" não encontrado: as fotos serão copiadas sem otimização. Rode "npm install" para otimizar.');
}
const LOGO_SITE = sharp ? 'logo-gf.webp' : 'logo-gf.png';

// ---------------------------------------------------------------- utilidades

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const semAcento = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
const slugify = (s) => semAcento(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const hash = (conteudo) => createHash('sha1').update(conteudo).digest('hex').slice(0, 10);

const config = JSON.parse(await readFile(path.join(RAIZ, 'site.config.json'), 'utf8'));
config.url = (config.url || '').replace(/\/+$/, '');
const BASE = config.url ? new URL(config.url + '/').pathname : '/';
const absoluta = (caminho) => (config.url ? `${config.url}/${caminho}` : caminho);
const prefixo = (idioma) => (idioma === 'pt' ? '' : `${idioma}/`);

const linkWhatsApp = (texto) => `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`;
const linkInstagram = (usuario) =>
  /^https?:\/\//.test(usuario) ? usuario : `https://instagram.com/${usuario.replace(/^@/, '')}`;

// Cliques registrados no contador de visitas (Umami): aparecem como eventos por atleta
const evento = (nome, atleta, idioma) =>
  ` data-umami-event="${esc(nome)}"${atleta ? ` data-umami-event-atleta="${esc(atleta.nome)}"` : ''} data-umami-event-idioma="${idioma}"`;

// Ícones em linha (stroke = currentColor)
const icone = {
  whatsapp:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.66 15l-1.3 4.75 4.86-1.27A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-2.88.75.77-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31c-.23.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.58.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.47-.29Z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.2-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z"/></svg>',
  externo:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  imprimir:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg>',
  trofeu:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>',
  seta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1.2 1.2M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1.2-1.2"/></svg>',
  email:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="m4 7 8 6 8-6"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/></svg>',
  fechar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>',
  pontos: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.9" fill="currentColor"/><circle cx="12" cy="12" r="1.9" fill="currentColor"/><circle cx="12" cy="19" r="1.9" fill="currentColor"/></svg>',
  grade: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/></svg>',
  anterior: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m15 5-7 7 7 7"/></svg>',
  proxima: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="m9 5 7 7-7 7"/></svg>',
};

// ---------------------------------------------------------------- leitura das fichas

// Separa o bloco de dados (entre as linhas "---") do texto da história que vem depois
function separarFicha(texto, arquivo) {
  texto = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = texto.match(/^---[ \t]*\n((?:[\s\S]*?\n)?)---[ \t]*(?:\n([\s\S]*))?$/);
  if (!m) throw new Error(`${arquivo}: a ficha precisa começar com uma linha "---" e ter outra linha "---" fechando os dados.`);
  let dados;
  try {
    dados = YAML.parse(m[1]) || {};
  } catch {
    // Fichas escritas à mão com caracteres que o YAML não aceita (ex.: @usuario): leitura simples
    dados = lerDadosSimples(m[1], arquivo);
  }
  return { dados, corpo: (m[2] || '').trim() };
}

// Formato simples "campo: valor" e listas "- item", usado como reserva
function lerDadosSimples(bloco, arquivo) {
  const dados = {};
  let listaAtual = null;
  bloco.split('\n').forEach((linha, i) => {
    if (linha.trim().startsWith('#')) return;
    const util = linha.replace(/\s+#\s.*$/, '');
    if (!util.trim()) return;
    const item = util.match(/^\s*-\s+(.*)$/);
    if (item) {
      if (!listaAtual) throw new Error(`${arquivo}, linha ${i + 2}: item "- ..." sem um campo de lista acima (ex.: "trajetoria:").`);
      dados[listaAtual].push(tirarAspas(item[1].trim()));
      return;
    }
    const par = util.match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/);
    if (!par) throw new Error(`${arquivo}, linha ${i + 2}: não entendi "${linha.trim()}". Use o formato  campo: valor`);
    const valor = par[2].trim();
    listaAtual = valor === '' ? par[1].toLowerCase() : null;
    dados[par[1].toLowerCase()] = valor === '' ? [] : tirarAspas(valor);
  });
  return dados;
}

const tirarAspas = (v) => (/^(["']).*\1$/.test(v) ? v.slice(1, -1) : v);

// Valores podem vir do painel (números, booleanos, listas de objetos) ou escritos à mão (texto)
const texto = (v) => {
  if (v == null || typeof v === 'object') return v instanceof Date ? v.toISOString().slice(0, 10) : '';
  return String(v).trim();
};
const verdadeiro = (v) => v === true || /^(sim|s|true|yes|1)$/i.test(texto(v));
const falso = (v) => v === false || /^(n[aã]o|n|false|no|0)$/i.test(texto(v));
const lista = (v) => (Array.isArray(v) ? v.filter((x) => x != null && x !== '') : texto(v) ? [texto(v)] : []);
const partes = (item) => String(item).split('|').map((p) => p.trim());

// Itens de lista: objeto (painel) ou "A | B | C" (escrito à mão)
function itens(valor, campos, deTexto) {
  return lista(valor).map((item) => {
    if (typeof item === 'object') return Object.fromEntries(Object.entries(item).map(([k, v]) => [k, texto(v)]));
    return deTexto(partes(item));
  }).filter((obj) => campos.some((c) => obj[c]));
}

// Markdown simples: parágrafos, **negrito**, *itálico*, subtítulos "## "
function textoParaHtml(corpo) {
  if (!corpo) return '';
  return corpo
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      const html = esc(bloco)
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
        .replace(/\n/g, '<br>');
      if (/^##\s/.test(bloco)) return `<h3>${html.replace(/^##\s+/, '')}</h3>`;
      return `<p>${html}</p>`;
    })
    .join('\n');
}

function lerData(valor, arquivo) {
  if (!valor) return null;
  let a, m, d;
  let r = valor.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (r) [, a, m, d] = r;
  else if ((r = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [, d, m, a] = r;
  else {
    aviso(`${arquivo}: data de nascimento "${valor}" não reconhecida. Use DD/MM/AAAA.`);
    return null;
  }
  const dd = String(d).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return { iso: `${a}-${mm}-${dd}`, br: `${dd}/${mm}/${a}`, ano: Number(a), mes: Number(m), dia: Number(d) };
}

function idadeEm(data) {
  if (!data) return null;
  let idade = HOJE.getFullYear() - data.ano;
  const mes = HOJE.getMonth() + 1;
  if (mes < data.mes || (mes === data.mes && HOJE.getDate() < data.dia)) idade--;
  return idade;
}

function formatarData(data, idioma) {
  if (idioma !== 'en') return data.br;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    Date.UTC(data.ano, data.mes - 1, data.dia),
  );
}

function idYoutube(url) {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/))([\w-]{11})/,
  );
  if (m) return m[1];
  return /^[\w-]{11}$/.test(url) ? url : null;
}

function formatarMedida(valor, unidade) {
  if (!valor) return '';
  const v = valor.trim();
  if (unidade === 'm') {
    if (/^\d{3}$/.test(v)) return `${v[0]},${v.slice(1)} m`; // 168 → 1,68 m
    if (/^\d[.,]\d{1,2}$/.test(v)) return `${v.replace('.', ',')} m`;
  }
  if (unidade === 'kg' && /^\d{2,3}([.,]\d)?$/.test(v)) return `${v.replace('.', ',')} kg`;
  return v;
}

const GRUPOS = ['gol', 'defesa', 'meio', 'ataque', 'outros'];
function grupoPosicao(posicao) {
  const s = semAcento(posicao).toLowerCase();
  if (/goleir/.test(s)) return 'gol';
  if (/zagueir|lateral|\bala\b|defens|libero/.test(s)) return 'defesa';
  if (/volante|meia|meio|armador|medio/.test(s)) return 'meio';
  if (/atacante|ponta|centroavante|extrem|avante|camisa 9/.test(s)) return 'ataque';
  return 'outros';
}

const EXT_IMAGEM = /\.(jpe?g|png|webp|avif)$/i;

// Caminho de imagem gravado pelo painel ("/fotos/x.jpg", a partir da raiz) ou relativo à ficha
function caminhoImagem(valor, dir, rotulo) {
  const v = texto(valor);
  if (!v) return null;
  // Nomes enviados pelo GitHub podem ter espaço, acento ou "%" (ex.: "Sem título.jpg")
  let decodificado = v;
  try {
    decodificado = decodeURI(v);
  } catch {
    // "%" solto no nome: usa o texto como está
  }
  const caminho = v.startsWith('/') ? path.join(RAIZ, decodificado) : path.join(dir, decodificado);
  if (existsSync(caminho)) return caminho;
  aviso(`${rotulo}: imagem "${v}" não encontrada.`);
  return null;
}

async function arquivosDeAtletas() {
  if (!existsSync(PASTA_ATLETAS)) return [];
  const encontrados = [];
  for (const e of await readdir(PASTA_ATLETAS, { withFileTypes: true })) {
    if (e.name.startsWith('_') || e.name.startsWith('.')) continue;
    if (e.isFile() && /\.md$/i.test(e.name) && e.name.toLowerCase() !== 'readme.md') {
      encontrados.push({ arquivo: path.join(PASTA_ATLETAS, e.name), nomeBase: e.name.replace(/\.md$/i, ''), dir: PASTA_ATLETAS, rotulo: `atletas/${e.name}` });
    } else if (e.isDirectory() && existsSync(path.join(PASTA_ATLETAS, e.name, 'ficha.md'))) {
      const dir = path.join(PASTA_ATLETAS, e.name);
      encontrados.push({ arquivo: path.join(dir, 'ficha.md'), nomeBase: e.name, dir, rotulo: `atletas/${e.name}/ficha.md`, legado: true });
    }
  }
  return encontrados;
}

async function lerAtletas() {
  const atletas = [];
  const slugs = new Set();
  for (const { arquivo, nomeBase, dir, rotulo, legado } of await arquivosDeAtletas()) {
    const { dados: bruto, corpo } = separarFicha(await readFile(arquivo, 'utf8'), rotulo);
    const dados = Object.fromEntries(Object.entries(bruto).map(([k, v]) => [k.toLowerCase(), v]));
    const t = (k) => texto(dados[k]);

    if (falso(dados.publicar) || verdadeiro(dados.rascunho)) {
      console.log(`  · ${rotulo}: rascunho — fora do site.`);
      continue;
    }
    const nome = t('nome');
    const posicao = t('posicao');
    if (!nome) {
      aviso(`${rotulo}: falta o campo "nome" — atleta ignorado.`);
      continue;
    }
    if (!posicao) aviso(`${rotulo}: falta o campo "posicao".`);

    const slug = slugify(nomeBase);
    if (slug !== nomeBase) aviso(`${rotulo}: o endereço da página será "${slug}".`);
    if (slugs.has(slug)) throw new Error(`Dois atletas geram o mesmo endereço "${slug}". Renomeie um deles.`);
    slugs.add(slug);

    let foto = caminhoImagem(dados.foto, dir, rotulo);
    if (!foto && legado) {
      const arquivos = (await readdir(dir)).filter((a) => EXT_IMAGEM.test(a)).sort();
      const preferida = arquivos.find((a) => /^foto\./i.test(a)) || arquivos[0];
      if (preferida) foto = path.join(dir, preferida);
    }
    const exemplo = verdadeiro(dados.exemplo);
    if (!foto && !exemplo) aviso(`${rotulo}: sem foto — será usada a imagem "Foto em breve".`);
    const galeria = lista(dados.galeria).map((v) => caminhoImagem(v, dir, rotulo)).filter(Boolean);

    const videoPrincipal = t('video');
    const idVideo = idYoutube(videoPrincipal);
    if (videoPrincipal && !idVideo) aviso(`${rotulo}: não reconheci o link do YouTube "${videoPrincipal}".`);
    const videosExtras = itens(dados.videos, ['url'], (p) => (p.length > 1 ? { titulo: p[0], url: p[1] } : { url: p[0] }))
      .map((v) => {
        const id = idYoutube(v.url);
        if (!id) aviso(`${rotulo}: link de vídeo extra não reconhecido "${v.url}".`);
        return id ? { titulo: v.titulo, id } : null;
      })
      .filter(Boolean);

    const nascimento = lerData(t('nascimento'), rotulo);
    const categoria = t('categoria');
    const catSlug = slugify(categoria) || 'outros';
    if (categoria && !['feminino', 'masculino'].includes(catSlug)) aviso(`${rotulo}: categoria "${categoria}" — use Feminino ou Masculino.`);

    atletas.push({
      slug,
      nome,
      nomeCompleto: t('nome_completo'),
      categoria,
      catSlug,
      categoriaIdade: t('categoria_idade'),
      posicao,
      posicaoSecundaria: t('posicao_secundaria'),
      grupo: grupoPosicao(posicao || t('posicao_secundaria')),
      nascimento,
      idade: idadeEm(nascimento),
      naturalidade: t('naturalidade'),
      nacionalidade: t('nacionalidade'),
      passaporte: t('passaporte'),
      altura: formatarMedida(t('altura'), 'm'),
      peso: formatarMedida(t('peso'), 'kg'),
      pe: t('pe_dominante'),
      clubeAtual: t('clube_atual'),
      ultimoClube: t('ultimo_clube'),
      situacao: { pt: t('situacao'), en: t('situacao_en'), es: t('situacao_es') },
      resumo: t('resumo'),
      instagram: t('instagram'),
      video: idVideo ? { id: idVideo } : null,
      videosExtras,
      trajetoria: itens(dados.trajetoria, ['clube', 'periodo'], (p) =>
        p.length >= 2 ? { periodo: p[0], clube: p[1], detalhe: p.slice(2).join(' · ') } : { clube: p[0] },
      ),
      conquistas: itens(dados.conquistas, ['titulo'], (p) =>
        p.length >= 2 && /^\d{4}/.test(p[0]) ? { ano: p[0], titulo: p.slice(1).join(' · ') } : { titulo: p.join(' · ') },
      ),
      estatisticas: itens(dados.estatisticas, ['valor'], (p) => ({ rotulo: p[0], valor: p[1], obs: p[2] })).filter((e) => e.rotulo && e.valor),
      extras: itens(dados.extras, ['valor'], (p) => ({ rotulo: p[0], valor: p.slice(1).join(' · ') })).filter((e) => e.rotulo && e.valor),
      historia: { pt: textoParaHtml(corpo), en: textoParaHtml(t('historia_en')), es: textoParaHtml(t('historia_es')) },
      foto,
      galeria,
      foco: t('foco'),
      ordem: Number(t('ordem')) || 999,
      listar: !falso(dados.listar) && !verdadeiro(dados.so_link),
      exemplo,
    });
  }
  atletas.sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, 'pt-BR'));
  return atletas;
}

// ---------------------------------------------------------------- imagens

const POSICAO_FOCO = { topo: 'north', centro: 'centre', baixo: 'south' };

async function prepararImagens(atleta) {
  const destino = path.join(DIST, 'atletas', atleta.slug);
  await mkdir(destino, { recursive: true });
  const imagens = { card: null, grande: null, og: 'assets/og-gf.jpg', galeria: [] };

  if (!sharp) {
    if (atleta.foto) {
      const nome = 'foto' + path.extname(atleta.foto).toLowerCase();
      await copyFile(atleta.foto, path.join(destino, nome));
      Object.assign(imagens, { card: nome, grande: nome, og: `atletas/${atleta.slug}/${nome}` });
    }
    for (const [i, origem] of atleta.galeria.entries()) {
      const nome = `galeria-${i + 1}${path.extname(origem).toLowerCase()}`;
      await copyFile(origem, path.join(destino, nome));
      imagens.galeria.push({ grande: nome, mini: nome });
    }
    return imagens;
  }

  if (atleta.foto) {
    const position = POSICAO_FOCO[slugify(atleta.foco)] || sharp.strategy.attention;
    const base = () => sharp(atleta.foto).rotate();
    await base().resize(640, 800, { fit: 'cover', position }).webp({ quality: 80 }).toFile(path.join(destino, 'foto-card.webp'));
    await base()
      .resize(1080, 1350, { fit: 'cover', position, withoutEnlargement: true })
      .webp({ quality: 84 })
      .toFile(path.join(destino, 'foto.webp'));
    // Imagem de prévia (WhatsApp, redes): foto à direita, logo G&F à esquerda
    const fotoOg = await base().resize(520, 630, { fit: 'cover', position }).toBuffer();
    await gerarCartaoOg(fotoOg, path.join(destino, 'compartilhar.jpg'));
    Object.assign(imagens, { card: 'foto-card.webp', grande: 'foto.webp', og: `atletas/${atleta.slug}/compartilhar.jpg` });
  }

  for (const [i, origem] of atleta.galeria.entries()) {
    const n = i + 1;
    await sharp(origem).rotate().resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(destino, `galeria-${n}.webp`));
    await sharp(origem).rotate().resize(600, 600, { fit: 'cover', position: sharp.strategy.attention }).webp({ quality: 78 }).toFile(path.join(destino, `galeria-${n}-mini.webp`));
    imagens.galeria.push({ grande: `galeria-${n}.webp`, mini: `galeria-${n}-mini.webp` });
  }
  return imagens;
}

async function gerarCartaoOg(fotoBuffer, saida) {
  const W = 1200;
  const H = 630;
  const fundo = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="brilho" cx="${fotoBuffer ? 28 : 50}%" cy="50%" r="55%">
        <stop offset="0" stop-color="#2a220c"/><stop offset=".55" stop-color="#0d0c09"/><stop offset="1" stop-color="#070707"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#brilho)"/>
  </svg>`);
  const alturaLogo = fotoBuffer ? 300 : 360;
  const logo = await sharp(LOGO).resize({ height: alturaLogo }).png().toBuffer();
  const { width: larguraLogo } = await sharp(logo).metadata();
  const centroX = fotoBuffer ? 340 : W / 2;
  const camadas = [];
  if (fotoBuffer) {
    const fade = Buffer.from(`<svg width="180" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="f" x1="0" x2="1"><stop offset="0" stop-color="#070707"/><stop offset="1" stop-color="#070707" stop-opacity="0"/></linearGradient></defs>
      <rect width="180" height="${H}" fill="url(#f)"/></svg>`);
    const filete = Buffer.from(`<svg width="2" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect width="2" height="${H}" fill="#d3ad38" opacity=".75"/></svg>`);
    camadas.push({ input: fotoBuffer, left: W - 520, top: 0 }, { input: fade, left: W - 520, top: 0 }, { input: filete, left: W - 522, top: 0 });
  }
  camadas.push({ input: logo, left: Math.round(centroX - larguraLogo / 2), top: Math.round((H - alturaLogo) / 2) });
  await sharp(fundo).composite(camadas).jpeg({ quality: 86, mozjpeg: true }).toFile(saida);
}

// ---------------------------------------------------------------- HTML: estrutura comum

function cabecalhoHtml({ idioma, titulo, descricao, caminho, raiz, ogImagem, noindex, tipo = 'website', rel, versoes }) {
  const t = UI[idioma];
  const canonica = config.url ? absoluta(caminho) : '';
  const alternativos =
    config.url && rel !== null
      ? IDIOMAS.map((l) => `<link rel="alternate" hreflang="${UI[l].htmlLang}" href="${esc(absoluta(prefixo(l) + rel))}">`).join('\n') +
        `\n<link rel="alternate" hreflang="x-default" href="${esc(absoluta(rel))}">\n`
      : '';
  const umami = config.umami?.id
    ? `<script defer src="${esc(config.umami.script || 'https://cloud.umami.is/script.js')}" data-website-id="${esc(config.umami.id)}"${
        config.url ? ` data-domains="${esc(config.umami.dominios || new URL(config.url).hostname)}"` : ''
      }></script>\n`
    : '';
  return `<!doctype html>
<html lang="${t.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}${canonica ? `<link rel="canonical" href="${esc(canonica)}">\n` : ''}${alternativos}<meta property="og:type" content="${tipo}">
<meta property="og:site_name" content="${esc(config.nome)}">
<meta property="og:locale" content="${t.ogLocale}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
${canonica ? `<meta property="og:url" content="${esc(canonica)}">\n` : ''}<meta property="og:image" content="${esc(absoluta(ogImagem))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#ffffff">
<link rel="icon" href="${raiz}assets/favicon.ico" sizes="32x32">
<link rel="icon" href="${raiz}assets/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="${raiz}assets/apple-touch-icon.png">
<link rel="preload" href="${raiz}assets/fontes/inter-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${raiz}assets/fontes/cormorant-garamond-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${raiz}styles.css?v=${versoes.css}">
<script defer src="${raiz}app.js?v=${versoes.js}"></script>
${umami}</head>`;
}

// Troca de idioma: leva para a mesma página nos outros idiomas (no perfil, o mesmo atleta)
function seletorIdioma(idioma, raiz, rel) {
  if (rel === null) return '';
  return `<nav class="idiomas" aria-label="${UI[idioma].idioma}">${IDIOMAS.map(
    (l) =>
      `<a href="${`${raiz}${prefixo(l)}${rel}` || './'}" hreflang="${UI[l].htmlLang}" lang="${UI[l].htmlLang}" title="${UI[l].nomeIdioma}"${
        l === idioma ? ' aria-current="page"' : ''
      }>${UI[l].sigla}</a>`,
  ).join('')}</nav>`;
}

// A marca G&F leva sempre à página inicial do portfólio, no mesmo idioma
function topoHtml({ idioma, raiz, textoWhats, rel, atleta }) {
  const t = UI[idioma];
  const inicio = raiz + prefixo(idioma) || './';
  return `<header class="topo" data-topo>
  <div class="container topo__interno">
    <a class="marca" href="${inicio}" title="${esc(t.irInicio)}" aria-label="G&amp;F Assessoria — ${esc(t.irInicio)}">
      <img class="marca__logo" src="${raiz}assets/${LOGO_SITE}" alt="" width="52" height="52">
      <span class="marca__texto"><strong>G&amp;F Assessoria</strong><small>${esc(t.subtituloMarca)}</small></span>
    </a>
    <div class="topo__acoes">
      ${seletorIdioma(idioma, raiz, rel)}
      <a class="botao botao--ouro botao--pequeno" href="${esc(linkWhatsApp(textoWhats))}" target="_blank" rel="noopener" aria-label="${esc(t.falarGF)}"${evento('WhatsApp G&F', atleta, idioma)}>${icone.whatsapp}<span>${esc(t.falarGF)}</span></a>
      <button type="button" class="topo__menu" data-abrir-painel aria-controls="painel-lateral" aria-expanded="false" aria-label="${esc(t.menu)}" title="${esc(t.menu)}">${icone.pontos}</button>
    </div>
  </div>
</header>`;
}

function rodapeHtml({ idioma, raiz, textoWhats, atleta }) {
  const t = UI[idioma];
  return `<footer class="rodape" id="contato">
  <div class="container rodape__interno">
    <div class="rodape__marca">
      <img src="${raiz}assets/${LOGO_SITE}" alt="" width="44" height="44" loading="lazy">
      <span><strong>G&amp;F Assessoria</strong><small>${esc(t.rodapeMarca)}</small></span>
    </div>
    <ul class="rodape__contatos">
      <li><a href="${esc(linkWhatsApp(textoWhats))}" target="_blank" rel="noopener"${evento('WhatsApp G&F', atleta, idioma)}>${icone.whatsapp}<span>${esc(config.whatsapp_exibicao)}</span></a></li>
      <li><a href="mailto:${esc(config.email)}"${evento('E-mail G&F', atleta, idioma)}>${icone.email}<span>${esc(config.email)}</span></a></li>
    </ul>
  </div>
  <div class="container rodape__base">
    <span>© <span data-ano>${HOJE.getFullYear()}</span> G&amp;F Assessoria · <a class="rodape__equipe" href="${raiz}entrar/">${esc(t.areaEquipe)}</a></span>
    <span>${esc(t.avisoRodape)}</span>
  </div>
</footer>
<div class="toast" role="status" aria-live="polite" data-toast></div>`;
}

// Área da equipe: "Fazer login" abre o painel de edição; "Criar conta" manda à G&F um pedido de acesso
// pelo WhatsApp (a conta é liberada pelo administrador, em Admin → Collaborators no painel).
function blocoEquipe(idioma) {
  const t = UI[idioma];
  return `<div class="equipe">
      <a class="botao botao--ouro equipe__botao" href="${esc(config.painel)}">${esc(t.fazerLogin)}</a>
      <button type="button" class="botao botao--contorno equipe__botao" data-criar-conta aria-expanded="false">${esc(t.criarConta)}</button>
      <form class="equipe__form" data-form-conta data-whatsapp="${esc(config.whatsapp)}" data-mensagem="${esc(t.pedidoConta('{nome}', '{email}'))}" hidden>
        <label class="equipe__campo"><span>${esc(t.seuNome)}</span><input type="text" name="nome" required autocomplete="name"></label>
        <label class="equipe__campo"><span>${esc(t.seuEmail)}</span><input type="email" name="email" required autocomplete="email"></label>
        <button type="submit" class="botao botao--ouro equipe__botao">${icone.whatsapp}<span>${esc(t.enviarPedido)}</span></button>
        <p class="equipe__nota">${esc(t.notaConta)}</p>
      </form>
    </div>`;
}

// Painel lateral aberto pelos três pontinhos do topo: atalhos e área da equipe
function painelLateral({ idioma, raiz, textoWhats }) {
  const t = UI[idioma];
  const inicio = raiz + prefixo(idioma) || './';
  return `<div class="painel-fundo" data-painel-fundo hidden></div>
<aside class="painel" id="painel-lateral" data-painel aria-label="${esc(t.menu)}" inert>
  <div class="painel__cabeca">
    <span class="painel__marca"><img src="${raiz}assets/${LOGO_SITE}" alt="" width="40" height="40" loading="lazy"><strong>G&amp;F Assessoria</strong></span>
    <button type="button" class="painel__fechar" data-fechar-painel aria-label="${esc(t.fechar)}">${icone.fechar}</button>
  </div>
  <nav class="painel__nav" aria-label="${esc(t.atalhos)}">
    <a href="${inicio}">${icone.grade}<span>${esc(t.tituloPortfolio)}</span></a>
    <a href="${esc(linkWhatsApp(textoWhats))}" target="_blank" rel="noopener">${icone.whatsapp}<span>${esc(t.falarGF)}</span></a>
    <a href="mailto:${esc(config.email)}" title="${esc(config.email)}">${icone.email}<span>${esc(t.email)}</span></a>
  </nav>
  <section class="painel__equipe">
    <p class="sobretitulo">${esc(t.areaEquipe)}</p>
    <p class="painel__texto">${esc(t.textoEquipe)}</p>
    ${blocoEquipe(idioma)}
  </section>
</aside>`;
}

function pagina({ idioma, titulo, descricao, caminho, raiz, ogImagem = 'assets/og-gf.jpg', noindex = false, tipo, classe = '', textoWhats, rel = '', atleta = null, conteudo, versoes }) {
  const t = UI[idioma];
  const whats = textoWhats || t.whatsGeral;
  return `${cabecalhoHtml({ idioma, titulo, descricao, caminho, raiz, ogImagem, noindex, tipo, rel, versoes })}
<body class="${classe}">
<a class="pular" href="#conteudo">${esc(t.pular)}</a>
${topoHtml({ idioma, raiz, textoWhats: whats, rel, atleta })}
<main id="conteudo">
${conteudo}
</main>
${rodapeHtml({ idioma, raiz, textoWhats: whats, atleta })}
${painelLateral({ idioma, raiz, textoWhats: whats })}
</body>
</html>
`;
}

// ---------------------------------------------------------------- HTML: peças do atleta

function seloCategoria(a, tr) {
  return [tr.categoria(a.catSlug, a.categoria), tr.categoriaIdade(a.categoriaIdade)].filter(Boolean).map(esc).join(' · ');
}

function linhaMeta(a, idioma) {
  const pedacos = [];
  if (a.idade) pedacos.push(`<span data-nascimento="${a.nascimento.iso}">${a.idade} ${UI[idioma].anos}</span>`);
  const clube = a.clubeAtual || a.ultimoClube;
  if (clube) pedacos.push(`<span>${esc(clube)}</span>`);
  return pedacos.join('<span class="ponto" aria-hidden="true">·</span>');
}

// Envio individual do perfil: copia o link ou abre o WhatsApp com mensagem pronta para o clube
function botoesEnvio(a, idioma, comTexto = false) {
  const t = UI[idioma];
  const tr = tradutor(idioma, a.catSlug);
  const url = absoluta(`${prefixo(idioma)}atletas/${a.slug}/`);
  const pos = [tr.posicao(a.posicao), tr.categoriaIdade(a.categoriaIdade)].filter(Boolean).join(', ');
  const rotulo = (r) => (comTexto ? `<span>${esc(r)}</span>` : `<span class="sr-only">${esc(r)}</span>`);
  return `<div class="envio${comTexto ? ' envio--texto' : ''}">
          <button type="button" class="envio__botao" data-copiar-link="${esc(url)}" title="${esc(t.copiarLinkDica)}"${evento('Copiou link', a, idioma)}>${icone.link}${rotulo(t.copiarLink)}</button>
          <a class="envio__botao" href="https://wa.me/?text=${encodeURIComponent(t.envio(a.catSlug, a.nome, pos, url))}" target="_blank" rel="noopener" title="${esc(t.enviarWhatsDica)}"${evento('Enviou perfil pelo WhatsApp', a, idioma)}>${icone.whatsapp}${rotulo(t.enviarWhats)}</a>
        </div>`;
}

function imagemAtleta(a, tamanho, raiz, idioma, extra = '') {
  const t = UI[idioma];
  const arquivo = tamanho === 'card' ? a.imagens.card : a.imagens.grande;
  if (!arquivo) return `<img src="${raiz}assets/sem-foto.svg" alt="${esc(t.fotoEmBreve(a.nome))}" ${extra}>`;
  return `<img src="${raiz}atletas/${a.slug}/${arquivo}" alt="${esc(t.fotoDe(a.nome))}" ${extra}>`;
}

function blocoVideo(video, titulo, a, idioma, principal = false) {
  return `<div class="video${principal ? ' video--principal' : ''}">
    <button type="button" class="video__capa" data-youtube="${video.id}" data-titulo="${esc(titulo)}" aria-label="${esc(`${UI[idioma].reproduzir}: ${titulo}`)}"${evento(principal ? 'Assistiu ao vídeo' : 'Assistiu a vídeo extra', a, idioma)}>
      <img src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
      <span class="video__play">${icone.play}</span>
    </button>
  </div>`;
}

// ---------------------------------------------------------------- páginas

function paginaInicial(atletas, idioma, versoes) {
  const t = UI[idioma];
  const raiz = idioma === 'pt' ? '' : '../';
  const visiveis = atletas.filter((a) => a.listar);
  const categorias = [...new Set(visiveis.map((a) => a.catSlug))].filter((c) => c !== 'outros');
  const grupos = GRUPOS.filter((g) => visiveis.some((a) => a.grupo === g));

  const filtroCategoria =
    categorias.length > 1
      ? `<div class="filtros__grupo" role="group" aria-label="${esc(t.modalidade)}">
          <button type="button" class="pilula" data-filtro-categoria="todas" aria-pressed="true">${esc(t.todos)}</button>
          ${categorias.map((c) => `<button type="button" class="pilula" data-filtro-categoria="${c}" aria-pressed="false">${esc(t.categorias[c])}</button>`).join('\n          ')}
        </div>`
      : '';
  const filtroPosicao =
    grupos.length > 1
      ? `<label class="campo">
          <span class="sr-only">${esc(t.posicao)}</span>
          <select data-filtro-posicao>
            <option value="todas">${esc(t.todasPosicoes)}</option>
            ${grupos.map((g) => `<option value="${g}">${esc(t.grupos[g])}</option>`).join('\n            ')}
          </select>
        </label>`
      : '';

  const cartoes = visiveis
    .map((a, i) => {
      const tr = tradutor(idioma, a.catSlug);
      const posicoes = [tr.posicao(a.posicao), tr.posicao(a.posicaoSecundaria)].filter(Boolean);
      const busca = semAcento(
        [a.nome, a.nomeCompleto, a.posicao, a.posicaoSecundaria, ...posicoes, a.clubeAtual, a.ultimoClube, a.naturalidade].join(' '),
      ).toLowerCase();
      return `<article class="cartao" data-atleta data-categoria="${a.catSlug}" data-posicao="${a.grupo}" data-busca="${esc(busca)}">
        <a class="cartao__link" href="atletas/${a.slug}/">
          <div class="cartao__foto">
            ${imagemAtleta(a, 'card', raiz, idioma, `width="640" height="800" ${i > 3 ? 'loading="lazy"' : ''} decoding="async"`)}
            ${seloCategoria(a, tr) ? `<span class="selo">${seloCategoria(a, tr)}</span>` : ''}
            ${a.exemplo ? `<span class="selo selo--exemplo">${esc(t.perfilExemplo)}</span>` : ''}
            ${a.video ? `<span class="cartao__video" title="${esc(t.temVideo)}">${icone.play}<span class="sr-only">${esc(t.temVideo)}</span></span>` : ''}
          </div>
          <div class="cartao__corpo">
            <p class="cartao__posicao">${esc(posicoes.join(' · '))}</p>
            <h2 class="cartao__nome">${esc(a.nome)}</h2>
            <p class="cartao__meta">${linhaMeta(a, idioma)}</p>
          </div>
        </a>
        <div class="cartao__acoes">
          <a class="cartao__ver" href="atletas/${a.slug}/">${esc(t.verPerfil)} ${icone.seta}</a>
          ${botoesEnvio(a, idioma)}
        </div>
      </article>`;
    })
    .join('\n      ');

  const conteudo = `
<section class="abertura">
  <div class="container">
    <h1 class="abertura__titulo">${esc(t.tituloPortfolio)}</h1>
    <p class="abertura__texto">${esc(t.textoPortfolio)}</p>
  </div>
</section>

<section class="secao secao--lista" id="atletas" aria-label="${esc(t.tituloPortfolio)}">
  <div class="container">
    <div class="filtros">
      ${filtroCategoria}
      ${filtroPosicao}
      <label class="campo campo--busca">
        <span class="sr-only">${esc(t.buscar)}</span>
        <input type="search" placeholder="${esc(t.buscarDica)}" data-filtro-busca autocomplete="off">
      </label>
      <p class="filtros__contador" data-contador data-um="${esc(t.contador(1))}" data-varios="${esc(t.contador(0)).replace(/^0/, '{n}')}" aria-live="polite">${esc(t.contador(visiveis.length))}</p>
    </div>
    <div class="grade-atletas" data-lista-atletas>
      ${cartoes || `<p class="vazio">${esc(t.listaVazia)}</p>`}
    </div>
    <p class="vazio" data-vazio hidden>${esc(t.filtroVazio)}</p>
  </div>
</section>`;

  return pagina({
    idioma,
    titulo: `${t.tituloPortfolio} · ${config.nome}`,
    descricao: t.descricaoSite,
    caminho: prefixo(idioma),
    raiz,
    classe: 'pagina-inicial',
    rel: '',
    conteudo,
    versoes,
  });
}

function paginaAtleta(a, idioma, versoes) {
  const t = UI[idioma];
  const tr = tradutor(idioma, a.catSlug);
  const raiz = idioma === 'pt' ? '../../' : '../../../';
  const caminho = `${prefixo(idioma)}atletas/${a.slug}/`;
  const urlPerfil = absoluta(caminho);
  const primeiroNome = a.nome.split(' ')[0];
  const posicao = tr.posicao(a.posicao);
  const posicaoSecundaria = tr.posicao(a.posicaoSecundaria);
  const posicoes = [posicao, posicaoSecundaria].filter(Boolean).join(' · ');
  const textoWhats = t.whatsAtleta(a.nome, posicao, urlPerfil);
  const whats = linkWhatsApp(textoWhats);
  const clube = a.clubeAtual || a.ultimoClube;
  const rotuloClube = a.clubeAtual ? t.clubeAtual : t.ultimoClube;
  const situacao = a.situacao[idioma] || tr.situacao(a.situacao.pt);
  const altura = tr.medida(a.altura);
  const peso = tr.medida(a.peso);
  const pe = tr.pe(a.pe);
  const categoria = [tr.categoria(a.catSlug, a.categoria), tr.categoriaIdade(a.categoriaIdade)].filter(Boolean).join(' · ');
  const historia = a.historia[idioma] || a.historia.pt;
  const historiaOriginal = !a.historia[idioma] && a.historia.pt && idioma !== 'pt';

  const numeros = [
    a.idade ? [t.idade, `<span data-nascimento="${a.nascimento.iso}" data-formato="curto">${a.idade}</span><small>${esc(t.anos)}</small>`] : null,
    altura ? [t.altura, esc(altura).replace(/ (m)$/, '<small>$1</small>')] : null,
    peso ? [t.peso, esc(peso).replace(/ (kg)$/, '<small>$1</small>')] : null,
    pe ? [t.pe, `<span class="numeros__texto">${esc(pe)}</span>`] : null,
  ].filter(Boolean);

  const ficha = [
    [t.campos.nomeCompleto, a.nomeCompleto],
    [
      t.campos.nascimento,
      a.nascimento
        ? `${esc(formatarData(a.nascimento, idioma))}${a.idade ? ` <span class="suave">(<span data-nascimento="${a.nascimento.iso}">${a.idade} ${esc(t.anos)}</span>)</span>` : ''}`
        : '',
      true,
    ],
    [t.campos.posicao, posicao],
    [t.campos.posicaoSecundaria, posicaoSecundaria],
    [t.pe, pe],
    [t.altura, altura],
    [t.peso, peso],
    [t.campos.categoria, categoria],
    [rotuloClube, clube],
    [t.situacao, situacao],
    [t.campos.naturalidade, a.naturalidade],
    [t.campos.nacionalidade, tr.nacionalidade(a.nacionalidade)],
    [t.campos.passaporte, tr.nacionalidade(a.passaporte)],
    ...a.extras.map((e) => [tr.rotulo(e.rotulo), e.valor]),
  ]
    .filter(([, v]) => v)
    .map(([rotulo, valor, html]) => `<div><dt>${esc(rotulo)}</dt><dd>${html ? valor : esc(valor)}</dd></div>`)
    .join('\n          ');

  const trajetoria = a.trajetoria.length
    ? `<div class="bloco">
          <h3 class="bloco__titulo">${esc(t.trajetoria)}</h3>
          <ol class="linha-tempo">
            ${a.trajetoria
              .map(
                (e) =>
                  `<li>${e.periodo ? `<span class="linha-tempo__periodo">${esc(tr.termos(e.periodo))}</span>` : ''}<strong>${esc(e.clube)}</strong>${
                    e.detalhe ? `<span class="linha-tempo__detalhe">${esc(tr.termos(e.detalhe))}</span>` : ''
                  }</li>`,
              )
              .join('\n            ')}
          </ol>
        </div>`
    : '';

  const conquistas = a.conquistas.length
    ? `<div class="bloco">
          <h3 class="bloco__titulo">${esc(t.conquistas)}</h3>
          <ul class="conquistas">
            ${a.conquistas
              .map((c) => {
                // Sem tradução cadastrada, mantém o título original inteiro (tradução parcial fica estranha)
                const titulo = (idioma !== 'pt' && c[`titulo_${idioma}`]) || c.titulo;
                return `<li>${icone.trofeu}<span>${c.ano ? `<span class="conquistas__ano">${esc(c.ano)}</span>` : ''}${esc(titulo)}</span></li>`;
              })
              .join('\n            ')}
          </ul>
        </div>`
    : '';

  const estatisticas = a.estatisticas.length
    ? `<div class="bloco">
          <h3 class="bloco__titulo">${esc(t.numeros)}</h3>
          <dl class="estatisticas">
            ${a.estatisticas
              .map((e) => `<div><dt>${esc(tr.rotulo(e.rotulo))}${e.obs ? `<small>${esc(tr.termos(e.obs))}</small>` : ''}</dt><dd>${esc(e.valor)}</dd></div>`)
              .join('\n            ')}
          </dl>
        </div>`
    : '';

  const secaoVideo = `
<section class="secao secao--video" id="video" aria-labelledby="titulo-video">
  <div class="container container--estreito">
    <div class="secao__cabeca secao__cabeca--centro">
      <p class="sobretitulo">${esc(t.melhoresLances)}</p>
      <h2 id="titulo-video" class="secao__titulo">${esc(t.emCampo(a.nome))}</h2>
    </div>
    ${
      a.video
        ? `${blocoVideo(a.video, `${t.melhoresLances} — ${a.nome}`, a, idioma, true)}
    <p class="video__rodape"><a class="link-seta" href="https://www.youtube.com/watch?v=${a.video.id}" target="_blank" rel="noopener"${evento('Abriu vídeo no YouTube', a, idioma)}>${esc(t.assistirYoutube)} ${icone.externo}</a></p>`
        : `<div class="video video--vazio"><p>${esc(t.videoEmBreve)}<br>${esc(t.videoSolicite)}</p></div>`
    }
    ${
      a.videosExtras.length
        ? `<div class="videos-extras">
      ${a.videosExtras
        .map((v) => {
          const titulo = v.titulo || t.videoExtra;
          return `<figure>${blocoVideo(v, `${titulo} — ${a.nome}`, a, idioma)}<figcaption>${esc(titulo)}</figcaption></figure>`;
        })
        .join('\n      ')}
    </div>`
        : ''
    }
  </div>
</section>`;

  const secaoGaleria = a.imagens.galeria.length
    ? `
<section class="secao secao--galeria" aria-labelledby="titulo-galeria">
  <div class="container">
    <div class="secao__cabeca">
      <p class="sobretitulo">${esc(t.fotos)}</p>
      <h2 id="titulo-galeria" class="secao__titulo">${esc(t.galeria)}</h2>
    </div>
    <ul class="galeria" data-galeria>
      ${a.imagens.galeria
        .map(
          (g, i) =>
            `<li><button type="button" class="galeria__item" data-foto="${raiz}atletas/${a.slug}/${g.grande}" aria-label="${esc(`${t.ampliar} ${i + 1}`)}"${evento('Abriu foto', a, idioma)}><img src="${raiz}atletas/${a.slug}/${g.mini}" alt="${esc(`${t.fotoDe(a.nome)} (${i + 1})`)}" width="600" height="600" loading="lazy" decoding="async"></button></li>`,
        )
        .join('\n      ')}
    </ul>
  </div>
</section>
<dialog class="visor" data-visor aria-label="${esc(t.galeria)}">
  <img class="visor__imagem" data-visor-imagem alt="">
  <p class="visor__contador" data-visor-contador></p>
  <button type="button" class="visor__botao visor__botao--fechar" data-visor-fechar aria-label="${esc(t.fechar)}">${icone.fechar}</button>
  <button type="button" class="visor__botao visor__botao--anterior" data-visor-anterior aria-label="${esc(t.anterior)}">${icone.anterior}</button>
  <button type="button" class="visor__botao visor__botao--proxima" data-visor-proxima aria-label="${esc(t.proxima)}">${icone.proxima}</button>
</dialog>`
    : '';

  const conteudo = `
${a.exemplo ? `<div class="faixa-exemplo">${esc(t.faixaExemplo)}</div>` : ''}
<div class="so-impressao impressao-topo">
  <img src="${raiz}assets/${LOGO_SITE}" alt="" width="40" height="40">
  <span><strong>G&amp;F Assessoria</strong> · ${esc(t.fichaAtleta)}</span>
  <span>${esc(urlPerfil.replace(/^https?:\/\//, ''))}</span>
</div>
<section class="perfil">
  <div class="container perfil__grade">
    <figure class="perfil__foto">
      ${imagemAtleta(a, 'grande', raiz, idioma, 'width="1080" height="1350" fetchpriority="high"')}
    </figure>
    <div class="perfil__info">
      ${categoria ? `<p class="sobretitulo">${esc(categoria)}</p>` : ''}
      <h1 class="perfil__nome">${esc(a.nome)}</h1>
      ${posicoes ? `<p class="perfil__posicao">${esc(posicoes)}</p>` : ''}
      ${numeros.length ? `<dl class="numeros">${numeros.map(([r, v]) => `<div><dt>${esc(r)}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''}
      ${
        clube || situacao
          ? `<ul class="perfil__status">
        ${clube ? `<li><span>${esc(rotuloClube)}</span><strong>${esc(clube)}</strong></li>` : ''}
        ${situacao ? `<li><span>${esc(t.situacao)}</span><strong>${esc(situacao)}</strong></li>` : ''}
      </ul>`
          : ''
      }
      <div class="perfil__acoes">
        ${a.video ? `<a class="botao botao--ouro" href="#video">${icone.play}<span>${esc(t.assistir)}</span></a>` : ''}
        <a class="botao ${a.video ? 'botao--contorno' : 'botao--ouro'}" href="${esc(whats)}" target="_blank" rel="noopener"${evento('WhatsApp G&F', a, idioma)}>${icone.whatsapp}<span>${esc(t.falarGF)}</span></a>
      </div>
      <div class="perfil__utilidades">
        ${botoesEnvio(a, idioma, true)}
        <button type="button" class="botao-texto" data-imprimir${evento('Baixou PDF', a, idioma)}>${icone.imprimir}<span>${esc(t.baixarPdf)}</span></button>
        ${a.instagram ? `<a class="botao-texto" href="${esc(linkInstagram(a.instagram))}" target="_blank" rel="noopener"${evento('Abriu Instagram', a, idioma)}>${icone.instagram}<span>Instagram</span></a>` : ''}
      </div>
    </div>
  </div>
</section>
${secaoVideo}
${secaoGaleria}

<section class="secao secao--papel" aria-labelledby="titulo-ficha">
  <div class="container detalhes">
    <div class="detalhes__ficha">
      <p class="sobretitulo">${esc(t.dados)}</p>
      <h2 id="titulo-ficha" class="secao__titulo">${esc(t.fichaTecnica)}</h2>
      <dl class="ficha">
          ${ficha}
      </dl>
      ${trajetoria}
    </div>
    <div class="detalhes__historia">
      ${
        historia
          ? `<p class="sobretitulo">${esc(t.historia)}</p>
      <h2 class="secao__titulo">${esc(t.sobre(primeiroNome))}</h2>
      <div class="texto-historia"${historiaOriginal ? ' lang="pt-BR"' : ''}>${historia}</div>
      ${historiaOriginal ? `<p class="nota-idioma">${esc(t.textoOriginal)}</p>` : ''}`
          : ''
      }
      ${estatisticas}
      ${conquistas}
    </div>
  </div>
</section>

<section class="secao contato-atleta" aria-labelledby="titulo-contato-atleta">
  <div class="container contato-atleta__grade">
    <div>
      <p class="sobretitulo">${esc(t.contato)}</p>
      <h2 id="titulo-contato-atleta" class="secao__titulo">${esc(t.interesse(primeiroNome))}</h2>
      <p>${esc(t.textoContato)}</p>
    </div>
    <div class="contato-atleta__acoes">
      <a class="botao botao--ouro" href="${esc(whats)}" target="_blank" rel="noopener"${evento('WhatsApp G&F', a, idioma)}>${icone.whatsapp}<span>WhatsApp ${esc(config.whatsapp_exibicao)}</span></a>
      <a class="botao botao--contorno" href="mailto:${esc(config.email)}?subject=${encodeURIComponent(t.emailAssunto(a.nome))}&amp;body=${encodeURIComponent(t.emailCorpo(a.nome, urlPerfil))}"${evento('E-mail G&F', a, idioma)}>${esc(t.email)}</a>
    </div>
  </div>
</section>

<nav class="barra-fixa${a.video ? '' : ' barra-fixa--unica'}" aria-label="${esc(t.acoesRapidas)}">
  ${a.video ? `<a class="botao botao--contorno" href="#video">${icone.play}<span>${esc(t.video)}</span></a>` : ''}
  <a class="botao botao--ouro" href="${esc(whats)}" target="_blank" rel="noopener"${evento('WhatsApp G&F', a, idioma)}>${icone.whatsapp}<span>${esc(t.falarGF)}</span></a>
</nav>

<div class="so-impressao impressao-rodape">
  ${a.video ? `<p><strong>${esc(t.melhoresLances)}:</strong> https://youtu.be/${a.video.id}</p>` : ''}
  <p><strong>${esc(t.perfilCompleto)}:</strong> ${esc(urlPerfil)}</p>
  <p><strong>G&amp;F Assessoria</strong> · WhatsApp ${esc(config.whatsapp_exibicao)} · ${esc(config.email)} · ${esc(t.intermediario)}</p>
</div>`;

  const descricao =
    (idioma === 'pt' && a.resumo) ||
    [posicoes, a.idade ? `${a.idade} ${t.anos}` : '', clube].filter(Boolean).join(' · ') + '. ' + t.descricaoAtleta;

  return pagina({
    idioma,
    titulo: `${a.nome}${posicao ? ` · ${posicao}` : ''} · ${config.nome}`,
    descricao,
    caminho,
    raiz,
    ogImagem: a.imagens.og,
    noindex: a.exemplo || !a.listar,
    tipo: 'profile',
    classe: 'pagina-atleta',
    textoWhats,
    rel: `atletas/${a.slug}/`,
    atleta: a,
    conteudo,
    versoes,
  });
}

// Área da equipe: um único "Fazer login", que leva ao painel de edição (Pages CMS).
// Quem autoriza cada pessoa é o administrador, dentro do painel (Admin → Collaborators).
function paginaEntrar(versoes) {
  const conteudo = `
<section class="entrar">
  <div class="container container--estreito">
    <div class="entrar__cartao">
      <img class="entrar__logo" src="../assets/${LOGO_SITE}" alt="" width="88" height="88">
      <p class="sobretitulo">Área da equipe</p>
      <h1 class="secao__titulo">Portfólio G&amp;F</h1>
      <p class="entrar__texto">${esc(UI.pt.textoEquipe)}</p>
      ${blocoEquipe('pt')}
    </div>
  </div>
</section>`;
  return pagina({
    idioma: 'pt',
    titulo: `Área da equipe · ${config.nome}`,
    descricao: 'Acesso restrito à equipe da G&F Assessoria.',
    caminho: 'entrar/',
    raiz: '../',
    noindex: true,
    rel: null,
    classe: 'pagina-entrar',
    conteudo,
    versoes,
  });
}

function pagina404(versoes) {
  // Servida em qualquer endereço inexistente: links absolutos a partir da base do site
  const conteudo = `
<section class="secao erro">
  <div class="container container--estreito">
    <p class="sobretitulo">404</p>
    <h1 class="secao__titulo">Página não encontrada</h1>
    <p>O endereço pode ter mudado ou o perfil não está mais disponível.<br><span lang="en">Page not found.</span> · <span lang="es">Página no encontrada.</span></p>
    <a class="botao botao--ouro" href="${BASE}">Ir para o portfólio</a>
  </div>
</section>`;
  return pagina({
    idioma: 'pt',
    titulo: `Página não encontrada · ${config.nome}`,
    descricao: UI.pt.descricaoSite,
    caminho: '404.html',
    raiz: BASE,
    noindex: true,
    rel: null,
    conteudo,
    versoes,
  });
}

// ---------------------------------------------------------------- execução

const inicio = Date.now();
console.log('Gerando o portfólio G&F…');
await rm(DIST, { recursive: true, force: true });
await mkdir(path.join(DIST, 'assets'), { recursive: true });

// Arquivos estáticos
await cp(path.join(SRC, 'assets'), path.join(DIST, 'assets'), { recursive: true });
await rm(path.join(DIST, 'assets', 'logo-gf-original.png'));
const css = await readFile(path.join(SRC, 'styles.css'));
const js = await readFile(path.join(SRC, 'app.js'));
await writeFile(path.join(DIST, 'styles.css'), css);
await writeFile(path.join(DIST, 'app.js'), js);
const versoes = { css: hash(css), js: hash(js) };

// Fontes servidas pelo próprio site (mais rápido e sem enviar dados do visitante ao Google)
await mkdir(path.join(DIST, 'assets', 'fontes'), { recursive: true });
for (const [pacote, nome] of [['inter', 'inter'], ['cormorant-garamond', 'cormorant-garamond']]) {
  for (const estilo of ['normal', 'italic']) {
    const arquivo = `${nome}-latin-wght-${estilo}.woff2`;
    await copyFile(path.join(RAIZ, 'node_modules', '@fontsource-variable', pacote, 'files', arquivo), path.join(DIST, 'assets', 'fontes', arquivo));
  }
}

if (sharp) {
  await sharp(LOGO).resize({ width: 220 }).png({ compressionLevel: 9 }).toFile(path.join(DIST, 'assets', 'logo-gf.png'));
  await sharp(LOGO).resize({ width: 176 }).webp({ quality: 90 }).toFile(path.join(DIST, 'assets', 'logo-gf.webp'));
  await gerarCartaoOg(null, path.join(DIST, 'assets', 'og-gf.jpg'));
} else {
  await copyFile(LOGO, path.join(DIST, 'assets', 'logo-gf.png'));
  await copyFile(LOGO, path.join(DIST, 'assets', 'og-gf.jpg'));
}

const atletas = await lerAtletas();
for (const atleta of atletas) {
  atleta.imagens = await prepararImagens(atleta);
  for (const idioma of IDIOMAS) {
    const pasta = path.join(DIST, prefixo(idioma), 'atletas', atleta.slug);
    await mkdir(pasta, { recursive: true });
    await writeFile(path.join(pasta, 'index.html'), paginaAtleta(atleta, idioma, versoes));
  }
  const notas = [atleta.exemplo && 'exemplo', !atleta.listar && 'só por link', atleta.galeria.length && `${atleta.galeria.length} foto(s) na galeria`].filter(Boolean);
  console.log(`  ✓ ${atleta.nome}${notas.length ? ` (${notas.join(', ')})` : ''} → atletas/${atleta.slug}/`);
}

for (const idioma of IDIOMAS) {
  await mkdir(path.join(DIST, prefixo(idioma)), { recursive: true });
  await writeFile(path.join(DIST, prefixo(idioma), 'index.html'), paginaInicial(atletas, idioma, versoes));
}
await writeFile(path.join(DIST, '404.html'), pagina404(versoes));
await mkdir(path.join(DIST, 'entrar'), { recursive: true });
await writeFile(path.join(DIST, 'entrar', 'index.html'), paginaEntrar(versoes));
await writeFile(path.join(DIST, '.nojekyll'), '');

if (config.url) {
  const publicos = atletas.filter((a) => a.listar && !a.exemplo);
  const urls = IDIOMAS.flatMap((l) => [prefixo(l), ...publicos.map((a) => `${prefixo(l)}atletas/${a.slug}/`)]);
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${esc(absoluta(u))}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  await writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${absoluta('sitemap.xml')}\n`);
}

console.log(`Pronto: ${atletas.length} atleta(s) em ${IDIOMAS.length} idiomas, ${((Date.now() - inicio) / 1000).toFixed(1)}s → dist/`);
if (avisos.length) console.log(`${avisos.length} aviso(s) acima — confira.`);
