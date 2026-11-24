# Sécuriser l’administration de CYCY shop

## 1. Double vérification obligatoire
- Conserver votre e-mail et votre mot de passe, puis demander un code à six chiffres provenant d’une application comme Google Authenticator ou Microsoft Authenticator.
- Prévoir une page privée pour associer votre téléphone avec un QR code, confirmer le premier code et vérifier les codes suivants.
- Refuser l’ouverture du tableau de bord et les opérations de gestion sans rôle gestionnaire et sans double vérification validée. Les contrôles doivent aussi s’appliquer aux demandes directes, pas seulement à la page.
- Prévoir la perte du téléphone : récupération contrôlée par le propriétaire du projet, sans bouton public permettant de contourner la double vérification.
- Tester avec un compte temporaire autorisé pour le test, retirer cette autorisation ensuite ; ne jamais associer le téléphone de la gestionnaire à sa place.

## 2. Administration absente de la navigation publique
- Retirer « Mon compte » et « Administration » du menu, de l’en-tête et du pied de page.
- Placer la connexion dans une présentation administrateur distincte, sans navigation commerciale et sans indexation par les moteurs de recherche.
- Vous communiquer l’adresse directe à conserver. Une adresse non affichée n’est pas une protection en soi : les contrôles de rôle et de double vérification restent obligatoires.

## 3. Interface séparée et bouclier anti-DDoS : solution proposée
Pour une séparation plus forte, recommander une interface administrateur dédiée sur un sous-domaine à vous, protégée par Cloudflare Access, avec une règle n’autorisant que la gestionnaire. Le pare-feu Cloudflare et ses protections anti-DDoS filtreraient les requêtes avant leur arrivée au site.

Cette partie nécessite un domaine et votre accord pour utiliser Cloudflare ; aucun abonnement ni changement de domaine ne sera effectué sans votre validation. Les coûts éventuels seront indiqués avant activation. La boutique reste publiée via Lovable.

Avant activation, vérifier la compatibilité du domaine en mode proxy et bloquer toute adresse alternative qui permettrait de contourner la porte privée. Un sous-domaine protégé ne sécurise pas automatiquement les autres adresses ni les accès directs aux données. La séparation réelle doit être validée de bout en bout ; elle n’est pas incluse dans un simple retrait des liens.

Aucun bouclier anti-DDoS supplémentaire n’a encore été activé. Un bouton ou du code dans la page ne peut pas remplacer une protection réseau. Ne pas promettre une immunité totale aux attaques ni inventer une limitation de trafic locale.

## 4. Mots de passe et « argon2i: ccfi »
- L’authentification gérée de Lovable Cloud utilise bcrypt pour les mots de passe. Son algorithme ne peut pas être remplacé par Argon2i dans le code de la boutique.
- Ne pas ajouter un second stockage de mots de passe ni un hachage dans le navigateur : cela fragiliserait l’accès existant.
- Pour un nouveau système où le choix serait possible, privilégier Argon2id plutôt qu’Argon2i ; changer de système d’identité serait une migration distincte, non réalisée ici.
- Renforcer les paramètres disponibles : protection contre les mots de passe compromis, mot de passe actuel exigé pour le changer et désactivation des inscriptions publiques puisque le compte est réservé à la gestionnaire.
- Attendre la signification de « ccfi » : ce terme n’identifie pas à lui seul une protection à installer.

## Mise en service sans vous bloquer
1. Construire et tester le parcours de double vérification et les contrôles de sécurité.
2. Publier le parcours permettant à la gestionnaire d’associer son téléphone.
3. Vous faire confirmer un premier code sur votre téléphone, puis activer les obligations côté données et fichiers. Ne pas rendre les anciennes pages publiées inutilisables avant cette étape : les changements de droits prennent effet immédiatement.
4. Vérifier que la gestionnaire avec code peut gérer la boutique, qu’une session sans code ne peut pas modifier les données ou fichiers et que les visiteurs peuvent encore voir les photos et commander.

## Détails techniques
- Utiliser les fonctions MFA natives de Cloud Auth (`enroll`, `challenge`, `verify`) et le niveau de session `aal2` ; ne pas fabriquer de codes ou stocker de secrets MFA dans le projet.
- Étendre le contrôle existant de l’administration sans remplacer l’autorisation par un contrôle d’URL ou une valeur enregistrée dans le navigateur.
- Auditer les politiques existantes avant de renforcer les tables, fichiers et fonctions de gestion ; préserver les accès publics au catalogue, aux photos signées et aux commandes visiteurs.
- Tester explicitement les sessions visiteur, client, gestionnaire sans second facteur et gestionnaire avec second facteur, y compris les demandes directes.