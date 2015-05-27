var zlib = require('zlib'),
    uglify = require('uglifyjs'),
    dust = require('dustjs-linkedin'),
    bytesize = require('bytesize');

var parser = require('../dist/parser'),
    compiler = require('../dist/compiler');

module.exports = function(grunt) {
  grunt.registerMultiTask('templateSize', function() {
    this.filesSrc.forEach(function(filepath) {
      var templateContents = grunt.file.read(filepath),
          ast = parser.parse(templateContents),
          compiledTemplate, minCompiledTemplate, fullSize, minSize, dustCompiled, dustSize;
          compiler.mode = 'dev';
      compiledTemplate = compiler.compile(ast, filepath);
      dustCompiled = dust.compile(templateContents, filepath);
      compiler.mode = 'production';
      minCompiledTemplate = compiler.compile(ast);
      fullSize = bytesize.stringSize(compiledTemplate, true);
      minSize = bytesize.stringSize(zlib.gzipSync(uglify.minify(minCompiledTemplate, {fromString: true}).code), true);
      dustSize = bytesize.stringSize(zlib.gzipSync(uglify.minify(dustCompiled, {fromString: true}).code), true);
      grunt.log.subhead(filepath);
      grunt.log.writeln('Full size: ' + fullSize);
      grunt.log.writeln('Min size: ' + minSize);
      grunt.log.writeln('Dust size: ' + dustSize);
    });
  });
};
