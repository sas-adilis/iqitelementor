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
		<div id="elementor-style-library-header-tools2"></div>
        <div id="elementor-style-library-header-tools"></div>
	</div>
</script>

<script type="text/template" id="tmpl-elementor-style-library-header-logo">
	<span><?php echo Translater::get()->l('Styles Library', 'elementor'); ?></span>
</script>

<script type="text/template" id="tmpl-elementor-style-library-header-save">
	<i class="eicon-save" title="<?php echo Translater::get()->l('Save Style', 'elementor'); ?>"></i>
</script>

<script type="text/template" id="tmpl-elementor-style-library-header-load">
	<i class="icon-upload" title="<?php echo Translater::get()->l('Import Style', 'elementor'); ?>"></i>
</script>

<script type="text/template" id="tmpl-elementor-style-library-header-menu">
	<div id="elementor-style-library-menu-all" class="elementor-template-library-menu-item elementor-active" data-filter=""><?php echo Translater::get()->l('All', 'elementor'); ?></div>
</script>

<script type="text/template" id="tmpl-elementor-style-library-styles">
	<div id="elementor-style-library-filter">
		<select id="elementor-style-library-filter-widget-type">
			<option value=""><?php echo Translater::get()->l('All widget types', 'elementor'); ?></option>
		</select>
	</div>
	<div id="elementor-style-library-styles-container"></div>
</script>

<script type="text/template" id="tmpl-elementor-style-library-style-item">
	<div class="elementor-style-library-style-icon">
		<i class="fa fa-paint-brush"></i>
	</div>
	<div class="elementor-style-library-style-info">
		<span class="elementor-style-library-style-name">{{{ name }}}</span>
		<span class="elementor-style-library-style-widget-type">{{{ widget_type }}}</span>
	</div>
	<div class="elementor-style-library-style-controls">
		<div class="elementor-style-library-style-default-toggle<# if ( is_default ) { #> is-default<# } #>">
			<i class="fa fa-star<# if ( ! is_default ) { #>-o<# } #>"></i>
			<span class="elementor-style-library-style-control-title"><# if ( is_default ) { #><?php echo Translater::get()->l('Default', 'elementor'); ?><# } else { #><?php echo Translater::get()->l('Set as default', 'elementor'); ?><# } #></span>
		</div>
		<div class="elementor-style-library-style-export">
			<a href="{{ export_link }}">
				<i class="fa fa-sign-out"></i><span class="elementor-style-library-style-control-title"><?php echo Translater::get()->l('Export', 'elementor'); ?></span>
			</a>
		</div>
		<div class="elementor-style-library-style-delete">
			<i class="fa fa-trash-o"></i><span class="elementor-style-library-style-control-title"><?php echo Translater::get()->l('Delete', 'elementor'); ?></span>
		</div>
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

<script type="text/template" id="tmpl-elementor-style-library-load-style">
	<div class="elementor-template-library-blank-title"><?php echo Translater::get()->l('Import Style', 'elementor'); ?></div>
	<div class="elementor-template-library-blank-excerpt"><?php echo Translater::get()->l('Import a .json style file from your computer', 'elementor'); ?></div>
	<form id="elementor-style-library-load-style-form">
		<div id="elementor-style-library-load-wrapper">
			<button id="elementor-style-library-load-btn-file"><?php echo Translater::get()->l('Select style .json file', 'elementor'); ?></button>
			<input id="elementor-style-library-load-style-file" type="file" name="file" required>
		</div>
		<button id="elementor-style-library-load-style-submit" class="elementor-btn elementor-btn-success">
			<span class="elementor-state-icon">
				<i class="fa fa-spin fa-circle-o-notch"></i>
			</span>
			<?php echo Translater::get()->l('Import', 'elementor'); ?>
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
