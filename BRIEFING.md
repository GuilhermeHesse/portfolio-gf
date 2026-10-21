# Briefing do projeto: Portfólio de Atletas G&F

Documento de referência do site, para orientar qualquer evolução futura. Pode ser usado como prompt para pedir alterações a uma IA ou a um desenvolvedor.

## Objetivo

Ter um link profissional para cada atleta assessorado pela G&F Assessoria, enviado a clubes (diretores, coordenadores, analistas de desempenho e scouts) quando a G&F oferece o atleta. Com esse link, o clube avalia o atleta em poucos minutos, de preferência pelo celular, e entra em contato com a G&F.

Referência de conteúdo: currículo de atleta em página única (ex.: curriculoleticiaxing.wordpress.com). Ou seja, nome, foto, história curta, ficha técnica, highlights e contato. Aqui isso vira um portfólio da agência, com padrão visual e técnico superior.

## Quem é a G&F

- **G&F Assessoria · Gestão de atletas** (Instagram @assessoriagf_, site gfcarreiras.online).
- Gestão de carreira de atletas de futebol, **feminino e masculino, da base ao profissional**.
- Intermediário registrado na CBF.
- Sócios: Júlia Ferreira de Faria (relacionamento e família) e Guilherme Martins Ribeiro Hesse (advogado e intermediário CBF).
- Valores: seriedade, proximidade e estratégia. Também ética, transparência e participação da família.
- Slogans: "Talento precisa de oportunidade. Carreira precisa de direção." / "O talento abre portas. A gestão correta sustenta a trajetória."

## Identidade visual

- Paleta do site institucional: preto `#070707`, dourado `#d3ad38` (claro `#f0d47a`, escuro `#9d791d`), prata `#c9c9c9` e papel `#f3f1eb`.
- Logo: monograma "GF" prateado em serifa, com um traço dourado.
- Tipografia: títulos em serifa elegante (Cormorant Garamond), textos e rótulos em Inter, com rótulos em caixa-alta espaçada.
- Tom: premium, sóbrio e confiável, como uma agência de gestão de carreira, não um site de torcida.

## Páginas

1. **Início:**
   - abertura com o slogan e os números do portfólio;
   - grade de atletas com filtros por modalidade (feminino/masculino), por posição (gol, defesa, meio-campo, ataque) e busca;
   - seção "Para clubes", explicando como funciona a avaliação e a intermediação;
   - seção "A G&F", com foto e nome dos sócios;
   - contatos.
2. **Página da atleta** (`/atletas/<nome>/`), nesta ordem:
   - foto grande;
   - nome, posição, idade, altura, peso, pé dominante, clube e situação contratual;
   - botões "Assistir aos melhores lances", "Falar com a G&F" (WhatsApp com mensagem pronta e link do perfil), "Compartilhar" e "Baixar ficha em PDF";
   - vídeo do YouTube embutido, que só carrega ao clicar, com link para abrir no YouTube e vídeos extras opcionais;
   - ficha técnica e trajetória;
   - história, números e conquistas;
   - chamada final de contato.
3. **Ficha em PDF:** versão de impressão em uma página A4, com logo, dados, história, link do vídeo e contatos da G&F.
4. **Prévia de link:** cada atleta tem uma imagem de compartilhamento própria (logo G&F + foto) para WhatsApp e redes sociais.

## Requisitos técnicos

- Site estático hospedado gratuitamente no GitHub Pages, com domínio próprio (`portifoliogf.com.br`).
- Conteúdo em arquivos simples: uma pasta por atleta, com `ficha.md` (dados + história) e `foto.jpg`. Dá para editar pelo navegador no GitHub, sem programar.
- Publicação automática (GitHub Actions) a cada alteração.
- Fotos otimizadas automaticamente: WebP em dois tamanhos e imagem de prévia 1200×630.
- Celular em primeiro lugar, acessível e rápido.
- Idade calculada automaticamente a partir da data de nascimento.
- Perfis podem ficar ocultos da lista (link direto) ou fora do ar, sem apagar dados.

## Cuidados

- Dados e imagens só com autorização do atleta e, para menores, dos responsáveis (LGPD art. 14 / ECA).
- Perfis de exemplo e perfis ocultos não são indexados pelo Google.
