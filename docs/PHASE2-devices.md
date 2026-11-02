# Phase 2 - Cartographie des appareils

Legende fiabilite : OK = integration documentee / connue. ? = je ne suis pas certain, a verifier (source indiquee).
Rien ici n'a ete teste sur tes appareils. Les noms d'entites sont des **noms generiques** : les vrais dependent de tes noms d'appareils.

## 1. Vue d'ensemble

| # | Appareil | Integration retenue | Mode | Authentification | Fiabilite |
|---|----------|--------------------|------|------------------|-----------|
| 1 | Echo / Dot / Dot Max / Spot | Alexa Media Player (HACS, alandtse) | Cloud (non officiel) | Login Amazon + cle 2FA (OTP) | ? fragile |
| 2 | WiZ / Smart+ Osram | WiZ (coeur HA) | Local UDP 38899 | Aucune (option "communication locale") | OK, si vraiment WiZ (voir doute) |
| 3 | Roborock S5 | Xiaomi Miio (coeur HA), repli Roborock (coeur HA) | Local (token) / cloud | Token Miio | ? selon l'appli utilisee |
| 4 | Dreame H15 Pro | Dreame Vacuum (HACS, Tasshack) | Cloud Dreame + local ? | Compte Dreamehome | **DOUTE MAJEUR** |
| 5 | TV Hisense VIDAA | Integration Hisense TV (HACS) | Local MQTT 36669 | Appairage PIN a l'ecran ? | ? |
| 6 | Fire TV Stick / 4K | Android Debug Bridge (coeur HA, integration "androidtv") | Local ADB | Cle RSA acceptee sur la TV | OK |
| 7 | myStrom Smart Plug CH | myStrom (coeur HA) | Local REST | Aucune | OK, nom du modele ? |
| 8 | Ledvance SMART+ Plug Wi-Fi | Tuya (coeur HA) ou LocalTuya (HACS) | Cloud / Local | Cloud Tuya IoT / cle locale | OK, mesure de puissance ? |

## 2. Detail par appareil

### 1. Alexa (Echo, Echo Dot, Echo Dot Max, Echo Spot)
- Integration : Alexa Media Player (HACS, depot `alandtse/alexa_media_player`). **Non officielle** : elle imite l'appli Alexa.
- Domaine Amazon : `amazon.de` est le choix usuel pour la Suisse. Je ne pense pas qu'`amazon.ch` existe comme domaine Alexa. A verifier dans la liste du formulaire de config.
- Auth : e-mail + mot de passe Amazon. Active la verification en 2 etapes avec une **appli d'authentification** et colle la cle secrete (OTP) dans le champ prevu : cela evite les codes SMS a chaque reconnexion.
- Entites : un `media_player.*` par appareil (lecture/pause, volume, source), un `notify.alexa_media_*` par appareil (TTS), quelques `switch`/`sensor` (ne pas deranger, prochaine alarme). Les **groupes multi-pieces** Alexa apparaissent comme `media_player` de groupe : a verifier avec tes groupes.
- TTS : service `notify.alexa_media_<nom>` avec `data: {type: tts}` (ou `announce`). Documente dans le README de l'integration.
- Risques : Amazon change son login (captcha, blocage), cookies expires, relogin periodique. Pas de repli equivalent : si l'integration casse, il n'y a plus de controle Alexa depuis HA. Garde les appareils utilisables par les routines Alexa natives.
- Securite : cette integration stocke le cookie Amazon dans `config/.storage/`. Ce dossier est ignore par git.

### 2. WiZ / Smart+ Osram
- Integration : WiZ (coeur HA), detection automatique par UDP.
- Pre-requis : dans l'appli WiZ, activer "Autoriser la communication locale" (Parametres du foyer).
- Auth : aucune. Entites : `light.*` (marche/arret, luminosite, `rgb_color`, `color_temp_kelvin`), eventuellement des `select`/`number` pour effets et vitesse.
- **Doute** : les ampoules "LEDVANCE SMART+ WiFi" sont en general basees sur **Tuya** (appli SMART+), pas WiZ. Seules les ampoules pilotees par l'appli **WiZ** sont compatibles. Verifie quelle appli tu utilises. Si c'est Tuya, elles suivent la ligne 8.
- Risques : IP changeantes (reserve des baux DHCP), le multicast/broadcast UDP ne traverse pas les VLAN. Repli : aucun cloud HA ; l'appli WiZ reste utilisable.

### 3. Roborock S5
- Option A (recommandee pour un S5, ancien protocole Miio) : Xiaomi Miio (coeur HA), mode local avec token.
- Option B : Roborock (coeur HA), via compte Roborock. Je ne suis pas certain que le S5 soit couvert : liste des modeles dans la doc officielle de l'integration Roborock.
- Auth A : token de 32 caracteres. Il s'obtient par le login cloud Xiaomi du config flow **si l'aspirateur est dans l'appli Mi Home**. S'il est dans l'appli Roborock, l'extraction du token est plus delicate : verifie ce point avant de couper l'appli actuelle.
- Entites : `vacuum.*` avec services `vacuum.start`, `vacuum.pause`, `vacuum.return_to_base`, `vacuum.locate`, `vacuum.set_fan_speed`. Les modes d'aspiration disponibles sont dans l'attribut `fan_speed_list` : ne pas coder les noms en dur (Phase 4). Batterie via `battery_level`. Capteurs de consommables (brosses, filtre) selon l'integration.
- Risques : mise a jour firmware qui change le token, IP changeante. Repli : bascule sur l'option B (cloud).

