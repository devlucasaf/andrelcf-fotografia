<img
    width="100%"
    src="https://capsule-render.vercel.app/api?type=waving&color=A020F0&height=120&section=header"
/>

# ✈️ André LCF · Fotografia de Aviação

Site estático e responsivo para portfólio de fotografia de aviação: aviação comercial, executiva, militar e histórica, aeroportos e eventos aeronáuticos. Desenvolvido somente com HTML5, CSS3 e JavaScript puro, sem frameworks nem dependências externas.

# 🗃️ Estrutura

```
andrelcf-fotografia/
│
├── index.html                  Página inicial
├── src/
│   ├── styles/
│   │   └── estilo-global.css  Identidade visual, componentes e responsividade
│   ├── scripts/
│   │   ├── configuracao.js    Nome, e-mail e redes sociais (valores provisórios)
│   │   ├── dados-galeria.js    Categorias e metadados das fotografias
│   │   └── principal.js        Lógica compartilhada por todas as páginas
│   ├── assets/
│   │   ├── images/
│   │   │   ├── hero/           Imagem principal da página inicial
│   │   │   ├── galeria/        Fotografias em tamanho grande (lightbox)
│   │   │   ├── aircraft/       Imagens institucionais (ex.: seção “Sobre”)
│   │   │   └── thumbnails/     Miniaturas usadas na grade da galeria
│   │   ├── icons/              favicon.svg
│   │   └── logos/              logo.svg
│   └── pages/
│       ├── faq.html
│       ├── galeria.html
│       └── licenca.html
├── LICENSE
├── README.md
└── .gitignore
```

**Alteração estrutural:** foram adicionados `configuracao.js` e `dados-galeria.js` ao lado de `principal.js` para separar dados de lógica. Assim, novas fotografias e informações de contato são editadas sem tocar no código de renderização. Eles são scripts clássicos (não módulos ES), por isso o site também funciona abrindo os arquivos diretamente pelo navegador.

# ✨ Funcionalidades

- **Navegação:** cabeçalho fixo com desfoque e barra de progresso de leitura durante a rolagem, indicador da página ativa, menu móvel em tela cheia (fecha com Esc, por clique em link ou ao ampliar a janela) e link “Pular para o conteúdo”.
- **Página inicial:** hero com animações de entrada e indicador de rolagem; seção “Sobre” com números calculados a partir dos dados da galeria; seis categorias com links para a galeria já filtrada; destaques em grade editorial com lightbox; chamada para ação; rodapé com ano automático e botão “Voltar ao topo”.
- **Galeria:** grade em colunas (masonry) que respeita a proporção original das imagens, filtros por categoria e fabricante, pesquisa sem acentos e com vários termos (modelo, companhia, matrícula, fabricante, local, categoria e descrição), estado vazio e filtros refletidos na URL (`?categoria=militar&busca=a29`).
- **Lightbox:** imagem ampliada com metadados (campos vazios são omitidos), navegação por botões, setas do teclado e gesto de deslizar, fechamento por botão, Esc ou clique fora da imagem, pré-carregamento das imagens vizinhas e mensagem de erro se a imagem falhar.
- **FAQ:** accordion acessível (ARIA gerado automaticamente, navegação com ↑ ↓ Home End), pesquisa, filtros por assunto, links diretos (`faq.html#pergunta-licenciamento`) e mensagem quando não há resultados.
- **Licença:** modelo editável claramente identificado como tal, sumário com destaque da seção atual e link de e-mail com um modelo de solicitação já preenchido.
- **Robustez:** imagens quebradas recebem uma imagem substituta; miniaturas ausentes recorrem à imagem grande; cada módulo só é iniciado se os elementos existirem na página.
- **Acessibilidade:** HTML semântico, foco visível, textos alternativos, `prefers-reduced-motion` respeitado e efeitos de hover limitados a dispositivos com mouse.

# ⚖️ Licenças

- O **código-fonte** é distribuído sob a licença MIT (arquivo `LICENSE`).
- As **fotografias** do fotógrafo **não** estão cobertas pela licença MIT: os direitos são reservados ao autor, conforme a página `licenca.html`.
- As ilustrações provisórias em SVG foram criadas especificamente para este projeto e podem ser usadas livremente até serem substituídas.

# 🛠️ Tecnologias utilizadas

<div align="left">
    <img 
        align="center"
        alt="JavaScript"
        tittle="JavaScript"
        height="40" 
        style="padding-right: 10px;"
        src="https://skillicons.dev/icons?i=javascript" 
    />
    <img
        align="center" 
        alt="HTML" 
        title="HTML"
        height="40" 
        style="padding-right: 10px;" 
        src="https://skillicons.dev/icons?i=html"
    />
    <img
        align="center" 
        alt="CSS" 
        title="CSS"
        height="40" 
        style="padding-right: 10px;" 
        src="https://skillicons.dev/icons?i=css"
    />
    <img
        align="center"
        alt="VsCode"
        tittle="VsCode"
        height="40" 
        style="padding-right: 10px;" 
        src="https://skillicons.dev/icons?i=vscode"
    />
    <img
        align="center"
        alt="Git"
        tittle="Git"
        height="40" 
        style="padding-right: 10px;" 
        src="https://skillicons.dev/icons?i=git"
    />
    <img
        align="center"
        alt="GitHub"
        tittle="GitHub"
        height="40" 
        style="padding-right: 10px;" 
        src="https://skillicons.dev/icons?i=github"
    />
</div>

<img
    width="100%"
    src="https://capsule-render.vercel.app/api?type=waving&color=A020F0&height=120&section=footer"
/>
