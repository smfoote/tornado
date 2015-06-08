if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function(target) {
      if (target === undefined || target === null) {
        throw new TypeError('Cannot convert first argument to object');
      }

      var to = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var nextSource = arguments[i];
        if (nextSource === undefined || nextSource === null) {
          continue;
        }
        nextSource = Object(nextSource);

        var keysArray = Object.keys(Object(nextSource));
        for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
          var nextKey = keysArray[nextIndex];
          var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
          if (desc !== undefined && desc.enumerable) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
      return to;
    }
  });
}

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
  helperTests,
  referenceTests,
  existsTests,
  notExistsTests,
  sectionTests,
  blockTests,
  partialTests
]);
