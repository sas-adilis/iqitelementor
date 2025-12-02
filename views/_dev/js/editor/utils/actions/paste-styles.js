/**
 * Utils: paste only style-related settings from one element to another.
 *
 * This module exposes two helpers:
 * - canPasteStyles(clipboardModel, targetModel)
 * - pasteStyles(clipboardModel, targetModel)
 *
 * Both parameters are expected to be Backbone models of Elementor-like widgets
 * (the same type as those used in the editor).
 */

/**
 * Try to get the control definitions for a given element model.
 * The exact API may vary a bit depending on the fork, so we try
 * a few common patterns and fall back safely.
 *
 * @param {Backbone.Model} model
 * @returns {Object|null}
 */
function getControlsFromModel(model) {
	if (!model || typeof model !== 'object') {
		return null;
	}

	let widgetType = null;
	if (typeof model.get === 'function') {
		widgetType = model.get('widgetType');
	}

	if (
		typeof elementor !== 'undefined' &&
		elementor.config &&
		elementor.config.widgets &&
		widgetType &&
		elementor.config.widgets[widgetType]
	) {
		const widgetConfig = elementor.config.widgets[widgetType];
		if (widgetConfig && widgetConfig.controls && typeof widgetConfig.controls === 'object') {
			return widgetConfig.controls;
		}
	}

	return null;
}

/**
 * Return the list of setting keys that belong to the Style tab
 * (or to a section considered as a style section).
 *
 * @param {Backbone.Model} model
 * @returns {string[]} Array of setting keys
 */
function getStyleControls(model) {
	const controls = getControlsFromModel(model);
	if (!controls) {
		return [];
	}

	return controls.filter((control) => {
		if (typeof control !== 'object') {
			return false;
		}

		if ( undefined !== control.style_transfer ) {
			return control.style_transfer;
		}

		return 'content' !== control.tab || control.selectors || control.prefix_class;
	});
}

/**
 * Petit helper pour normaliser les settings d'un modèle
 * (Backbone model ou simple objet).
 *
 * @param {any} rawSettings
 * @returns {Object}
 */
function normalizeSettings(rawSettings) {
	if (!rawSettings) {
		return {};
	}

	// Backbone model avec toJSON()
	if (typeof rawSettings.toJSON === 'function') {
		return rawSettings.toJSON();
	}

	// Déjà un objet simple
	if (typeof rawSettings === 'object') {
		return rawSettings;
	}

	return {};
}

/**
 * Colle uniquement les settings liés au Style depuis clipboardModel vers targetModel.
 * Ne fait rien si les prérequis ne sont pas remplis.
 *
 * @param {Backbone.Model} targetModel
 */
function pasteStyles(targetModel) {
    const clipboardModel = window.iqitElementorClipboard;
	if (!clipboardModel || !targetModel) {
		return;
	}

	// Clés de style basées sur la définition des controls de la CIBLE :
	// ça évite d'essayer de setter des clés qui n'existent pas sur ce widget.
	const styleControls = getStyleControls(targetModel);

	if (!styleControls.length) {
		return;
	}

	const sourceSettings = normalizeSettings(clipboardModel.data.settings);
	const newStyleSettings = {};

	styleControls.forEach((control) => {
		if (Object.prototype.hasOwnProperty.call(sourceSettings, control.name)) {
			newStyleSettings[control.name] = sourceSettings[control.name];
		}
	});

	const targetSettingsRaw = targetModel.get && targetModel.get('settings');
	const targetSettings = normalizeSettings(targetSettingsRaw);

	if (!Object.keys(newStyleSettings).length) {
		// Rien à coller
		return;
	}

	// Fusion des settings actuels avec les nouveaux styles
	const mergedSettings = (typeof _ !== 'undefined' && typeof _.extend === 'function')
		? _.extend({}, targetSettings, newStyleSettings)
		: Object.assign({}, targetSettings, newStyleSettings);

	// On met à jour le modèle cible. Selon ton implémentation,
	// tu peux avoir un setSetting() ou similaire.
	if (typeof targetSettingsRaw === 'object' && typeof targetSettingsRaw.set === 'function') {
		// Si settings est un Backbone Model
		Object.keys(mergedSettings).forEach((settingKey) => {
			targetSettingsRaw.set(settingKey, mergedSettings[settingKey]);
		});
	} else if (typeof targetModel.setSettings === 'function') {
		// Certaines implémentations exposent une API dédiée
		targetModel.setSettings(mergedSettings);
	} else if (typeof targetModel.set === 'function') {
		// Fallback : on remplace le bloc settings complet
		targetModel.set('settings', mergedSettings);
	}
}

function getPastStylesAction( view, options = {} ) {
    const defaults = {
        icon: '<i class="fa fa-paint-brush"></i>',
    };

    const settings = Object.assign( {}, defaults, options );

    return {
        name: 'paste_styles',
        icon: settings.icon,
        title: elementor.translate ? elementor.translate( 'Paste styles' ) : 'Copy',
        separator: settings.separator,
        callback: () => {
            pasteStyles(view.model);
        },
    };
}

// Export par défaut pratique si tu préfères importer un seul objet.
module.exports = getPastStylesAction;
