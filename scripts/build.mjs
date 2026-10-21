// Gera o site estático em dist/ a partir de site.config.json e das fichas em atletas/<pasta>/ficha.md.
// Uso: npm run build
import { readFile, writeFile, mkdir, readdir, rm, cp, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

const linkWhatsApp = (texto) => `https://wa.me/${config.whatsapp}?text=${encodeURIComponent(texto)}`;
const linkInstagram = (usuario) =>
  /^https?:\/\//.test(usuario) ? usuario : `https://instagram.com/${usuario.replace(/^@/, '')}`;

// Ícones em linha (stroke = currentColor)
const icone = {
  whatsapp:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-8.66 15l-1.3 4.75 4.86-1.27A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-2.88.75.77-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.14c-.25-.12-1.46-.72-1.69-.8-.23-.08-.39-.12-.56.12-.16.25-.64.8-.78.97-.14.16-.29.18-.53.06-.25-.12-1.04-.38-1.98-1.22-.73-.65-1.23-1.46-1.37-1.7-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.13-.56-1.34-.76-1.84-.2-.48-.4-.41-.56-.42h-.47a.9.9 0 0 0-.66.31c-.23.25-.86.84-.86 2.05 0 1.2.88 2.37 1 2.53.12.17 1.73 2.64 4.2 3.7.58.25 1.04.4 1.4.52.59.19 1.12.16 1.54.1.47-.07 1.46-.6 1.66-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.16-.47-.29Z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11.2-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z"/></svg>',
  externo:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
  compartilhar:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/></svg>',
  imprimir:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M7 9V3h10v6M7 18H5a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M7 14h10v7H7z"/></svg>',
  trofeu:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>',
  voltar:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  seta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/></svg>',
};

// ---------------------------------------------------------------- leitura das fichas

// Lê o bloco de dados entre "---" (campo: valor, listas com "- item") e o texto da história abaixo dele.
function lerFicha(texto, arquivo) {
  texto = texto.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const m = texto.match(/^---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n([\s\S]*))?$/);
  if (!m) throw new Error(`${arquivo}: a ficha precisa começar com uma linha "---" e ter outra linha "---" fechando os dados.`);
  const dados = {};
  let listaAtual = null;
  m[1].split('\n').forEach((linha, i) => {
    if (linha.trim().startsWith('#')) return;
    const util = linha.replace(/\s+#\s.*$/, '');
    if (!util.trim()) return;
    const item = util.match(/^\s*-\s+(.*)$/);
    if (item) {
      if (!listaAtual) {
        throw new Error(`${arquivo}, linha ${i + 2}: item "- ..." sem um campo de lista acima (ex.: "trajetoria:").`);
      }
      dados[listaAtual].push(tirarAspas(item[1].trim()));
      return;
    }
    const par = util.match(/^([A-Za-z_][\w]*)\s*:\s*(.*)$/);
    if (!par) throw new Error(`${arquivo}, linha ${i + 2}: não entendi "${linha.trim()}". Use o formato  campo: valor`);
    const chave = par[1].toLowerCase();
    const valor = par[2].trim();
    if (valor === '') {
      dados[chave] = [];
      listaAtual = chave;
    } else {
      dados[chave] = tirarAspas(valor);
      listaAtual = null;
    }
  });
  return { dados, corpo: (m[2] || '').trim() };
}

function tirarAspas(v) {
  return /^(["']).*\1$/.test(v) ? v.slice(1, -1) : v;
}

// Markdown simples: parágrafos, **negrito**, *itálico*, subtítulos "## "
function textoParaHtml(corpo) {
  if (!corpo) return '';
  return corpo
    .split(/\n\s*\n/)
    .map((bloco) => bloco.trim())
    .filter(Boolean)
    .map((bloco) => {
      let html = esc(bloco)
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
  let r = valor.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (r) [, a, m, d] = r;
  else if ((r = valor.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) [, d, m, a] = r;
  else {
    aviso(`${arquivo}: data de nascimento "${valor}" não reconhecida. Use DD/MM/AAAA.`);
    return null;
  }
  const iso = `${a}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  return { iso, br: `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${a}`, ano: Number(a), mes: Number(m), dia: Number(d) };
}

function idadeEm(data) {
  if (!data) return null;
  let idade = HOJE.getFullYear() - data.ano;
  const mes = HOJE.getMonth() + 1;
  if (mes < data.mes || (mes === data.mes && HOJE.getDate() < data.dia)) idade--;
  return idade;
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

const GRUPOS = { gol: 'Gol', defesa: 'Defesa', meio: 'Meio-campo', ataque: 'Ataque', outros: 'Outras' };
function grupoPosicao(posicao) {
  const s = semAcento(posicao).toLowerCase();
  if (/goleir/.test(s)) return 'gol';
  if (/zagueir|lateral|\bala\b|defens|libero/.test(s)) return 'defesa';
  if (/volante|meia|meio|armador|medio/.test(s)) return 'meio';
  if (/atacante|ponta|centroavante|extrem|avante|camisa 9/.test(s)) return 'ataque';
  return 'outros';
}

// "A | B | C" → ['A','B','C']
const partes = (item) => item.split('|').map((p) => p.trim());

const EXT_IMAGEM = /\.(jpe?g|png|webp|avif)$/i;

async function lerAtletas() {
  if (!existsSync(PASTA_ATLETAS)) return [];
  const pastas = (await readdir(PASTA_ATLETAS, { withFileTypes: true }))
    .filter((p) => p.isDirectory() && !p.name.startsWith('_') && !p.name.startsWith('.'))
    .map((p) => p.name);

  const atletas = [];
  const slugs = new Set();
  for (const pasta of pastas) {
    const dir = path.join(PASTA_ATLETAS, pasta);
    const arquivoFicha = path.join(dir, 'ficha.md');
    const rotulo = `atletas/${pasta}/ficha.md`;
    if (!existsSync(arquivoFicha)) {
      aviso(`atletas/${pasta}: pasta sem ficha.md — ignorada.`);
      continue;
    }
    const { dados, corpo } = lerFicha(await readFile(arquivoFicha, 'utf8'), rotulo);
    const t = (k) => (Array.isArray(dados[k]) ? '' : String(dados[k] ?? '').trim());
    const lista = (k) => (Array.isArray(dados[k]) ? dados[k].filter(Boolean) : t(k) ? [t(k)] : []);
    const sim = (k) => /^(sim|s|true|yes|1)$/i.test(t(k));
    const nao = (k) => /^(n[aã]o|n|false|no|0)$/i.test(t(k));

    if (nao('publicar')) {
      console.log(`  · ${pasta}: publicar: não — fora do site.`);
      continue;
    }
    const nome = t('nome');
    const posicao = t('posicao');
    if (!nome) {
      aviso(`${rotulo}: falta o campo "nome" — atleta ignorado.`);
      continue;
    }
    if (!posicao) aviso(`${rotulo}: falta o campo "posicao".`);

    const slug = slugify(pasta);
    if (slug !== pasta) aviso(`atletas/${pasta}: o endereço da página será "${slug}" (use só letras minúsculas, números e hífens no nome da pasta).`);
    if (slugs.has(slug)) throw new Error(`Duas pastas geram o mesmo endereço "${slug}". Renomeie uma delas.`);
    slugs.add(slug);

    let foto = t('foto') ? path.join(dir, t('foto')) : null;
    if (foto && !existsSync(foto)) {
      aviso(`${rotulo}: foto "${t('foto')}" não encontrada na pasta.`);
      foto = null;
    }
    if (!foto) {
      const arquivos = (await readdir(dir)).filter((a) => EXT_IMAGEM.test(a)).sort();
      const preferida = arquivos.find((a) => /^foto\./i.test(a)) || arquivos[0];
      if (preferida) foto = path.join(dir, preferida);
    }
    if (!foto && !sim('exemplo')) aviso(`${rotulo}: sem foto — será usada a imagem "Foto em breve".`);

    const videoPrincipal = t('video');
    const idVideo = idYoutube(videoPrincipal);
    if (videoPrincipal && !idVideo) aviso(`${rotulo}: não reconheci o link do YouTube "${videoPrincipal}".`);
    const videosExtras = lista('videos')
      .map((item) => {
        const p = partes(item);
        const url = p.length > 1 ? p[1] : p[0];
        const id = idYoutube(url);
        if (!id) aviso(`${rotulo}: link de vídeo extra não reconhecido "${item}".`);
        return id ? { titulo: p.length > 1 ? p[0] : 'Vídeo', id, url } : null;
      })
      .filter(Boolean);

    const nascimento = lerData(t('nascimento'), rotulo);
    const categoria = t('categoria');
    const catSlug = slugify(categoria) || 'outros';
    if (categoria && !['feminino', 'masculino'].includes(catSlug)) {
      aviso(`${rotulo}: categoria "${categoria}" — use Feminino ou Masculino.`);
    }

    atletas.push({
      slug,
      pasta,
      dir,
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
      situacao: t('situacao'),
      resumo: t('resumo'),
      instagram: t('instagram'),
      video: idVideo ? { id: idVideo, url: videoPrincipal } : null,
      videosExtras,
      trajetoria: lista('trajetoria').map(partes),
      conquistas: lista('conquistas').map(partes),
      estatisticas: lista('estatisticas').map(partes).filter((p) => p.length >= 2),
      extras: lista('extras').map(partes).filter((p) => p.length >= 2),
      historia: textoParaHtml(corpo),
      foto,
      foco: t('foco'),
      ordem: Number(t('ordem')) || 999,
      listar: !nao('listar'),
      exemplo: sim('exemplo'),
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
  if (!atleta.foto) {
    return { card: null, grande: null, og: 'assets/og-gf.jpg' };
  }
  if (!sharp) {
    const nome = 'foto' + path.extname(atleta.foto).toLowerCase();
    await copyFile(atleta.foto, path.join(destino, nome));
    return { card: nome, grande: nome, og: `atletas/${atleta.slug}/${nome}` };
  }
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
  return { card: 'foto-card.webp', grande: 'foto.webp', og: `atletas/${atleta.slug}/compartilhar.jpg` };
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

// ---------------------------------------------------------------- HTML

function cabecalhoHtml({ titulo, descricao, caminho, raiz, ogImagem, noindex, tipo = 'website', versoes }) {
  const canonica = config.url ? absoluta(caminho) : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descricao)}">
${noindex ? '<meta name="robots" content="noindex, nofollow">\n' : ''}${canonica ? `<link rel="canonical" href="${esc(canonica)}">\n` : ''}<meta property="og:type" content="${tipo}">
<meta property="og:site_name" content="${esc(config.nome)}">
<meta property="og:locale" content="pt_BR">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descricao)}">
${canonica ? `<meta property="og:url" content="${esc(canonica)}">\n` : ''}<meta property="og:image" content="${esc(absoluta(ogImagem))}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#070707">
<link rel="icon" href="${raiz}assets/favicon.ico" sizes="32x32">
<link rel="icon" href="${raiz}assets/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="${raiz}assets/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Inter:wght@400;500;600;700;800&display=swap">
<link rel="stylesheet" href="${raiz}styles.css?v=${versoes.css}">
<script defer src="${raiz}app.js?v=${versoes.js}"></script>
</head>`;
}

function topoHtml(raiz, textoWhats) {
  return `<header class="topo" data-topo>
  <div class="container topo__interno">
    <a class="marca" href="${raiz}" aria-label="${esc(config.nome)} — início do portfólio">
      <img class="marca__logo" src="${raiz}assets/logo-gf.png" alt="" width="52" height="52">
      <span class="marca__texto"><strong>G&amp;F Assessoria</strong><small>Portfólio de atletas</small></span>
    </a>
    <nav class="topo__nav" aria-label="Principal">
      <a href="${raiz}#atletas">Atletas</a>
      <a href="${raiz}#para-clubes">Para clubes</a>
      <a href="${raiz}#a-gf">A G&amp;F</a>
      <a href="#contato">Contato</a>
    </nav>
    <a class="botao botao--ouro botao--pequeno" href="${esc(linkWhatsApp(textoWhats))}" target="_blank" rel="noopener">${icone.whatsapp}<span>WhatsApp</span></a>
  </div>
</header>`;
}

function rodapeHtml(raiz) {
  const whatsGeral = linkWhatsApp('Olá, G&F! Vi o portfólio de atletas e gostaria de mais informações.');
  return `<footer class="rodape" id="contato">
  <div class="container rodape__grade">
    <div class="rodape__marca">
      <img src="${raiz}assets/logo-gf.png" alt="G&amp;F Assessoria" width="76" height="76" loading="lazy">
      <p class="rodape__frase">O talento abre portas.<br><em>A gestão correta sustenta a trajetória.</em></p>
    </div>
    <div>
      <h2 class="rodape__titulo">Contato para clubes</h2>
      <ul class="rodape__lista">
        <li><a href="${esc(whatsGeral)}" target="_blank" rel="noopener"><span>WhatsApp comercial</span>${esc(config.whatsapp_exibicao)}</a></li>
        <li><a href="tel:${esc(config.telefone)}"><span>Telefone</span>${esc(config.telefone_exibicao)}</a></li>
        <li><a href="mailto:${esc(config.email)}"><span>E-mail</span>${esc(config.email)}</a></li>
      </ul>
    </div>
    <div>
      <h2 class="rodape__titulo">G&amp;F Assessoria</h2>
      <ul class="rodape__lista">
        <li><a href="${esc(linkInstagram(config.instagram))}" target="_blank" rel="noopener"><span>Instagram</span>@${esc(config.instagram)}</a></li>
        <li><a href="${esc(config.site_institucional)}" target="_blank" rel="noopener"><span>Site institucional</span>${esc(config.site_institucional.replace(/^https?:\/\//, ''))}</a></li>
        <li><a href="${esc(config.politica_privacidade)}" target="_blank" rel="noopener"><span>Privacidade</span>Política de privacidade</a></li>
      </ul>
    </div>
  </div>
  <div class="container rodape__base">
    <span>© <span data-ano>${HOJE.getFullYear()}</span> G&amp;F Assessoria · Gestão de atletas · Intermediário registrado na CBF</span>
    <span>${esc(config.aviso_rodape || '')}</span>
  </div>
</footer>
<div class="toast" role="status" aria-live="polite" data-toast></div>`;
}

function pagina({ titulo, descricao, caminho, raiz, ogImagem = 'assets/og-gf.jpg', noindex = false, tipo, classe = '', textoWhats, conteudo, versoes }) {
  return `${cabecalhoHtml({ titulo, descricao, caminho, raiz, ogImagem, noindex, tipo, versoes })}
<body class="${classe}">
<a class="pular" href="#conteudo">Pular para o conteúdo</a>
${topoHtml(raiz, textoWhats || 'Olá, G&F! Vi o portfólio de atletas e gostaria de mais informações.')}
<main id="conteudo">
${conteudo}
</main>
${rodapeHtml(raiz)}
</body>
</html>
`;
}

function linhaMeta(atleta) {
  const pedacos = [];
  if (atleta.idade) pedacos.push(`<span data-nascimento="${atleta.nascimento.iso}">${atleta.idade} anos</span>`);
  const clube = atleta.clubeAtual || atleta.ultimoClube;
  if (clube) pedacos.push(`<span>${esc(clube)}</span>`);
  return pedacos.join('<span class="ponto" aria-hidden="true">·</span>');
}

function seloCategoria(atleta) {
  return [atleta.categoria, atleta.categoriaIdade].filter(Boolean).map(esc).join(' · ');
}

function imagemAtleta(atleta, imagens, tamanho, raiz, extra = '') {
  const alt = `Foto de ${atleta.nome}`;
  const arquivo = tamanho === 'card' ? imagens.card : imagens.grande;
  if (!arquivo) return `<img src="${raiz}assets/sem-foto.svg" alt="${esc(atleta.nome)} — foto em breve" ${extra}>`;
  const prefixo = raiz + `atletas/${atleta.slug}/`;
  return `<img src="${prefixo}${arquivo}" alt="${esc(alt)}" ${extra}>`;
}

function paginaInicial(atletas, versoes) {
  const raiz = '';
  const visiveis = atletas.filter((a) => a.listar);
  const categorias = [...new Set(visiveis.map((a) => a.catSlug))].filter((c) => c !== 'outros');
  const grupos = Object.keys(GRUPOS).filter((g) => visiveis.some((a) => a.grupo === g));

  const filtroCategoria =
    categorias.length > 1
      ? `<div class="filtros__grupo" role="group" aria-label="Modalidade">
          <button type="button" class="pilula" data-filtro-categoria="todas" aria-pressed="true">Todos</button>
          ${categorias
            .map((c) => `<button type="button" class="pilula" data-filtro-categoria="${c}" aria-pressed="false">${c === 'feminino' ? 'Feminino' : 'Masculino'}</button>`)
            .join('\n          ')}
        </div>`
      : '';
  const filtroPosicao =
    grupos.length > 1
      ? `<label class="campo">
          <span class="sr-only">Posição</span>
          <select data-filtro-posicao>
            <option value="todas">Todas as posições</option>
            ${grupos.map((g) => `<option value="${g}">${GRUPOS[g]}</option>`).join('\n            ')}
          </select>
        </label>`
      : '';

  const cartoes = visiveis
    .map((a, i) => {
      const imagens = a.imagens;
      const busca = semAcento(`${a.nome} ${a.nomeCompleto} ${a.posicao} ${a.posicaoSecundaria} ${a.clubeAtual} ${a.ultimoClube} ${a.naturalidade}`).toLowerCase();
      return `<article class="cartao" data-atleta data-categoria="${a.catSlug}" data-posicao="${a.grupo}" data-busca="${esc(busca)}">
        <a class="cartao__link" href="atletas/${a.slug}/">
          <div class="cartao__foto">
            ${imagemAtleta(a, imagens, 'card', raiz, `width="640" height="800" ${i > 3 ? 'loading="lazy"' : ''} decoding="async"`)}
            ${seloCategoria(a) ? `<span class="selo">${seloCategoria(a)}</span>` : ''}
            ${a.exemplo ? '<span class="selo selo--exemplo">Perfil de exemplo</span>' : ''}
            ${a.video ? `<span class="cartao__video" title="Tem vídeo de melhores lances">${icone.play}<span class="sr-only">Com vídeo</span></span>` : ''}
          </div>
          <div class="cartao__corpo">
            <p class="cartao__posicao">${esc([a.posicao, a.posicaoSecundaria].filter(Boolean).join(' · '))}</p>
            <h3 class="cartao__nome">${esc(a.nome)}</h3>
            <p class="cartao__meta">${linhaMeta(a)}</p>
            <span class="cartao__ver">Ver perfil ${icone.seta}</span>
          </div>
        </a>
      </article>`;
    })
    .join('\n      ');

  const fundadores = (config.fundadores || [])
    .map((f) => `<li><strong>${esc(f.nome)}</strong><span>${esc(f.funcao)}</span></li>`)
    .join('');

  const whats = linkWhatsApp('Olá, G&F! Vi o portfólio de atletas e gostaria de mais informações.');
  const conteudo = `
<section class="hero">
  <div class="container hero__grade">
    <div class="hero__texto">
      <p class="sobretitulo">G&amp;F Assessoria · ${esc(config.titulo)}</p>
      <h1 class="hero__titulo">Talento precisa de oportunidade. <em>Carreira precisa de direção.</em></h1>
      <p class="hero__lead">Atletas do futebol feminino e masculino, da base ao profissional. Em cada perfil, o vídeo com os melhores lances, a ficha técnica e a trajetória, organizados para a avaliação do seu clube.</p>
      <div class="hero__acoes">
        <a class="botao botao--ouro" href="#atletas">Conhecer os atletas ${icone.seta}</a>
        <a class="botao botao--contorno" href="${esc(whats)}" target="_blank" rel="noopener">${icone.whatsapp}<span>Falar com a G&amp;F</span></a>
      </div>
    </div>
    <div class="hero__simbolo" aria-hidden="true">
      <img src="assets/logo-gf.png" alt="" width="420" height="420">
    </div>
  </div>
  <div class="container">
    <dl class="hero__numeros">
      <div><dt>Atletas no portfólio</dt><dd>${visiveis.length}</dd></div>
      <div><dt>Modalidades</dt><dd>Feminino e masculino</dd></div>
      <div><dt>Da base</dt><dd>ao profissional</dd></div>
      <div><dt>Intermediação</dt><dd>Registrada na CBF</dd></div>
    </dl>
  </div>
</section>

<section class="secao" id="atletas" aria-labelledby="titulo-atletas">
  <div class="container">
    <div class="secao__cabeca">
      <div>
        <p class="sobretitulo">Portfólio</p>
        <h2 id="titulo-atletas" class="secao__titulo">Atletas</h2>
      </div>
      <p class="secao__intro">Selecione um atleta para ver o vídeo com os melhores lances, os dados técnicos e a história completa.</p>
    </div>
    <div class="filtros">
      ${filtroCategoria}
      ${filtroPosicao}
      <label class="campo campo--busca">
        <span class="sr-only">Buscar</span>
        <input type="search" placeholder="Buscar por nome, posição ou clube" data-filtro-busca autocomplete="off">
      </label>
      <p class="filtros__contador" data-contador aria-live="polite">${visiveis.length === 1 ? '1 atleta' : `${visiveis.length} atletas`}</p>
    </div>
    <div class="grade-atletas" data-lista-atletas>
      ${cartoes || '<p class="vazio">Os perfis estão sendo atualizados. Fale com a G&amp;F para conhecer os atletas disponíveis.</p>'}
    </div>
    <p class="vazio" data-vazio hidden>Nenhum atleta encontrado com esses filtros.</p>
  </div>
</section>

<section class="secao secao--papel" id="para-clubes" aria-labelledby="titulo-clubes">
  <div class="container">
    <div class="secao__cabeca">
      <div>
        <p class="sobretitulo">Para clubes</p>
        <h2 id="titulo-clubes" class="secao__titulo">Avaliação com informação organizada</h2>
      </div>
      <p class="secao__intro">Cada perfil é mantido pela equipe da G&amp;F. Quando um atleta despertar interesse, conduzimos o contato com transparência e responsabilidade.</p>
    </div>
    <ol class="passos">
      <li><span class="passos__num">01</span><h3>Assista e avalie</h3><p>Vídeo com os melhores lances, ficha técnica, trajetória e conquistas em um só lugar, acessível do celular ou do computador.</p></li>
      <li><span class="passos__num">02</span><h3>Solicite mais material</h3><p>Jogos completos, documentação e informações contratuais são enviados diretamente pela G&amp;F aos clubes interessados.</p></li>
      <li><span class="passos__num">03</span><h3>Negocie com segurança</h3><p>Intermediação conduzida por intermediário registrado na CBF, com acompanhamento jurídico e participação da família.</p></li>
    </ol>
    <div class="faixa-contato">
      <p>Interessou-se por algum perfil?<br><strong>Fale diretamente com a G&amp;F.</strong></p>
      <a class="botao botao--escuro" href="${esc(whats)}" target="_blank" rel="noopener">${icone.whatsapp}<span>${esc(config.whatsapp_exibicao)}</span></a>
    </div>
  </div>
</section>

<section class="secao" id="a-gf" aria-labelledby="titulo-gf">
  <div class="container sobre">
    <figure class="sobre__foto">
      <img src="assets/fundadores.webp" alt="Júlia Ferreira de Faria e Guilherme Martins Ribeiro Hesse, fundadores da G&amp;F Assessoria" width="1024" height="1280" loading="lazy">
    </figure>
    <div class="sobre__texto">
      <p class="sobretitulo">A G&amp;F</p>
      <h2 id="titulo-gf" class="secao__titulo">Gestão de carreira com seriedade, proximidade e estratégia</h2>
      <p>A G&amp;F Assessoria nasceu para cuidar de sonhos que também pertencem às famílias. Acompanhamos atletas em formação e profissionais com planejamento de carreira, organização documental, imagem profissional e suporte jurídico, sempre com ética e transparência.</p>
      <ul class="fundadores">${fundadores}</ul>
      <a class="link-seta" href="${esc(config.site_institucional)}" target="_blank" rel="noopener">Conheça a G&amp;F ${icone.externo}</a>
    </div>
  </div>
</section>`;

  return pagina({
    titulo: `${config.titulo} · ${config.nome}`,
    descricao: config.descricao,
    caminho: '',
    raiz,
    classe: 'pagina-inicial',
    conteudo,
    versoes,
  });
}

function blocoVideo(video, titulo, principal = false) {
  return `<div class="video${principal ? ' video--principal' : ''}">
    <button type="button" class="video__capa" data-youtube="${video.id}" data-titulo="${esc(titulo)}" aria-label="Reproduzir vídeo: ${esc(titulo)}">
      <img src="https://i.ytimg.com/vi/${video.id}/hqdefault.jpg" alt="" loading="lazy" width="480" height="360">
      <span class="video__play">${icone.play}</span>
    </button>
  </div>`;
}

function paginaAtleta(a, versoes) {
  const raiz = '../../';
  const imagens = a.imagens;
  const urlPerfil = absoluta(`atletas/${a.slug}/`);
  const primeiroNome = a.nome.split(' ')[0];
  const posicoes = [a.posicao, a.posicaoSecundaria].filter(Boolean).join(' · ');
  const textoWhats = `Olá, G&F! Vi o perfil de ${a.nome}${a.posicao ? ` (${a.posicao})` : ''} no portfólio de atletas e gostaria de mais informações.\n${urlPerfil}`;
  const whats = linkWhatsApp(textoWhats);
  const clube = a.clubeAtual || a.ultimoClube;
  const rotuloClube = a.clubeAtual ? 'Clube atual' : 'Último clube';

  const numeros = [
    a.idade ? ['Idade', `<span data-nascimento="${a.nascimento.iso}" data-formato="curto">${a.idade}</span><small>anos</small>`] : null,
    a.altura ? ['Altura', esc(a.altura).replace(/ (m)$/, '<small>$1</small>')] : null,
    a.peso ? ['Peso', esc(a.peso).replace(/ (kg)$/, '<small>$1</small>')] : null,
    a.pe ? ['Pé dominante', `<span class="numeros__texto">${esc(a.pe)}</span>`] : null,
  ].filter(Boolean);

  const ficha = [
    ['Nome completo', a.nomeCompleto],
    ['Data de nascimento', a.nascimento ? `${a.nascimento.br}${a.idade ? ` <span class="suave">(<span data-nascimento="${a.nascimento.iso}">${a.idade} anos</span>)</span>` : ''}` : '', true],
    ['Posição', a.posicao],
    ['Posição secundária', a.posicaoSecundaria],
    ['Pé dominante', a.pe],
    ['Altura', a.altura],
    ['Peso', a.peso],
    ['Categoria', [a.categoria, a.categoriaIdade].filter(Boolean).join(' · ')],
    [rotuloClube, clube],
    ['Situação', a.situacao],
    ['Naturalidade', a.naturalidade],
    ['Nacionalidade', a.nacionalidade],
    ['Passaporte', a.passaporte],
    ...a.extras.map((p) => [p[0], p.slice(1).join(' · ')]),
  ]
    .filter(([, v]) => v)
    .map(([rotulo, valor, html]) => `<div><dt>${esc(rotulo)}</dt><dd>${html ? valor : esc(valor)}</dd></div>`)
    .join('\n          ');

  const trajetoria = a.trajetoria.length
    ? `<div class="bloco">
          <h3 class="bloco__titulo">Trajetória</h3>
          <ol class="linha-tempo">
            ${a.trajetoria
              .map((p) => {
                const [periodo, clubeT, detalhe] = p.length >= 2 ? p : ['', p[0]];
                return `<li>${periodo ? `<span class="linha-tempo__periodo">${esc(periodo)}</span>` : ''}<strong>${esc(clubeT)}</strong>${detalhe ? `<span class="linha-tempo__detalhe">${esc(p.slice(2).join(' · '))}</span>` : ''}</li>`;
              })
              .join('\n            ')}
          </ol>
        </div>`
    : '';

  const conquistas = a.conquistas.length
    ? `<div class="bloco">
          <h3 class="bloco__titulo">Conquistas e destaques</h3>
          <ul class="conquistas">
            ${a.conquistas
              .map((p) => {
                const temAno = p.length >= 2 && /^\d{4}/.test(p[0]);
                const ano = temAno ? p[0] : '';
                const texto = temAno ? p.slice(1).join(' · ') : p.join(' · ');
                return `<li>${icone.trofeu}<span>${ano ? `<span class="conquistas__ano">${esc(ano)}</span>` : ''}${esc(texto)}</span></li>`;
              })
              .join('\n            ')}
          </ul>
        </div>`
    : '';

  const estatisticas = a.estatisticas.length
    ? `<div class="bloco">
          <h3 class="bloco__titulo">Números</h3>
          <dl class="estatisticas">
            ${a.estatisticas.map((p) => `<div><dt>${esc(p[0])}${p[2] ? `<small>${esc(p[2])}</small>` : ''}</dt><dd>${esc(p[1])}</dd></div>`).join('\n            ')}
          </dl>
        </div>`
    : '';

  const secaoVideo = `
<section class="secao secao--video" id="video" aria-labelledby="titulo-video">
  <div class="container container--estreito">
    <div class="secao__cabeca secao__cabeca--centro">
      <p class="sobretitulo">Melhores lances</p>
      <h2 id="titulo-video" class="secao__titulo">${esc(a.nome)} em campo</h2>
    </div>
    ${
      a.video
        ? `${blocoVideo(a.video, `Melhores lances — ${a.nome}`, true)}
    <p class="video__rodape"><a class="link-seta" href="https://www.youtube.com/watch?v=${a.video.id}" target="_blank" rel="noopener">Assistir no YouTube ${icone.externo}</a></p>`
        : `<div class="video video--vazio"><p>O vídeo com os melhores lances será publicado em breve.<br>Solicite o material completo à G&amp;F.</p></div>`
    }
    ${
      a.videosExtras.length
        ? `<div class="videos-extras">
      ${a.videosExtras
        .map((v) => `<figure>${blocoVideo(v, `${v.titulo} — ${a.nome}`)}<figcaption>${esc(v.titulo)}</figcaption></figure>`)
        .join('\n      ')}
    </div>`
        : ''
    }
  </div>
</section>`;

  const conteudo = `
${a.exemplo ? '<div class="faixa-exemplo">Perfil de exemplo: substitua pelos dados de um atleta real ou apague esta pasta.</div>' : ''}
<div class="so-impressao impressao-topo">
  <img src="${raiz}assets/logo-gf.png" alt="" width="40" height="40">
  <span><strong>G&amp;F Assessoria</strong> · Ficha de atleta</span>
  <span>${esc(urlPerfil.replace(/^https?:\/\//, ''))}</span>
</div>
<section class="perfil">
  <div class="container perfil__grade">
    <figure class="perfil__foto">
      ${imagemAtleta(a, imagens, 'grande', raiz, 'width="1080" height="1350" fetchpriority="high"')}
    </figure>
    <div class="perfil__info">
      <a class="voltar" href="${raiz}#atletas">${icone.voltar}<span>Todos os atletas</span></a>
      ${seloCategoria(a) ? `<p class="sobretitulo">${seloCategoria(a)}</p>` : ''}
      <h1 class="perfil__nome">${esc(a.nome)}</h1>
      ${posicoes ? `<p class="perfil__posicao">${esc(posicoes)}</p>` : ''}
      ${numeros.length ? `<dl class="numeros">${numeros.map(([r, v]) => `<div><dt>${r}</dt><dd>${v}</dd></div>`).join('')}</dl>` : ''}
      ${
        clube || a.situacao
          ? `<ul class="perfil__status">
        ${clube ? `<li><span>${rotuloClube}</span><strong>${esc(clube)}</strong></li>` : ''}
        ${a.situacao ? `<li><span>Situação</span><strong>${esc(a.situacao)}</strong></li>` : ''}
      </ul>`
          : ''
      }
      <div class="perfil__acoes">
        <a class="botao botao--ouro" href="#video">${icone.play}<span>Assistir aos melhores lances</span></a>
        <a class="botao botao--contorno" href="${esc(whats)}" target="_blank" rel="noopener">${icone.whatsapp}<span>Falar com a G&amp;F</span></a>
      </div>
      <div class="perfil__utilidades">
        <button type="button" class="botao-texto" data-compartilhar data-titulo="${esc(`${a.nome} · ${config.nome}`)}">${icone.compartilhar}<span>Compartilhar perfil</span></button>
        <button type="button" class="botao-texto" data-imprimir>${icone.imprimir}<span>Baixar ficha em PDF</span></button>
        ${a.instagram ? `<a class="botao-texto" href="${esc(linkInstagram(a.instagram))}" target="_blank" rel="noopener">${icone.instagram}<span>Instagram</span></a>` : ''}
      </div>
    </div>
  </div>
</section>
${secaoVideo}

<section class="secao secao--papel" aria-labelledby="titulo-ficha">
  <div class="container detalhes">
    <div class="detalhes__ficha">
      <p class="sobretitulo">Dados</p>
      <h2 id="titulo-ficha" class="secao__titulo">Ficha técnica</h2>
      <dl class="ficha">
          ${ficha}
      </dl>
      ${trajetoria}
    </div>
    <div class="detalhes__historia">
      ${
        a.historia
          ? `<p class="sobretitulo">História</p>
      <h2 class="secao__titulo">Sobre ${esc(primeiroNome)}</h2>
      <div class="texto-historia">${a.historia}</div>`
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
      <p class="sobretitulo">Interesse no atleta</p>
      <h2 id="titulo-contato-atleta" class="secao__titulo">Fale com a G&amp;F sobre ${esc(primeiroNome)}</h2>
      <p>Enviamos jogos completos, documentação e informações contratuais aos clubes interessados. Intermediação por intermediário registrado na CBF.</p>
    </div>
    <div class="contato-atleta__acoes">
      <a class="botao botao--ouro" href="${esc(whats)}" target="_blank" rel="noopener">${icone.whatsapp}<span>WhatsApp ${esc(config.whatsapp_exibicao)}</span></a>
      <a class="botao botao--contorno" href="mailto:${esc(config.email)}?subject=${encodeURIComponent(`Interesse: ${a.nome}`)}&amp;body=${encodeURIComponent(`Olá, G&F!\n\nGostaria de mais informações sobre ${a.nome}.\n${urlPerfil}\n\nClube:\nContato:`)}">E-mail</a>
    </div>
  </div>
</section>

<div class="so-impressao impressao-rodape">
  ${a.video ? `<p><strong>Melhores lances:</strong> https://youtu.be/${a.video.id}</p>` : ''}
  <p><strong>Perfil completo:</strong> ${esc(urlPerfil)}</p>
  <p><strong>G&amp;F Assessoria</strong> · WhatsApp ${esc(config.whatsapp_exibicao)} · ${esc(config.email)} · Intermediário registrado na CBF</p>
</div>`;

  const idadeTxt = a.idade ? `${a.idade} anos` : '';
  const descricao =
    a.resumo ||
    [posicoes, idadeTxt, clube].filter(Boolean).join(' · ') + '. Vídeo com os melhores lances, ficha técnica e trajetória.';

  return pagina({
    titulo: `${a.nome}${a.posicao ? ` · ${a.posicao}` : ''} · ${config.nome}`,
    descricao,
    caminho: `atletas/${a.slug}/`,
    raiz,
    ogImagem: imagens.og,
    noindex: a.exemplo || !a.listar,
    tipo: 'profile',
    classe: 'pagina-atleta',
    textoWhats,
    conteudo,
    versoes,
  });
}

function pagina404(versoes) {
  // Servida em qualquer endereço inexistente: links absolutos a partir da base do site
  const conteudo = `
<section class="secao erro">
  <div class="container container--estreito">
    <p class="sobretitulo">Erro 404</p>
    <h1 class="secao__titulo">Página não encontrada</h1>
    <p>O endereço pode ter mudado ou o perfil não está mais disponível.</p>
    <a class="botao botao--ouro" href="${BASE}#atletas">Ver todos os atletas</a>
  </div>
</section>`;
  return pagina({ titulo: `Página não encontrada · ${config.nome}`, descricao: config.descricao, caminho: '404.html', raiz: BASE, noindex: true, conteudo, versoes });
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

if (sharp) {
  await sharp(LOGO).resize({ width: 220 }).png({ compressionLevel: 9 }).toFile(path.join(DIST, 'assets', 'logo-gf.png'));
  await gerarCartaoOg(null, path.join(DIST, 'assets', 'og-gf.jpg'));
} else {
  await copyFile(LOGO, path.join(DIST, 'assets', 'logo-gf.png'));
  await copyFile(LOGO, path.join(DIST, 'assets', 'og-gf.jpg'));
}

const atletas = await lerAtletas();
for (const atleta of atletas) {
  atleta.imagens = await prepararImagens(atleta);
  await writeFile(path.join(DIST, 'atletas', atleta.slug, 'index.html'), paginaAtleta(atleta, versoes));
  console.log(`  ✓ ${atleta.nome}${atleta.exemplo ? ' (exemplo)' : ''}${atleta.listar ? '' : ' (não listado)'} → atletas/${atleta.slug}/`);
}

await writeFile(path.join(DIST, 'index.html'), paginaInicial(atletas, versoes));
await writeFile(path.join(DIST, '404.html'), pagina404(versoes));
await writeFile(path.join(DIST, '.nojekyll'), '');

if (config.url) {
  const urls = ['', ...atletas.filter((a) => a.listar && !a.exemplo).map((a) => `atletas/${a.slug}/`)];
  await writeFile(
    path.join(DIST, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((u) => `  <url><loc>${esc(absoluta(u))}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  await writeFile(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${absoluta('sitemap.xml')}\n`);
}

console.log(`Pronto: ${atletas.length} atleta(s) em ${((Date.now() - inicio) / 1000).toFixed(1)}s → dist/`);
if (avisos.length) console.log(`${avisos.length} aviso(s) acima — confira.`);
