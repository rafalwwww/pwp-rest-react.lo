Test scenarios for Service Worker fallback (cache/local/network)

1) Backup in cache (fastest path)

- Setup:
  - Ensure Cache Storage contains entry `local-backup-v1` with keys `/backup/wp-json.json`, `/backup/pages-269.json`, etc.
  - Service Worker registered and active.

- Action:
  - Load page that requests `/wp-json/wp/v2/pages/269`.

- Expected:
  - SW immediately returns cached `/backup/pages-269.json`.
  - No network request to remote WP endpoint is made for this resource (no red 404 in Network).


2) Backup file exists on origin but not cached (local fetch path)

- Setup:
  - Remove cache entries for `local-backup-v1` (or clear Cache Storage), but ensure `/backup/pages-269.json` exists on server.
  - SW registered.

- Action:
  - Load page that requests `/wp-json/wp/v2/pages/269`.

- Expected:
  - SW fetches `/backup/pages-269.json` from origin, caches it into `local-backup-v1`, and returns it.
  - No red 404 from remote WP endpoint.


3) No backup, REST API available (network path)

- Setup:
  - Ensure no backup files or cache for the endpoint.
  - REST API endpoint https://.../wp-json/wp/v2/pages/269 is available and returns 200 JSON.

- Action:
  - Load page requesting the endpoint.

- Expected:
  - SW performs network fetch to remote API and returns the successful response.


4) REST API disabled (returns 404 with {code: 'rest_disabled'}) and backup exists

- Setup:
  - Remote WP API responds with 404 and JSON {"code":"rest_disabled"}.
  - Local backup exists in cache or at `/backup/...`.

- Action:
  - Load page requesting the endpoint.

- Expected:
  - SW detects the rest_disabled response, and returns local backup (cache or `/backup/...`).
  - Network DevTools should not show a lasting red 404 for content (backup served instead).


5) Neither backup nor REST API available (final fallback)

- Setup:
  - No cache, no backup files on origin, and REST API is unavailable.

- Action:
  - Load page requesting the endpoint.

- Expected:
  - SW returns a 503 JSON response {"error":"service_unavailable"}.
  - Page displays error or lacks content - this is expected.


Notes:
- To force SW update: DevTools -> Application -> Service Workers -> unregister, then reload or click Update.
- To inspect cache: DevTools -> Application -> Cache Storage -> local-backup-v1.
- To simulate REST disabled: return 404 JSON with {"code":"rest_disabled"} from the server for the endpoint.






Wprowadź zmiany: dodam skrypt Node scripts/bump-sw-version.js który nadpisuje CACHE_VERSION w sw.js (domyślnie generuje timestamp vYYYYMMDDHHMMSS), oraz zaktualizuję package.json dodając skrypt bump-sw-version i prebuild (wywoływany przed npm run build). Oczekuję, że po uruchomieniu npm run bump-sw-version sw.js otrzyma nową wartość wersji i pozostanie składniowo poprawny. Teraz zastosuję patch z plikiem i aktualizacją package.json.

bump-sw-version.js+38-1
Read package.json

Zaktualizuję package.json scripts: dodam bump-sw-version i prebuild aby skrypt uruchamiał się przed build.

Using "Apply Patch"

package.json+2-0
Teraz przetestuję skrypt bump-sw-version uruchamiając go without args — powinien zaktualizować CACHE_VERSION to a timestamp-based vYYYY... value. I'll run it in the terminal.


npm run bump-sw-version
Sprawdzę ponownie składnię sw.js po bumpie, żeby upewnić się, że plik nie został uszkodzony.


node --check public/sw.js
Wprowadziłem skrypt do automatycznego bumpowania wersji cache SW i przetestowałem go lokalnie.

Co zrobiłem:

dodałem plik bump-sw-version.js — nadpisuje wartość CACHE_VERSION w sw.js. Domyślnie generuje timestampowy identyfikator w formacie vYYYYMMDDHHMMSS, lub przyjmuje argument (np. v2 lub 2).
zaktualizowałem package.json:
skrypt: "bump-sw-version": "node scripts/bump-sw-version.js"
skrypt: "prebuild": "npm run bump-sw-version" (wywoływany automatycznie przed npm run build)
uruchomiłem npm run bump-sw-version i potwierdziłem, że sw.js został zaktualizowany (np. CACHE_VERSION → v20251007160539).
sprawdziłem składnię pliku sw.js po modyfikacji: node --check public/sw.js — brak błędów.
Jak używać:

Ręcznie: uruchom
aby ustawić nową wersję (bez argumentu wygeneruje timestamp). Możesz też podać: npm run bump-sw-version -- v2 lub npm run bump-sw-version -- 2.

Automatycznie przy buildzie: npm run build wykona prebuild (bump) przed budowaniem.
Co się stanie po bumpie:

sw.js będzie miało nową wartość CACHE_VERSION — przy kolejnym aktywowaniu SW (po deployu) stary cache local-backup-v1 zostanie usunięty i zastąpiony nowym local-backup-<newversion> zgodnie z kodem w activate.
Jeśli chcesz, mogę:

Dodać confirmation log w bump-sw-version.js z opcją --dry-run lub --force.
Zintegrować to z procesem deploy (np. do npm run deploy) lub zrobić hash oparty na zawartości plików backup (bardziej deterministyczne).
Przywrócić ręcznie konkretną wersję cache w razie potrzeby.




Krótka instrukcja:

Sprawdź co by się zmieniło (dry run):
npm run bump-sw-version:dry

Wykonaj rzeczywiste bumpnięcie (ustawi timestampową wersję):
npm run bump-sw-version

Lub podaj własną wersję:
npm run bump-sw-version -- v2
# lub
npm run bump-sw-version -- 2

Test:
Uruchomiłem npm run bump-sw-version:dry lokalnie — wypisał wersję, nie zmieniając pliku.






Zaktualizowałem skrypty npm tak, żeby zachować stare zachowanie npm run build, a dodatkowo dodać opcję budowania z bumpem wersji SW.

Co zrobiłem:

Usunąłem automatyczny prebuild (już nie bumpuje przy zwykłym npm run build).
Dodałem nowy skrypt build:with-bump, który najpierw wykona npm run bump-sw-version, a potem uruchomi webpack --mode production.

Jak używać:

Stare zachowanie (bez bumpa):
npm run build

Nowy workflow (bump + build):
npm run build:with-bump

Sprawdzić dry-run bumpa:
npm run bump-sw-version:dry

Rzeczywisty bump:
npm run bump-sw-version

Ręczny build bez bumpa (jak wcześniej):
npm run build
