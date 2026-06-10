{*
* 2007-2016 PrestaShop
*
* NOTICE OF LICENSE
*
* This source file is subject to the Academic Free License (AFL 3.0)
* that is bundled with this package in the file LICENSE.txt.
* It is also available through the world-wide-web at this URL:
* http://opensource.org/licenses/afl-3.0.php
* If you did not receive a copy of the license and are unable to
* obtain it through the world-wide-web, please send an email
* to license@prestashop.com so we can send you a copy immediately.
*
* DISCLAIMER
*
* Do not edit or add to this file if you wish to upgrade PrestaShop to newer
* versions in the future. If you wish to customize PrestaShop for your
* needs please refer to http://www.prestashop.com for more information.
*
*  @author PrestaShop SA <contact@prestashop.com>
*  @copyright  2007-2016 PrestaShop SA
*  @license    http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
*  International Registered Trademark & Property of PrestaShop SA
*}

{*
  The CMS, product, brand and blog "Edit with Elementor" buttons used to be
  rendered here as inline <script type="text/template"> blocks and then
  injected by views/js/backoffice.js via hardcoded jQuery selectors.

  They are now produced by IqitElementor\BackOffice\BuiltInButtonProvider and
  injected by views/js/bo-button-injector.js, which lets any module (including
  iqitelementor_addons and any future addon) register its own placements
  through the EditorButtonRegistry + actionIqitElementorRegisterBoButtons hook.

  The Category template is still rendered below as-is because it carries the
  "Show elementor content only" switcher in addition to the button, which is
  more than a simple button placement can express.
*}

<script type="text/javascript">
    var elementorPageType = '{$pageType}';
</script>

<script type="text/template" id="tmpl-btn-edit-with-elementor-category">
    <div style="margin-bottom: 20px;">
        <div class="form-group row">
        <label class="form-control-label" ></label>
        <div class="col-sm">
        {if $urlElementor }
            <a target="_blank" href="{$urlElementor}" class="m-b-2 m-r-1 btn pointer btn-edit-with-elementor"><i class="icon-external-link"></i> {l s='Add extendend content with Elementor - Visual Page Builder' mod='iqitelementor'}</a>
        {else}
            <div class="alert alert-info"> <p class="alert-text">{l s=' Save category first to enable page builder for description' mod='iqitelementor'}</p></div>
        {/if}
        </div></div>
    </div>
    {if $urlElementor }
    <div style="margin-bottom: 20px; border-bottom:  1px solid #cecece">
        <div class="form-group row">
            <label class="form-control-label"><span>{l s='Show elementor content only' mod='iqitelementor'}</span></label>
            <div class="col-sm">

                <div class="input-group">
                    <span class="ps-switch">
                        <input id="justElementor_off" class="ps-switch" name="justElementor" value="0"  {if !$justElementorCategory}checked="checked"{/if} type="radio"><label for="justElementor_off">{l s='No' mod='iqitelementor'}</label>
                        <input id="justElementor_on" class="ps-switch" name="justElementor" value="1" {if $justElementorCategory}checked="checked"{/if} type="radio"><label for="justElementor_on">{l s='Yes' mod='iqitelementor'}</label>
                        <span class="slide-button"></span>
                    </span>
                </div>
                <input name="idPageElementor" value="{$idPage}"  type="hidden">

                <div class="col-lg-12">
                    <div class="help-block">
                        {l s='If you want to create customized category page(like landing page) without sidebards and default product list enabled this option' mod='iqitelementor'}
                    </div>
                </div>
            </div>
        </div>
    </div>
    {/if}

</script>
