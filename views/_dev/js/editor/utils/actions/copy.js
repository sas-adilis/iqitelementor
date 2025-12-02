// modules/iqitelementor/views/_dev/js/editor/utils/context-clipboard.js

let clipboard = window.iqitElementorClipboard || null;

function setClipboardFromElement( view ) {
    const model = view.model;

    clipboard = {
        type: 'element',
        elType: model.get( 'elType' ),          // section / column / widget
        widgetType: model.get( 'widgetType' ),  // uniquement pour les widgets
        data: model.toJSON(),
    };

    window.iqitElementorClipboard = clipboard;
    return clipboard;
}

function getCopyAction( view, options = {} ) {
    const defaults = {
        icon: '<i class="fa fa-clipboard"></i>',
    };

    const settings = Object.assign( {}, defaults, options );

    return {
        name: 'copy',
        icon: settings.icon,
        title: elementor.translate ? elementor.translate( 'Copy' ) : 'Copy',
        separator: settings.separator,
        callback: () => {
            setClipboardFromElement( view );
        },
    };
}

module.exports = getCopyAction;