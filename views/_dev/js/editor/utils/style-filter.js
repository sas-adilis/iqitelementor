/**
 * Filter widget settings to keep only style-related keys.
 *
 * Shared by save-style (to store only style data) and
 * apply-style (to avoid overwriting content).
 */

/**
 * Return control definitions for a widget type.
 *
 * @param {string} widgetType
 * @returns {Array|null}
 */
function getControlsForWidgetType( widgetType ) {
    if (
        typeof elementor !== 'undefined' &&
        elementor.config &&
        elementor.config.widgets &&
        widgetType &&
        elementor.config.widgets[ widgetType ] &&
        elementor.config.widgets[ widgetType ].controls
    ) {
        return elementor.config.widgets[ widgetType ].controls;
    }

    return null;
}

/**
 * Return only the style-related control names for a widget type.
 *
 * A control is considered "style" if:
 *  - it has `style_transfer: true`, or
 *  - it is NOT on the "content" tab, or
 *  - it has `selectors` or `prefix_class` (even on the content tab)
 *
 * @param {string} widgetType
 * @returns {string[]}
 */
function getStyleControlNames( widgetType ) {
    var controls = getControlsForWidgetType( widgetType );
    if ( ! controls ) {
        return [];
    }

    var names = [];

    controls.forEach( function( control ) {
        if ( typeof control !== 'object' ) {
            return;
        }

        var isStyle = false;

        if ( undefined !== control.style_transfer ) {
            isStyle = !! control.style_transfer;
        } else {
            isStyle = 'content' !== control.tab || !! control.selectors || !! control.prefix_class;
        }

        if ( isStyle && control.name ) {
            names.push( control.name );
        }
    } );

    return names;
}

/**
 * Filter a plain settings object, keeping only style keys.
 *
 * @param {string} widgetType
 * @param {Object} allSettings  — full settings (plain object)
 * @returns {Object}            — only style-related keys
 */
function filterStyleSettings( widgetType, allSettings ) {
    var styleNames = getStyleControlNames( widgetType );

    if ( ! styleNames.length ) {
        return allSettings;
    }

    var filtered = {};

    styleNames.forEach( function( name ) {
        if ( Object.prototype.hasOwnProperty.call( allSettings, name ) ) {
            filtered[ name ] = allSettings[ name ];
        }
    } );

    return filtered;
}

module.exports = {
    getStyleControlNames: getStyleControlNames,
    filterStyleSettings: filterStyleSettings
};
