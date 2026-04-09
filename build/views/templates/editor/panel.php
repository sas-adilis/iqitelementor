<?php
namespace IqitElementor\Core;

use IqitElementor\Helper\Helper;
use IqitElementor\Helper\Translater;
if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
} // Exit if accessed directly
?>
<script type="text/template" id="tmpl-elementor-topbar-content">
	<div class="elementor-topbar-zone elementor-topbar-zone--left">
		<button id="elementor-topbar-exit" class="elementor-topbar-btn" title="<?php echo Translater::get()->l('Go to Backoffice', 'elementor'); ?>">
			<i class="fa fa-arrow-left"></i>
		</button>
		<a id="elementor-topbar-logo" href="./" title="<?php echo Translater::get()->l('Go to Backoffice', 'elementor'); ?>">
			<img src="<?php echo _MODULE_DIR_; ?>iqitelementor/logo.png" alt="IQIT Elementor" />
		</a>
		<button id="elementor-topbar-revisions" class="elementor-topbar-btn" title="<?php echo Translater::get()->l('Revisions', 'elementor'); ?>">
			<i class="fa fa-history"></i>
			<span class="elementor-topbar-btn-label"><?php echo Translater::get()->l('Revisions', 'elementor'); ?></span>
		</button>
	</div>
	<div class="elementor-topbar-zone elementor-topbar-zone--center">
		<div class="elementor-topbar-devices">
			<button class="elementor-topbar-device-btn active" data-device-mode="desktop" title="<?php echo Translater::get()->l('Desktop', 'elementor'); ?>">
				<i class="eicon-device-desktop"></i>
			</button>
			<button class="elementor-topbar-device-btn" data-device-mode="tablet" title="<?php echo Translater::get()->l('Tablet', 'elementor'); ?>">
				<i class="eicon-device-tablet"></i>
			</button>
			<button class="elementor-topbar-device-btn" data-device-mode="mobile" title="<?php echo Translater::get()->l('Mobile', 'elementor'); ?>">
				<i class="eicon-device-mobile"></i>
			</button>
		</div>
	</div>
	<div class="elementor-topbar-zone elementor-topbar-zone--right">
		<button id="elementor-topbar-templates" class="elementor-topbar-btn" title="<?php echo Translater::get()->l('Templates', 'elementor'); ?>">
			<i class="fa fa-folder"></i>
		</button>
		<button id="elementor-topbar-styles" class="elementor-topbar-btn" title="<?php echo Translater::get()->l('Styles Library', 'elementor'); ?>">
			<i class="fa fa-paint-brush"></i>
		</button>
		<button id="elementor-topbar-navigator" class="elementor-topbar-btn" title="<?php echo Translater::get()->l('Navigator', 'elementor'); ?>">
			<i class="eicon-navigator"></i>
		</button>
		<button id="elementor-topbar-inspect" class="elementor-topbar-btn" title="<?php echo Translater::get()->l('Inspect Mode', 'elementor'); ?>">
			<i class="fa fa-th-large"></i>
		</button>
		<button id="elementor-topbar-preview" class="elementor-topbar-btn" title="<?php echo Translater::get()->l('Preview Changes', 'elementor'); ?>">
			<i class="fa fa-eye"></i>
		</button>
		<button id="elementor-topbar-save" class="elementor-topbar-save-btn" title="<?php echo Translater::get()->l('Save', 'elementor'); ?>">
			<span class="elementor-topbar-save-icon">
				<i class="fa fa-spin fa-circle-o-notch"></i>
			</span>
			<?php echo Translater::get()->l('Save', 'elementor'); ?>
		</button>
	</div>
</script>

<script type="text/template" id="tmpl-elementor-panel-revisions">
	<div class="elementor-revisions-spinner"></div>
</script>

<script type="text/template" id="tmpl-elementor-panel">
	<div id="elementor-mode-switcher"></div>
	<header id="elementor-panel-header-wrapper"></header>
	<main id="elementor-panel-content-wrapper"></main>
	<footer id="elementor-panel-footer">
		<div class="elementor-panel-container">
		</div>
	</footer>
</script>

<script type="text/template" id="tmpl-elementor-panel-menu-item">
	<div class="elementor-panel-menu-item-icon">
		<i class="fa fa-{{ icon }}"></i>
	</div>
	<div class="elementor-panel-menu-item-title">{{{ title }}}</div>
</script>

<script type="text/template" id="tmpl-elementor-panel-header">
	<div id="elementor-panel-header-menu-button" class="elementor-header-button">
		<i class="elementor-icon eicon-menu tooltip-target" data-tooltip="<?php Helper::escAttr('Menu', 'elementor'); ?>"></i>
	</div>
	<div id="elementor-panel-header-title"></div>
	<div id="elementor-panel-header-add-button" class="elementor-header-button">
		<i class="elementor-icon eicon-apps tooltip-target" data-tooltip="<?php Helper::escAttr('Widgets Panel', 'elementor'); ?>"></i>
	</div>
