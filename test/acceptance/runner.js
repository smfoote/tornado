import {runSuites} from '../testRunner.js';
import helperTests from './helper';
import htmlTests from './html';
import referenceTests from './reference';
import existsTests from './exists';
import notExistsTests from './notExists';
import sectionTests from './section';
import blockTests from './block';
import partialTests from './partial';
import td from '../../dist/runtime';

window.td = td;

runSuites([
  helperTests,
  htmlTests,
  referenceTests,
  existsTests,
  notExistsTests,
  sectionTests,
  blockTests,
  partialTests
]);
