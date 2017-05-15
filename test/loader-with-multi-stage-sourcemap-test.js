'use strict';

var assert = require('power-assert');
var sourceMap = require("source-map");
var Consumer = sourceMap.SourceMapConsumer;
var convert = require('convert-source-map');
var espower = require('../index');

/**
 * coffee -> js -> powered-js
 *
 * coffee code
 *   1: zero = 0
 *   2: assert zero, 1
 *
 * js code
 *   1: var zero;
 *   2:
 *   3: zero = 0;
 *   4:
 *   5: assert(zero, 1);
 *
 * powered-js code
 *   1: var _PowerAssertRecorder1 = function () {
 *   2:     function PowerAssertRecorder() {
 *   3:         this.captured = [];
 *   4:     }
 *   5:     PowerAssertRecorder.prototype._capt = function _capt(value, espath) {
 *   6:         this.captured.push({
 *   7:             value: value,
 *   8:             espath: espath
 *   9:         });
 *  10:         return value;
 *  11:     };
 *  12:     PowerAssertRecorder.prototype._expr = function _expr(value, source) {
 *  13:         var capturedValues = this.captured;
 *  14:         this.captured = [];
 *  15:         return {
 *  16:             powerAssertContext: {
 *  17:                 value: value,
 *  18:                 events: capturedValues
 *  19:             },
 *  20:             source: source
 *  21:         };
 *  22:     };
 *  23:     return PowerAssertRecorder;
 *  24: }();
 *  25: var _rec1 = new _PowerAssertRecorder1();
 *  26: var zero;
 *  27: zero = 0;
 *  28: assert(_rec1._expr(_rec1._capt(zero, 'arguments/0'), {
 *  29:     content: 'assert(zero, 1)',
 *  30:     filepath: 'test/fixtures/multi-stage/fixture.coffee',
 *  31:     line: 2
 *  32: }), 1);
 *  33: 
 *  34: 
 */
describe('webpack-espowered-loader with multi stage sourcemap', function() {
  it('should return re-mapped sourcemap', function() {
    var originalCoffeeSource = 'zero = 0\nassert zero, 1';
    var jsSource = 'var zero;\n\nzero = 0;\n\nassert(zero, 1);';
    var inMap = convert.fromObject({
      version: 3,
      sources: ['test/fixtures/multi-stage/fixture.coffee'],
      names: [],
      mappings: "AAAA,IAAA;;AAAA,IAAA,GAAO;;AACP,MAAA,CAAO,IAAP,EAAa,CAAb"
    });

    // set context for webpack loader
    var context = {};
    context.resourcePath = 'test/fixtures/multi-stage/fixture.coffee';
    context.options = {};
    context.callback = function(err, powered, map) {
      var smc = new Consumer(map);

      /**
       * Check sourcemap generated by coffee-script compiler
       *
       * coffee code
       *   1: zero = 0
       *      ^
       * powered-js code
       *  24: var zero;
       *          ^
       */
      var originalPosition = smc.originalPositionFor({
        line: 24,
        column: 5
      });
      assert.equal(originalPosition.source, 'test/fixtures/multi-stage/fixture.coffee');
      assert.equal(originalPosition.line, 1);
      assert.equal(originalPosition.column, 0);

      /**
       * Check sourcemap generated by espower
       *
       * coffee code
       *   2: assert zero, 1
       *            ^
       * powered-js code
       *   28: assert(_rec1._expr(_rec1._capt(zero, 'arguments/0'), {
       *                                      ^
       */
      originalPosition = smc.originalPositionFor({
        line: 28,
        column: 32
      });
      assert.equal(originalPosition.source, 'test/fixtures/multi-stage/fixture.coffee');
      assert.equal(originalPosition.line, 2);
      assert.equal(originalPosition.column, 7);

      /**
       * Check sourcemap generated by espower
       *
       * coffee code
       *   2: assert zero, 1
       *                  ^
       * powered-js code
       *   32: }), 1);
       *         ^
       */
      originalPosition = smc.originalPositionFor({
        line: 32,
        column: 4
      });
      assert.equal(originalPosition.source, 'test/fixtures/multi-stage/fixture.coffee');
      assert.equal(originalPosition.line, 2);
      assert.equal(originalPosition.column, 13);
    };

    espower.call(context, jsSource, inMap.toObject());
  });
});

