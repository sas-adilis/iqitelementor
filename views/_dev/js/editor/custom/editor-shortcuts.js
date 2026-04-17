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

	function isEscapeKey(e) {
		return (e.key === 'Escape' || e.keyCode === 27);
	}

	function closeOpenModals() {
		if (typeof elementor === 'undefined') {
			return false;
		}

		var closed = false;

		if (elementor.templates && elementor.templates.getModal) {
			var tplModal = elementor.templates.getModal();
			if (tplModal && tplModal.isVisible && tplModal.isVisible()) {
				tplModal.hide();
				closed = true;
			}
		}

		if (elementor.styleLibrary && elementor.styleLibrary.getModal) {
			var styleModal = elementor.styleLibrary.getModal();
			if (styleModal && styleModal.isVisible && styleModal.isVisible()) {
				styleModal.hide();
				closed = true;
			}
		}

		return closed;
	}

	function handleKeydown(e) {
		if (isEscapeKey(e)) {
			if (closeOpenModals()) {
				e.preventDefault();
				e.stopPropagation();
			}
			return;
		}

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
			$(iframeDoc).off('keydown.iqitShortcut').on('keydown.iqitShortcut', handleKeydown);
		}

		attach();
		$preview.off('load.iqitShortcut').on('load.iqitShortcut', attach);
	}

	$(document).on('keydown.iqitShortcut', handleKeydown);

	$(function () {
		if (typeof elementor === 'undefined') {
			return;
		}
		elementor.on('preview:loaded', bindPreviewIframe);
	});
})(jQuery);
