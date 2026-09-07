# Carrossel de banners reutilizável com Splide

Versão do componente de banners preparada para temas Shopify Online Store 2.0 que já utilizam Splide. A biblioteca fica dentro de `assets`, então o componente funciona sem CDN e sem depender da versão carregada por outro tema.

Esta pasta usa o Splide `4.1.3`, versão distribuída localmente em `assets/splide.min.js` e `assets/splide.min.css`. O projeto original do Splide documenta a inicialização com `new Splide(...).mount()` e os métodos `Components.Autoplay.play()`/`pause()` usados pelo componente. [Documentação oficial do Splide](https://splidejs.com/guides/getting-started/)

## Instalação

Copie os arquivos preservando os caminhos:

```text
sections/reusable-banner.liquid
assets/splide.min.js
assets/splide.min.css
assets/reusable-banner-splide.js
assets/reusable-banner-splide.css
```

Depois adicione **Carrossel de banners reutilizável** pelo editor visual. A seção já carrega os quatro assets na ordem correta.

## Recursos

É a mesma configuração da versão nativa: imagens desktop/mobile, vídeos Shopify/YouTube/Vimeo, link de mídia, dois botões, posicionamento, cores, alturas, fade/slide, autoplay, navegação, acessibilidade e agendamento pontual ou recorrente.

O script remove temporariamente da lista do Splide os slides que não estão ativos. Quando a programação muda, ele recria a instância e mantém somente os slides válidos, inclusive em recorrências que atravessam a meia-noite.

## Fallback

Sem imagem selecionada, o componente usa o placeholder SVG padrão do Shopify `hero-apparel-1`, gerado por `placeholder_svg_tag`. Não há imagem fixa ou asset proprietário do tema de referência.

## Licença de terceiros

O arquivo `SPLIDE-LICENSE.txt` acompanha a licença MIT do Splide. A licença do componente desta pasta segue a política do repositório interno onde ele for incorporado.