</script>

<script type="text/template" id="tmpl-elementor-panel-footer-content">
	<div id="elementor-panel-footer-exit" class="elementor-panel-footer-tool" title="<?php echo Translater::get()->l('Exit', 'elementor'); ?>">
		<i class="fa fa-times"></i>
		<div class="elementor-panel-footer-sub-menu-wrapper">
			<div class="elementor-panel-footer-sub-menu">
				<a id="elementor-panel-footer-view-edit-page" class="elementor-panel-footer-sub-menu-item" href="./">
					<i class="elementor-icon fa fa-arrow-left"></i>
					<span class="elementor-title"><?php echo Translater::get()->l('Go to Backoffice', 'elementor'); ?></span>
				</a>
			</div>
		</div>
	</div>
    <!--<div class="elementor-panel-footer-tool tooltip-target" data-tooltip="<?php echo Helper::escAttr('Structure', 'elementor'); ?>" aria-label="<?php echo Helper::escAttr('Structure', 'elementor'); ?>">
        <button id="elementor-panel-footer-navigator" >
            <i class="eicon-navigator" aria-hidden="true"></i>
        </button>
    </div>-->

	<div id="elementor-panel-footer-responsive" class="elementor-panel-footer-tool" title="<?php Helper::escAttr('Responsive Mode', 'elementor'); ?>">
		<i class="eicon-device-desktop"></i>
		<div class="elementor-panel-footer-sub-menu-wrapper">
			<div class="elementor-panel-footer-sub-menu">
				<div class="elementor-panel-footer-sub-menu-item" data-device-mode="desktop">
					<i class="elementor-icon eicon-device-desktop"></i>
					<span class="elementor-title"><?php echo Translater::get()->l('Desktop', 'elementor'); ?></span>
					<span class="elementor-description"><?php echo Translater::get()->l('Default Preview', 'elementor'); ?></span>
				</div>
				<div class="elementor-panel-footer-sub-menu-item" data-device-mode="tablet">
					<i class="elementor-icon eicon-device-tablet"></i>
					<span class="elementor-title"><?php echo Translater::get()->l('Tablet', 'elementor'); ?></span>
					<span class="elementor-description"><?php echo Translater::get()->l('Preview for 768px', 'elementor'); ?></span>
				</div>
				<div class="elementor-panel-footer-sub-menu-item" data-device-mode="mobile">
					<i class="elementor-icon eicon-device-mobile"></i>
					<span class="elementor-title"><?php echo Translater::get()->l('Mobile', 'elementor'); ?></span>
					<span class="elementor-description"><?php echo Translater::get()->l('Preview for 360px', 'elementor'); ?></span>
				</div>
			</div>
		</div>
	</div>
	<div id="elementor-panel-footer-templates" class="elementor-panel-footer-tool" title="<?php Helper::escAttr('Templates', 'elementor'); ?>">
		<span class="elementor-screen-only"><?php echo Translater::get()->l('Templates', 'elementor'); ?></span>
		<i class="fa fa-folder"></i>
		<div class="elementor-panel-footer-sub-menu-wrapper">
			<div class="elementor-panel-footer-sub-menu">
				<div id="elementor-panel-footer-templates-modal" class="elementor-panel-footer-sub-menu-item">
					<i class="elementor-icon fa fa-folder"></i>
					<span class="elementor-title"><?php echo Translater::get()->l('Templates Library', 'elementor'); ?></span>
				</div>
				<div id="elementor-panel-footer-save-template" class="elementor-panel-footer-sub-menu-item">
					<i class="elementor-icon fa fa-save"></i>
					<span class="elementor-title"><?php echo Translater::get()->l('Save Template', 'elementor'); ?></span>
				</div>
			</div>
		</div>
	</div>
	<div id="elementor-panel-footer-inspect" class="elementor-panel-footer-tool" title="<?php echo Helper::escAttr('Inspect Mode', 'elementor'); ?>">
		<span class="elementor-screen-only"><?php echo Translater::get()->l('Inspect Mode', 'elementor'); ?></span>
		<i class="fa fa-th-large"></i>
	</div>
	<div id="elementor-panel-footer-save" class="elementor-panel-footer-tool" title="<?php echo Helper::escAttr('Save', 'elementor'); ?>">
		<button class="elementor-btn">
			<span class="elementor-state-icon">
				<i class="fa fa-spin fa-circle-o-notch "></i>
			</span>
			<?php echo Translater::get()->l('Save', 'elementor'); ?>
		</button>
	</div>
</script>

