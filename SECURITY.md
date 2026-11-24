# Administration CYCY shop

## Livré dans le projet

- Migrations complètes dans `drizzle/migrations/0011_*.sql` à `0014_*.sql` ; changements appliqués et existence des fonctions, tables, index et sept déclencheurs de journal vérifiée.
- Actions, lectures privées, changement du mot de passe, envoi, suppression et signature des images dans les fonctions serveur de `src/lib/admin.functions.ts`.
- Vérification du JWT par le middleware d’authentification, nouvelle validation de l’identité, puis `has_role` avant toute opération privée. Les opérations ordinaires utilisent le client du compte, pas les privilèges du service.
- Le gestionnaire est unique. `has_role` exige le TOTP vérifié, le facteur épinglé, une session native existante et une date de création de moins de sept jours. Le renouvellement d’un jeton ne remet pas ce délai à zéro. Les sessions plus anciennes doivent se reconnecter.
- Écritures interdites aux clients sur les données d’administration. Lecture publique limitée aux produits actifs, catégories publiques et promotions valides. Commandes lisibles seulement par le gestionnaire autorisé ou leur propriétaire.
- Commandes invitées uniquement via `place_order`, avec prix calculés, stock verrouillé et transaction atomique. **Pas de politique d’insertion publique directe** : elle permettrait de forger des totaux et de contourner la validation des stocks.
- Bucket privé. Les signatures administrateur vérifient le rôle ; les signatures publiques sélectionnent uniquement les chemins de produits actifs ou catégories publiques par RLS anonyme avant signature. Exiger un rôle gestionnaire pour ces images publiques casserait la boutique.
- Accès `/gestion-cycy`, redirections depuis `/admin`, sans lien dans la vitrine. Le nom du chemin n’est pas une protection et ne constitue pas un domaine séparé.
- Journal des changements de lignes par déclencheurs, journal des consultations, changements du mot de passe et fichiers par fonctions serveur. Les demandes de modification des fichiers sont enregistrées avant l’action, puis confirmées après réussite. Aucun mot de passe, jeton de connexion ou contenu complet de commande dans ce journal.
- CSP avec nonce aléatoire par requête fourni au routeur ; HSTS, nosniff, Referrer-Policy. Les pages d’administration refusent tout cadrage, y compris dans l’éditeur : ouvrir cet accès directement pour y travailler. La connexion `/compte` et la vitrine restent compatibles avec l’aperçu.

## Limites et activation restante

- **Turnstile n’est pas actif.** Le serveur vérifie un véritable jeton (succès, hostname et action `admin-login`) dès que `TURNSTILE_SITE_KEY` et `TURNSTILE_SECRET_KEY` sont configurés. La clé secrète est enregistrée, mais non validée ; aucune Site Key valide n’a été fournie. Aucune clé de test et aucune fausse réussite ne sont utilisées. La connexion actuelle conserve le compteur et le TOTP pendant cette attente.
- Le compteur de connexion est atomique et durable : cinq demandes par fenêtre fixe de quinze minutes. Il utilise l’IP native quand elle est disponible, sinon un compteur partagé et non une IP transmise par le client. **La disponibilité d’une IP de confiance en production reste à vérifier** avant de présenter cette limitation comme une limitation réellement individuelle par IP.
- Ce compteur protège la fonction de connexion de l’application, **pas l’endpoint Auth hébergé directement accessible**. L’activation du CAPTCHA et des restrictions de sessions dans le service Auth géré n’est pas exposée par les outils disponibles. Le refus des privilèges après sept jours est bien imposé en base, indépendamment du renouvellement natif de jetons.
- Les contrôles applicatifs ne sont pas un bouclier anti-DDoS réseau. Aucun service réseau supplémentaire ni domaine séparé n’a été configuré.
- Les modifications s’appliquent au projet et à la base ; la version publiée nécessite une publication des nouveaux écrans et fonctions.

## Vérifications

- 21 tests réussis : autorisation serveur, revalidation des écrans sans boucle, session de sept jours, limites de connexion, validation des mutations, chemins de fichiers, en-têtes, routage et calcul du panier ; cinq tests d’intégration restent désactivés faute de session jetable adaptée.
- Navigateur réel : accueil, navigation, catalogue vide réel, panier, redirections et refus de modification sans session et avec le compte gestionnaire sans TOTP. Lecture privée refusée avec un vrai statut serveur 403 ; en-têtes DENY et CSP vérifiés ; aucune erreur de chargement ni violation CSP. Le tunnel invité atteint bien la validation du panier sans exiger une connexion.
- Le compte gestionnaire affiche le second facteur existant ; aucune association n’a été supprimée ou remplacée pour les tests.
- Le parcours de modification autorisée après un code TOTP réel n’a pas été exercé : aucun code du téléphone n’est disponible. Les tests d’intégration nécessitant un compte jetable activé restent désactivés faute de session adaptée.
- Aucune commande ni produit fictif créé pour les vérifications. Le tunnel n’a donc pas été testé jusqu’à la création d’une commande réelle.