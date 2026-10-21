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
- Atletas podem ficar fora da lista (`listar: não`), acessíveis apenas pelo link direto.

Referência de conteúdo: currículo de atleta em página única (ex.: curriculoleticiaxing.wordpress.com). Ou seja, nome, foto, história curta, ficha técnica, highlights e contato.

## Páginas

1. **Portfólio (página inicial):** título "Portfólio de atletas", filtros (feminino/masculino, posição, busca) e grade de cartões. Cada cartão traz foto, posição, nome, idade, clube, "Ver perfil", "Copiar link" e "WhatsApp".
2. **Perfil do atleta**, nesta ordem:
   - foto grande;
   - nome, posição, idade, altura, peso, pé dominante, clube e situação contratual;
   - "Assistir aos melhores lances" e "Falar com a G&F";
   - "Copiar link", "Enviar pelo WhatsApp" e "Baixar ficha em PDF";
   - vídeo do YouTube embutido e vídeos extras;
   - ficha técnica e trajetória;
   - história, números e conquistas;
   - contato ("Interesse em <nome>?").
3. **Ficha em PDF:** uma página A4 com logo, dados, história, link do vídeo e contato.

## Marca

- G&F Assessoria · Gestão de atletas · Intermediário CBF. Futebol feminino e masculino, da base ao profissional.
- Paleta: preto `#070707`, dourado `#d3ad38` (claro `#f0d47a`, escuro `#9d791d`), prata `#c9c9c9` e papel `#f3f1eb`.
- Logo: monograma "GF" prateado em serifa, com um traço dourado.
- Tipografia: Cormorant Garamond (nomes e títulos) e Inter (textos e rótulos em caixa-alta espaçada).
- Tom: sóbrio e profissional. O protagonista é o atleta.
- Contato: WhatsApp +55 (31) 99888-6452 · contatoassessoriagf@outlook.com.

## Requisitos técnicos

- Site estático no GitHub Pages, com domínio `portfoliogf.com.br`. O `portifoliogf.com.br` redireciona para ele.
- Uma pasta por atleta em `atletas/`, com `ficha.md` (dados + história) e `foto.jpg`. Dá para editar pelo navegador no GitHub.
- Fotos otimizadas automaticamente (WebP) e imagem de prévia 1200×630 por atleta.
- Celular em primeiro lugar, acessível e rápido. Idade calculada automaticamente.

## Cuidados

- Dados e imagens só com autorização do atleta e, para menores, dos responsáveis (LGPD art. 14 / ECA).
- Perfis de exemplo e perfis fora da lista não são indexados pelo Google.
