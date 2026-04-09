<?php
namespace IqitElementor\Core;

use IqitElementor\Helper\Translater;

if (!defined('ELEMENTOR_ABSPATH')) {
    exit;
}
?>

<script type="text/template" id="tmpl-elementor-style-library-header">
	<div id="elementor-style-library-header-logo-area"></div>
	<div id="elementor-style-library-header-menu-area"></div>
	<div id="elementor-style-library-header-items-area">
		<div id="elementor-style-library-header-close-modal" class="elementor-template-library-header-item" title="<?php echo Translater::get()->l('Close', 'elementor'); ?>">
			<i class="eicon-close" title="<?php echo Translater::get()->l('Close', 'elementor'); ?>"></i>
		</div>
	</div>
</script>

<script type="text/template" id="tmpl-elementor-style-library-header-logo">
	<i class="fa fa-paint-brush"></i><span><?php echo Translater::get()->l('Styles Library', 'elementor'); ?></span>
</script>

<script type="text/template" id="tmpl-elementor-style-library-styles">
	<div id="elementor-style-library-filter">
		<input type="text" id="elementor-style-library-filter-text" placeholder="<?php echo Translater::get()->l('Search styles...', 'elementor'); ?>">
	</div>
	<div id="elementor-style-library-styles-container"></div>
</script>

<script type="text/template" id="tmpl-elementor-style-library-style-item">
	<div class="elementor-style-library-style-icon">
		<i class="fa fa-paint-brush"></i>
	</div>
	<div class="elementor-style-library-style-info">
		<div class="elementor-style-library-style-name">{{{ name }}}</div>
		<div class="elementor-style-library-style-widget-type">{{{ widget_type }}}</div>
	</div>
	<div class="elementor-style-library-style-controls">
		<button class="elementor-style-library-style-apply elementor-btn elementor-btn-success" title="<?php echo Translater::get()->l('Apply', 'elementor'); ?>">
			<i class="fa fa-check"></i>
		</button>
		<button class="elementor-style-library-style-default elementor-btn <# if ( is_default ) { #>elementor-btn-warning<# } #>" title="<# if ( is_default ) { #><?php echo Translater::get()->l('Unset default', 'elementor'); ?><# } else { #><?php echo Translater::get()->l('Set as default', 'elementor'); ?><# } #>">
			<i class="fa fa-star<# if ( ! is_default ) { #>-o<# } #>"></i>
		</button>
		<button class="elementor-style-library-style-delete" title="<?php echo Translater::get()->l('Delete', 'elementor'); ?>">
			<i class="fa fa-trash-o"></i>
		</button>
	</div>
</script>

<script type="text/template" id="tmpl-elementor-style-library-save-style">
	<div class="elementor-template-library-blank-title"><?php echo Translater::get()->l('Save Widget Style', 'elementor'); ?></div>
	<div class="elementor-template-library-blank-excerpt"><?php echo Translater::get()->l('Save the current widget settings as a reusable style.', 'elementor'); ?></div>
	<form id="elementor-style-library-save-style-form">
		<input type="hidden" id="elementor-style-library-save-widget-type" name="widget_type" value="">
		<input type="hidden" id="elementor-style-library-save-settings" name="settings" value="">
		<input id="elementor-style-library-save-style-name" name="name" placeholder="<?php echo Translater::get()->l('Enter style name', 'elementor'); ?>" required>
		<button id="elementor-style-library-save-style-submit" class="elementor-btn elementor-btn-success">
			<span class="elementor-state-icon">
				<i class="fa fa-spin fa-circle-o-notch"></i>
			</span>
			<?php echo Translater::get()->l('Save', 'elementor'); ?>
		</button>
	</form>
</script>

<script type="text/template" id="tmpl-elementor-style-library-styles-empty">
	<div id="elementor-style-library-styles-empty-icon">
		<i class="fa fa-paint-brush"></i>
	</div>
	<div class="elementor-template-library-blank-title"><?php echo Translater::get()->l('No Saved Styles Yet', 'elementor'); ?></div>
	<div class="elementor-template-library-blank-excerpt"><?php echo Translater::get()->l('Right-click any widget and choose "Save styles as..." to save reusable styles.', 'elementor'); ?></div>
</script>

<script type="text/template" id="tmpl-elementor-style-library-loading">
	<div class="elementor-loader-wrapper">
		<div class="elementor-loader">
			<div class="elementor-loader-box"></div>
			<div class="elementor-loader-box"></div>
			<div class="elementor-loader-box"></div>
			<div class="elementor-loader-box"></div>
		</div>
		<div class="elementor-loading-title"><?php echo Translater::get()->l('Loading', 'elementor'); ?></div>
	</div>
</script>
