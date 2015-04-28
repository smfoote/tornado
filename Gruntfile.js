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
        {dest: 'test.js', src: 'test.es6'}
      ]
    }
  },
  browserify: {
    'test/bundle.js': ['test/sandbox.js']
  },
  watch: {
    scripts: {
      files: ['**/*.js', 'test.es6'],
      tasks: ['default'],
      options: {
        spawn: false,
      },
    },
  }
});

grunt.registerTask('default', ['babel', 'browserify']);
