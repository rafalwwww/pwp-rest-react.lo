// src/projectTestData.js

// Bardzo długi tekst do testów
// let longText = 'Lorem ipsum '.repeat(500);
let longText = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam euismod turpis ullamcorper, porta mauris nec, iaculis metus. Ut magna lacus, congue nec accumsan vitae, pharetra vel ligula. Ut varius iaculis libero, ullamcorper pulvinar diam facilisis eu. Maecenas eget libero mi. Nullam non magna a nisl gravida sodales. Sed vitae hendrerit nisi, euismod iaculis ligula. Sed erat purus, tristique dapibus sapien non, dictum dictum lectus. Nulla ut tempor nisi, ac tristique dolor. Nam volutpat libero vel accumsan vehicula. Mauris massa odio, eleifend vel egestas sed, sagittis ut odio. Integer dictum quam sed felis consequat laoreet. Aenean posuere eget sem eu facilisis. Proin ullamcorper mauris dapibus neque tempus semper. Etiam varius metus vel risus molestie, vel cursus tortor tempor.

Duis pretium tincidunt leo, vitae posuere neque auctor in. Mauris vitae lectus id ex ornare blandit sed a quam. Suspendisse rutrum molestie turpis, volutpat varius mi elementum egestas. Vestibulum vitae sollicitudin magna. Donec orci dui, tempus varius lobortis elementum, fringilla at massa. Quisque sagittis et mauris ut placerat. Duis a iaculis lorem. Praesent efficitur volutpat massa, vitae dapibus metus. Nulla id euismod dui. Praesent id commodo ipsum. Aliquam et posuere ex, et venenatis arcu. Integer non augue ut risus accumsan sollicitudin ac quis sem. Nam fermentum sapien ac lorem hendrerit fringilla.`;


// Przykładowy projekt testowy
export const testProject = {
  id: 999999,
  title: { rendered: "Testowy Długi Projekt" },
  _embedded: {
    'wp:featuredmedia': [
      { media_details: { sizes: { large: { source_url: "img/default-image-url.jpg" }, full: { source_url: "img/default-image-url.jpg" } } } }
    ],
    'wp:term': [
      [{ slug: "test" }]
    ]
  },
  content: {
    rendered: `<p>${longText}</p>`
  },
  acf: {
    modal: longText,
    link: "https://example.com",
    altitle: "Testowy projekt",
    link_to_code: "https://github.com/rafalwwww/portfolio.level12.linuxpl.eu_prod"
  }
};

export const testProject1 = {
  id: 999991,
  title: { rendered: "Testowy Długi Projekt Bez Modala" },
  _embedded: {
    'wp:featuredmedia': [
      { media_details: { sizes: { large: { source_url: "img/default-image-url.jpg" }, full: { source_url: "img/default-image-url.jpg" } } } }
    ],
    'wp:term': [
      [{ slug: "test" }]
    ]
  },
  content: {
    rendered: `<p>${longText}</p>`
  },
  acf: {
    // modal: longText,
    link: "https://example.com",
    altitle: "Testowy Długi Projekt Bez Modala",
    link_to_code: "https://github.com/rafalwwww/portfolio.level12.linuxpl.eu_prod"
  }
};