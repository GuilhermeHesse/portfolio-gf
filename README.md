# Portfólio de Atletas · G&F Assessoria

Portfólio das atletas e dos atletas da G&F, feito para enviar a clubes. Cada atleta tem um **perfil próprio**: o clube abre o link e cai direto naquele perfil. Se quiser, clica na logo G&F e vê o portfólio completo.

Cada perfil reúne:

- foto principal e galeria de fotos;
- vídeo do YouTube com os melhores lances;
- ficha técnica;
- história, trajetória, números e conquistas;
- botão de WhatsApp para o clube falar com a G&F;
- ficha em PDF de uma página.

O site existe em **português, inglês e espanhol**.

- **Endereço do site:** https://portfoliogf.com.br (o antigo guilhermehesse.github.io/portfolio-gf redireciona para ele)
- **Painel de edição:** https://app.pagescms.org

---

## 1. Enviar o perfil de um atleta para um clube

No portfólio, cada cartão tem dois botões ao lado de "Ver perfil":

- 🔗 **Copiar link:** copia o endereço do perfil para colar no WhatsApp, no e-mail ou onde precisar.
- **WhatsApp:** abre o WhatsApp com a mensagem pronta. Você só escolhe o contato do clube.

**Clube do exterior:** troque o idioma no topo do site (PT · EN · ES) antes de copiar ou enviar. O link e a mensagem saem no idioma escolhido, por exemplo `portfoliogf.com.br/en/atletas/nome/`.

Na página do perfil:

- não há menu; a logo G&F, no canto superior esquerdo, leva à página inicial do portfólio (no mesmo idioma);
- o clube vê só aquele atleta e o botão "Falar com a G&F";
- o seletor de idioma leva apenas ao mesmo atleta em outra língua;
- a prévia no WhatsApp mostra a foto do atleta com a logo da G&F.

## 2. Painel de edição (cadastrar atletas, fotos e vídeos)

O painel é o **Pages CMS**: gratuito, com formulários em português e ligado a este repositório. Tudo o que se salva lá entra no site em 1 a 2 minutos.

**Entrada pelo site:** botão de **três pontinhos (⋮)** no canto superior direito de qualquer página. Ele abre o painel lateral com a **Área da equipe**:

- **Fazer login:** abre o painel de edição.
- **Criar conta:** a pessoa informa nome e e-mail, e o pedido chega à G&F pelo WhatsApp. O administrador libera a conta em **Admin → Collaborators**, e a pessoa recebe o convite por e-mail.

A mesma área está em https://portfoliogf.com.br/entrar/ (link "Área da equipe" no rodapé).

- **Administrador (GuilhermeHesse):** na tela de login, escolha **"Sign in with GitHub"**. Só assim aparece o menu Admin, onde se autorizam as outras contas.
- **Equipe autorizada:** escolhe "Continue with email" e usa o e-mail convidado.

### 2.1 Primeiro acesso do administrador (uma vez — já feito)

1. Entre em https://app.pagescms.org e clique em **"Sign in with GitHub"**, usando a conta **GuilhermeHesse**.
2. Autorize o aplicativo **Pages CMS** apenas no repositório **portfolio-gf**.
3. Abra o repositório **portfolio-gf**. Aparece a seção **Atletas**.

O menu lateral (ícone no canto superior esquerdo) tem:

- **Atletas** (Content): a lista e os formulários.
- **Media:** as fotos enviadas.
- **Admin:** os convites (Collaborators) e a configuração. Só o administrador vê.

### 2.2 Cadastrar ou editar um atleta

1. Em **Atletas**, crie uma entrada nova ou clique em um atleta existente.
2. Preencha os campos (cada um tem uma explicação embaixo).
3. Envie as fotos direto nos campos "Foto principal" e "Galeria de fotos".
4. Cole o link do YouTube no campo do vídeo.
5. Salve.

- **Só por link:** a opção "Mostrar só por link" tira o atleta da página inicial, mas o link direto continua funcionando. Serve para uma negociação sigilosa, por exemplo.
- **Fora do ar:** a opção "Rascunho" tira o perfil do ar sem apagar os dados.

### 2.3 Dar acesso aos funcionários

1. No menu lateral, vá em **Admin → Collaborators** e clique em **"Invite a collaborator"**.
2. Digite o **e-mail** do funcionário e confirme.
3. O funcionário recebe um convite por e-mail. **Não precisa ter conta no GitHub.**
4. Para entrar, ele abre https://app.pagescms.org, clica em **"Continue with email"**, usa o mesmo e-mail do convite e confirma pelo link que chega na caixa de entrada.
5. Para tirar o acesso, remova o e-mail na mesma tela Collaborators. O acesso é cortado na hora.

