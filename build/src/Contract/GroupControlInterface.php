<?php
namespace IqitElementor\Contract;

if (!defined('ELEMENTOR_ABSPATH')) {
    throw new \RuntimeException('iqitelementor: ELEMENTOR_ABSPATH not defined — module not loaded properly');
}

interface GroupControlInterface
{
    public static function getType(): string;
}
