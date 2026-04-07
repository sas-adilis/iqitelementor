/**
 * Iqit Elementor — Inspect Mode
 *
 * Affiche les margins (orange hachuré) et paddings (vert hachuré)
 * de l'élément survolé (section / column / widget) dans l'iframe de preview.
 * Rien n'est affiché tant qu'on ne survole pas un élément.
 */
(function ($) {
	'use strict';

	var OVERLAY_ID = 'iqit-inspect-overlay';
	var BODY_CLASS = 'iqit-inspect-mode';
	var BUTTON_ID = 'elementor-panel-footer-inspect';
	var TARGET_SELECTOR = '.elementor-section, .elementor-column, .elementor-widget';

	var COLOR_MARGIN = 'rgba(255, 152, 0, 0.35)';
	var COLOR_PADDING = 'rgba(76, 175, 80, 0.35)';

	var active = false;
	var iframeWin = null;
	var iframeDoc = null;
	var $iframeBody = null;
	var overlayEl = null;
	var styleEl = null;
	var hoveredEl = null;

	/* ------------------------------------------------------------------ */
	/*  Bootstrap                                                         */
	/* ------------------------------------------------------------------ */

	function onReady() {
		if (typeof elementor === 'undefined') {
			return;
		}

		elementor.on('preview:loaded', function () {
			bindPreview();
			bindButton();

			if (elementor.channels && elementor.channels.dataEditMode) {
				elementor.channels.dataEditMode.on('switch', function () {
					var mode = elementor.channels.dataEditMode.request('activeMode');
					if (mode === 'preview' && active) {
						toggle(false);
					}
				});
			}
		});
	}

	function bindButton() {
		var $btn = $('#' + BUTTON_ID);
		if (!$btn.length) {
			setTimeout(bindButton, 200);
			return;
		}

		$btn.off('click.iqitInspect').on('click.iqitInspect', function (e) {
			e.preventDefault();
			e.stopPropagation();
			toggle();
		});
	}

	function bindPreview() {
		var $preview = elementor.$preview;
		if (!$preview || !$preview.length) {
			return;
		}

		iframeWin = $preview[0].contentWindow;
		iframeDoc = $preview[0].contentDocument || iframeWin.document;
		if (!iframeDoc || !iframeDoc.body) {
			return;
		}
		$iframeBody = $(iframeDoc.body);

		$preview.off('load.iqitInspect').on('load.iqitInspect', function () {
			teardown();
			setTimeout(function () {
				bindPreview();
				if (active) {
					setup();
				}
			}, 100);
		});
	}

	/* ------------------------------------------------------------------ */
	/*  Toggle                                                            */
	/* ------------------------------------------------------------------ */

	function toggle(force) {
		var next = typeof force === 'boolean' ? force : !active;
		if (next === active) {
			return;
		}
		active = next;
		$('#' + BUTTON_ID).toggleClass('iqit-inspect-active', active);

		if (active) {
			setup();
		} else {
			teardown();
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Setup / Teardown                                                  */
	/* ------------------------------------------------------------------ */

	function setup() {
		if (!$iframeBody || !$iframeBody.length) {
			return;
		}
		$iframeBody.addClass(BODY_CLASS);

		// Style injecté dans l'iframe
		if (!styleEl) {
			styleEl = iframeDoc.createElement('style');
			styleEl.id = 'iqit-inspect-style';
		}
		styleEl.textContent = '.' + BODY_CLASS + '{cursor:crosshair}';
		if (!styleEl.parentNode) {
			iframeDoc.head.appendChild(styleEl);
		}

		// Container overlay
		if (!overlayEl) {
			overlayEl = iframeDoc.createElement('div');
			overlayEl.id = OVERLAY_ID;
			overlayEl.style.cssText = 'position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:9998';
		}
		if (!overlayEl.parentNode) {
			iframeDoc.body.appendChild(overlayEl);
		}
		overlayEl.innerHTML = '';

		// Listeners
		iframeDoc.body.addEventListener('mouseover', onMouseOver, true);
		iframeDoc.body.addEventListener('mouseleave', onMouseLeave, true);
		iframeWin.addEventListener('scroll', onScrollResize, true);
		iframeWin.addEventListener('resize', onScrollResize);
	}

	function teardown() {
		if ($iframeBody && $iframeBody.length) {
			$iframeBody.removeClass(BODY_CLASS);
		}

		if (styleEl && styleEl.parentNode) {
			styleEl.parentNode.removeChild(styleEl);
		}

		if (overlayEl && overlayEl.parentNode) {
			overlayEl.parentNode.removeChild(overlayEl);
		}
		if (overlayEl) {
			overlayEl.innerHTML = '';
		}

		if (iframeDoc && iframeDoc.body) {
			iframeDoc.body.removeEventListener('mouseover', onMouseOver, true);
			iframeDoc.body.removeEventListener('mouseleave', onMouseLeave, true);
		}
		if (iframeWin) {
			iframeWin.removeEventListener('scroll', onScrollResize, true);
			iframeWin.removeEventListener('resize', onScrollResize);
		}

		hoveredEl = null;
	}

	/* ------------------------------------------------------------------ */
	/*  Hover handlers                                                    */
	/* ------------------------------------------------------------------ */

	function onMouseOver(e) {
		var el = e.target && e.target.closest ? e.target.closest(TARGET_SELECTOR) : null;
		if (el === hoveredEl) {
			return;
		}
		hoveredEl = el;
		drawForElement(el);
	}

	function onMouseLeave() {
		hoveredEl = null;
		if (overlayEl) {
			overlayEl.innerHTML = '';
		}
	}

	function onScrollResize() {
		if (hoveredEl) {
			drawForElement(hoveredEl);
		}
	}

	/* ------------------------------------------------------------------ */
	/*  Draw                                                              */
	/* ------------------------------------------------------------------ */

	function drawForElement(el) {
		if (!overlayEl) {
			return;
		}

		if (!el) {
			overlayEl.innerHTML = '';
			return;
		}

		var rect = el.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) {
			overlayEl.innerHTML = '';
			return;
		}

		var cs = iframeWin.getComputedStyle(el);
		var mt = parseFloat(cs.marginTop) || 0;
		var mr = parseFloat(cs.marginRight) || 0;
		var mb = parseFloat(cs.marginBottom) || 0;
		var ml = parseFloat(cs.marginLeft) || 0;
		var pt = parseFloat(cs.paddingTop) || 0;
		var pr = parseFloat(cs.paddingRight) || 0;
		var pb = parseFloat(cs.paddingBottom) || 0;
		var pl = parseFloat(cs.paddingLeft) || 0;

		var scrollX = iframeWin.pageXOffset || 0;
		var scrollY = iframeWin.pageYOffset || 0;
		var top = rect.top + scrollY;
		var left = rect.left + scrollX;
		var w = rect.width;
		var h = rect.height;

		var html = '';

		// Margin — orange
		if (mt > 0) {
			html += hatchRect(left - ml, top - mt, w + ml + mr, mt, COLOR_MARGIN);
		}
		if (mb > 0) {
			html += hatchRect(left - ml, top + h, w + ml + mr, mb, COLOR_MARGIN);
		}
		if (ml > 0) {
			html += hatchRect(left - ml, top, ml, h, COLOR_MARGIN);
		}
		if (mr > 0) {
			html += hatchRect(left + w, top, mr, h, COLOR_MARGIN);
		}

		// Padding — vert
		if (pt > 0) {
			html += hatchRect(left, top, w, pt, COLOR_PADDING);
		}
		if (pb > 0) {
			html += hatchRect(left, top + h - pb, w, pb, COLOR_PADDING);
		}
		if (pl > 0) {
			html += hatchRect(left, top + pt, pl, h - pt - pb, COLOR_PADDING);
		}
		if (pr > 0) {
			html += hatchRect(left + w - pr, top + pt, pr, h - pt - pb, COLOR_PADDING);
		}

		overlayEl.innerHTML = html;
	}

	function hatchRect(x, y, w, h, color) {
		if (w <= 0 || h <= 0) {
			return '';
		}
		return '<div style="'
			+ 'position:absolute;'
			+ 'left:' + x + 'px;'
			+ 'top:' + y + 'px;'
			+ 'width:' + w + 'px;'
			+ 'height:' + h + 'px;'
			+ 'background:repeating-linear-gradient(45deg,' + color + ' 0 6px,transparent 6px 12px);'
			+ 'pointer-events:none;'
			+ '"></div>';
	}

	// Init
	$(function () {
		onReady();
	});
})(jQuery);