**O que o funcionário pode fazer:** cadastrar e editar atletas e enviar fotos.

**O que ele não pode fazer:** mexer no visual ou no código do site, mudar a configuração do painel ou convidar outras pessoas. Isso fica só com o administrador (a conta GitHub da G&F).

Toda alteração fica registrada no histórico do GitHub, com quem fez, quando e o que mudou, e pode ser desfeita. Para desfazer, peça ao Claude.

## 3. Idiomas

**Traduzido automaticamente** (inglês e espanhol):

- textos do site;
- posição, pé dominante, modalidade e categoria;
- nacionalidade;
- datas;
- situações no formato "Contrato até 12/2026" ou "Livre para negociação";
- rótulos de números comuns (Jogos, Gols, Assistências).

**Para traduzir:** a **história** e as **conquistas** têm campos próprios em inglês e espanhol no painel. Se ficarem em branco, a versão estrangeira mostra o texto em português com o aviso "texto original em português". Peça ao Claude para traduzir, se quiser.

## 4. Contador de visitas (quem abriu cada perfil)

O site já registra:

- **visitas por perfil**;
- **cliques importantes**: "Assistiu ao vídeo", "WhatsApp G&F", "Baixou PDF", "Copiou link" e "Abriu foto", sempre com o nome do atleta e o idioma.

Para começar a ver os números:

1. Crie uma conta gratuita em https://umami.is (Umami Cloud, plano **Hobby**).
2. Adicione um site com o domínio `portfoliogf.com.br`.
3. Copie o **Website ID**, uma sequência como `a1b2c3d4-…`.
4. Coloque o ID em `site.config.json`, no campo `"umami": { "id": "…" }`, ou passe ao Claude.

No painel do Umami:

- **Pages:** visitas de cada perfil (`/atletas/nome/`).
- **Events:** os cliques, com o nome do atleta.

O Umami não usa cookies, então não precisa de aviso de cookies (LGPD).

**Não contar as visitas da equipe:** em cada navegador e celular da equipe, abra o site uma vez com `?nao-contar` no fim do endereço (ex.: `portfoliogf.com.br/?nao-contar`). Para voltar a contar, use `?contar`.

## 5. Dicas de foto e vídeo

- **Foto principal:** vertical, com boa luz, rosto visível e uniforme ou roupa esportiva. O site corta e comprime sozinho. Se o rosto ficar cortado, ajuste o campo "Recorte da foto".
- **Galeria:** até 8 fotos de jogo ou treino.
- **Vídeo:** suba no YouTube como **Não listado** e cole o link. Confira em *YouTube Studio → Detalhes → Mostrar mais* se a opção **Permitir incorporação** está marcada.

## 6. Domínio portfoliogf.com.br (Registro.br) — já configurado

Configurado em 22/10/2026, com HTTPS ativo. A zona DNS está no **modo avançado** do Registro.br (**portfoliogf.com.br → DNS → Configurar zona DNS**), com estes registros. Não apague nenhum, ou o site sai do ar:

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

No GitHub, o domínio está em **Settings → Pages → Custom domain**, com **Enforce HTTPS** marcado.

Pendente: fazer o `portifoliogf.com.br` (com "i") redirecionar para o domínio principal. Peça ao Claude.

## 7. Ver o site no computador antes de publicar (opcional)

Precisa do [Node.js](https://nodejs.org). Na pasta do projeto:

```bash
npm install
npm run dev
```

O comando `npm run build` mostra avisos se alguma ficha estiver com problema, como data inválida, link do YouTube não reconhecido ou foto ausente.

## 8. Privacidade (importante)

Publique dados e imagens só com **autorização por escrito** do atleta e, se for menor de 18 anos, dos **pais ou responsáveis** (LGPD, art. 14, e ECA). Para menores, avalie não informar a cidade de nascimento e não colocar o Instagram pessoal.

**Atenção:** este repositório é **público**, exigência do GitHub gratuito para hospedar sites. Tudo o que estiver nas fichas, inclusive em perfis "só por link" ou em rascunho, pode ser lido por quem abrir o repositório. Não coloque aqui dados sigilosos, como valores de contrato, documentos ou telefones da família.

## Estrutura

```
atletas/              um arquivo por atleta (nome-do-atleta.md), editado pelo painel
fotos/                fotos enviadas pelo painel
.pages.yml            formulários do painel de edição (o que os funcionários podem editar)
site.config.json      contatos, endereço do site e contador de visitas
src/                  visual (styles.css), interações (app.js) e logo
scripts/build.mjs     gera o site em dist/ a partir das fichas
scripts/idiomas.mjs   textos em PT/EN/ES e traduções automáticas
BRIEFING.md           conceito e requisitos do projeto
```
