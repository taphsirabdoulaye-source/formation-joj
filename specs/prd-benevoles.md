# PRD — Bénévoles

**Statut** : Validé

## Problème

Chaque discipline a besoin de bénévoles pour accueillir le public. Les responsables de discipline gèrent les inscriptions sur papier, et des créneaux débordent : plus de bénévoles inscrits que de places prévues.

## Utilisateurs

- Responsable de discipline : ouvrir des créneaux d'accueil et savoir qui y vient.
- Bénévole : s'inscrire à un créneau, et s'en désinscrire s'il ne peut plus venir.

## Proposition

Le responsable ouvre un créneau avec une capacité ; les bénévoles s'y inscrivent, et l'application refuse toute inscription au-delà de la capacité. Contrairement à la feuille papier, la limite est appliquée au moment de l'inscription : un créneau ne peut plus déborder.

## Mesure du succès

Pendant la démo, un créneau de capacité 2 accepte deux bénévoles et refuse le troisième.

## Tranches

### TR1 — Ouvrir un créneau et s'y inscrire

Le responsable ouvre un créneau avec une capacité ; un bénévole s'y inscrit. Règle : aucune inscription au-delà de la capacité.

### TR2 — Consulter un créneau et ses inscrits

Le responsable consulte un créneau et la liste de ses inscrits. Règle : un même email ne peut pas être inscrit deux fois au même créneau.

### TR3 — Se désinscrire, et l'écran du créneau

Un bénévole se désinscrit d'un créneau, ce qui libère sa place. Un écran permet de voir un créneau, de s'y inscrire et de s'en désinscrire.

## Hors périmètre

- La modification ou la suppression d'un créneau.
- Les emails de confirmation.
- Les comptes des bénévoles.

## Hypothèses et risques

- Supposé : un créneau appartient à une discipline et porte une date et un horaire. Si ce n'est pas le cas, le responsable ne peut pas distinguer ses créneaux.
- Supposé : un bénévole est identifié par son nom et son email, sans compte. Risque : n'importe qui peut inscrire ou désinscrire un email qui n'est pas le sien.
- Supposé : seul le responsable ouvre des créneaux, mais sans comptes rien ne l'empêche techniquement ; on fait confiance aux utilisateurs.
