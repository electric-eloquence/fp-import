'use strict';

const fs = require('fs-extra');
const path = require('path');

const diveSync = require('diveSync');
const {expect} = require('chai');

// Instantiate a gulp instance and assign it to the fp const.
process.env.ROOT_DIR = path.normalize(`${__dirname}/..`);
const fp = require('fepper/tasker');

const conf = global.conf;
const pref = global.pref;

require('../../import~extend');

const stylesDirFront = conf.ui.paths.source.css;
const stylesDirFrontBld = conf.ui.paths.source.cssBld;
const stylesDirFrontBldRel = conf.ui.pathsRelative.source.cssBld;
const stylesDirBack = 'import/styles';
const stylesDirBackNonex = 'nonex/styles';
const stylesDirBackSub = `${stylesDirBack}/styles_dir-global`;
const styleBase = 'style-css';
const style = `${stylesDirFrontBld}/${styleBase}.css`;
const styleYml = `${stylesDirFrontBld}/${styleBase}.yml`;
const styleYmlExpectedExt = `'styles_ext': |2
  .css
`;

function resetArgv() {
  if (process.argv.indexOf('-f') > -1) {
    let i = process.argv.length;

    while (i--) {
      if (process.argv.pop() === '-f') {
        break;
      }
    }
  }
}

function resetStylesDir(args = {}) {
  diveSync(stylesDirFront, (err, file) => {
    fs.unlinkSync(file);
  });

  const returnObj = {};

  for (let fileKey of Object.keys(args)) {
    returnObj[`${fileKey}ExistsBefore`] = fs.existsSync(args[fileKey]);
  }

  return returnObj;
}

describe('fp import:style', function () {
  before(function () {
    pref.backend.synced_dirs = {};
  });

  beforeEach(function () {
    resetArgv();
  });

  after(function () {
    resetStylesDir();
  });

  it('errors with no -f argument', function (done) {
    fp.runSeq(
      'import:style',
      done
    );
  });

  // Test success and error cases. The error cases should pass as tests.
  // For backend -f arguments, when local yml and global yml differ, always fail and emit error.
  // This prevents overwriting local settings on the frontend meant for something else on the backend.
  describe('fp import:style with backend -f argument', function () {
    const stylesDirBackBld = `${stylesDirBack}/bld`;

    it('imports using absolute path argument', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackBld}
`;
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`${conf.backend_dir}/${stylesDirBackBld}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports using undefined styles_dir, and ignore undefined styles_ext', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackBld}
`;
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports using global styles_dir, and ignore undefined styles_ext', function (done) {
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports using undefined styles_dir, and ignore global styles_ext', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackBld}
`;
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports using global styles_dir, and ignore global styles_ext', function (done) {
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);

          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using conflicting styles_dir, and ignore undefined styles_ext', function (done) {
      const styleYmlExpected = `styles_dir: ${stylesDirBackNonex}`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('imports using undefined styles_dir, and ignore conflicting styles_ext', function (done) {
      const styleYmlToIgnore = 'styles_ext: .foo';
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlToIgnore);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);
          const styleYmlExpected = `'styles_dir': |2
  import/styles/bld
'styles_ext': |2
  .css
`;

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('errors using conflicting styles_dir, and ignore global styles_ext', function (done) {
      const styleYmlExpected = `styles_dir: ${stylesDirBackNonex}`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('imports using global styles_dir, and ignore conflicting styles_ext', function (done) {
      const styleYmlToIgnore = 'styles_ext: .foo';
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlToIgnore);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);
          const styleYmlExpected = `'styles_ext': |2
  .css
`;

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('errors using conflicting styles_dir, and ignore conflicting styles_ext', function (done) {
      const styleYmlExpected = `styles_dir: ${stylesDirBackNonex}\nstyles_ext: .foo`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('imports even if global styles_dir points to a nonexistent directory', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackBld}
`;
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackNonex;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports even if global styles_ext mismatches arg extension', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackBld}
`;
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.foo';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('errors using local styles_dir that points to a nonexistent directory', function (done) {
      const styleYmlExpected = `styles_dir: ${stylesDirBackNonex}`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('imports ignoring local styles_ext that mismatches arg extension', function (done) {
      const styleYmlToIgnore = 'styles_ext: .foo';
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, styleYmlToIgnore);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);
          const styleYmlExpected = `'styles_dir': |2
  import/styles/bld
'styles_ext': |2
  .css
`;

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('imports using global styles_dir that nests the arg path', function (done) {
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports where local styles_dir is nested by global styles_dir, and immediately nests -f argument\
', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackBld}
`;
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('errors where local styles_dir is nested by global styles_dir, but does not immediately nest -f argument\
', function (done) {
      const styleDir = `${stylesDirFront}/styles/argv.f-backend`;
      const style = `${styleDir}/${styleBase}.css`;
      const styleYml = `${styleDir}/${styleBase}.yml`;
      const styleYmlExpected = `styles_dir: ${stylesDirBack}`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBack}/argv.f-backend/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = 'import';
      delete pref.backend.synced_dirs.styles_ext;
      fs.ensureDirSync(styleDir);
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('errors where local styles_dir nests global local styles_dir, and therefore cannot immediately nest -f argument\
', function (done) {
      const style = `${stylesDirFrontBld}/${styleBase}.css`;
      const styleYml = `${stylesDirFrontBld}/${styleBase}.yml`;
      const styleYmlExpected = `styles_dir: ${stylesDirBack}`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`backend/${stylesDirBackSub}/bld/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackSub;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('fp import:style with frontend -f argument and style extension', function () {
    it('imports using absolute path argument', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBld}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackSub;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports using global styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackSub;
      delete pref.backend.synced_dirs.styles_ext;

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and global styles_ext', function (done) {
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports using global styles_dir, and global styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackSub;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and overriding local styles_ext', function (done) {
      const styleYmlExpected = 'styles_ext: .foo';
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('imports using overriding local styles_dir, and global styles_ext', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBack}/styles_dir-local
`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir);

          done();
        }
      );
    });

    it('imports using global styles_dir, and overriding local styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.foo';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports using overriding local styles_dir, and overriding local styles_ext', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBack}/styles_dir-local
`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackNonex;
      pref.backend.synced_dirs.styles_ext = '.foo';
      fs.writeFileSync(styleYml, styleYmlExpectedDir + styleYmlExpectedExt);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('errors if global styles_dir points to a nonexistent directory', function (done) {
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackNonex;
      pref.backend.synced_dirs.styles_ext = '.css';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);

          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports ignoring global styles_ext that mismatches arg extension', function (done) {
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.foo';

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);

          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local styles_dir points to a nonexistent directory', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackNonex}
`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir);


          done();
        }
      );
    });

    it('imports ignoring local styles_ext that mismatches arg extension', function (done) {
      const styleYmlExpectedExt = `'styles_ext': |2
  .bar
`;
      const {
        styleExistsBefore,
        styleYmlExistsBefore
      } = resetStylesDir({
        style,
        styleYml
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.css`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlExistsAfter = fs.existsSync(styleYml);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleYmlExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedExt);

          done();
        }
      );
    });
  });

  // Test success and error cases. The error cases should pass as tests.
  describe('fp import:style with frontend -f argument and .yml extension', function () {
    it('imports using absolute path argument', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBld}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, '');

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal('');

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      delete pref.backend.synced_dirs.styles_dir;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, '');

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using global styles_dir, and undefined styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      delete pref.backend.synced_dirs.styles_ext;
      fs.writeFileSync(styleYml, '');

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(pref.backend.synced_dirs.styles_ext).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and global styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, '');

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('imports using global styles_dir, and global styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, '');

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal('');

          done();
        }
      );
    });

    it('errors using undefined styles_dir, and overriding local styles_ext', function (done) {
      const styleYmlExpected = 'styles_ext: .foo';
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      delete pref.backend.synced_dirs.styles_dir;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpected);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(pref.backend.synced_dirs.styles_dir).to.not.exist;
          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlActual).to.equal(styleYmlExpected);

          done();
        }
      );
    });

    it('imports using overriding local styles_dir, and global styles_ext', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBack}/styles_dir-local