<script type="text/template" id="tmpl-elementor-mode-switcher-content">
	<input id="elementor-mode-switcher-preview-input" type="checkbox">
	<label for="elementor-mode-switcher-preview-input" id="elementor-mode-switcher-preview" title="<?php Helper::escAttr('Preview', 'elementor'); ?>">
		<span class="elementor-screen-only"><?php echo Translater::get()->l('Preview', 'elementor'); ?></span>
		<i class="fa"></i>
	</label>
</script>

<script type="text/template" id="tmpl-editor-content">
	<div class="elementor-tabs-controls">
		<ul>
			<# _.each( elementData.tabs_controls, function( tabTitle, tabSlug ) { #>
			<li class="elementor-tab-control-{{ tabSlug }}">
				<a href="#" data-tab="{{ tabSlug }}">
					{{{ tabTitle }}}
				</a>
			</li>
			<# } ); #>
		</ul>
	</div>
	<div class="elementor-controls"></div>
</script>

<script type="text/template" id="tmpl-elementor-panel-schemes-typography">
	<div class="elementor-panel-scheme-buttons">
		<div class="elementor-panel-scheme-button-wrapper elementor-panel-scheme-reset">
			<button class="elementor-btn">
				<i class="fa fa-undo"></i>
				<?php echo Translater::get()->l('Reset', 'elementor'); ?>
			</button>
		</div>
		<div class="elementor-panel-scheme-button-wrapper elementor-panel-scheme-discard">
			<button class="elementor-btn">
				<i class="fa fa-times"></i>
				<?php echo Translater::get()->l('Discard', 'elementor'); ?>
			</button>
		</div>
		<div class="elementor-panel-scheme-button-wrapper elementor-panel-scheme-save">
			<button class="elementor-btn elementor-btn-success" disabled><?php echo Translater::get()->l('Apply', 'elementor'); ?></button>
		</div>
	</div>
	<div class="elementor-panel-scheme-items"></div>
</script>

<script type="text/template" id="tmpl-elementor-panel-schemes-color">
	<div class="elementor-panel-scheme-buttons">
		<div class="elementor-panel-scheme-button-wrapper elementor-panel-scheme-reset">
			<button class="elementor-btn">
				<i class="fa fa-undo"></i>
				<?php echo Translater::get()->l('Reset', 'elementor'); ?>
			</button>
		</div>
		<div class="elementor-panel-scheme-button-wrapper elementor-panel-scheme-discard">
			<button class="elementor-btn">
				<i class="fa fa-times"></i>
				<?php echo Translater::get()->l('Discard', 'elementor'); ?>
			</button>
		</div>
		<div class="elementor-panel-scheme-button-wrapper elementor-panel-scheme-save">
			<button class="elementor-btn elementor-btn-success" disabled><?php echo Translater::get()->l('Apply', 'elementor'); ?></button>
		</div>
	</div>
	<div class="elementor-panel-scheme-content elementor-panel-box">
		<div class="elementor-panel-heading">
			<div class="elementor-panel-heading-title"><?php echo Translater::get()->l('Color Palette', 'elementor'); ?></div>
		</div>
		<div class="elementor-panel-scheme-items elementor-panel-box-content"></div>
	</div>
	<div class="elementor-panel-scheme-colors-more-palettes elementor-panel-box">
	</div>
</script>

<script type="text/template" id="tmpl-elementor-panel-schemes-disabled">
	{{{ 'are disabled', disabledTitle ) }}}
</script>

<script type="text/template" id="tmpl-elementor-panel-scheme-color-item">
	<div class="elementor-panel-scheme-color-input-wrapper">
		<input type="text" class="elementor-panel-scheme-color-value" value="{{ value }}" />
	</div>
	<div class="elementor-panel-scheme-color-title">{{{ title }}}</div>
</script>

<script type="text/template" id="tmpl-elementor-panel-scheme-typography-item">
	<div class="elementor-panel-heading">
		<div class="elementor-panel-heading-toggle">
			<i class="fa"></i>
		</div>
		<div class="elementor-panel-heading-title">{{{ title }}}</div>
	</div>
	<div class="elementor-panel-scheme-typography-items elementor-panel-box-content">
	</div>
</script>

<script type="text/template" id="tmpl-elementor-control-responsive-switchers">
	<div class="elementor-control-responsive-switchers">
		<a class="elementor-responsive-switcher elementor-responsive-switcher-desktop" data-device="desktop">
			<i class="eicon-device-desktop"></i>
		</a>
		<a class="elementor-responsive-switcher elementor-responsive-switcher-tablet" data-device="tablet">
			<i class="eicon-device-tablet"></i>
		</a>
		<a class="elementor-responsive-switcher elementor-responsive-switcher-mobile" data-device="mobile">
			<i class="eicon-device-mobile"></i>
		</a>
	</div>
</script>
