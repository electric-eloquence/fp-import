'use strict';

const path = require('path');

// Instantiate a gulp instance and assign it to the fp const.
process.env.ROOT_DIR = path.normalize(`${__dirname}/..`);
const fp = require('fepper/tasker');

require('../../import~extend');

describe('fp import:help', function () {
  it('prints help text', function (done) {
    fp.runSeq(
      'import:help',
      done
    );
  });
});
