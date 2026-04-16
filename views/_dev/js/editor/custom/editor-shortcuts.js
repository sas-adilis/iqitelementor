/*! iqitelementor - v1.0.0 */
/**
 * Iqit Elementor — Keyboard Shortcuts
 *
 * CMD+S (Mac) / CTRL+S (Windows/Linux) déclenche la sauvegarde/publication
 * de la page en cours d'édition, que le focus soit sur le panneau latéral
 * ou dans l'iframe de preview.
 */
(function ($) {
	'use strict';

	function isSaveShortcut(e) {
		var key = e.key || '';
		var isS = key.toLowerCase() === 's' || e.keyCode === 83 || e.which === 83;
		return isS && (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey;
	}

	function triggerSave(e) {
		if (!isSaveShortcut(e)) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();

		if (typeof elementor === 'undefined' || !elementor.saveBuilder) {
			return;
		}

		var $saveBtn = $('#elementor-panel-footer-save .elementor-btn');
		if ($saveBtn.length) {
			$saveBtn.addClass('elementor-btn-state');
		}

		elementor.saveBuilder({
			revision: 'publish',
			onSuccess: function () {
				if ($saveBtn.length) {
					$saveBtn.removeClass('elementor-btn-state');
				}
				if (elementor.dialogsManager) {
					var dialog = elementor.dialogsManager.createWidget('popup', {
						hide: { delay: 1500 }
					});
					dialog.setMessage(
						'<div class="elementor-dialog-message">' +
						'<i class="fa fa-check-circle"></i>' +
						'<div class="elementor-dialog-message-text">' +
						elementor.translate('saved') +
						'</div></div>'
					);
					dialog.show();
				}
			},
			onError: function () {
				if ($saveBtn.length) {
					$saveBtn.removeClass('elementor-btn-state');
				}
			}
		});
	}

	function bindPreviewIframe() {
		if (typeof elementor === 'undefined' || !elementor.$preview || !elementor.$preview.length) {
			return;
		}

		var $preview = elementor.$preview;

		function attach() {
			var iframeDoc = $preview[0].contentDocument || ($preview[0].contentWindow && $preview[0].contentWindow.document);
			if (!iframeDoc) {
				return;
			}
			$(iframeDoc).off('keydown.iqitSaveShortcut').on('keydown.iqitSaveShortcut', triggerSave);
		}

		attach();
		$preview.off('load.iqitSaveShortcut').on('load.iqitSaveShortcut', attach);
	}

	$(document).on('keydown.iqitSaveShortcut', triggerSave);

	$(function () {
		if (typeof elementor === 'undefined') {
			return;
		}
		elementor.on('preview:loaded', bindPreviewIframe);
	});
})(jQuery);
