# Nexushome - historique et reprise de projet

> Fichier de reprise destiné à Claude Code CLI. Lis-le en entier avant d'agir.
> Branche de travail : `claude/adoring-lovelace-9jlv3n` (repo `starrstrak/nexushome`). Ne pas créer de PR sans demande explicite.
> Langue : réponses en français, commentaires de code en anglais.

## 1. Objectif
Application WEB (téléphone + PC) accessible depuis Internet pour piloter un parc domotique via **Home Assistant Container (Docker)**.
Frontend : Next.js App Router + TypeScript strict + Tailwind, `home-assistant-js-websocket`.
Exposition : Cloudflare Tunnel (aucun port ouvert sur la box). HA = `https://ha.<domaine>`, frontend = `https://home.<domaine>` (Vercel ou Docker).

Les valeurs `{{...}}` du prompt initial n'ont jamais été renseignées : domaine, IP de l'hôte et modèle d'hôte restent à confirmer. Hypothèses prises : fuseau `Europe/Zurich`, CHF/CH/fr, `example.ch`, IP LAN `192.168.1.10`.

## 2. Contraintes (à respecter partout)
- Aucun secret en dur : `.env`, `config/secrets.yaml`, variables Cloudflare. Jamais de token HA longue durée dans le code client ni dans git.
- Ne désactiver aucune protection : pas de CORS `*`, pas de SSL désactivé, HTTPS partout (ws:// bloqué en contenu mixte).
- N'inventer ni service HA, ni entité, ni option : en cas de doute, le dire et indiquer où vérifier dans la doc officielle.
- Privilégier les intégrations documentées plutôt que le reverse engineering.
- Dépendances minimales, versions épinglées.
- Format de livraison par phase : arborescence, un bloc de code par fichier, code complet, puis « points à tester » et « 3 erreurs courantes ». Une phase à la fois, attendre la validation de l'utilisateur.

## 3. Appareils (cf. `docs/PHASE2-devices.md`)
1. Alexa (Echo, Dot, Dot Max, Spot) : Alexa Media Player (HACS, `alandtse`), cloud non officiel, login Amazon + clé OTP 2FA. Domaine : `amazon.de` probable (amazon.ch non confirmé).
2. WiZ / Smart+ Osram : intégration WiZ native, local UDP 38899. DOUTE : les ampoules LEDVANCE SMART+ WiFi sont souvent Tuya, pas WiZ.
3. Roborock S5 : Xiaomi Miio (token) en priorité, repli intégration Roborock (cloud). Token facile si l'appareil est dans Mi Home.
4. Dreame H15 Pro : DOUTE MAJEUR, probablement un aspirateur-laveur à main, non supporté par `Tasshack/dreame-vacuum` (robots). A vérifier dans le README ; sinon l'exclure.
5. TV Hisense VIDAA : intégration HACS « Hisense TV » (MQTT local, port 36669). Auteur du dépôt et exposition des touches de navigation non confirmés.
6. Fire TV Stick / 4K : Android Debug Bridge (`androidtv`, coeur HA), pas « Android TV Remote ». Débogage ADB à activer, clé RSA à accepter sur la TV.
7. myStrom Smart Plug CH : intégration myStrom (REST local). Nom exact du modèle et exposition de la puissance (attribut vs capteur) à confirmer.
8. Ledvance SMART+ Plug Wi-Fi (Tuya) : Tuya (cloud) ou LocalTuya (HACS, clé locale). Mesure de puissance selon modèle.

## 4. Etat d'avancement

| Phase | Contenu | Etat |
|---|---|---|
| 1 | Infra Docker (HA, cloudflared), config HA, secrets, backup | Fichiers faits et validés par l'utilisateur ; **rien déployé** chez lui sauf test Mac (voir §6) |
| 2 | Cartographie des appareils | Faite (`docs/PHASE2-devices.md`), doutes ouverts |
| 3 | Socle frontend | Fait, typecheck + build OK, testé en mode démo |
| 4 | Composants UI | Fait, testé en mode démo (build prod, CSP strict, 0 erreur console) |
| 5 | Qualité et sécurité | **PAS FAIT** |

Jamais testé avec un vrai Home Assistant : login OAuth, WebSocket, TTS Alexa, touches ADB, batterie, puissance.

## 5. Structure du dépôt
```
docker-compose.yml          HA + cloudflared (host network, tags épinglés, vérifiés existants le 2026-11-08)
docker-compose.web.yml      frontend optionnel en Docker (127.0.0.1:3000, derrière cloudflared)
docker-compose.mac.yml      TEST LOCAL Mac : HA seul, port 8123 publié, pas de tunnel
.env.example                TZ, CF_TUNNEL_TOKEN, NEXT_PUBLIC_HA_URL
config/configuration.yaml   http (x_forwarded_for, trusted_proxies 127.0.0.1/::1, ip_ban, CORS limité), recorder 14j
config/secrets.yaml.example external_url, internal_url, frontend_origin
config/secrets.mac.example.yaml  valeurs localhost pour le test Mac (frontend_origin http://localhost:3100)
scripts/backup.sh           sauvegarde à froid de config/, rétention 14 jours (à copier hors site)
docs/PHASE2-devices.md      cartographie
web/                        Next.js 16.4.4, React 19.3.1, TS 5.9.3 strict, Tailwind 4.3.3, home-assistant-js-websocket 9.8.1
```
Détails `web/src` :
- `proxy.ts` : CSP avec nonce par requête (Next 16 : "proxy" remplace middleware). Pas de style inline (style-src nonce) : positionnement imperatif via CSSOM (cf. ColorWheel).
- `lib/ha/` : `config.ts` (URL https obligatoire, http toléré pour localhost), `auth.ts` (`getAuth`, tokens courts en localStorage), `entity-store.ts` (store par entité), `features.ts`, `demo.ts` (mode démo).
- `providers/HaProvider.tsx` : connexion, reconnexion automatique, statuts, mode démo.
- `hooks/` : `useEntity`, `useAllEntities`, `useEntityIds`, `useRelatedSensorId`, `useService`, `useConnectionStatus`, `useDebouncedCallback`.
- `components/` : `DeviceTabs` (Lumières, Prises, Aspirateurs, TV, Alexa, Entités), `devices/*` (LightCard, ColorWheel, PlugCard, VacuumCard, TvCard, NavPad, AlexaPanel), `ui.tsx`, `ConnectionBadge/Banner`.
- `config/devices.ts` : classification par motifs du nom d'entité (`echo|alexa`, `fire_?tv`) + listes `alexaPlayers`, `fireTvPlayers`, `hidden`.
- PWA : `app/manifest.ts`, `public/sw.js` (shell seulement, ne met jamais en cache le trafic HA), icônes.
- Aucune entité réelle codée en dur : les cartes viennent de la découverte automatique.

Mode démo : `cd web && npm run demo [-- -p 3100]` (script Node multiplateforme, entités fictives `demo_*`). Ne JAMAIS définir `NEXT_PUBLIC_DEMO` en production.

## 6. Situation de l'utilisateur (Mac, zsh)
- Le frontend en mode démo s'ouvre chez lui sur `http://localhost:3100` (3000 était occupé).
- Il a choisi d'installer Home Assistant sur son **MacBook, pour test seulement**. Docker Desktop : `network_mode: host` ne marche pas comme sous Linux, d'où `docker-compose.mac.yml`. La détection LAN (WiZ, Tuya, Alexa local) est limitée : saisir les IP à la main.
- Il en est à : cloner le dépôt, `cp config/secrets.mac.example.yaml config/secrets.yaml`, `docker compose -f docker-compose.mac.yml up -d`, ouvrir `http://localhost:8123`, créer l'admin + 2FA, puis `web/.env.local` avec `NEXT_PUBLIC_HA_URL=http://localhost:8123` et `npm run dev -- -p 3100`. Il n'a pas encore confirmé que HA répond.
- Aucun déploiement final (hôte Linux 24/7, Cloudflare Tunnel, Vercel/Docker) n'est fait.

## 7. Reste à faire (par ordre)
1. **Aider à finir l'installation HA sur Mac** (si l'utilisateur colle des erreurs : logs `docker compose -f docker-compose.mac.yml logs -f homeassistant`, vérifier que `frontend_origin` correspond exactement au schéma+hôte+port de l'app).
2. Intégrer les appareils dans HA (ordre : WiZ, myStrom, Fire TV ADB, puis Tuya/LocalTuya, Miio, Alexa, Hisense, Dreame en dernier après vérification de compatibilité). Installer HACS : `docker exec -it homeassistant bash -c "wget -O - https://get.hacs.xyz | bash -"` puis redémarrer et ajouter l'intégration (autorisation GitHub).
3. Récupérer les vrais `entity_id` (onglet « Entités » de l'app) et adapter `web/src/config/devices.ts` si le classement est faux.
4. Valider avec le vrai HA et corriger ce qui était hypothétique (voir §8).
5. **Phase 5** : tests de base (vitest ou équivalent, à garder minimal ; candidats : `readHaConfig`, `EntityStore`, `useService`, `hasFeature/num`), checklist de sécurité pour app exposée sur Internet, plan de repli BFF côté serveur avec token non exposé (Route Handlers Next ; envisager Cloudflare Access avec service token si Access devant `ha.*`), nettoyage.
6. Mise en production : hôte Linux, tunnel Cloudflare (hostnames `ha.*` -> `http://localhost:8123`, `home.*` -> `http://localhost:3000` si Docker), DNS, Cloudflare Access sur `home.*`, WAF géo + rate limiting sur `ha.*`, 2FA HA, cron `scripts/backup.sh` + copie hors site chiffrée, retrait de toute origine `localhost` des CORS.

## 8. Points non vérifiés (ne pas les présenter comme acquis)
- Touches Fire TV envoyées via `androidtv.adb_command` : `UP, DOWN, LEFT, RIGHT, ENTER, BACK, HOME` (vérifier la doc de l'intégration).
- TTS Alexa : `notify.alexa_media_<object_id>` avec `data.type = "tts"` (vérifier les noms réels dans Outils de développement > Services).
- Batterie aspirateur : attribut `battery_level` potentiellement déprécié ; repli sur un capteur `sensor.<nom>*` de classe `battery`.
- Puissance des prises : capteur `sensor.<nom>*` de classe `power` ou attribut `current_power_w` (myStrom).
- Bits `supported_features` des media_player (`features.ts`) : permissif si l'attribut est absent.
- Cloudflare Access devant `ha.*` : casse très probablement les appels CORS du frontend et l'app mobile HA (non testé) ; Access prévu seulement sur `home.*`.
- Healthcheck HA (`curl` dans l'image) non testé ; sauvegarde native HA en mode Container non confirmée.
- Auteur exact du dépôt HACS « Hisense TV » ; référence de modèle myStrom ; compatibilité Dreame H15 Pro ; domaine Alexa `amazon.ch`.

## 9. Décisions techniques à conserver
- Pas de Mosquitto (aucun appareil n'en a besoin : Hisense utilise le broker de la TV).
- Auth : flux OAuth `getAuth` (login HA + 2FA), jamais de long-lived token.
- `layout.tsx` appelle `await headers()` pour forcer le rendu dynamique, nécessaire au nonce CSP.
- TypeScript 5.9.3 (pas 7.x : trop récent pour Next 16).
- Pas de styles inline dans le rendu serveur (CSP).
- Ne pas casser le build : vérifier avec `cd web && npx tsc --noEmit && NEXT_PUBLIC_HA_URL=https://ha.example.ch npm run build`.

## 10. Historique résumé de la conversation
1. Prompt initial : cahier des charges en 5 phases, une phase à la fois avec validation.
2. Phase 1 livrée (compose, config HA, secrets, backup, procédure tunnel/HACS/durcissement).
3. Phase 2 livrée (cartographie), doutes signalés ; l'utilisateur a validé.
4. Phase 3 livrée (socle Next.js, client WebSocket, hooks, PWA, CSP).
5. Mode démo ajouté à la demande de l'utilisateur pour voir l'interface.
6. Phase 4 livrée (cartes d'appareils, onglets).
7. Support : l'utilisateur n'avait pas cloné le dépôt (erreur `cd web`), conflit de port 3000 -> script `npm run demo` multiplateforme avec choix de port.
8. L'utilisateur veut intégrer ses appareils puis installer HA ; choix : MacBook en test -> `docker-compose.mac.yml`.
9. Dernière demande : ce fichier de reprise.
