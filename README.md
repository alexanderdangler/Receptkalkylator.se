# NyttRecept.se – Receptkalkylator

En webbaserad receptkalkylator för svensk sjukvårdspersonal. Beräkna snittförbrukning av tabletter, antal uttag som behöver förskrivas, och mängd kortisonkräm baserat på kroppsyta och ålder.

**Webbplats:** [nyttrecept.se](https://nyttrecept.se)

## Funktioner

- **Snittförbrukning** – Beräkna hur många tabletter som förbrukats under en period
- **Kvarvarande tabletter** – Beräkna hur många tabletter som borde finnas kvar på ett recept
- **Receptstorlek** – Beräkna hur stort recept som ska skrivas ut (antal uttag)
- **Kräm-/salvkalkylator** – Beräkna mängd topikalt kortison baserat på kroppsyta, åldersgrupp och behandlingsschema. Inkluderar färdigt nedtrappningsschema
- **Vanliga frågor (FAQ)** – Omfattande FAQ om receptförskrivning, licensläkemedel, högkostnadsskydd, Pascal m.m.

## Teknik

- **Bootstrap 5.2.1** – UI-ramverk (selektiv import via SCSS)
- **jQuery 3.6.1** – DOM-manipulation
- **Luxon 3.0.4** – Datumberäkningar
- **SCSS** – Stilmallar med Bootstrap-anpassningar
- **Browserify** – JavaScript-bundling

## Projektstruktur

```
NyttRecept.se/
├── public_html/          # Produktionsfiler (deployas till webbservern)
│   ├── index.html        # Hela applikationen
│   ├── .htaccess         # Apache-konfiguration
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── css/              # Kompilerad CSS
│   ├── js/               # Bundlad JavaScript
│   └── img/              # Bilder och logotyper
├── uncompiled/           # Källfiler
│   ├── js/index.uncompiled.js   # JavaScript-källkod
│   └── scss/main.scss           # SCSS-källkod
├── resources/            # Designfiler (Illustrator)
├── package.json
└── .claude/CLAUDE.md
```

## Bygga projektet

### JavaScript
```bash
# Bundla med Browserify
browserify uncompiled/js/index.uncompiled.js -o public_html/js/main.js

# Minifiera (använd VS Code Minify-extension eller terser)
npx terser public_html/js/main.js -o public_html/js/main.min.js -c -m
```

### CSS
Kompilera SCSS till CSS med valfri SCSS-kompilator (t.ex. VS Code Live Sass Compiler):
```
uncompiled/scss/main.scss → public_html/css/main.min.css
```

### Installation
```bash
npm install
```

## Driftsättning

Statiska filer i `public_html/` deployas till Apache-webbserver med HTTPS.

## Författare

- **Alexander Dangler** – Legitimerad läkare, Medibyte AB
- **Jesper Hjertström** – Legitimerad läkare

## Licens

ISC