`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir);

          done();
        }
      );
    });

    it('imports using global styles_dir, and overriding local styles_ext', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.foo';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedExt);

          done();
        }
      );
    });

    it('imports using overriding local styles_dir, and overriding local styles_ext', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBack}/styles_dir-local
`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackNonex;
      pref.backend.synced_dirs.styles_ext = '.foo';
      fs.writeFileSync(styleYml, styleYmlExpectedDir + styleYmlExpectedExt);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.true;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir + styleYmlExpectedExt);

          done();
        }
      );
    });

    it('errors f global styles_dir points to a nonexistent directory', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBackNonex;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, '');

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if global styles_ext mismatches actual extension', function (done) {
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.bar';
      fs.writeFileSync(styleYml, '');

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;

          done();
        }
      );
    });

    it('errors if local styles_dir points to a nonexistent directory', function (done) {
      const styleYmlExpectedDir = `'styles_dir': |2
  ${stylesDirBackNonex}
`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedDir);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlActual).to.equal(styleYmlExpectedDir);

          done();
        }
      );
    });

    it('errors if local styles_ext mismatches actual extension', function (done) {
      const styleYmlExpectedExt = `'styles_ext': |2
  .bar
`;
      const {
        styleExistsBefore
      } = resetStylesDir({
        style
      });

      process.argv.push('-f');
      process.argv.push(`${stylesDirFrontBldRel}/${styleBase}.yml`);

      pref.backend.synced_dirs.styles_dir = stylesDirBack;
      pref.backend.synced_dirs.styles_ext = '.css';
      fs.writeFileSync(styleYml, styleYmlExpectedExt);

      fp.runSeq(
        'import:style',
        () => {
          const styleExistsAfter = fs.existsSync(style);
          const styleYmlActual = fs.readFileSync(styleYml, conf.enc);

          expect(styleExistsBefore).to.be.false;
          expect(styleExistsAfter).to.be.false;
          expect(styleYmlActual).to.equal(styleYmlExpectedExt);

          done();
        }
      );
    });
  });
});
