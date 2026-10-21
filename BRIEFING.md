# Briefing do projeto: Portfólio de Atletas G&F

Documento de referência do site, para orientar qualquer evolução futura. Pode ser usado como prompt para pedir alterações a uma IA ou a um desenvolvedor.

## O que é (e o que não é)

- **É** o portfólio de atletas da G&F Assessoria: uma vitrine das atletas e dos atletas, usada para oferecê-los a clubes.
- **Não é** um site de apresentação da empresa. Não há história da G&F, slogans, foto dos sócios nem seções institucionais. A G&F aparece só como marca (logo e cores) e como contato.

## Função principal: perfil isolado

O uso mais importante é enviar **o perfil de um único atleta** a um clube:

- Cada atleta tem um endereço próprio (`portfoliogf.com.br/atletas/<nome>/`).
- O clube que recebe o link cai direto no perfil e lê todas as informações daquele atleta.
- A página do perfil **não tem** menu, link "voltar" nem qualquer link para a lista ou para outros atletas.
- Na lista, cada cartão tem "Copiar link" e "Enviar pelo WhatsApp" (mensagem pronta para o clube). Os mesmos botões aparecem dentro do perfil.
- Prévia do link no WhatsApp: foto do atleta + logo G&F.
- Atletas podem ficar fora da lista (opção "Mostrar só por link"), acessíveis apenas pelo link direto.

Referência de conteúdo: currículo de atleta em página única (ex.: curriculoleticiaxing.wordpress.com). Ou seja, nome, foto, história curta, ficha técnica, highlights e contato.

## Acesso e edição

- Painel Pages CMS (app.pagescms.org), ligado ao repositório. O administrador é a conta GitHub da G&F.
- Os funcionários entram por convite de e-mail, sem conta no GitHub, e o administrador pode revogar o acesso a qualquer momento.
- Os funcionários editam apenas atletas, fotos e vídeos (formulários definidos em `.pages.yml`). Não mexem em código, visual ou configuração, nem convidam outras pessoas.
- Toda alteração fica no histórico do GitHub e pode ser desfeita.

## Idiomas e métricas

- Português (raiz), inglês (`/en/`) e espanhol (`/es/`).
- Interface, posições, pé dominante, categorias, datas e situações comuns são traduzidos automaticamente. História e conquistas têm campos opcionais de tradução.
- Contador de visitas Umami: sem cookies, visitas por perfil e eventos "Assistiu ao vídeo", "WhatsApp G&F", "Baixou PDF", "Copiou link" e "Abriu foto", com o nome do atleta.

## Páginas

1. **Portfólio (página inicial):** título "Portfólio de atletas", filtros (feminino/masculino, posição, busca) e grade de cartões. Cada cartão traz foto, posição, nome, idade, clube, "Ver perfil", "Copiar link" e "WhatsApp".
2. **Perfil do atleta**, nesta ordem:
   - foto grande;
   - nome, posição, idade, altura, peso, pé dominante, clube e situação contratual;
   - "Assistir aos melhores lances" e "Falar com a G&F";
   - "Copiar link", "Enviar pelo WhatsApp" e "Baixar ficha em PDF";
   - vídeo do YouTube embutido e vídeos extras (faixa escura);
   - galeria de fotos com ampliação;
   - ficha técnica e trajetória;
   - história, números e conquistas;
   - contato ("Interesse em <nome>?").
3. **Ficha em PDF:** uma página A4 com logo, dados, história, link do vídeo e contato.

## Marca

- G&F Assessoria · Gestão de atletas · Intermediário CBF. Futebol feminino e masculino, da base ao profissional.
- Tema claro: fundo off-white `#f6f4ee` e cartões brancos. Faixas pretas só no vídeo e no rodapé. No celular, uma barra fixa com "Vídeo" e "Falar com a G&F".
- Paleta: preto `#070707`, dourado `#d3ad38` (claro `#f0d47a`, escuro `#9d791d`), prata `#c9c9c9` e papel `#f3f1eb`.
- Logo: monograma "GF" prateado em serifa, com um traço dourado.
- Tipografia: Cormorant Garamond (nomes e títulos) e Inter (textos e rótulos em caixa-alta espaçada).
- Tom: sóbrio e profissional. O protagonista é o atleta.
- Contato: WhatsApp +55 (31) 99888-6452 · contatoassessoriagf@outlook.com.

## Requisitos técnicos

- Site estático no GitHub Pages, com domínio `portfoliogf.com.br`. O `portifoliogf.com.br` redireciona para ele.
- Um arquivo por atleta em `atletas/` (YAML com o texto da história abaixo dos dados), com as fotos em `fotos/`.
- Fotos otimizadas automaticamente (WebP), galeria e imagem de prévia 1200×630 por atleta.
- Celular em primeiro lugar, acessível e rápido. Idade calculada automaticamente.

## Cuidados

- Dados e imagens só com autorização do atleta e, para menores, dos responsáveis (LGPD art. 14 / ECA).
- Perfis de exemplo e perfis fora da lista não são indexados pelo Google.
