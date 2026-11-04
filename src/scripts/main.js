(function () {
    "use strict";

    /* --- CONTEXTO E DADOS --- */
    const ESPACO_NOMES_SVG = "http://www.w3.org/2000/svg";
    const raiz = document.documentElement;
    const corpo = document.body;
    const CONFIGURACAO = window.CONFIGURACAO_SITE || {};
    const DADOS = window.DADOS_GALERIA || {};
    const BASE_IMAGENS = `${corpo.dataset.base || ""}src/assets/images/`;
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

    const CATEGORIAS = Array.isArray(DADOS.categorias)
        ? DADOS.categorias.filter(
                (categoria) => categoria && possuiValor(categoria.identificador) && possuiValor(categoria.rotulo)
        )
        : [];
    const MAPA_CATEGORIAS = new Map(CATEGORIAS.map((categoria) => [categoria.identificador, categoria]));
    const FOTOGRAFIAS = prepararFotografias(DADOS.fotografias);

    const IMAGEM_RESERVA =
        "data:image/svg+xml;charset=utf-8," +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
                '<rect width="800" height="600" fill="#111821"/>' +
                '<path d="M340 240h120v90H340zM340 310l30-30 25 25 20-20 45 45" fill="none" stroke="#A4AFBD" stroke-width="5" stroke-linejoin="round"/>' +
                '<text x="400" y="390" fill="#A4AFBD" font-family="Segoe UI, Arial, sans-serif" font-size="26" text-anchor="middle">Imagem indisponível</text>' +
                "</svg>"
        );

    const ICONES = {
        setaEsquerda: "M19 12H5M11 18l-6-6 6-6",
        setaDireita: "M5 12h14M13 6l6 6-6 6",
        fechar: "M6 6l12 12M18 6L6 18",
        expandir: "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5",
        externo: "M7 17L17 7M9 7h8v8",
    };

    const CAMPOS_METADADOS = [
        ["aeronave", "Aeronave"],
        ["fabricante", "Fabricante"],
        ["companhia", "Companhia / operador"],
        ["matricula", "Matrícula"],
        ["local", "Local"],
        ["data", "Data"],
    ];

    /* --- UTILITÁRIOS --- */
    function selecionarElemento(seletor, contexto = document) {
        return contexto.querySelector(seletor);
    }

    function selecionarTodosElementos(seletor, contexto = document) {
        return Array.from(contexto.querySelectorAll(seletor));
    }

    function possuiValor(valor) {
        if (valor === null || valor === undefined) {
            return false;
        }
        return typeof valor === "string" ? valor.trim().length > 0 : true;
    }

    function normalizarTexto(valor) {
        return String(valor ?? "")
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .toLowerCase()
            .trim();
    }

    function converterEmTermosPesquisa(valor) {
        return normalizarTexto(valor).split(/\s+/).filter(Boolean);
    }

    function pluralizar(quantidade, singular, formaPlural) {
        return `${quantidade} ${quantidade === 1 ? singular : formaPlural}`;
    }

    function atrasarExecucao(funcaoRetorno, atraso) {
        let temporizador;
        return (...argumentosRecebidos) => {
            window.clearTimeout(temporizador);
            temporizador = window.setTimeout(() => funcaoRetorno(...argumentosRecebidos), atraso);
        };
    }

    function ehNumeroPositivo(valor) {
        return Number.isFinite(Number(valor)) && Number(valor) > 0;
    }

    function ehUrlExternaSegura(valor) {
        try {
            return new URL(valor).protocol === "https:";
        } catch {
            return false;
        }
    }

    function resolverImagem(caminho) {
        if (!possuiValor(caminho)) {
            return "";
        }
        const valor = String(caminho).trim();

        if (ehUrlExternaSegura(valor)) {
            return valor;
        }
        return BASE_IMAGENS + valor.replace(/^\/+/, "");
    }

    function obterRotuloCategoria(identificador) {
        return MAPA_CATEGORIAS.get(identificador)?.rotulo || "Sem categoria";
    }

    function comportamentoRolagem() {
        return movimentoReduzido.matches ? "auto" : "smooth";
    }

    function criarElemento(etiqueta, opcoes = {}, filhos = []) {
        const elemento = document.createElement(etiqueta);
        const { classe, texto, atributos, conjuntoDados } = opcoes;
        if (classe) {
            elemento.className = classe;
        }

        if (texto !== undefined && texto !== null) {
            elemento.textContent = String(texto);
        }

        if (atributos) {
            Object.entries(atributos).forEach(([nome, valor]) => {
                if (valor === undefined || valor === null || valor === false) {
                    return;
                }
                elemento.setAttribute(nome, valor === true ? "" : String(valor));
            });
        }

        if (conjuntoDados) {
            Object.assign(elemento.dataset, conjuntoDados);
        }
        filhos.filter(Boolean).forEach((filho) => elemento.append(filho));
        return elemento;
    }

    function criarIcone(nome, classe = "icone") {
        const svg = document.createElementNS(ESPACO_NOMES_SVG, "svg");

        svg.setAttribute("class", classe);
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("aria-hidden", "true");
        svg.setAttribute("focusable", "false");

        const caminhoSvg = document.createElementNS(ESPACO_NOMES_SVG, "path");

        caminhoSvg.setAttribute("d", ICONES[nome] || "");
        svg.append(caminhoSvg);

        return svg;
    }

    const formatadorDia = new Intl.DateTimeFormat("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });
    const formatadorMes = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });

    function formatarData(valor) {
        if (!possuiValor(valor)) { 
            return "";
        }
        
        const textoOriginal = String(valor).trim();
        const correspondencia = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(textoOriginal);
        if (!correspondencia) {
            return textoOriginal;
        }

        const [, ano, mes, dia] = correspondencia;
        const data = new Date(Date.UTC(Number(ano), Number(mes) - 1, dia ? Number(dia) : 1));
        if (Number.isNaN(data.getTime())) {
            return textoOriginal;
        }
        
        return (dia ? formatadorDia : formatadorMes).format(data);
    }

    function prepararFotografias(lista) {
        if (!Array.isArray(lista)) {
            return [];
        }

        const identificadoresVistos = new Set();
        return lista
            .filter((fotografia) => {
                const ehValida =
                    fotografia &&
                    possuiValor(fotografia.identificador) &&
                    possuiValor(fotografia.imagem) &&
                    !identificadoresVistos.has(fotografia.identificador);
                if (!ehValida) {
                    console.warn(
                        "[galeria] Registro ignorado: identificador ausente/duplicado ou imagem não informada.",
                        fotografia
                    );
                    return false;
                }
                identificadoresVistos.add(fotografia.identificador);
                return true;
            })
            .map((fotografia) => {
                const titulo = possuiValor(fotografia.titulo)
                    ? String(fotografia.titulo).trim()
                    : "Fotografia sem título";
                const camposPesquisaveis = [
                    titulo,
                    fotografia.aeronave,
                    fotografia.fabricante,
                    fotografia.companhia,
                    fotografia.matricula,
                    fotografia.local,
                    fotografia.descricao,
                    obterRotuloCategoria(fotografia.categoria),
                ];
                return {
                    ...fotografia,
                    titulo,
                    indicePesquisa: normalizarTexto(camposPesquisaveis.filter(possuiValor).join(" ")),
                };
            });
    }

    function criarImagemFotografia(fotografia, classe, { carregamentoImediato = false } = {}) {
        const usarMiniatura = possuiValor(fotografia.miniatura);
        const atributos = {
            src: resolverImagem(usarMiniatura ? fotografia.miniatura : fotografia.imagem),
            alt: possuiValor(fotografia.textoAlternativo) ? fotografia.textoAlternativo : fotografia.titulo,
            loading: carregamentoImediato ? "eager" : "lazy",
            decoding: "async",
        };

        if (ehNumeroPositivo(fotografia.largura) && ehNumeroPositivo(fotografia.altura)) {
            atributos.width = fotografia.largura;
            atributos.height = fotografia.altura;
        }

        const conjuntoDados = usarMiniatura ? { origemImagemReserva: resolverImagem(fotografia.imagem) } : undefined;
        return criarElemento("img", { classe, atributos, conjuntoDados });
    }

    function acompanharCarregamentoImagem(imagem, alvo) {
        const marcarCarregada = () => alvo.classList.add("esta-carregado");
        if (imagem.complete && imagem.naturalWidth > 0) {
            marcarCarregada();
        } else {
            imagem.addEventListener("load", marcarCarregada);
        }
    }

    function aplicarImagemReserva(imagem) {
        if (imagem.dataset.imagemReserva === "desligada" || imagem.dataset.reservaAplicada === "true") {
            return;
        }

        if (imagem.dataset.origemImagemReserva && imagem.dataset.reservaTentada !== "true") {
            imagem.dataset.reservaTentada = "true";
            imagem.src = imagem.dataset.origemImagemReserva;
            return;
        }

        imagem.dataset.reservaAplicada = "true";
        imagem.removeAttribute("srcset");
        imagem.src = IMAGEM_RESERVA;
        imagem.closest("[data-moldura-imagem]")?.classList.add("imagem-ausente");
    }

    function inicializarImagemReserva() {
        document.addEventListener(
            "error",
            (evento) => {
                if (evento.target instanceof HTMLImageElement) {
                    aplicarImagemReserva(evento.target);
                }
            },
            true
        );
        selecionarTodosElementos("img").forEach((imagem) => {
            if (imagem.complete && imagem.naturalWidth === 0 && possuiValor(imagem.getAttribute("src"))) {
                aplicarImagemReserva(imagem);
            }
        });
    }

    function inicializarCabecalho() {
        const cabecalho = selecionarElemento("[data-cabecalho]");
        if (!cabecalho) {
            return;
        }
        const progresso = selecionarElemento("[data-progresso-rolagem]", cabecalho);
        let atualizacaoAgendada = false;

        const atualizar = () => {
            const posicaoRolagem = window.scrollY;
            cabecalho.classList.toggle("esta-rolado", posicaoRolagem > 24);
            if (progresso) {
                const rolagemMaxima = raiz.scrollHeight - window.innerHeight;
                progresso.style.transform = `scaleX(${rolagemMaxima > 0 ? Math.min(posicaoRolagem / rolagemMaxima, 1) : 0})`;
            }
            atualizacaoAgendada = false;
        };

        window.addEventListener(
            "scroll",
            () => {
                if (atualizacaoAgendada) {
                    return;
                }
                atualizacaoAgendada = true;
                window.requestAnimationFrame(atualizar);
            },
            { passive: true }
        );
        atualizar();
    }

    function marcarLinksNavegacaoAtivos() {
        const pagina = corpo.dataset.pagina;
        selecionarTodosElementos("[data-link-navegacao]").forEach((link) => {
            if (link.dataset.linkNavegacao === pagina) {
                link.setAttribute("aria-current", "page");
            }
        });
    }

    function inicializarNavegacao() {
        marcarLinksNavegacaoAtivos();
        const botaoAlternar = selecionarElemento("[data-alternar-menu]");
        const navegacao = selecionarElemento("[data-navegacao]");
        if (!botaoAlternar || !navegacao) {
            return;
        }

        const rotulo = selecionarElemento("[data-rotulo-alternar-menu]", botaoAlternar);
        const telaGrande = window.matchMedia("(min-width: 900px)");
        const areasExternas = selecionarTodosElementos("main, footer");

        const definirAberto = (aberto, { devolverFoco = true } = {}) => {
            botaoAlternar.setAttribute("aria-expanded", String(aberto));
            if (rotulo) {
                rotulo.textContent = aberto ? "Fechar menu" : "Abrir menu";
            }

            navegacao.classList.toggle("esta-aberto", aberto);
            raiz.classList.toggle("menu-esta-aberto", aberto);
            areasExternas.forEach((elemento) => {
                elemento.inert = aberto;
            });

            if (aberto) {
                selecionarElemento("a", navegacao)?.focus({ preventScroll: true });
            } else if (devolverFoco) {
                botaoAlternar.focus({ preventScroll: true });
            }
        };

        const estaAberto = () => navegacao.classList.contains("esta-aberto");

        botaoAlternar.addEventListener("click", () => definirAberto(!estaAberto()));
        navegacao.addEventListener("click", (evento) => {
            if (evento.target.closest("a") && estaAberto()) {
                definirAberto(false, { devolverFoco: false });
            }
        });
        document.addEventListener("keydown", (evento) => {
            if (evento.key === "Escape" && estaAberto()) {
                definirAberto(false);
            }
        });
        telaGrande.addEventListener("change", (evento) => {
            if (evento.matches && estaAberto()) {
                definirAberto(false, { devolverFoco: false });
            }
        });
    }

    function inicializarAnoRodape() {
        const ano = String(new Date().getFullYear());
        selecionarTodosElementos("[data-ano-atual]").forEach((elemento) => {
            elemento.textContent = ano;
        });
    }

    function inicializarVoltarAoTopo() {
        selecionarTodosElementos("[data-voltar-ao-topo]").forEach((botao) => {
            botao.addEventListener("click", () => {
                window.scrollTo({ top: 0, behavior: comportamentoRolagem() });
                selecionarElemento(".marca")?.focus({ preventScroll: true });
            });
        });
    }

    function inicializarNomeFotografo() {
        if (!possuiValor(CONFIGURACAO.nomeFotografo)) {
            return;
        }

        selecionarTodosElementos("[data-nome-fotografo]").forEach((elemento) => {
            elemento.textContent = CONFIGURACAO.nomeFotografo;
        });
    }

    function obterEmailContato() {
        const email = possuiValor(CONFIGURACAO.emailContato) ? String(CONFIGURACAO.emailContato).trim() : "";
        return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(email) ? email : "";
    }

    function inicializarLinksContato() {
        const email = obterEmailContato();
        selecionarTodosElementos("[data-email-contato]").forEach((link) => {
            if (!email) {
                link.hidden = true;
                return;
            }

            const parametros = [];
            if (link.dataset.assuntoContato) {
                parametros.push(`subject=${encodeURIComponent(link.dataset.assuntoContato)}`);
            }

            if (link.dataset.corpoContato) {
                parametros.push(`body=${encodeURIComponent(link.dataset.corpoContato)}`);
            }

            link.href = `mailto:${email}${parametros.length ? `?${parametros.join("&")}` : ""}`;
            if (link.hasAttribute("data-texto-contato")) {
                link.textContent = email;
            }
        });
    }

    function inicializarRedesSociais() {
        const listas = selecionarTodosElementos("[data-lista-redes-sociais]");
        if (!listas.length) {
            return;
        }

        const perfis = (Array.isArray(CONFIGURACAO.redesSociais) ? CONFIGURACAO.redesSociais : []).filter(
            (perfil) => perfil && possuiValor(perfil.rede) && ehUrlExternaSegura(perfil.url)
        );

        listas.forEach((lista) => {
            const itens = perfis.map((perfil) =>
                criarElemento("li", {}, [
                    criarElemento(
                        "a",
                        {
                            classe: "link-rede-social",
                            texto: perfil.rede,
                            atributos: { href: perfil.url, target: "_blank", rel: "noopener noreferrer me" },
                        },
                        [
                            criarElemento("span", { classe: "visualmente-oculto", texto: " (abre em nova aba)" }),
                            criarIcone("externo"),
                        ]
                    ),
                ])
            );
            lista.replaceChildren(...itens);
            lista.hidden = itens.length === 0;
            const mensagemVazia = lista.parentElement && selecionarElemento("[data-vazio-redes-sociais]", lista.parentElement);
            if (mensagemVazia) {
                mensagemVazia.hidden = itens.length > 0;
            }
        });
    }

    /* --- ANIMAÇÕES DE ENTRADA --- */
    let observadorRevelacao = null;

    function inicializarRevelacao() {
        if ("IntersectionObserver" in window && !movimentoReduzido.matches) {
            raiz.classList.add("possui-revelacao");
            observadorRevelacao = new IntersectionObserver(
                (entradas) => {
                    entradas.forEach((entrada) => {
                        if (!entrada.isIntersecting) {
                            return;
                        }
                        entrada.target.classList.add("esta-visivel");
                        observadorRevelacao.unobserve(entrada.target);
                    });
                },
                { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
            );
        }
        observarRevelacao(selecionarTodosElementos("[data-revelar]"));
    }

    function observarRevelacao(elementos) {
        elementos.forEach((elemento) => {
            if (observadorRevelacao) {
                observadorRevelacao.observe(elemento);
            } else {
                elemento.classList.add("esta-visivel");
            }
        });
    }

    function inicializarEstatisticas() {
        const valores = {
            fotografias: FOTOGRAFIAS.length,
            categorias: new Set(
                FOTOGRAFIAS.map((fotografia) => fotografia.categoria).filter((identificador) =>
                    MAPA_CATEGORIAS.has(identificador)
                )
            ).size,
            fabricantes: new Set(FOTOGRAFIAS.map((fotografia) => fotografia.fabricante).filter(possuiValor)).size,
        };

        selecionarTodosElementos("[data-estatistica]").forEach((elemento) => {
            const valor = valores[elemento.dataset.estatistica];
            if (valor !== undefined) {
                elemento.textContent = String(valor);
            }
        });

        selecionarTodosElementos("[data-contagem-categoria]").forEach((elemento) => {
            const quantidade = FOTOGRAFIAS.filter(
                (fotografia) => fotografia.categoria === elemento.dataset.contagemCategoria
            ).length;
            elemento.textContent = pluralizar(quantidade, "fotografia", "fotografias");
        });
    }

    function criarItemDestaque(fotografia, indice) {
        const imagem = criarImagemFotografia(fotografia, "item-destaque__imagem");
        const botao = criarElemento(
            "button",
            {
                classe: "item-destaque",
                atributos: {
                    type: "button",
                    "aria-label": `Ampliar fotografia: ${fotografia.titulo}`,
                    "data-revelar": true,
                    "data-moldura-imagem": true,
                },
                conjuntoDados: { identificadorFotografia: fotografia.identificador },
            },
            [
                imagem,
                criarElemento("span", { classe: "item-destaque__legenda" }, [
                    criarElemento("span", {
                        classe: "item-destaque__categoria",
                        texto: obterRotuloCategoria(fotografia.categoria),
                    }),
                    criarElemento("span", { classe: "item-destaque__titulo", texto: fotografia.titulo }),
                ]),
                criarElemento("span", { classe: "item-destaque__ampliar" }, [criarIcone("expandir")]),
            ]
        );
        botao.style.setProperty("--atraso-revelacao", `${(indice % 3) * 90}ms`);
        acompanharCarregamentoImagem(imagem, botao);
        return botao;
    }

    function inicializarDestaques(visualizadorAmpliado) {
        const grade = selecionarElemento("[data-grade-destaques]");
        if (!grade) {
            return;
        }

        const destaques = FOTOGRAFIAS.filter((fotografia) => fotografia.destaque === true).slice(0, 6);

        if (!destaques.length) {
            grade.replaceChildren(
                criarElemento("p", {
                    classe: "vazio-em-linha",
                    texto: "Nenhuma fotografia em destaque cadastrada no momento.",
                })
            );
            return;
        }

        const itens = destaques.map(criarItemDestaque);
        grade.replaceChildren(...itens);
        observarRevelacao(itens);

        grade.addEventListener("click", (evento) => {
            const acionador = evento.target.closest("[data-identificador-fotografia]");
            if (!acionador) {
                return;
            }

            const indice = destaques.findIndex(
                (fotografia) => fotografia.identificador === acionador.dataset.identificadorFotografia
            );
            
            if (indice >= 0) {
                visualizadorAmpliado.abrir(destaques, indice, acionador);
            }
        });
    }

    function criarVisualizadorAmpliado() {
        let dialogo = null;
        let referencias = {};
        let itens = [];
        let indiceAtual = 0;
        let elementoAcionador = null;
        let temporizadorFechamento = 0;
        let inicioToque = null;

        function construir() {
            referencias.imagem = criarElemento("img", {
                classe: "visualizador-ampliado__imagem",
                atributos: { 
                    alt: "", 
                    decoding: "async" 
                },
                conjuntoDados: { 
                    imagemReserva: "desligada" 
                },
            });

            referencias.carregador = criarElemento("span", {
                classe: "visualizador-ampliado__carregador",
                atributos: { 
                    "aria-hidden": "true" 
                },
            });

            referencias.erro = criarElemento("p", {
                classe: "visualizador-ampliado__erro",
                texto: "Não foi possível carregar esta fotografia.",
                atributos: { 
                    hidden: true 
                },
            });

            referencias.anterior = criarElemento(
                "button",
                {
                    classe: "visualizador-ampliado__navegacao visualizador-ampliado__navegacao--anterior",
                    atributos: { 
                        type: "button", 
                        "aria-label": "Fotografia anterior" 
                    },
                },
                [criarIcone("setaEsquerda")]
            );

            referencias.proxima = criarElemento(
                "button",
                {
                    classe: "visualizador-ampliado__navegacao visualizador-ampliado__navegacao--proxima",
                    atributos: { 
                        type: "button", 
                        "aria-label": "Próxima fotografia" 
                    },
                },
                [criarIcone("setaDireita")]
            );

            referencias.fechar = criarElemento(
                "button",
                {
                    classe: "visualizador-ampliado__fechar",
                    atributos: { 
                        type: "button", 
                        "aria-label": "Fechar visualização ampliada" 
                    },
                },
                [criarIcone("fechar")]
            );
            
            referencias.contador = criarElemento("p", {
                classe: "visualizador-ampliado__contador",
                atributos: { 
                    "aria-live": "polite" 
                },
            });

            referencias.categoria = criarElemento("p", { 
                classe: "visualizador-ampliado__categoria" 
            });

            referencias.titulo = criarElemento("h2", {
                classe: "visualizador-ampliado__titulo",
                atributos: { 
                    id: "titulo-visualizador-ampliado" 
                },
            });

            referencias.descricao = criarElemento("p", { 
                classe: "visualizador-ampliado__descricao" 
            });

            referencias.metadados = criarElemento("dl", { 
                classe: "visualizador-ampliado__metadados" 
            });

            referencias.palco = criarElemento("div", { 
                classe: "visualizador-ampliado__palco" 
            }, [
                referencias.anterior,
                criarElemento("figure", { classe: "visualizador-ampliado__figura" }, [
                    criarElemento("div", { classe: "visualizador-ampliado__midia" }, [
                        referencias.imagem,
                        referencias.carregador,
                    ]),
                    referencias.erro,
                ]),
                referencias.proxima,
            ]);

            const informacoes = criarElemento("div", { 
                classe: "visualizador-ampliado__informacoes" 
            }, [
                referencias.categoria,
                referencias.titulo,
                referencias.descricao,
                referencias.metadados,
                criarElemento("p", {
                    classe: "visualizador-ampliado__dica",
                    texto: "Use as setas ← → para navegar e Esc para fechar.",
                    atributos: { "aria-hidden": "true" },
                }),
            ]);

            dialogo = criarElemento(
                "dialog",
                {
                    classe: "visualizador-ampliado",
                    atributos: { "aria-labelledby": "titulo-visualizador-ampliado" },
                },
                [
                    criarElemento("div", { classe: "visualizador-ampliado__barra-superior" }, [
                        referencias.contador,
                        referencias.fechar,
                    ]),
                    criarElemento("div", { classe: "visualizador-ampliado__corpo" }, [
                        referencias.palco,
                        informacoes,
                    ]),
                ]
            );
            document.body.append(dialogo);
            vincularEventos();
        }

        function vincularEventos() {
            referencias.fechar.addEventListener("click", solicitarFechamento);
            referencias.anterior.addEventListener("click", () => mudarFotografia(-1));
            referencias.proxima.addEventListener("click", () => mudarFotografia(1));

            referencias.imagem.addEventListener("load", () => {
                dialogo.classList.remove("esta-carregando");
                referencias.imagem.classList.add("esta-pronto");
            });

            referencias.imagem.addEventListener("error", () => {
                dialogo.classList.remove("esta-carregando");
                referencias.imagem.classList.remove("esta-pronto");
                referencias.erro.hidden = false;
            });

            dialogo.addEventListener("cancel", (evento) => {
                evento.preventDefault();
                solicitarFechamento();
            });

            dialogo.addEventListener("close", limparFechamento);
            dialogo.addEventListener("click", (evento) => {
                if (evento.target === dialogo || evento.target === referencias.palco) {
                    solicitarFechamento();
                }
            });

            dialogo.addEventListener("keydown", (evento) => {
                if (evento.key === "ArrowRight") {
                    evento.preventDefault();
                    mudarFotografia(1);
                } else if (evento.key === "ArrowLeft") {
                    evento.preventDefault();
                    mudarFotografia(-1);
                }
            });

            referencias.palco.addEventListener(
                "touchstart",
                (evento) => {
                    if (evento.touches.length !== 1) {
                        return;
                    }
                    inicioToque = { 
                        x: evento.touches[0].clientX, 
                        y: evento.touches[0].clientY 
                    };
                },
                { passive: true }
            );

            referencias.palco.addEventListener(
                "touchend",
                (evento) => {
                    if (!inicioToque) {
                        return;
                    }

                    const toque = evento.changedTouches[0];
                    const deslocamentoHorizontal = toque.clientX - inicioToque.x;
                    const deslocamentoVertical = toque.clientY - inicioToque.y;
                    inicioToque = null;
                    
                    if (Math.abs(deslocamentoHorizontal) > 50 && Math.abs(deslocamentoHorizontal) > Math.abs(deslocamentoVertical) * 1.5) {
                        mudarFotografia(deslocamentoHorizontal < 0 ? 1 : -1);
                    }
                },
                { passive: true }
            );
        }

        function construirLinhasMetadados(fotografia) {
            return CAMPOS_METADADOS.filter(([chave]) => possuiValor(fotografia[chave])).map(([chave, rotulo]) =>
                criarElemento("div", { classe: "visualizador-ampliado__linha-metadados" }, [
                    criarElemento("dt", { texto: rotulo }),
                    criarElemento("dd", {
                        texto: chave === "data" ? formatarData(fotografia[chave]) : String(fotografia[chave]),
                    }),
                ])
            );
        }

        function renderizar() {
            const fotografia = itens[indiceAtual];
            const origem = resolverImagem(fotografia.imagem);

            dialogo.classList.add("esta-carregando");
            referencias.erro.hidden = true;
            referencias.imagem.classList.remove("esta-pronto");
            referencias.imagem.alt = possuiValor(fotografia.textoAlternativo)
                ? fotografia.textoAlternativo
                : fotografia.titulo;
            
            if (ehNumeroPositivo(fotografia.largura) && ehNumeroPositivo(fotografia.altura)) {
                referencias.imagem.width = Number(fotografia.largura);
                referencias.imagem.height = Number(fotografia.altura);
            } else {
                referencias.imagem.removeAttribute("width");
                referencias.imagem.removeAttribute("height");
            }
            
            referencias.imagem.src = origem;
            if (referencias.imagem.complete && referencias.imagem.naturalWidth > 0) {
                dialogo.classList.remove("esta-carregando");
                referencias.imagem.classList.add("esta-pronto");
            }

            referencias.categoria.textContent = obterRotuloCategoria(fotografia.categoria);
            referencias.titulo.textContent = fotografia.titulo;
            referencias.descricao.textContent = possuiValor(fotografia.descricao) ? fotografia.descricao : "";
            referencias.descricao.hidden = !possuiValor(fotografia.descricao);

            const linhas = construirLinhasMetadados(fotografia);
            
            referencias.metadados.replaceChildren(...linhas);
            referencias.metadados.hidden = linhas.length === 0;

            const possuiVarias = itens.length > 1;
            referencias.anterior.hidden = !possuiVarias;
            referencias.proxima.hidden = !possuiVarias;
            referencias.contador.textContent = `${indiceAtual + 1} / ${itens.length}`;

            preCarregarVizinhas();
        }

        function preCarregarVizinhas() {
            if (itens.length < 2) {
                return;
            }

            [1, -1].forEach((deslocamento) => {
                const fotografia = itens[(indiceAtual + deslocamento + itens.length) % itens.length];
                const imagem = new Image();
                imagem.decoding = "async";
                imagem.src = resolverImagem(fotografia.imagem);
            });
        }

        function mudarFotografia(deslocamento) {
            if (itens.length < 2) {
                return;
            }
            indiceAtual = (indiceAtual + deslocamento + itens.length) % itens.length;
            renderizar();
        }

        function abrir(lista, indice, elementoAcionadorRecebido) {
            if (!Array.isArray(lista) || !lista.length) {
                return;
            }

            if (!dialogo) {
                construir();
            }

            window.clearTimeout(temporizadorFechamento);
            dialogo.classList.remove("esta-fechando");

            itens = lista;
            indiceAtual = Math.min(Math.max(indice, 0), lista.length - 1);
            elementoAcionador = elementoAcionadorRecebido || document.activeElement;
            renderizar();

            if (!dialogo.open) {
                if (typeof dialogo.showModal === "function") {
                    dialogo.showModal();
                } else {
                    dialogo.setAttribute("open", "");
                }
            }
            raiz.classList.add("rolagem-bloqueada");
            referencias.fechar.focus();
        }

        function solicitarFechamento() {
            if (!dialogo || !dialogo.open) {
                return;
            }

            if (movimentoReduzido.matches) {
                dialogo.close();
                return;
            }
            dialogo.classList.add("esta-fechando");
            window.clearTimeout(temporizadorFechamento);
            temporizadorFechamento = window.setTimeout(() => dialogo.close(), 220);
        }

        function limparFechamento() {
            window.clearTimeout(temporizadorFechamento);
            dialogo.classList.remove("esta-fechando");
            raiz.classList.remove("rolagem-bloqueada");
            if (elementoAcionador && document.contains(elementoAcionador)) {
                elementoAcionador.focus({ preventScroll: true });
            }
            elementoAcionador = null;
        }

        return { abrir };
    }

    function criarItemGaleria(fotografia, indice) {
        const imagem = criarImagemFotografia(fotografia, "cartao-fotografia__imagem", {
            carregamentoImediato: indice < 4,
        });

        const moldura = criarElemento(
            "span",
            { 
                classe: "cartao-fotografia__moldura", 
                atributos: { 
                    "data-moldura-imagem": true 
                } 
            },
            [imagem, criarElemento("span", { classe: "cartao-fotografia__ampliar" }, [criarIcone("expandir")])]
        );

        if (ehNumeroPositivo(fotografia.largura) && ehNumeroPositivo(fotografia.altura)) {
            moldura.style.aspectRatio = `${fotografia.largura} / ${fotografia.altura}`;
        }
        acompanharCarregamentoImagem(imagem, moldura);

        const subtitulo = [fotografia.aeronave, fotografia.matricula].filter(possuiValor).join(" · ");
        const botao = criarElemento(
            "button",
            {
                classe: "cartao-fotografia",
                atributos: {
                    type: "button",
                    "aria-label": `Ampliar fotografia: ${fotografia.titulo}${subtitulo ? ` (${subtitulo})` : ""}`,
                },
                conjuntoDados: { identificadorFotografia: fotografia.identificador },
            },
            [
                moldura,
                criarElemento("span", { classe: "cartao-fotografia__metadados" }, [
                    criarElemento("span", {
                        classe: "cartao-fotografia__categoria",
                        texto: obterRotuloCategoria(fotografia.categoria),
                    }),
                    criarElemento("span", { classe: "cartao-fotografia__titulo", texto: fotografia.titulo }),
                    subtitulo
                        ? criarElemento("span", { classe: "cartao-fotografia__subtitulo", texto: subtitulo })
                        : null,
                ]),
            ]
        );

        const item = criarElemento("li", { classe: "grade-galeria__item" }, [botao]);
        item.style.setProperty("--indice-item", String(Math.min(indice, 12)));
        return item;
    }

    function inicializarGaleria(visualizadorAmpliado) {
        const grade = selecionarElemento("[data-grade-galeria]");
        if (!grade) {
            return;
        }

        const elementosInterface = {
            barraFerramentas: selecionarElemento("[data-barra-ferramentas-galeria]"),
            pesquisa: selecionarElemento("[data-pesquisa-galeria]"),
            filtros: selecionarElemento("[data-filtros-galeria]"),
            fabricante: selecionarElemento("[data-fabricante-galeria]"),
            status: selecionarElemento("[data-status-galeria]"),
            vazio: selecionarElemento("[data-vazio-galeria]"),
            tituloVazio: selecionarElemento("[data-titulo-vazio-galeria]"),
            textoVazio: selecionarElemento("[data-texto-vazio-galeria]"),
            botoesLimpar: selecionarTodosElementos("[data-limpar-galeria]"),
        };

        const fabricantes = Array.from(
            new Set(FOTOGRAFIAS.map((fotografia) => fotografia.fabricante).filter(possuiValor))
        ).sort((primeiro, segundo) => primeiro.localeCompare(segundo, "pt-BR"));

        const parametros = new URLSearchParams(window.location.search);
        const estado = {
            categoria: parametros.get("categoria") || "todas",
            fabricante: parametros.get("fabricante") || "",
            consulta: parametros.get("busca") || "",
        };

        if (estado.categoria !== "todas" && !MAPA_CATEGORIAS.has(estado.categoria)) {
            estado.categoria = "todas";
        }

        if (estado.fabricante && !fabricantes.includes(estado.fabricante)) {
            estado.fabricante = "";
        }

        let visiveis = [];

        if (elementosInterface.barraFerramentas) {
            elementosInterface.barraFerramentas.hidden = false;
        }

        renderizarFiltros();
        renderizarFabricantes();

        if (elementosInterface.pesquisa) {
            elementosInterface.pesquisa.value = estado.consulta;
        }
        vincularEventos();
        atualizar({ sincronizarUrl: false });

        function renderizarFiltros() {
            if (!elementosInterface.filtros) {
                return;
            }
            const opcoes = [{ identificador: "todas", rotulo: "Todas" }, ...CATEGORIAS];
            elementosInterface.filtros.replaceChildren(
                ...opcoes.map((opcao) => {
                    const quantidade =
                        opcao.identificador === "todas"
                            ? FOTOGRAFIAS.length
                            : FOTOGRAFIAS.filter((fotografia) => fotografia.categoria === opcao.identificador).length;
                    return criarElemento(
                        "button",
                        {
                            classe: "ficha-filtro",
                            atributos: { type: "button", "aria-pressed": "false" },
                            conjuntoDados: { categoria: opcao.identificador },
                        },
                        [
                            criarElemento("span", { texto: opcao.rotulo }),
                            criarElemento("span", { classe: "ficha-filtro__contagem", texto: quantidade }),
                        ]
                    );
                })
            );
        }

        function renderizarFabricantes() {
            if (!elementosInterface.fabricante) {
                return;
            }

            const opcoes = fabricantes.map((nome) =>
                criarElemento("option", { texto: nome, atributos: { value: nome } })
            );
            elementosInterface.fabricante.append(...opcoes);
            elementosInterface.fabricante.disabled = fabricantes.length === 0;
        }

        function vincularEventos() {
            elementosInterface.filtros?.addEventListener("click", (evento) => {
                const botao = evento.target.closest("[data-categoria]");
                if (!botao) {
                    return;
                }
                estado.categoria = botao.dataset.categoria;
                atualizar();
            });

            elementosInterface.fabricante?.addEventListener("change", () => {
                estado.fabricante = elementosInterface.fabricante.value;
                atualizar();
            });

            elementosInterface.pesquisa?.addEventListener(
                "input",
                atrasarExecucao(() => {
                    estado.consulta = elementosInterface.pesquisa.value;
                    atualizar();
                }, 140)
            );

            elementosInterface.botoesLimpar.forEach((botao) => botao.addEventListener("click", limpar));
            grade.addEventListener("click", (evento) => {
                const acionador = evento.target.closest("[data-identificador-fotografia]");
                if (!acionador) {
                    return;
                }

                const indice = visiveis.findIndex(
                    (fotografia) => fotografia.identificador === acionador.dataset.identificadorFotografia
                );

                if (indice >= 0) {
                    visualizadorAmpliado.abrir(visiveis, indice, acionador);
                }
            });
        }

        function possuiFiltrosAtivos() {
            return estado.categoria !== "todas" || estado.fabricante !== "" || estado.consulta.trim() !== "";
        }

        function atualizar({ sincronizarUrl = true } = {}) {
            const termos = converterEmTermosPesquisa(estado.consulta);
            visiveis = FOTOGRAFIAS.filter(
                (fotografia) =>
                    (estado.categoria === "todas" || fotografia.categoria === estado.categoria) &&
                    (!estado.fabricante || fotografia.fabricante === estado.fabricante) &&
                    termos.every((termo) => fotografia.indicePesquisa.includes(termo))
            );
            sincronizarControles();
            renderizarGrade();
            renderizarStatus();
            if (sincronizarUrl) {
                sincronizarEstadoNaUrl();
            }
        }

        function sincronizarControles() {
            selecionarTodosElementos(
                "[data-categoria]",
                elementosInterface.filtros || document.createElement("div")
            ).forEach((botao) => {
                botao.setAttribute("aria-pressed", String(botao.dataset.categoria === estado.categoria));
            });

            if (elementosInterface.fabricante) {
                elementosInterface.fabricante.value = estado.fabricante;
            }

            const filtrado = possuiFiltrosAtivos();
            elementosInterface.botoesLimpar.forEach((botao) => {
                if (botao.hasAttribute("data-limpar-galeria-barra")) {
                    botao.hidden = !filtrado;
                }
            });
        }

        function renderizarGrade() {
            grade.replaceChildren(...visiveis.map(criarItemGaleria));
            grade.hidden = visiveis.length === 0;
            if (!elementosInterface.vazio) {
                return;
            }

            elementosInterface.vazio.hidden = visiveis.length > 0;
            if (visiveis.length > 0) {
                return;
            }

            const semDados = FOTOGRAFIAS.length === 0;
            if (elementosInterface.tituloVazio) {
                elementosInterface.tituloVazio.textContent = semDados
                    ? "Nenhuma fotografia cadastrada"
                    : "Nenhuma fotografia encontrada";
            }

            if (elementosInterface.textoVazio) {
                elementosInterface.textoVazio.textContent = semDados
                    ? "A galeria ainda não possui fotografias publicadas. Volte em breve."
                    : "Tente outro termo de pesquisa, escolha outra categoria ou limpe os filtros para ver todas as fotografias.";
            }

            selecionarTodosElementos("[data-limpar-galeria]", elementosInterface.vazio).forEach((botao) => {
                botao.hidden = semDados;
            });
        }

        function renderizarStatus() {
            if (!elementosInterface.status) {
                return;
            }

            const total = FOTOGRAFIAS.length;
            const quantidade = visiveis.length;
            
            if (quantidade === 0) {
                elementosInterface.status.textContent = "Nenhuma fotografia corresponde aos filtros selecionados.";
            } else if (quantidade === total) {
                elementosInterface.status.textContent = `Exibindo todas as ${pluralizar(total, "fotografia", "fotografias")}.`;
            } else {
                elementosInterface.status.textContent = `Exibindo ${quantidade} de ${pluralizar(total, "fotografia", "fotografias")}.`;
            }
        }

        function sincronizarEstadoNaUrl() {
            const url = new URL(window.location.href);
            const definirParametro = (chave, valor) => {
                if (valor) {
                    url.searchParams.set(chave, valor);
                } else {
                    url.searchParams.delete(chave);
                }
            };

            definirParametro("categoria", estado.categoria !== "todas" ? estado.categoria : "");
            definirParametro("fabricante", estado.fabricante);
            definirParametro("busca", estado.consulta.trim());
            
            try {
                window.history.replaceState(null, "", url);
            } catch {
                /* --- ALGUNS NAVEGADORES BLOQUEIAM REPLACESTATE EM ARQUIVOS LOCAIS --- */
            }
        }

        function limpar() {
            estado.categoria = "todas";
            estado.fabricante = "";
            estado.consulta = "";
            if (elementosInterface.pesquisa) {
                elementosInterface.pesquisa.value = "";
            }
            atualizar();
            elementosInterface.pesquisa?.focus();
        }
    }

    function inicializarPerguntasFrequentes() {
        const conteiner = selecionarElemento("[data-perguntas-frequentes]");
        if (!conteiner) {
            return;
        }

        const itens = selecionarTodosElementos("[data-item-pergunta]", conteiner);
        const grupos = selecionarTodosElementos("[data-grupo-perguntas]", conteiner);
        const barraFerramentas = selecionarElemento("[data-barra-ferramentas-perguntas]");
        const campoPesquisa = selecionarElemento("[data-pesquisa-perguntas]");
        const filtros = selecionarElemento("[data-filtros-perguntas]");
        const status = selecionarElemento("[data-status-perguntas]");
        const mensagemVazia = selecionarElemento("[data-vazio-perguntas]");
        let categoriaAtiva = "todas";

        conteiner.classList.add("esta-aprimorado");
        if (barraFerramentas) {
            barraFerramentas.hidden = false;
        }

        itens.forEach(configurarItem);

        conteiner.addEventListener("click", (evento) => {
            const gatilho = evento.target.closest(".item-pergunta__gatilho");
            if (gatilho) { 
                alternarItem(gatilho.closest("[data-item-pergunta]"));
            }
        });

        conteiner.addEventListener("keydown", tratarTeclado);
        campoPesquisa?.addEventListener("input", atrasarExecucao(aplicarFiltros, 120));
        filtros?.addEventListener("click", (evento) => {
            const botao = evento.target.closest("[data-filtro-perguntas]");
            if (!botao) {
                return;
            }
            categoriaAtiva = botao.dataset.filtroPerguntas;
            aplicarFiltros();
        });

        selecionarTodosElementos("[data-limpar-perguntas]").forEach((botao) => botao.addEventListener("click", limpar));
        window.addEventListener("hashchange", abrirPeloHash);

        aplicarFiltros();
        abrirPeloHash();

        function configurarItem(item, indice) {
            const gatilho = selecionarElemento(".item-pergunta__gatilho", item);
            const painel = selecionarElemento(".item-pergunta__painel", item);
            if (!gatilho || !painel) {
                return;
            }

            if (!item.id) {
                item.id = `pergunta-${indice + 1}`;
            }

            gatilho.id = `${item.id}-gatilho`;
            painel.id = `${item.id}-painel`;
            gatilho.setAttribute("aria-controls", painel.id);
            gatilho.setAttribute("aria-expanded", "false");
            
            if (!selecionarElemento(".item-pergunta__icone", gatilho)) {
                gatilho.append(
                    criarElemento("span", { 
                        classe: "item-pergunta__icone", 
                        atributos: { "aria-hidden": "true" } 
                    })
                );
            }
            item.dataset.textoPesquisa = normalizarTexto(`${item.textContent} ${item.dataset.palavrasChave || ""}`);
        }

        function definirEstadoItem(item, aberto) {
            const gatilho = selecionarElemento(".item-pergunta__gatilho", item);
            if (!gatilho) {
                return;
            }
            gatilho.setAttribute("aria-expanded", String(aberto));
            item.classList.toggle("esta-aberto", aberto);
        }

        function alternarItem(item) {
            if (item) {
                definirEstadoItem(item, !item.classList.contains("esta-aberto"));
            }
        }

        function tratarTeclado(evento) {
            const gatilho = evento.target.closest(".item-pergunta__gatilho");
            if (!gatilho) {
                return;
            }

            const gatilhos = selecionarTodosElementos(".item-pergunta__gatilho", conteiner).filter(
                (elemento) => !elemento.closest("[hidden]")
            );
            
            const indice = gatilhos.indexOf(gatilho);
            const alvos = {
                ArrowDown: gatilhos[(indice + 1) % gatilhos.length],
                ArrowUp: gatilhos[(indice - 1 + gatilhos.length) % gatilhos.length],
                Home: gatilhos[0],
                End: gatilhos[gatilhos.length - 1],
            };

            const alvo = alvos[evento.key];
            if (!alvo) {
                return;
            }

            evento.preventDefault();
            alvo.focus();
        }

        function aplicarFiltros() {
            const termos = converterEmTermosPesquisa(campoPesquisa?.value);
            let total = 0;

            selecionarTodosElementos("[data-filtro-perguntas]", filtros || document.createElement("div")).forEach(
                (botao) => {
                    botao.setAttribute("aria-pressed", String(botao.dataset.filtroPerguntas === categoriaAtiva));
                }
            );

            grupos.forEach((grupo) => {
                const grupoAtivo = categoriaAtiva === "todas" || grupo.dataset.grupoPerguntas === categoriaAtiva;
                let quantidadeNoGrupo = 0;
                selecionarTodosElementos("[data-item-pergunta]", grupo).forEach((item) => {
                    const corresponde = grupoAtivo && termos.every((termo) => item.dataset.textoPesquisa.includes(termo));
                    item.hidden = !corresponde;
                    if (corresponde) {
                        quantidadeNoGrupo += 1;
                    }
                });
                grupo.hidden = quantidadeNoGrupo === 0;
                total += quantidadeNoGrupo;
            });

            if (mensagemVazia) {
                mensagemVazia.hidden = total > 0;
            }

            if (status) {
                status.textContent =
                    total === 0
                        ? "Nenhuma pergunta encontrada."
                        : termos.length || categoriaAtiva !== "todas"
                            ? `${pluralizar(total, "pergunta encontrada", "perguntas encontradas")}.`
                            : `${pluralizar(total, "pergunta disponível", "perguntas disponíveis")}.`;
            }
        }

        function limpar() {
            categoriaAtiva = "todas";
            if (campoPesquisa) {
                campoPesquisa.value = "";
            }
            aplicarFiltros();
            campoPesquisa?.focus();
        }

        function abrirPeloHash() {
            const identificador = decodeURIComponent(window.location.hash.slice(1));
            if (!identificador) {
                return;
            }

            const item = document.getElementById(identificador);
            if (!item || !item.matches("[data-item-pergunta]")) {
                return;
            }

            if (item.hidden) {
                limpar();
            }
            definirEstadoItem(item, true);
            selecionarElemento(".item-pergunta__gatilho", item)?.focus({ preventScroll: true });
            item.scrollIntoView({ behavior: comportamentoRolagem(), block: "start" });
        }
    }

    function inicializarSumarioAtivo() {
        const navegacao = selecionarElemento("[data-sumario-ativo]");
        if (!navegacao || !("IntersectionObserver" in window)) {
            return;
        }
        const links = selecionarTodosElementos('a[href^="#"]', navegacao);
        const secoes = new Map();
        links.forEach((link) => {
            const secao = document.getElementById(decodeURIComponent(link.hash.slice(1)));
            if (secao) {
                secoes.set(secao, link);
            }
        });

        if (!secoes.size) {
            return;
        }

        const definirAtivo = (linkAtivo) => {
            links.forEach((link) => {
                const ehAtivo = link === linkAtivo;
                link.classList.toggle("esta-ativo", ehAtivo);
                if (ehAtivo) {
                    link.setAttribute("aria-current", "location");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        };

        const observador = new IntersectionObserver(
            (entradas) => {
                entradas.forEach((entrada) => {
                    if (entrada.isIntersecting) {
                        definirAtivo(secoes.get(entrada.target));
                    }
                });
            },
            { rootMargin: "-25% 0px -65% 0px" }
        );
        secoes.forEach((_, secao) => observador.observe(secao));
    }

    function inicializar() {
        raiz.classList.add("javascript-ativo");
        
        inicializarImagemReserva();
        inicializarCabecalho();
        inicializarNavegacao();
        inicializarAnoRodape();
        inicializarVoltarAoTopo();
        inicializarNomeFotografo();
        inicializarLinksContato();
        inicializarRedesSociais();
        inicializarRevelacao();

        const visualizadorAmpliado = criarVisualizadorAmpliado();
        
        inicializarEstatisticas();
        inicializarDestaques(visualizadorAmpliado);
        inicializarGaleria(visualizadorAmpliado);
        inicializarPerguntasFrequentes();
        inicializarSumarioAtivo();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", inicializar);
    } else {
        inicializar();
    }
})();
