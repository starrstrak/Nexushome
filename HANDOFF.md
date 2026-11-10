# Nexushome - fichier de transmission pour Claude Code CLI

Mode d'emploi : dans le dossier du dépôt cloné, lance `claude`, puis colle le « Prompt de démarrage » ci-dessous.
Le contexte complet (état, structure, décisions, points non vérifiés) est dans `CLAUDE.md`, chargé automatiquement.

## Prompt de démarrage (à coller)

```
Lis CLAUDE.md et docs/PHASE2-devices.md en entier. Tu reprends un projet en cours.
Branche : claude/adoring-lovelace-9jlv3n. Ne crée pas de PR sans que je le demande.

Phases 1 à 4 sont faites (infra Docker, cartographie, socle Next.js, composants UI), testées
seulement en mode démo. Il reste :
1. M'aider à finir l'installation de Home Assistant sur mon Mac (test) avec
   docker-compose.mac.yml, puis connecter l'app (web/.env.local, port 3100).
2. M'aider à intégrer mes appareils dans HA, dans l'ordre : WiZ, myStrom, Fire TV (ADB),
   Tuya/LocalTuya, Roborock/Miio, Alexa Media Player, Hisense, Dreame en dernier.
3. Après connexion au vrai HA : corriger ce qui était hypothétique (CLAUDE.md §8) et adapter
   web/src/config/devices.ts à mes vrais entity_id.
4. Phase 5 : tests de base, checklist de sécurité pour une app exposée sur Internet, plan de
   repli BFF (token HA jamais exposé au navigateur).
5. Préparer la mise en production (hôte Linux, Cloudflare Tunnel, Access, WAF, sauvegardes).

Règles : une étape à la fois, attends ma validation ; réponds en français, commentaires de
code en anglais ; aucun secret en dur ; ne désactive aucune protection (pas de CORS *, HTTPS
partout) ; n'invente ni service HA ni entité : en cas de doute, dis-le et indique la doc à
consulter. Avant de modifier le frontend, vérifie : cd web && npx tsc --noEmit && build.
Commence par me demander où j'en suis dans l'installation de HA.
```

## Cahier des charges initial (prompt d'origine, résumé fidèle)

Rôle : ingénieur domotique senior (Home Assistant, Docker, réseau/sécurité) et développeur
full-stack TypeScript (Next.js App Router, React, Tailwind). Intégrations existantes et
documentées plutôt que reverse engineering ; dire quand on n'est pas certain.

Infrastructure visée : hôte Docker (Raspberry Pi 5 / NAS / mini-PC), Home Assistant Container en
`network_mode: host`, domaine géré chez Cloudflare, Cloudflare Tunnel (aucun port ouvert),
HA sur `https://ha.<domaine>`, frontend sur `https://home.<domaine>` (Vercel ou Docker),
domaine Alexa amazon.de ou amazon.ch. Les `{{...}}` n'ont jamais été renseignés.

Appareils : Alexa (Echo, Dot, Dot Max, Spot), WiZ / Smart+ Osram, Roborock S5, Dreame H15 Pro,
TV Hisense VIDAA, Fire TV Stick et 4K, myStrom Smart Plug CH, Ledvance SMART+ Plug Wi-Fi (Tuya).

Phases (une seule à la fois, validation avant la suivante) :
1. Infrastructure Docker + durcissement (FAIT)
2. Cartographie des appareils (FAIT)
3. Socle frontend (FAIT)
4. Composants UI (FAIT)
5. Qualité et sécurité (A FAIRE)

Format : arborescence d'abord, un bloc de code par fichier avec son chemin, code complet
(aucun « à compléter »), TypeScript strict, réponse en français, commentaires en anglais,
fin de phase = points à tester + 3 erreurs courantes.

Contraintes : aucun secret en dur (.env.local, secrets.yaml, variables Cloudflare) ; jamais de
token HA longue durée côté client ni dans git ; ne désactiver aucune protection ; HTTPS partout ;
n'inventer ni service, ni entité, ni option ; dépendances minimales avec versions.

## Etat au moment de la transmission

- Tout est poussé sur la branche `claude/adoring-lovelace-9jlv3n` du dépôt `starrstrak/nexushome`.
- Mode démo fonctionnel chez l'utilisateur : `cd web && npm run demo -- -p 3100` puis http://localhost:3100.
- HA : l'utilisateur a choisi un MacBook pour un test. Il doit encore démarrer HA
  (`docker compose -f docker-compose.mac.yml up -d`), confirmer que http://localhost:8123 répond,
  créer l'admin + 2FA, puis connecter l'app. Rien n'est encore testé avec un vrai HA.
- Questions encore ouvertes pour l'utilisateur : Dreame H15 Pro (robot ou appareil à main ?),
  appli des ampoules (WiZ ou SMART+/Tuya), appli du Roborock (Mi Home ou Roborock),
  nom exact de la prise myStrom, modèle exact de la prise Ledvance, domaine réel,
  machine finale (Raspberry Pi / NAS / mini-PC Linux).

## Aucun secret ici

Ne jamais ajouter dans ce fichier ni dans git : token Cloudflare, mots de passe, clés Tuya/Amazon/Xiaomi,
token HA. Ils vont dans `.env`, `config/secrets.yaml` ou le gestionnaire de secrets de l'hébergeur.
