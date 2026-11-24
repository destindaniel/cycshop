# Plateforme e-commerce premium

- [x] Corriger l’écran blanc au démarrage : scripts et CSP synchronisés, réponses HTML non mises en cache ; chargements répétés, panier et connexion vérifiés à 822 et 390 pixels, aucune erreur de démarrage ni violation CSP ; 23 tests réussis.

- [x] Sécuriser les actions et lectures administrateur côté serveur, imposer TOTP et expiration à sept jours, journaliser les changements et préserver la commande invitée.
- [x] Déplacer l’administration vers /gestion-cycy, ajouter les en-têtes de sécurité et vérifier les écrans et refus.
- [ ] Activer et vérifier Turnstile : attend une vraie Site Key ; la valeur reçue n’est pas une clé publique et n’a pas été utilisée. La clé secrète est stockée mais n’a pas été validée avec le widget.
- [ ] Vérifier la limite par IP en production et durcir le service d’authentification direct : l’application refuse les en-têtes IP non fiables et utilise un compteur partagé si l’hébergement ne fournit pas d’IP vérifiable ; les réglages natifs CAPTCHA et session de sept jours ne sont pas exposés par les outils disponibles.
- [ ] Vérifier les modifications autorisées et la journalisation avec une vraie session TOTP : la session gestionnaire disponible n’a que le premier facteur ; aucun produit ni commande fictifs n’a été créé.

- [x] Préparer le parcours de double vérification, retirer les liens administrateur publics et renforcer les paramètres de mots de passe ; accès privé et refus côté données/fichiers vérifiés, seize tests réussis.
- [ ] Publier les nouveaux écrans puis vérifier le parcours autorisé complet : le téléphone est déjà associé et l’obligation TOTP est activée ; attend un code réel du téléphone pour tester des modifications autorisées, sans supprimer ni remplacer cette association.
- [ ] Proposer un accès administrateur séparé et une protection anti-DDoS : pas de domaine détenu ; achat ou connexion d’un domaine et choix du service de protection nécessaires avant activation.
- [ ] Argon2i demandé à la place de « ccfi » : non configurable avec l’authentification gérée actuelle ; ne pas ajouter de faux hachage ou de stockage parallèle des mots de passe.

- [x] Reproduire le modèle fourni : accueil vert profond et citron, navigation capsule, catégories compactes et présentation photographique ; navigation, panier et connexion vérifiés à 1440, 822 et 390 px, six tests réussis ; données et accès inchangés.

- [x] Affiner les boutons selon le modèle fourni : formes arrondies, flèches circulaires et animations ; navigation, panier et connexion vérifiés à 1440, 822 et 390 px, réduction de mouvement et neuf tests réussis, sans modifier les accès ni le commerce.

- [x] Affiner la boutique avec le nouveau guide : navigation compacte, catégories lisibles, panier latéral et interactions rapides ; parcours publics vérifiés à 1440, 822 et 390 px, réduction de mouvement et neuf tests réussis.

- [x] Refaire visiblement la direction éditoriale selon le guide fourni : nouvelle photo d’accueil, navigation, typographie, mosaïque de catégories et présentation du catalogue ; parcours publics vérifiés sur cinq tailles d’écran, photos chargées et neuf tests réussis, accès inchangés.

- [x] Affiner le design à partir du guide UI/UX fourni : accueil, navigation, catégories, catalogue et formulaires ; vérifié à 1440, 822, 390 et 375 px, avec réduction de mouvement, sans modifier les données ni les accès.

- [ ] Configurer Shopify : création refusée ; attend une autorisation explicite.
- [x] Confirmer le nom de la boutique : CYCY shop.
- [x] Construire le design chocolat et crème et l’accueil avec des images professionnelles.
- [x] Créer les pages boutique et catégories, la navigation et la recherche avec un catalogue honnêtement vide.
- [x] Connecter le catalogue réel et les fiches produits : catalogue, catégories et promotions lus dans la base.
- [x] Construire le panier et le parcours de commande sans faux paiement réussi : paiement à la livraison, prix figés et stock décrémenté à la commande.
- [x] Activer Lovable Cloud : comptes clients, commandes, favoris et images produits.
- [x] Construire l’administration authentifiée : produits, catégories, stocks, promotions, commandes et clients.
- [x] Créer les pages contact et informations légales avec des états en attente, sans coordonnées ni politiques inventées.
- [ ] Ajouter la newsletter : attend la connexion des services ; compléter les pages légales et contact après validation du commerçant.
- [x] Vérifier les pages publiques sur ordinateur, téléphone et tablette : navigation, recherche, catégories, tri et panier vide ; aucun message d’erreur.
- [x] Vérifier les accès administrateur : visiteur et client redirigés vers /admin/login, écriture client refusée, gestionnaire admise.
- [x] Lovable Cloud : tables, sécurité, images produits, connexion gestionnaire (/admin/login) et tableau de bord.
- [x] Accès gestionnaire réservé à Cycyshop242@gmail.com (après confirmation de l’e-mail).
- [x] Espace d’administration réservé à la gestionnaire de la boutique : double contrôle (route + tableau de bord) et vérification réelle.
- [ ] Ajout, modification, suppression de produits et commande réelle : attend une session TOTP autorisée et un véritable produit à vendre ; aucun catalogue ni commande fictif ne doit être ajouté.
- [ ] Paiement Mobile Money : à connecter plus tard ; paiement à la livraison actif.
- [x] Espace « Mon compte » réservé à l'administratrice : connexion gestionnaire uniquement, commande sans compte client, favoris retirés.
