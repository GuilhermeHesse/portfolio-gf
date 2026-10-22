// Portfólio de atletas · G&F Assessoria — interações da página (sem dependências)
(() => {
  document.documentElement.classList.add('js');

  const TEXTOS = {
    pt: { anos: 'anos', copiado: 'Link do perfil copiado', copie: 'Copie o link do perfil:', naoContar: 'Este navegador não entra mais no contador de visitas', contar: 'Este navegador voltou a entrar no contador de visitas' },
    en: { anos: 'years', copiado: 'Profile link copied', copie: 'Copy the profile link:', naoContar: 'This browser is no longer counted in visits', contar: 'This browser is counted in visits again' },
    es: { anos: 'años', copiado: 'Enlace del perfil copiado', copie: 'Copie el enlace del perfil:', naoContar: 'Este navegador ya no se cuenta en las visitas', contar: 'Este navegador vuelve a contarse en las visitas' },
  };
  const t = TEXTOS[document.documentElement.lang.slice(0, 2)] || TEXTOS.pt;
  const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  // Aviso rápido na parte de baixo da tela
  const toast = document.querySelector('[data-toast]');
  let temporizador;
  const avisar = (texto) => {
    if (!toast) return;
    toast.textContent = texto;
    toast.classList.add('toast--visivel');
    clearTimeout(temporizador);
    temporizador = setTimeout(() => toast.classList.remove('toast--visivel'), 2800);
  };

  // Equipe da G&F: abrir o site com ?nao-contar uma vez tira este navegador do contador de visitas
  const parametros = new URLSearchParams(location.search);
  try {
    if (parametros.has('nao-contar')) {
      localStorage.setItem('umami.disabled', '1');
      avisar(t.naoContar);
    } else if (parametros.has('contar')) {
      localStorage.removeItem('umami.disabled');
      avisar(t.contar);
    }
  } catch {
    // navegação privada sem acesso ao armazenamento
  }

  // Topo ganha sombra ao rolar a página
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
    if (idade > 0 && idade < 80) el.textContent = el.dataset.formato === 'curto' ? String(idade) : `${idade} ${t.anos}`;
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
      if (contador) contador.textContent = total === 1 ? contador.dataset.um : contador.dataset.varios.replace('{n}', total);
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

  // Copiar o link isolado do perfil, para enviar a um clube
  document.querySelectorAll('[data-copiar-link]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      const url = new URL(botao.dataset.copiarLink, location.href).href;
      try {
        await navigator.clipboard.writeText(url);
        avisar(t.copiado);
      } catch {
        prompt(t.copie, url);
      }
    });
  });

  // Ficha em PDF: abre a impressão (escolher "Salvar como PDF")
  document.querySelectorAll('[data-imprimir]').forEach((botao) => botao.addEventListener('click', () => window.print()));

  // Galeria: foto ampliada com setas, teclado e deslizar no celular
  const visor = document.querySelector('[data-visor]');
  const fotos = [...document.querySelectorAll('[data-galeria] [data-foto]')];
  if (visor && fotos.length && typeof visor.showModal === 'function') {
    const imagem = visor.querySelector('[data-visor-imagem]');
    const contadorVisor = visor.querySelector('[data-visor-contador]');
    let atual = 0;
    const mostrar = (i) => {
      atual = (i + fotos.length) % fotos.length;
      imagem.src = fotos[atual].dataset.foto;
      imagem.alt = fotos[atual].querySelector('img')?.alt || '';
      contadorVisor.textContent = `${atual + 1} / ${fotos.length}`;
    };
    fotos.forEach((foto, i) =>
      foto.addEventListener('click', () => {
        mostrar(i);
        visor.showModal();
      }),
    );
    visor.classList.toggle('visor--uma', fotos.length === 1);
    visor.querySelector('[data-visor-fechar]').addEventListener('click', () => visor.close());
    visor.querySelector('[data-visor-anterior]').addEventListener('click', () => mostrar(atual - 1));
    visor.querySelector('[data-visor-proxima]').addEventListener('click', () => mostrar(atual + 1));
    visor.addEventListener('click', (e) => {
      if (e.target === visor) visor.close();
    });
    visor.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') mostrar(atual - 1);
      if (e.key === 'ArrowRight') mostrar(atual + 1);
    });
    let inicioToque = null;
    visor.addEventListener('touchstart', (e) => (inicioToque = e.touches[0].clientX), { passive: true });
    visor.addEventListener('touchend', (e) => {
      if (inicioToque === null) return;
      const distancia = e.changedTouches[0].clientX - inicioToque;
      if (Math.abs(distancia) > 50) mostrar(atual + (distancia < 0 ? 1 : -1));
      inicioToque = null;
    });
  }

  // Painel lateral (três pontinhos do topo): atalhos e área da equipe
  const painel = document.querySelector('[data-painel]');
  const fundoPainel = document.querySelector('[data-painel-fundo]');
  const botaoPainel = document.querySelector('[data-abrir-painel]');
  if (painel && fundoPainel && botaoPainel) {
    const aberto = () => painel.classList.contains('painel--aberto');
    const abrir = () => {
      painel.inert = false;
      fundoPainel.hidden = false;
      requestAnimationFrame(() => {
        painel.classList.add('painel--aberto');
        fundoPainel.classList.add('painel-fundo--visivel');
      });
      botaoPainel.setAttribute('aria-expanded', 'true');
      document.body.classList.add('painel-aberto');
      painel.querySelector('[data-fechar-painel]').focus();
    };
    const fechar = () => {
      painel.classList.remove('painel--aberto');
      fundoPainel.classList.remove('painel-fundo--visivel');
      botaoPainel.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('painel-aberto');
      painel.inert = true;
      setTimeout(() => {
        if (!aberto()) fundoPainel.hidden = true;
      }, 300);
      botaoPainel.focus();
    };
    botaoPainel.addEventListener('click', () => (aberto() ? fechar() : abrir()));
    painel.querySelector('[data-fechar-painel]').addEventListener('click', fechar);
    fundoPainel.addEventListener('click', fechar);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && aberto()) fechar();
    });
  }

  // Criar conta: mostra o formulário e envia o pedido à G&F pelo WhatsApp (o administrador libera a conta)
  document.querySelectorAll('[data-criar-conta]').forEach((botao) => {
    const form = botao.parentElement.querySelector('[data-form-conta]');
    if (!form) return;
    botao.addEventListener('click', () => {
      form.hidden = !form.hidden;
      botao.setAttribute('aria-expanded', String(!form.hidden));
      if (!form.hidden) form.elements.nome.focus();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const texto = form.dataset.mensagem
        .replace('{nome}', form.elements.nome.value.trim())
        .replace('{email}', form.elements.email.value.trim());
      window.open(`https://wa.me/${form.dataset.whatsapp}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
    });
  });

  // Entrada suave dos blocos ao rolar
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const alvos = document.querySelectorAll('.cartao, .detalhes > *, .video--principal, .galeria li, .contato-atleta__grade');
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
