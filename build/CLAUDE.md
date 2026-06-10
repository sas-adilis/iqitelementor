# CLAUDE.md — iqitelementor

Directives permanentes pour tout travail sur ce module.
À lire et appliquer avant chaque intervention.

---

## Environnement

- **Module PrestaShop** : compatible PS 1.7 → 9
- **PHP** : 7.1 minimum — aucune syntaxe PHP > 7.1 autorisée
- **Développement distant** : pas d'accès local PHP/base de données, tout se fait via FTP/SFTP
- **Autoloader** : Composer uniquement — pas de `require_once` manuel hors bootstrap, pas de fallback

---

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Fichiers `src/` | `PascalCase` | `ElementManager.php` |
| Fichiers hors `src/` | `snake_case` | `iqitelementor.php` |
| Classes | `PascalCase` | `IqitElementorElementManager` |
| Méthodes | `camelCase` | `getWidgetList()` |
| Propriétés | `camelCase` | `$widgetRegistry` |
| Constantes | `SCREAMING_SNAKE_CASE` | `IQITELEMENTOR_VERSION` |
| Dossiers | `snake_case` | `/src/widget/` |
| Namespace | `PascalCase` | `IqitElementor\Core\` |

### Règles

- `src/` suit PSR-4 : le nom de fichier doit correspondre exactement au nom de classe (`PascalCase`)
- Les fichiers hors `src/` (contrôleurs, vues, fichier racine) restent en `snake_case` convention PS
- Toutes les classes `src/` sont sous le namespace `IqitElementor\` — sauf la classe racine
  `IqitElementor` (contrainte PS : même nom que le module)
- Les `ObjectModel` vont dans `classes/` sans namespace (voir section dédiée)
- Méthodes imposées par PrestaShop conservent leur nom (`install`, `uninstall`,
  `getContent`, `hookDisplayHeader`, etc.)
- **Zéro `snake_case` sur les méthodes** hors contrainte PS/PHP natif

---

## Namespace & autoloader

```json
{
    "autoload": {
        "psr-4": {
            "IqitElementor\\": "src/"
        },
        "classmap": [
            "classes/"
        ]
    }
}
```

Bootstrap dans `iqitelementor.php` :
```php
require_once __DIR__ . '/vendor/autoload.php';
```

Pas de fallback. Si `vendor/autoload.php` est absent, c'est un problème
d'environnement à corriger, pas à contourner dans le code.

---

## ObjectModel — dossier `classes/`

Les classes qui étendent `ObjectModel` sont placées dans `classes/` à la racine,
**sans namespace**, chargées via classmap Composer.

```
classes/
├── IqitElementorLanding.php
├── IqitElementorTemplate.php
└── ...
```

**Pourquoi hors namespace :**
- PrestaShop fait de l'introspection sur le nom de classe (`get_class()`, `$className`
  dans les AdminControllers, liens admin générés en query string)
- `class_alias()` ne couvre pas tous ces cas et peut casser silencieusement
- Garder le nom long (`IqitElementorLanding`) tel quel — pas de renommage, pas d'alias

---

## Arborescence `src/`

```
src/
├── Core/
│   └── Assets.php
├── Manager/
│   ├── ElementManager.php
│   ├── ControlsManager.php
│   └── TemplateManager.php
├── Base/
│   ├── ElementBase.php
│   ├── WidgetBase.php
│   └── SectionBase.php
├── Widget/
│   └── *.php                   # Un fichier par widget
├── Control/
│   └── *.php                   # Un fichier par type de contrôle
├── Module/
│   └── History/
│       └── Module.php
└── Helper/
    ├── UrlHelper.php
    ├── MediaHelper.php
    └── SanitizeHelper.php
```

---

## Typage PHP

### Typage natif — toujours en priorité

PHP 7.1 supporte les éléments suivants, à utiliser systématiquement :

```php
// Types scalaires, return types, void, nullable
public function setLimit(int $limit): void { }
public function findById(?int $id): ?array { }
public function getWidgetList(): array { }
public function register(WidgetBase $widget): void { }
```
j'j'e
`void`, `?string`, `?int`, `?array` etc. sont **valides PHP 7.1** et doivent être utilisés.

### PHPDoc — uniquement quand le natif est insuffisant

**Union types** (disponibles seulement à partir de PHP 8.0)
```php
/** @param int|string $id */
/** @return Widget|false */
public function findWidget($id) { }
```

**Tableaux typés**
```php
/** @param WidgetBase[] $widgets */
/** @return array<string, mixed> */
public function registerAll(array $widgets): void { }
```

**Propriétés de classe** (typage natif disponible seulement à partir de PHP 7.4)
```php
/** @var WidgetBase[] */
private $widgets = [];

/** @var string|null */
private $currentContext;
```

**Constantes de classe**
```php
/** @var string */
const TYPE = 'widget';
```

### Règle anti-redondance

Ne jamais doubler un type natif avec un PHPDoc qui ne dit rien de plus :

```php
// ❌ Interdit — PHPDoc redondant
/** @param int $limit */
public function setLimit(int $limit): void { }

// ✅ Correct — PHPDoc apporte une information que le natif ne peut pas exprimer
/** @param WidgetBase[] $widgets */
public function registerAll(array $widgets): void { }
```

---

## Ce qu'il ne faut pas toucher

- Noms de hooks PrestaShop
- Méthodes imposées par PS (`install`, `uninstall`, `getContent`, etc.)
- Noms des classes `ObjectModel` dans `classes/` — pas de renommage, pas d'alias
- Structure des tables SQL existantes — toute migration DB est un sprint séparé
- Fichiers de traduction dans `/translations/`

---

## Checklist avant de terminer une tâche

- [ ] Aucune syntaxe PHP > 7.1
- [ ] Toutes les méthodes ont un type de retour natif ou un `@return` PHPDoc
- [ ] Toutes les propriétés ont un `@var` PHPDoc
- [ ] Aucun PHPDoc redondant avec un type natif existant
- [ ] Aucun `require_once` manuel hors bootstrap
- [ ] Nouvelles classes métier dans `src/` sous namespace `IqitElementor\`, fichiers en `PascalCase`
- [ ] `ObjectModel` dans `classes/` sans namespace, chargés via classmap
- [ ] Nommage conforme au tableau des conventions
