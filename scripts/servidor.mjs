// Servidor local para conferir o site antes de publicar. Uso: npm run dev  (ou npm run servidor)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RAIZ, 'dist');
const PORTA = Number(process.env.PORT) || 4173;
const config = JSON.parse(await readFile(path.join(RAIZ, 'site.config.json'), 'utf8'));
// Serve no mesmo caminho do site publicado (ex.: /gf-atletas/) para os links funcionarem igual
const BASE = config.url ? new URL(config.url.replace(/\/+$/, '') + '/').pathname : '/';

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (!pathname.startsWith(BASE)) {
    res.writeHead(302, { Location: BASE }).end();
    return;
  }
  let arquivo = path.join(DIST, decodeURIComponent(pathname.slice(BASE.length)));
  if (!arquivo.startsWith(DIST)) {
    res.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(arquivo)).isDirectory()) {
      if (!pathname.endsWith('/')) {
        res.writeHead(301, { Location: pathname + '/' }).end();
        return;
      }
      arquivo = path.join(arquivo, 'index.html');
    }
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' });
    res.end(conteudo);
  } catch {
    const pagina = await readFile(path.join(DIST, '404.html')).catch(() => 'Página não encontrada');
    res.writeHead(404, { 'Content-Type': TIPOS['.html'] }).end(pagina);
  }
}).listen(PORTA, () => console.log(`Portfólio rodando em http://localhost:${PORTA}${BASE}  (Ctrl+C para parar)`));
