<?php
/**
 * 2017 IQIT-COMMERCE.COM
 *
 * NOTICE OF LICENSE
 *
 * This file is licenced under the Software License Agreement.
 * With the purchase or the installation of the software in your application
 * you accept the licence agreement
 *
 *  @author    IQIT-COMMERCE.COM <support@iqit-commerce.com>
 *  @copyright 2017 IQIT-COMMERCE.COM
 *  @license   Commercial license (You can not resell or redistribute this software.)
 */
class IqitElementorActionsModuleFrontController extends ModuleFrontController
{
    public function postProcess()
    {
        if (Tools::getValue('process') == 'handleWidget') {
            $this->ajaxProcessHandleWidget();
        } elseif (Tools::getValue('process') == 'handleCsfrToken') {
            $this->ajaxProcessHandleCsfrToken();
        }
    }

    protected function ajaxProcessHandleWidget()
    {
        ob_end_clean();
        header('Content-Type: application/json');
        exit(json_encode([
            'preview' => $this->module->fetch('module:iqitelementor/views/templates/widgets/contactform.tpl'),
        ]));
    }

    protected function ajaxProcessHandleCsfrToken()
    {
        ob_end_clean();
        header('Content-Type: application/json');
        exit(json_encode([
            'preview' => $this->module->fetch('module:iqitelementor/views/templates/widgets/contactform-token.tpl'),
        ]));
    }
}
