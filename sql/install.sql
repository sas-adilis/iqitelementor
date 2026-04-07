CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_landing` (
  `id_iqit_elementor_landing` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_shop` int(10) unsigned DEFAULT NULL,
  `title` varchar(255) NOT NULL ,
  `active` tinyint(1) unsigned NOT NULL DEFAULT 1,
  `autosave_content` longtext DEFAULT NULL,
  `autosave_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_iqit_elementor_landing`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_landing_lang` (
  `id_iqit_elementor_landing` INT UNSIGNED NOT NULL,
  `id_lang` int(10) unsigned NOT NULL ,
  `data` longtext default NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` varchar(512) DEFAULT NULL,
  `link_rewrite` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id_iqit_elementor_landing`, `id_lang`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_template` (
  `id_template` int(10) unsigned NOT NULL auto_increment,
  `title` varchar(255) NOT NULL ,
  `data` longtext default NULL,
  `autosave_content` longtext DEFAULT NULL,
  `autosave_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_template`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_product` (
  `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_product` int(10) UNSIGNED NOT NULL,
  `autosave_content` longtext DEFAULT NULL,
  `autosave_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_elementor`, `id_product`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_product_lang` (
  `id_elementor` int(10) UNSIGNED NOT NULL,
  `id_lang` int(10) UNSIGNED NOT NULL,
  `id_shop` int(10) unsigned NOT NULL,
  `data` longtext default NULL,
  PRIMARY KEY (`id_elementor`, `id_lang`, `id_shop`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_product_shop` (
  `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_shop` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id_elementor`, `id_shop`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_category` (
  `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_category` int(10) UNSIGNED NOT NULL,
  `just_elementor` int(10) UNSIGNED default NULL,
  `autosave_content` longtext DEFAULT NULL,
  `autosave_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_elementor`, `id_category`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_category_lang` (
  `id_elementor` int(10) UNSIGNED NOT NULL,
  `id_lang` int(10) UNSIGNED NOT NULL,
  `id_shop` int(10) unsigned NOT NULL,
  `data` longtext default NULL,
  PRIMARY KEY (`id_elementor`, `id_lang`, `id_shop`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_category_shop` (
  `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_shop` int(10) unsigned NOT NULL,
  `just_elementor` int(10) UNSIGNED default NULL,
  PRIMARY KEY (`id_elementor`, `id_shop`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;



CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_content` (
  `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_object` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `title` varchar(255) NOT NULL DEFAULT '',
  `hook` varchar(255) NOT NULL DEFAULT '',
  `active` tinyint(1) unsigned NOT NULL,
  `autosave_content` longtext DEFAULT NULL,
  `autosave_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id_elementor`, `id_object`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_content_lang` (
  `id_elementor` int(10) UNSIGNED NOT NULL,
  `id_lang` int(10) UNSIGNED NOT NULL,
  `id_shop` int(10) unsigned NOT NULL,
  `data` longtext default NULL,
  PRIMARY KEY (`id_elementor`, `id_lang`, `id_shop`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_content_shop` (
  `id_elementor` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_shop` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id_elementor`, `id_shop`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `PREFIXiqit_elementor_revision` (
  `id_iqit_elementor_revision` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `entity_type`                varchar(50)      NOT NULL,
  `entity_id`                  int(10) unsigned NOT NULL,
  `content`                    longtext         NOT NULL,
  `created_at`                 datetime         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `label`                      varchar(255)     NOT NULL DEFAULT '',
  `id_employee`                int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id_iqit_elementor_revision`),
  KEY `idx_entity_date` (`entity_type`, `entity_id`, `created_at`)
) ENGINE=ENGINE_TYPE  DEFAULT CHARSET=utf8mb4;

