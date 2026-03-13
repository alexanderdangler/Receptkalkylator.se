# NyttRecept.se – Projektkontext

## Syfte
Receptkalkylator för svensk sjukvårdspersonal. Produktionssite med tusentals månatliga användare.
Medicinsk information som måste vara korrekt – dubbelkolla alltid medicinsk data.

## Arkitektur
Single-page application. All HTML, JavaScript och FAQ-innehåll finns i `public_html/index.html`.
Ingen backend – allt körs i webbläsaren.

## Viktiga filer
- `uncompiled/js/index.uncompiled.js` – All JavaScript-källkod. Redigera här, inte i bundlade filer.
- `uncompiled/scss/main.scss` – SCSS-källkod med Bootstrap-anpassningar.
- `public_html/index.html` – Hela applikationen inkl. FAQ och schema.org-markup.
- `public_html/.htaccess` – Apache-konfiguration med säkerhetshuvuden och cache.

## Byggprocess
1. Redigera källfiler i `uncompiled/`
2. Bundla JS: `browserify uncompiled/js/index.uncompiled.js -o public_html/js/main.js`
3. Minifiera JS: Använd VS Code Minify-extension eller `npx terser public_html/js/main.js -o public_html/js/main.min.js -c -m`
4. Kompilera SCSS: VS Code Live Sass Compiler eller liknande

## Kodkonventioner
- jQuery används för DOM-manipulation
- Luxon används för datumberäkningar (importeras via Browserify/CommonJS)
- Bootstrap 5 laddas selektivt via SCSS-imports
- Bootstrap JS laddas via CDN (5.2.1)
- Blandat svenska och engelska variabelnamn – behåll befintligt mönster

## Medicinsk data
- Högkostnadsskyddet uppdateras årligen – kontrollera E-hälsomyndighetens webbplats
- JSON-LD schema (MedicalWebPage + FAQPage) finns i head-taggen
- Uppdatera lastReviewed vid innehållsändringar

## Testning
Manuell testning i webbläsaren:
- Testa alla 4 kalkylatorer (usage, dagar, uttag, cream)
- Testa doseringsformat: 1+0+1, 2x3, 1*3, 1.5x2, 2X2, 1,5x2
- Testa krämkalkylator med olika åldersgrupper
- Verifiera kopiering till urklipp
- Kontrollera att inga JavaScript-konsolfel uppstår
