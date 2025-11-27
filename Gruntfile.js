module.exports = function( grunt ) {
	'use strict';

	var remapify = require( 'remapify' ),
		pkgInfo = grunt.file.readJSON( 'package.json' );

	require( 'matchdep' ).filterDev( 'grunt-*' ).forEach( grunt.loadNpmTasks );

	// Project configuration
	grunt.initConfig( {
		pkg: grunt.file.readJSON( 'package.json' ),

		banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
				'<%= grunt.template.today("dd-mm-yyyy") %> */',

		sass: {
			dist: {
				files: [ {
					expand: true,
					cwd: 'views/_dev/scss/direction',
					src: '*.scss',
					dest: 'views/css',
					ext: '.css'
				} ]
			}
		},

		browserify: {
			options: {
				browserifyOptions: {
					debug: true
				},
				preBundleCB: function( bundle ) {
					bundle.plugin( remapify, [
						{
							cwd: 'views/_dev/js/editor/behaviors',
							src: '**/*.js',
							expose: 'elementor-behaviors'
						},
						{
							cwd: 'views/_dev/js/editor/layouts',
							src: '**/*.js',
							expose: 'elementor-layouts'
						},
						{
							cwd: 'views/_dev/js/editor/models',
							src: '**/*.js',
							expose: 'elementor-models'
						},
						{
							cwd: 'views/_dev/js/editor/collections',
							src: '**/*.js',
							expose: 'elementor-collections'
						},
						{
							cwd: 'views/_dev/js/editor/views',
							src: '**/*.js',
							expose: 'elementor-views'
						},
						{
							cwd: 'views/_dev/js/editor/components',
							src: '**/*.js',
							expose: 'elementor-components'
						},
						{
							cwd: 'views/_dev/js/editor/utils',
							src: '**/*.js',
							expose: 'elementor-utils'
						},
						{
							cwd: 'views/_dev/js/editor/layouts/panel',
							src: '**/*.js',
							expose: 'elementor-panel'
						},
						{
							cwd: 'views/_dev/js/editor/components/template-library',
							src: '**/*.js',
							expose: 'elementor-templates'
						},
						{
							cwd: 'views/_dev/js/frontend',
							src: '**/*.js',
							expose: 'elementor-frontend'
						}
					] );
				}
			},

			dist: {
				files: {
					'views/js/editor.js': [
						'views/_dev/js/editor/utils/jquery-html5-dnd.js',
						'views/_dev/js/editor/utils/jquery-serialize-object.js',

						'views/_dev/js/editor/editor.js'
					],
					'views/js/frontend.js': [ 'views/_dev/js/frontend/frontend.js' ],
					'views/js/backoffice.js': [ 'views/_dev/js/backoffice/backoffice.js' ]
				},
				options: pkgInfo.browserify
			}

		},

		// Extract sourcemap to separate file
		exorcise: {
			bundle: {
				options: {},
				files: {
					'views/js/editor.js.map': [ 'views/js/editor.js' ],
					'views/js/frontend.js.map': [ 'views/js/frontend.js' ]
				}
			}
		},

		uglify: {
			//pkg: grunt.file.readJSON( 'package.json' ),
			options: {},
			dist: {
				files: {
					'views/js/editor.min.js': [
						'views/js/editor.js'
					],
					'views/js/frontend.min.js': [
						'views/js/frontend.js'
					]
				}
			}
		},

		usebanner: {
			dist: {
				options: {
					banner: '<%= banner %>'
				},
				files: {
					src: [
						'views/js/*.js',
						'views/css/*.css',

						'!views/css/animations.min.css'
					]
				}
			}
		},

		jshint: {
			options: {
				jshintrc: '.jshintrc'
			},
			all: [
				'Gruntfile.js',
				'views/js/dev/**/*.js'
			]
		},

		postcss: {
			dev: {
				options: {
					map: true,

					processors: [
						require( 'autoprefixer' )( {
							browsers: 'last 2 versions, Safari > 5'
						} )
					]
				},
				files: [ {
					src: [
						'views/css/*.css',
						'!views/css/*.min.css'
					]
				} ]
			},
			minify: {
				options: {
					processors: [
						require( 'cssnano' )()
					]
				},
				files: [ {
					expand: true,
					src: [
						'views/css/*.css',
						'!views/css/*.min.css'
					],
					ext: '.min.css'
				} ]
			}
		},

		watch:  {
			styles: {
				files: [
					'views/_dev/scss/**/*.scss'
				],
				tasks: [ 'styles' ]
			},

			scripts: {
				files: [
					'views/_dev/js/**/*.js'
				],
				tasks: [ 'scripts' ]
			}
		},


		copy: {
			main: {
				src: [
					'**',
					'!node_modules/**',
					'!build/**',
					'!bin/**',
					'!.git/**',
					'!tests/**',
					'!.travis.yml',
					'!.jscsrc',
					'!.jshintignore',
					'!.jshintrc',
					'!ruleset.xml',
					'!README.md',
					'!phpunit.xml',
					'!vendor/**',
					'!Gruntfile.js',
					'!package.json',
					'!npm-debug.log',
					'!composer.json',
					'!composer.lock',
					'!.gitignore',
					'!.gitmodules',

					'!views/_dev/**',
					'!views/**/*.map',
					'!*~'
				],
				expand: true,
				dest: 'build/'
			}
		},

		clean: {
			//Clean up build folder
			main: [
				'build'
			]
		}
	} );

	// Default task(s).
	grunt.registerTask( 'default', [
		'scripts',
		'styles'
	] );


	grunt.registerTask( 'scripts', [
		'jshint',
		'browserify',
		'exorcise'
		//'uglify'
	] );

	grunt.registerTask( 'styles', [
		'sass',
		'postcss'
	] );

	grunt.registerTask( 'build', [
		'default',
		'usebanner',
		'clean',
		'copy',
		'default' // Remove banners for GitHub
	] );

};
