# Portfólio de Atletas · G&F Assessoria

Site de apresentação das atletas e dos atletas da G&F para clubes. Cada atleta tem uma página própria, com:

- foto em destaque;
- vídeo do YouTube com os melhores lances;
- ficha técnica;
- história, trajetória, números e conquistas;
- botão de WhatsApp com mensagem pronta;
- ficha em PDF de uma página;
- prévia com a marca G&F quando o link é enviado pelo WhatsApp.

- **Endereço final:** https://portifoliogf.com.br (depois de configurar o DNS, veja abaixo)
- **Endereço provisório:** https://guilhermehesse.github.io/portfolio-gf/

O site se atualiza sozinho: qualquer alteração salva neste repositório no GitHub é publicada em 1 a 2 minutos.

---

## 1. Cadastrar um atleta novo (pelo navegador, sem instalar nada)

1. Abra o repositório no GitHub e entre na pasta **`atletas`**.
2. Clique em **Add file → Create new file**.
3. No campo do nome, digite o nome da pasta, uma barra e `ficha.md`. Exemplo:
   `maria-eduarda-silva/ficha.md`
   (só letras minúsculas, sem acento, com hífens. Esse nome vira o endereço `portifoliogf.com.br/atletas/maria-eduarda-silva/`.)
4. Copie o conteúdo de [`atletas/_MODELO/ficha.md`](atletas/_MODELO/ficha.md), cole e preencha. Linhas com `#` são instruções e não aparecem no site.
5. Clique em **Commit changes** para salvar.
6. Entre na pasta que você criou, clique em **Add file → Upload files** e envie a foto com o nome **`foto.jpg`** (pode ser `.png` ou `.webp`).

Em 1 a 2 minutos o perfil aparece no site. Para acompanhar a publicação, abra a aba **Actions**: o símbolo ✓ verde quer dizer que o site já foi publicado.

**Editar:** abra o `ficha.md` do atleta, clique no lápis ✏️, altere e salve.
**Esconder sem apagar:** troque para `listar: não`. O perfil some da página inicial, mas o link direto continua funcionando, o que é útil para enviar a um clube específico.
**Tirar do ar:** troque para `publicar: não` ou apague a pasta.

> Os três perfis `exemplo-…` são fictícios e mostram como o site fica preenchido. Apague essas pastas quando cadastrar os atletas reais.

## 2. Dicas de foto e vídeo

- **Foto:** de preferência vertical, com boa luz, rosto visível e uniforme ou roupa esportiva. O site corta, comprime e gera as versões para celular sozinho. Se o recorte ficar ruim, use `foco: topo` (ou `centro`/`baixo`) na ficha.
- **Vídeo:** suba no YouTube como **Não listado** (não aparece em buscas, mas abre pelo link) e cole o link no campo `video:`. Vale qualquer formato: `youtube.com/watch?v=…`, `youtu.be/…` ou `shorts/…`. Confira em *YouTube Studio → Detalhes → Mostrar mais* se a opção **Permitir incorporação** está marcada.
- **Vídeos extras** (jogo completo, etc.): use a lista `videos:`, no formato `Título | link`.

## 3. Ligar o domínio portifoliogf.com.br (Registro.br)

Faça uma única vez, no painel do [Registro.br](https://registro.br):

1. Entre em **portifoliogf.com.br → DNS → Editar zona** (o domínio já usa o DNS do próprio Registro.br).
2. Adicione os registros abaixo. Deixe o campo "nome" vazio para o domínio principal:

| Tipo  | Nome  | Valor |
|-------|-------|-------|
| A     | *(vazio)* | 185.199.108.153 |
| A     | *(vazio)* | 185.199.109.153 |
| A     | *(vazio)* | 185.199.110.153 |
| A     | *(vazio)* | 185.199.111.153 |
| AAAA  | *(vazio)* | 2606:50c0:8000::153 |
| AAAA  | *(vazio)* | 2606:50c0:8001::153 |
| AAAA  | *(vazio)* | 2606:50c0:8002::153 |
| AAAA  | *(vazio)* | 2606:50c0:8003::153 |
| CNAME | www   | guilhermehesse.github.io. |

3. Salve. A propagação leva de alguns minutos a algumas horas.
4. Por último, faça os dois ajustes que dependem do DNS já funcionando:
   - No GitHub, em **Settings → Pages → Custom domain**, digite `portifoliogf.com.br`, salve e marque **Enforce HTTPS** quando a opção liberar.
   - Em `site.config.json`, troque `"url"` para `"https://portifoliogf.com.br"`.

   Se preferir, peça ao Claude para fazer essa etapa.

## 4. Ver o site no computador antes de publicar (opcional)

Precisa do [Node.js](https://nodejs.org) instalado. Na pasta do projeto:

```bash
npm install
npm run dev
```

Depois, abra o endereço que aparecer no terminal. O comando `npm run build` mostra avisos se alguma ficha estiver com problema, como data inválida, link do YouTube não reconhecido ou foto ausente.

## 5. Contatos e textos gerais

WhatsApp, telefone, e-mail, Instagram, sócios e o aviso do rodapé ficam em [`site.config.json`](site.config.json).

## 6. Privacidade (importante)

Publique dados e imagens só com **autorização por escrito** do atleta e, se for menor de 18 anos, dos **pais ou responsáveis** (LGPD, art. 14, e ECA). Para menores, avalie:

- não informar a cidade de nascimento;
- não colocar o Instagram pessoal;
- usar `listar: não`, enviando o link só aos clubes interessados.

## Estrutura

```
atletas/              uma pasta por atleta: ficha.md + foto.jpg
atletas/_MODELO/      ficha-modelo comentada (não vai para o site)
site.config.json      contatos e textos gerais
src/                  visual do site (styles.css), interações (app.js) e imagens da marca
scripts/build.mjs     gera o site em dist/ a partir das fichas
.github/workflows/    publicação automática no GitHub Pages
BRIEFING.md           conceito e requisitos do projeto
```
