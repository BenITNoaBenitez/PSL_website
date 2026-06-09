# Site PSL — version de relecture

Site vitrine statique de PSL (plans & sécurité incendie). Cette version est publiée
sur **GitHub Pages** pour relecture. Chaque page intègre un **widget de notes** qui
permet au relecteur d'écrire des remarques, enregistrées automatiquement dans le
dossier [`notes/`](notes/), un fichier Markdown par page (ex : `notes/contact.md`).

## Pour le relecteur — comment laisser une note

1. Ouvrir une page du site, cliquer sur le bouton **📝 Notes** (en bas à droite).
2. La première fois : ouvrir **⚙︎ Réglages**, renseigner :
   - **Votre nom** (s'affiche à côté de chaque note),
   - **le jeton GitHub** fourni par le propriétaire du site.
   - cliquer **Enregistrer**.
3. Écrire la remarque, cliquer **Envoyer la note**. C'est tout.

Le jeton et le nom restent dans **votre** navigateur ; ils ne sont jamais publiés.

## Pour le propriétaire — créer le jeton GitHub

Le widget écrit dans le dépôt via un **fine-grained personal access token** :

1. GitHub → *Settings* → *Developer settings* → *Personal access tokens* →
   *Fine-grained tokens* → **Generate new token**.
2. **Repository access** : *Only select repositories* → ce dépôt uniquement.
3. **Permissions** → *Repository permissions* → **Contents : Read and write**
   (laisser tout le reste sur « No access »).
4. Générer, copier le jeton, le transmettre au relecteur (canal privé).

Risque limité : au pire, ce seul dépôt peut être modifié. Le jeton est
**révocable à tout moment** depuis la même page GitHub.

## Récupérer les notes

Les remarques arrivent dans [`notes/`](notes/), un fichier par page. Faire un
`git pull` pour les récupérer localement, les traiter, puis publier la version finale.

## Détails techniques

- Page d'accueil : `index.html` redirige vers `index-new.html`.
- Le dépôt (owner/repo) est **auto-détecté** depuis l'URL GitHub Pages.
  Pour forcer : définir `window.NOTES_CONFIG = {owner, repo, branch}` avant le script.
- Code du widget : [`js/notes-widget.js`](js/notes-widget.js).
