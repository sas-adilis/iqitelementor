<?php
/**
 * 2007-2015 PrestaShop
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
 * @author    PrestaShop SA <contact@prestashop.com>
 * @copyright 2007-2015 PrestaShop SA
 * @license   http://opensource.org/licenses/afl-3.0.php  Academic Free License (AFL 3.0)
 * International Registered Trademark & Property of PrestaShop SA
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

/**
 * Class ElementorWidget_RevolutionSlider
 */
class IqitElementorWidget_ContactForm
{
    /**
     * @var int
     */
    public $id_base;

    /**
     * @var string widget name
     */
    public $name;
    public $context;
    /**
     * @var string widget icon
     */
    public $icon;

    public $status = 1;

    public function __construct()
    {
        if (!Module::isEnabled('contactform')) {
            $this->status = 0;
        }

        $this->name = IqitElementorWpHelper::__('Contact form', 'elementor');
        $this->id_base = 'ContactForm';
        $this->icon = 'form-horizontal';
        $this->context = Context::getContext();
    }

    public function getForm()
    {
        $contactSouruce = [];
        $contacts = $this->getTemplateVarContact();

        $contactSouruce['selection'] = IqitElementorWpHelper::__('Selection', 'elementor');

        foreach ($contacts as $contact) {
            $contactSouruce[$contact['id_contact']] = $contact['name'];
        }

        return [
            'section_pswidget_options' => [
                'label' => IqitElementorWpHelper::__('Form fields', 'elementor'),
                'type' => 'section',
            ],
            'form_labels' => [
                'label' => IqitElementorWpHelper::__('Labels', 'elementor'),
                'type' => 'select',
                'default' => 'none',
                'section' => 'section_pswidget_options',
                'options' => [
                    '' => IqitElementorWpHelper::__('Yes', 'elementor'),
                    'none' => IqitElementorWpHelper::__('No', 'elementor'),
                ],
                'description' => IqitElementorWpHelper::__('
               Module base on prestashop core contactform module. Translation you do by translating contactform module', 'elementor'),
                'selectors' => [
                    '{{WRAPPER}} .form-control-label' => 'display: {{VALUE}};',
                ],
            ],
            'form_recipient' => [
                'label' => IqitElementorWpHelper::__('Recipient field', 'elementor'),
                'type' => 'select',
                'default' => 'selection',
                'section' => 'section_pswidget_options',
                'options' => $contactSouruce,
            ],
            'form_attachment' => [
                'label' => IqitElementorWpHelper::__('Attachment field', 'elementor'),
                'type' => 'select',
                'default' => '',
                'section' => 'section_pswidget_options',
                'options' => [
                    '' => IqitElementorWpHelper::__('Yes', 'elementor'),
                    'none' => IqitElementorWpHelper::__('No', 'elementor'),
                ],
                'selectors' => [
                    '{{WRAPPER}} .elementor-attachment-field' => 'display: {{VALUE}};',
                ],
            ],
            'input_height' => [
                'label' => IqitElementorWpHelper::__('Input height', 'elementor'),
                'type' => 'slider',
                'default' => [
                    'size' => 45,
                    'unit' => 'px',
                ],
                'range' => [
                    'px' => [
                        'min' => 25,
                        'max' => 80,
                    ],
                ],
                'section' => 'section_pswidget_options',
                'selectors' => [
                    '{{WRAPPER}} .form-control' => 'min-height: {{SIZE}}{{UNIT}};',
                    '{{WRAPPER}} .elementor-attachment-field .btn' => 'padding-top: 0px; padding-bottom: 0px; line-height: {{SIZE}}{{UNIT}};',
                ],
            ],
            'textare_height' => [
                'label' => IqitElementorWpHelper::__('Textarea height', 'elementor'),
                'type' => 'slider',
                'default' => [
                    'size' => 300,
                    'unit' => 'px',
                ],
                'range' => [
                    'px' => [
                        'min' => 50,
                        'max' => 400,
                    ],
                ],
                'section' => 'section_pswidget_options',
                'selectors' => [
                    '{{WRAPPER}} textarea.form-control' => 'min-height: {{SIZE}}{{UNIT}};',
                ],
            ],
            'section_pswidget_button' => [
                'label' => IqitElementorWpHelper::__('Button', 'elementor'),
                'type' => 'section',
            ],
            'btn_align' => [
                'label' => IqitElementorWpHelper::__('Alignment', 'elementor'),
                'type' => 'choose',
                'options' => [
                    'left' => [
                        'title' => IqitElementorWpHelper::__('Left', 'elementor'),
                        'icon' => 'align-left',
                    ],
                    'center' => [
                        'title' => IqitElementorWpHelper::__('Center', 'elementor'),
                        'icon' => 'align-center',
                    ],
                    'right' => [
                        'title' => IqitElementorWpHelper::__('Right', 'elementor'),
                        'icon' => 'align-right',
                    ],
                    'justify' => [
                        'title' => IqitElementorWpHelper::__('Justify', 'elementor'),
                        'icon' => 'align-justify',
                    ],
                ],
                'default' => 'right',
                'section' => 'section_pswidget_button',
            ],
            'btn_size' => [
                'label' => IqitElementorWpHelper::__('Button size', 'elementor'),
                'type' => 'select',
                'default' => '',
                'section' => 'section_pswidget_button',
                'options' => [
                    'btn-sm' => IqitElementorWpHelper::__('Small', 'elementor'),
                    '' => IqitElementorWpHelper::__('Default', 'elementor'),
                    'btn-lg' => IqitElementorWpHelper::__('Large', 'elementor'),
                ],
            ],
            'section_style_input' => [
                'label' => IqitElementorWpHelper::__('Input', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ],
            'label_typo' => [
                'group_type_control' => 'typography',
                'name' => 'typography_label',
                'tab' => 'style',
                'section' => 'section_style_input',
                'selector' => '{{WRAPPER}} .form-control-label',
            ],
            'input_typo' => [
                'group_type_control' => 'typography',
                'name' => 'typography_input',
                'tab' => 'style',
                'section' => 'section_style_input',
                'selector' => '{{WRAPPER}} .form-control',
            ],
            'input_bg' => [
                'label' => IqitElementorWpHelper::__('Background', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_input',
                'selectors' => [
                    '{{WRAPPER}} .form-control, {{WRAPPER}} .custom-select2, {{WRAPPER}} .custom-select2 option' => 'background: {{VALUE}};',
                ],
            ],
            'input_color' => [
                'label' => IqitElementorWpHelper::__('Text color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_input',
                'selectors' => [
                    '{{WRAPPER}} .form-control' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .form-control::-webkit-input-placeholder' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .form-control:-ms-input-placeholder' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .form-control::placeholder' => 'color: {{VALUE}};',
                ],
            ],
            'input_border' => [
                'group_type_control' => 'border',
                'name' => 'border',
                'label' => IqitElementorWpHelper::__('Border', 'elementor'),
                'tab' => 'style',
                'placeholder' => '1px',
                'default' => '1px',
                'section' => 'section_style_input',
                'selector' => '{{WRAPPER}} .form-control',
            ],
            'input_bg_hover' => [
                'label' => IqitElementorWpHelper::__('Focus - background', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_input',
                'selectors' => [
                    '{{WRAPPER}} .form-control:focus,  {{WRAPPER}} .custom-select2:focus-within' => 'background: {{VALUE}};',
                ],
            ],
            'input_color_hover' => [
                'label' => IqitElementorWpHelper::__('Focus - color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_input',
                'selectors' => [
                    '{{WRAPPER}} .form-control:focus' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .form-control:focus::-webkit-input-placeholder' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .form-control:focus:-ms-input-placeholder' => 'color: {{VALUE}};',
                    '{{WRAPPER}} .form-control:focus::placeholder' => 'color: {{VALUE}};',
                ],
            ],
            'input_border_h' => [
                'label' => IqitElementorWpHelper::__('Focus - border color', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_input',
                'selectors' => [
                    '{{WRAPPER}} .form-control:focus' => 'border-color: {{VALUE}};',
                ],
            ],
            'section_style_btn' => [
                'label' => IqitElementorWpHelper::__('Button', 'elementor'),
                'type' => 'section',
                'tab' => 'style',
            ],
            'btn_bg' => [
                'label' => IqitElementorWpHelper::__('Background', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_btn',
                'selectors' => [
                    '{{WRAPPER}} .btn-elementor-send' => 'background: {{VALUE}};',
                ],
            ],
            'btn_color' => [
                'label' => IqitElementorWpHelper::__('Text', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_btn',
                'selectors' => [
                    '{{WRAPPER}} .btn-elementor-send' => 'color: {{VALUE}};',
                ],
            ],
            'btn_bg_hover' => [
                'label' => IqitElementorWpHelper::__('Hover - background', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_btn',
                'selectors' => [
                    '{{WRAPPER}} .btn-elementor-send:hover' => 'background: {{VALUE}};',
                ],
            ],
            'btn_color_hover' => [
                'label' => IqitElementorWpHelper::__('Hover - text', 'elementor'),
                'type' => 'color',
                'tab' => 'style',
                'section' => 'section_style_btn',
                'selectors' => [
                    '{{WRAPPER}} .btn-elementor-send:hover' => 'color: {{VALUE}};',
                ],
            ],
        ];
    }

    public function getTemplateVarContact()
    {
        $contacts = [];
        $all_contacts = Contact::getContacts($this->context->language->id);

        foreach ($all_contacts as $one_contact) {
            $contacts[$one_contact['id_contact']] = $one_contact;
        }

        return $contacts;
    }

    public function parseOptions($optionsSource, $preview = false)
    {
        $options = [];

        $options['id_module'] = Module::getModuleIdByName('contactform');
        $options['form_recipient'] = $optionsSource['form_recipient'];
        $options['btn_align'] = $optionsSource['btn_align'];
        $options['btn_size'] = $optionsSource['btn_size'];

        return $options;
    }
}
