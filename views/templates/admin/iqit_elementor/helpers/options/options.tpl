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
{extends file="helpers/options/options.tpl"}

{block name="input"}
    {if $field['type'] == 'instagram_connect'}
    <div class="col-lg-9">
        <div class="elementor-instagram-connection">
        {if $field['token']}
            <p>{l s='Your connected instagram account' mod='iqitelementor'}</p>
            <a href="https://instagram.com/{$field['username']}/" target="_blank" class="m-b-2 m-r-1 btn btn-connect-with-instagram">
                    <i class="icon-instagram"></i> {$field['username']}
            </a>
            <a href="{$field['urlRemove']}" class="m-b-2 m-r-1 btn btn-danger">
                <i class="icon-trash"></i>
            </a>
            <p class="expiration-date">{l s='Expiration date' mod='iqitelementor'}: {$field['instagramExpDate']}({l s='Autorenewal' mod='iqitelementor'})</p>
        {else}
            <input class="form-control " style="margin-bottom: 12px;" type="text" size="5" name="iqit_elementor_inst_token" value="" placeholder="{l s='Acess token' mod='iqitelementor'}">
                <button type="submit" class="btn btn-connect-with-instagram" name="submitInstagramConnect"><i class="icon-instagram"></i> {l s='Connect with your Instagram' mod='iqitelementor'}</button>
                <br><br>
            If you want to use instagram feed widget you need to fill field with your access token, and then click 'Connect with your Instagram' <br> Learn <a href="https://iqit-commerce.com/how-to-get-instagram-token/">How to get Instagram acess token</a>
        {/if}
        </div>
    </div>
        {if isset($field['desc']) && !empty($field['desc'])}
            <div class="col-lg-9 col-lg-offset-3">
                <div class="help-block">
                    {if is_array($field['desc'])}
                        {foreach $field['desc'] as $p}
                            {if is_array($p)}
                                <span id="{$p.id}">{$p.text}</span><br />
                            {else}
                                {$p}<br />
                            {/if}
                        {/foreach}
                    {else}
                        {$field['desc']}
                    {/if}
                </div>
            </div>
        {/if}
    {else}
        {$smarty.block.parent}
    {/if}
{/block}

