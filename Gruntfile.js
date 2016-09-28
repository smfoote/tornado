var grunt = require('grunt');
require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

grunt.initConfig({
  babel: {
    dist: {
      options: {
          sourceMap: true
      },
      files: [
        {expand: true, cwd: 'src/', dest: 'dist/', ext: '.js', src: '**/*.js'},
        {src: 'bin/tornado.es6', dest: 'bin/tornado'},
        {src: 'index.es6', dest: 'tornado.js'}
      ]
    },
    acceptance: {
      options: {
        sourceMap: true
      },
      files: [
        {expand: true, cwd: 'test/acceptance/', dest: 'test/cacceptance/', ext: '.js', src: '**/*.js'},
        {dest: 'test/testRunner.js', src: 'test/testRunner.es6'}
      ]
    },
    dependencyFree: {
      options: {
        sourceMap: true
      },
      files: [
        {expand: true, cwd: 'test/dependency-free/', dest: 'test/cdependency-free/', ext: '.js', src: '**/*.js'}
      ]
    }
  },
  bytesize: {
    all: {
      src: ['dist/*.js']
    }
  },
  browserify: {
    test: {
      src: 'test/cacceptance/runner.js',
      dest: 'test/cacceptance/bundle.js'
    },
    sandbox: {
      src: 'test/sandbox/sandbox.js',
      dest: 'test/sandbox/bundle.js'
    },
    benchmark: {
      options: {
        transform: ['brfs']
      },
      src: 'benchmark/benchmark.js',
      dest: 'benchmark/bundle.js'
    },
    dependencyFree: {
      src: 'test/cdependency-free/main.js',
      dest: 'test/dependency-free/bundle.js'
    }
  },
  eslint: {
    target: ['src', 'test/acceptance/*.js']
  },
  mocha: {
    src: ['test/testRunner.html'],
    options: {
      run: true,
      logErrors: true,
      log: true
    }
  },
  peg: {
    dist: {
      src: 'src/grammar.pegjs',
      dest: 'dist/parser.js'
    }
  },
  watch: {
    scripts: {
      files: ['**/*.js'],
      tasks: ['default'],
      options: {
        spawn: false
      }
    },
    test: {
      files: ['**/*.js', 'test/**/*.es6'],
      tasks: ['default', 'acceptance'],
      options: {
        spawn: false
      }
    }
  }
});

grunt.loadNpmTasks('grunt-mocha');

grunt.registerTask('dist', ['peg', 'eslint', 'babel:dist']);
grunt.registerTask('test', ['dist', 'babel:acceptance', 'browserify:test', 'mocha']);
grunt.registerTask('sandbox', ['dist', 'browserify:sandbox']);
grunt.registerTask('depFree', ['dist', 'babel:dependencyFree', 'browserify:dependencyFree']);
grunt.registerTask('benchmark', ['dist', 'bytesize']);

grunt.registerTask('default', ['dist', 'browserify']);
