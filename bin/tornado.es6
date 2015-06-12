#!/usr/bin/env node

import cli from 'cli';
import fs from 'fs';
import {version} from '../package.json';

import parser from '../dist/parser';
import compiler from '../dist/compiler';

cli.enable('glob', 'version');

cli.setApp('tornado', version);

cli.setUsage(`${cli.app} [options] [path1 [path2 path3]]

  Compile all .td files in a directory:
${cli.app} --output=compiled.js templates/**/*.td`);

cli.parse({
  name: ['n', 'The name by which the template will be registered (defaults to path)', 'string'],
  output: ['o', 'Concatenate all output to this file', 'path'],
  split: ['s', 'Should the output files be split into their own files (true) or concatenated (false)', 'boolean'],
  pwd: [false, 'generate template names starting from this directory', 'string'],
  mode: ['m', 'Compling for `production` or `dev`', 'string']
});

let streams;
let path = cli.native.path;

function glob(globPaths) {
  return globPaths.map(arg => cli.glob.sync(arg))
    .reduce((a, b) => a.concat(b), []);
}

function read(filename, cb) {
  var data = '',
    file = fs.createReadStream(filename);

  file.on('error', cb);
  file.on('data', function(chunk) {
    data += chunk;
  });
  file.on('end', function() {
    cb(null, data);
  });
}

function output(data, file) {
  let outputStream;
  try {
    if (file) {
      if (streams[file]) {
        outputStream = streams[file];
      } else {
        outputStream = streams[file] = cli.native.fs.createWriteStream(file);
      }
    } else {
      outputStream = process.stdout;
    }
    outputStream.write(data + cli.native.os.EOL);
  } catch (e) {
    cli.fatal('Could not write to output stream');
  }
}

function handle() {
  streams = {};
  paths.forEach((inputFile, index, filesToProcess) => {
    read(inputFile, function(err, data) {
      if (err) {
        cli.info('Couldn\'t open ' + inputFile + ' for reading');
        return;
      }

      let outputFile = cli.options.output;
      let templateName = path.join(path.dirname(inputFile), path.basename(inputFile, path.extname(inputFile)));
      let compiledData;

      // Use the template's path as the output path if split-files is turned on
      if (cli.options.split) {
        outputFile = templateName + '.js';
      }

      // Allow override of template name as long as there's only one template
      if (cli.options.name && filesToProcess.length === 1) {
        templateName = cli.options.name;
      }

      // Optionally strip leading directories from a template name
      // For example, if --pwd=tmpl, `tmpl/foo/a` becomes `foo/a`
      if (cli.options.pwd) {
        templateName = path.relative(cli.options.pwd, templateName);
      }

      // Windows creates template names with \ so normalize to / to allow AMD loaders
      // to correctly load templates, and so you don't have to write templates differently
      // depending on what OS you use
      templateName = templateName.replace(/\\/g, '/');

      compiledData = compile(data, templateName);
      if (compiledData) {
        output(compiledData, outputFile);
      }
    });
  });
}


function compile(data, name) {
  var compiled;

  try {
    compiled = compiler.compile(parser.parse(data), name);
  } catch (e) {
    return cli.fatal('[' + name + '] ' + e);
  }
  return compiled;
}

let paths = glob(cli.args);

handle();
