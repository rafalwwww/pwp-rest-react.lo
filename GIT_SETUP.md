Instrukcja szybkiego ustawienia Git + tokena (GitHub)

Cel:
- Zainicjować lokalne repozytorium Git, dodać podstawowy commit i przygotować konfigurację uwierzytelniania tak, abyś mógł wysłać projekt na GitHub używając swojego tokena (PAT). Token musisz dodać ręcznie — nie zapisuję go tutaj.

Kroki (szybkie):

1) Zastąp remote swoim repozytorium GitHub:
   - Po wykonaniu pierwszego commita (zrobione lokalnie) ustaw remote:
     git remote set-url origin https://github.com/USER/REPO.git

2) Dodanie tokena (opcje):

   A) Najszybsze (jednorazowe) — podaj token przy push:
      git push https://<USERNAME>:<TOKEN>@github.com/USER/REPO.git main

      - W powyższym poleceniu <TOKEN> to Twój Personal Access Token (PAT).
      - Uwaga: token pojawi się w historii powłoki — używaj ostrożnie.

   B) Zapisanie tokena lokalnie (przechowywanie w pliku) — prostsze, ale mniej bezpieczne:
      - W katalogu projektu utwórz plik `.git-credentials` z jedną linią:
        https://<USERNAME>:<TOKEN>@github.com

      - Skonfiguruj Git, by używał tego pliku (lokalnie dla repo):
        git config credential.helper "store --file .git-credentials"

      - Po tej konfiguracji zwykły `git push origin main` użyje zapisanych poświadczeń.

      - WAŻNE: Ten plik zawiera token w postaci jawnej. Nie udostępniaj repo ani nie commituj tego pliku. W tym repo mamy już w `.gitignore` wpis `.git-credentials`.

   C) Bezpieczniej (zalecane) — użyj Git Credential Manager (GCM) lub menedżera systemowego:
      - Na Windows zwykle działa Git Credential Manager (manager-core). Jeśli jest zainstalowany, Git poprosi o logowanie podczas push i bezpiecznie zapisze poświadczenia.
      - Aby wymusić GCM (jeśli jest dostępny):
        git config --global credential.helper manager-core

3) Inne przydatne polecenia lokalne (wykonane już przez skrypt):
   - git init
   - git add .
   - git commit -m "Initial commit"
   - git branch -M main
   - git remote add origin https://github.com/USER/REPO.git  # zamień na właściwy URL

4) Jak bezpiecznie zaktualizować token (jeśli używasz pliku `.git-credentials`):
   - Zastąp zawartość pliku jedną linią z nowym tokenem (użyj edytora). Przykład PowerShell:
     Set-Content -Path .git-credentials -Value "https://USERNAME:TOKEN@github.com"

5) Usuwanie/rotacja tokena:
   - Jeśli token wycieknie, natychmiast usuń go z GitHub i wygeneruj nowy.
   - Usuń plik `.git-credentials` z dysku po użyciu, jeśli nie chcesz go trwale trzymać.

Bezpieczeństwo:
- Najbezpieczniejsza opcja to użycie Git Credential Manager lub innego bezpiecznego magazynu (systemowego). Pliki z tokenami przechowuj tylko jeżeli rozumiesz ryzyko.

Jeśli chcesz, mogę:
- Zmienić remote na podany przez Ciebie URL.
- Przygotować jednoznaczne polecenie push używające tokena (na Twoje życzenie).
