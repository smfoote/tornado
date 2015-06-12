import {runSuites} from '../testRunner.js';
import htmlTests from './html';
import helperTests from './helper';
import referenceTests from './reference';
import existsTests from './exists';
import notExistsTests from './notExists';
import sectionTests from './section';
import blockTests from './block';
import partialTests from './partial';
import td from '../../dist/runtime';

window.td = td;

runSuites([
  htmlTests,
  referenceTests,
  existsTests,
  notExistsTests,
  sectionTests,
  blockTests,
  partialTests,
  helperTests
]);
