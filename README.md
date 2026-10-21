# Portfólio de Atletas · G&F Assessoria

Portfólio das atletas e dos atletas da G&F, feito para enviar a clubes. Cada atleta tem um **perfil próprio e isolado**: o clube abre o link e cai direto naquele perfil, sem acesso aos outros atletas.

Cada perfil reúne:

- foto em destaque;
- vídeo do YouTube com os melhores lances;
- ficha técnica;
- história, trajetória, números e conquistas;
- botão de WhatsApp para o clube falar com a G&F;
- ficha em PDF de uma página.

- **Endereço final:** https://portfoliogf.com.br (depois de configurar o DNS, veja a seção 4)
- **Endereço provisório:** https://guilhermehesse.github.io/portfolio-gf/

---

## 1. Enviar o perfil de um atleta para um clube

Abra o portfólio. No cartão do atleta, há dois botões ao lado de "Ver perfil":

- 🔗 **Copiar link:** copia o endereço do perfil (ex.: `portfoliogf.com.br/atletas/maria-eduarda-silva/`) para colar no WhatsApp, no e-mail ou onde precisar.
- **WhatsApp:** abre o WhatsApp com a mensagem pronta para você escolher o contato do clube. A mensagem é: *"Olá! Segue o perfil da atleta Maria Eduarda (Volante, Sub-20), apresentado pela G&F Assessoria: link"*.

Os mesmos botões aparecem dentro do perfil, junto com "Baixar ficha em PDF".

Na página do perfil:

- não há menu, nem link para a lista ou para outros atletas;
- o clube vê só aquele atleta e o botão "Falar com a G&F";
- quando o link é enviado pelo WhatsApp, a prévia mostra a foto do atleta com a logo da G&F.

**Perfil só por link:** para um atleta que não deve aparecer na página inicial (negociação sigilosa, por exemplo), use `listar: não` na ficha. O perfil continua funcionando pelo link direto, não aparece na lista e não é indexado pelo Google. Para pegar o link, use o endereço `.../atletas/nome-da-pasta/`.

## 2. Cadastrar um atleta novo (pelo navegador, sem instalar nada)

1. Abra o repositório no GitHub e entre na pasta **`atletas`**.
2. Clique em **Add file → Create new file**.
3. No campo do nome, digite o nome da pasta, uma barra e `ficha.md`. Exemplo: `maria-eduarda-silva/ficha.md`. Use só letras minúsculas, sem acento, com hífens: esse nome vira o endereço do perfil.
4. Copie o conteúdo de [`atletas/_MODELO/ficha.md`](atletas/_MODELO/ficha.md), cole e preencha. Linhas com `#` são instruções e não aparecem no site.
5. Clique em **Commit changes** para salvar.
6. Entre na pasta que você criou, clique em **Add file → Upload files** e envie a foto com o nome **`foto.jpg`**.

Em 1 a 2 minutos o perfil aparece no site. Para acompanhar, abra a aba **Actions**: o ✓ verde quer dizer que o site já foi publicado.

**Editar:** abra o `ficha.md` do atleta, clique no lápis ✏️, altere e salve.
**Tirar do ar:** troque para `publicar: não` ou apague a pasta.

> Os três perfis `exemplo-…` são fictícios. Apague essas pastas quando cadastrar os atletas reais.

## 3. Dicas de foto e vídeo

- **Foto:** de preferência vertical, com boa luz, rosto visível e uniforme ou roupa esportiva. O site corta e comprime a foto sozinho. Se o recorte ficar ruim, use `foco: topo` (ou `centro`/`baixo`) na ficha.
- **Vídeo:** suba no YouTube como **Não listado** e cole o link no campo `video:`. Qualquer formato de link funciona. Confira em *YouTube Studio → Detalhes → Mostrar mais* se a opção **Permitir incorporação** está marcada.
- **Vídeos extras** (jogo completo, etc.): use a lista `videos:`, no formato `Título | link`.

## 4. Ligar o domínio portfoliogf.com.br (Registro.br)

Faça uma única vez, no painel do [Registro.br](https://registro.br):

1. Entre em **portfoliogf.com.br → DNS → Editar zona**.
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
4. Depois disso, peça ao Claude para:
   - ligar o domínio no GitHub (**Settings → Pages → Custom domain** e **Enforce HTTPS**);
   - trocar `"url"` em `site.config.json` para `https://portfoliogf.com.br`.

**portifoliogf.com.br** (com "i"): para ele levar ao domínio principal, configure no Registro.br os mesmos registros da tabela, mas com o CNAME `www` apontando também para `guilhermehesse.github.io.`. O Claude cria uma pequena página de redirecionamento para esse domínio.

## 5. Ver o site no computador antes de publicar (opcional)

Precisa do [Node.js](https://nodejs.org) instalado. Na pasta do projeto:

```bash
npm install
npm run dev
```

O comando `npm run build` mostra avisos se alguma ficha estiver com problema, como data inválida, link do YouTube não reconhecido ou foto ausente.

## 6. Contatos

WhatsApp, e-mail e o aviso do rodapé ficam em [`site.config.json`](site.config.json).

## 7. Privacidade (importante)

Publique dados e imagens só com **autorização por escrito** do atleta e, se for menor de 18 anos, dos **pais ou responsáveis** (LGPD, art. 14, e ECA). Para menores, avalie não informar a cidade de nascimento e não colocar o Instagram pessoal.

**Atenção:** este repositório é **público**, exigência do GitHub gratuito para hospedar sites. Tudo o que estiver nas fichas, inclusive em perfis com `listar: não` ou `publicar: não`, pode ser lido por quem abrir o repositório. Não coloque aqui dados sigilosos, como valores de contrato, documentos ou telefones da família.

## Estrutura

```
atletas/              uma pasta por atleta: ficha.md + foto.jpg
atletas/_MODELO/      ficha-modelo comentada (não vai para o site)
site.config.json      contatos e textos gerais
src/                  visual do site (styles.css), interações (app.js) e logo
scripts/build.mjs     gera o site em dist/ a partir das fichas
BRIEFING.md           conceito e requisitos do projeto
```