### 4. Dreame H15 Pro - DOUTE MAJEUR
- Le **H15 Pro** me semble etre un aspirateur-laveur **a main** (wet & dry), pas un robot. L'integration Dreame Vacuum de Tasshack vise les **robots** aspirateurs. Je ne sais pas si ce modele est supporte, ni s'il est connecte au cloud Dreame de facon exploitable.
- A faire avant toute chose : chercher "H15" dans la liste des appareils supportes du README `Tasshack/dreame-vacuum`, et confirmer dans l'appli Dreamehome si l'appareil est connecte en Wi-Fi.
- Si non supporte : **pas de controle HA**. Je ne proposerai pas de reverse engineering. Les boutons "demarrer / retour base" de la Phase 4 n'auraient pas de sens pour un appareil a main : on les omettra.
- Si c'est un robot compatible : entite `vacuum.*` comme en 3, auth par compte Dreamehome (cloud, region a choisir), risque de dependance cloud.

### 5. TV Hisense VIDAA
- Integration : "Hisense TV" via HACS (je ne suis pas certain de l'auteur du depot : cherche dans HACS et lis le README et la date de derniere mise a jour avant d'installer).
- Local : MQTT sur la TV, port 36669. Pas de broker externe necessaire.
- Auth : selon la version VIDAA, un code PIN s'affiche sur la TV a l'appairage. Details dans le README choisi.
- Entites : `media_player.*` (marche/arret, volume, mute, source). Menu/navigation et apps : **a verifier** dans le README, je ne sais pas si l'integration expose des touches de telecommande.
- Risques : la TV doit etre allumee ou en veille reseau pour repondre ; l'allumage a distance peut exiger Wake-on-LAN (service `wake_on_lan`, coeur HA). Les versions VIDAA different entre modeles. Repli : aucun cloud HA. Fire TV (6) couvre la lecture.

### 6. Fire TV Stick et Fire TV Stick 4K
- Integration : Android Debug Bridge (domaine `androidtv`, coeur HA). **Pas** "Android TV Remote" : Fire OS ne l'utilise pas.
- Pre-requis : Parametres > Ma Fire TV > Options developpeur > Debogage ADB (et "Applis de sources inconnues" si demande). Au premier lancement, accepter l'empreinte RSA affichee sur la TV.
- Entites : `media_player.*` (marche/arret, volume, source = applis), service `androidtv.adb_command` (touches HAUT/BAS/OK, etc., liste dans la doc de l'integration), `media_player.select_source` pour lancer une appli.
- Securite : ADB est un acces complet a l'appareil sur le LAN. Aucun port-forward, VLAN IoT recommande.
- Risques : mises a jour Fire OS qui coupent le debogage ; IP changeantes. Repli : appli Fire TV.

### 7. myStrom Smart Plug CH
- Integration : myStrom (coeur HA), API REST locale. Je ne suis pas certain que la mention "Smart Plug CH" corresponde exactement au "WiFi Switch CH v2" documente par HA : verifie la doc de l'integration.
- Auth : aucune en local. Entites : `switch.*` ; la puissance (W) est exposee soit en attribut, soit en capteur selon la version de HA : a verifier. Si absent, repli : un `rest` sensor sur l'API locale de la prise (voir la doc myStrom pour les routes).
- Risques : firmware, IP changeante. Repli : API REST directe.

### 8. Ledvance SMART+ Plug Wi-Fi (Tuya)
- Option A : Tuya (coeur HA), cloud, connexion par QR code via l'appli Tuya Smart / Smart Life. Il faudra peut-etre ajouter la prise a l'une de ces applis, pas seulement a SMART+.
- Option B : LocalTuya (HACS), 100 % local. Il faut la **cle locale** (compte Tuya IoT Platform, gratuit mais avec renouvellement periodique du projet cloud), l'ID de l'appareil et sa version de protocole. Deux depots existent (l'original et des forks plus actifs) : compare avant d'installer.
- Entites : `switch.*`. La **mesure de puissance** n'existe que si le modele a un compteur : verifie le modele exact. Avec LocalTuya, il faut declarer les DPS (numeros de donnees) toi-meme (souvent courant/puissance/tension, mais **pas garanti**).
- Risques : le cloud Tuya a des quotas, la cle locale change si on re-appaire l'appareil. Repli : A ou B selon celle qui casse.

## 3. A faire avant la Phase 3
1. Reserver des baux DHCP pour tous les appareils (WiZ, Miio, Tuya, myStrom, Fire TV, Hisense).
2. Isoler les appareils IoT dans un VLAN seulement si le mDNS/broadcast est relaye vers HA (sinon la detection casse).
3. Installer les integrations dans cet ordre : WiZ, myStrom, Fire TV (simples), puis Tuya/LocalTuya, Miio, Alexa, Hisense. Dreame en dernier, apres verification de compatibilite.
4. Me communiquer : le nom exact de la prise myStrom, l'appli de l'ampoule (WiZ ou SMART+), l'appli du Roborock (Mi Home ou Roborock), le contexte du H15 Pro (robot ou a main ?).
