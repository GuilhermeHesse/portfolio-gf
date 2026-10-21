// Portfólio de atletas · G&F Assessoria — interações da página (sem dependências)
(() => {
  document.documentElement.classList.add('js');

  const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Topo ganha fundo ao rolar a página
  const topo = document.querySelector('[data-topo]');
  const aoRolar = () => topo && topo.classList.toggle('topo--rolado', window.scrollY > 24);
  aoRolar();
  window.addEventListener('scroll', aoRolar, { passive: true });

  // Idade sempre atualizada no dia da visita
  const hoje = new Date();
  document.querySelectorAll('[data-nascimento]').forEach((el) => {
    const [ano, mes, dia] = el.dataset.nascimento.split('-').map(Number);
    let idade = hoje.getFullYear() - ano;
    if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) idade--;
    if (idade > 0 && idade < 80) el.textContent = el.dataset.formato === 'curto' ? String(idade) : `${idade} anos`;
  });

  document.querySelectorAll('[data-ano]').forEach((el) => (el.textContent = hoje.getFullYear()));

  // Filtros da lista de atletas
  const lista = document.querySelector('[data-lista-atletas]');
  if (lista) {
    const cartoes = [...lista.querySelectorAll('[data-atleta]')];
    const botoesCategoria = [...document.querySelectorAll('[data-filtro-categoria]')];
    const seletorPosicao = document.querySelector('[data-filtro-posicao]');
    const campoBusca = document.querySelector('[data-filtro-busca]');
    const contador = document.querySelector('[data-contador]');
    const vazio = document.querySelector('[data-vazio]');
    const filtro = { categoria: 'todas', posicao: 'todas', busca: '' };

    const aplicar = () => {
      const termo = semAcento(filtro.busca.trim());
      let total = 0;
      cartoes.forEach((cartao) => {
        const visivel =
          (filtro.categoria === 'todas' || cartao.dataset.categoria === filtro.categoria) &&
          (filtro.posicao === 'todas' || cartao.dataset.posicao === filtro.posicao) &&
          (!termo || cartao.dataset.busca.includes(termo));
        cartao.hidden = !visivel;
        if (visivel) total++;
      });
      if (contador) contador.textContent = total === 1 ? '1 atleta' : `${total} atletas`;
      if (vazio) vazio.hidden = total !== 0;
    };

    botoesCategoria.forEach((botao) =>
      botao.addEventListener('click', () => {
        filtro.categoria = botao.dataset.filtroCategoria;
        botoesCategoria.forEach((b) => b.setAttribute('aria-pressed', String(b === botao)));
        aplicar();
      }),
    );
    seletorPosicao?.addEventListener('change', () => {
      filtro.posicao = seletorPosicao.value;
      aplicar();
    });
    campoBusca?.addEventListener('input', () => {
      filtro.busca = campoBusca.value;
      aplicar();
    });
  }

  // Vídeo do YouTube só carrega ao clicar (página mais leve no celular)
  document.querySelectorAll('[data-youtube]').forEach((capa) => {
    capa.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${capa.dataset.youtube}?autoplay=1&rel=0&playsinline=1`;
      iframe.title = capa.dataset.titulo || 'Vídeo';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      iframe.allowFullscreen = true;
      capa.replaceWith(iframe);
    });
  });

  // Aviso rápido na parte de baixo da tela
  const toast = document.querySelector('[data-toast]');
  let temporizador;
  const avisar = (texto) => {
    if (!toast) return;
    toast.textContent = texto;
    toast.classList.add('toast--visivel');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => toast.classList.remove('toast--visivel'), 2600);
  };

  // Compartilhar: menu nativo no celular, cópia do link no computador
  document.querySelectorAll('[data-compartilhar]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      const dados = { title: botao.dataset.titulo || document.title, url: location.href.split('#')[0] };
      if (navigator.share && matchMedia('(pointer: coarse)').matches) {
        try {
          await navigator.share(dados);
          return;
        } catch (erro) {
          if (erro.name === 'AbortError') return;
        }
      }
      try {
        await navigator.clipboard.writeText(dados.url);
        avisar('Link do perfil copiado');
      } catch {
        prompt('Copie o link do perfil:', dados.url);
      }
    });
  });

  // Ficha em PDF: abre a impressão (escolher "Salvar como PDF")
  document.querySelectorAll('[data-imprimir]').forEach((botao) => botao.addEventListener('click', () => window.print()));

  // Entrada suave dos blocos ao rolar
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const alvos = document.querySelectorAll('.cartao, .passos li, .sobre, .detalhes > *, .video--principal, .contato-atleta__grade');
    const observador = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          entrada.target.classList.add('revelar--visivel');
          observador.unobserve(entrada.target);
        }),
      { rootMargin: '0px 0px -8% 0px' },
    );
    alvos.forEach((alvo) => {
      if (alvo.getBoundingClientRect().top < innerHeight) return;
      alvo.classList.add('revelar');
      observador.observe(alvo);
    });
  }
})();
