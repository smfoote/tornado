"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var visitor = _interopRequire(require("../visitor"));

var Instruction = _interopRequire(require("../utils/Instruction"));

var generateWalker = visitor.build({
  TORNADO_PARTIAL: {
    enter: function enter(item, instructions, state) {
      instructions.push(new Instruction("insert_TORNADO_PARTIAL", { key: item.node[1].key }, state));
    }
  },
  TORNADO_BODY: {
    enter: function enter(item, instructions, state) {
      var params = undefined;
      instructions.push(new Instruction("open_TORNADO_BODY", { key: item.node[1].key, type: item.node[1].type, name: item.node[1].name }, state));
      params = item.node[1].params;
      if (params && params.length) {
        params.forEach(function (p) {
          // we currently only support a string or number or a reference
          // TODO: move this logic into the visitor
          var val = p[1].val,
              key = p[1].key;
          instructions.push(new Instruction("open_TORNADO_PARAM", { key: key }, state));
          if (typeof val === "string") {
            instructions.push(new Instruction("insert_PLAIN_TEXT", { content: val, type: "plaintext" }, state));
          } else if (typeof val === "number") {
            instructions.push(new Instruction("insert_PLAIN_TEXT", { content: val, type: "plaintext" }, state));
          } else {
            instructions.push(new Instruction("insert_TORNADO_REFERENCE", { key: val[1].key }, state));
          }
          instructions.push(new Instruction("close_TORNADO_PARAM", {}, state));
        });
      }
    },
    leave: function leave(item, instructions, state) {
      instructions.push(new Instruction("close_TORNADO_BODY", { type: item.node[1].type }, state));
    }
  },
  TORNADO_REFERENCE: {
    enter: function enter(item, instructions, state) {
      instructions.push(new Instruction("insert_TORNADO_REFERENCE", { key: item.node[1].key }, state));
    }
  },
  TORNADO_COMMENT: {
    enter: function enter(item, instructions, state) {
      instructions.push(new Instruction("insert_TORNADO_COMMENT", {}, state));
    }
  },
  HTML_ELEMENT: {
    enter: function enter(item, instructions, state) {
      instructions.push(new Instruction("open_HTML_ELEMENT", {
        key: item.node[1].tag_info.key,
        type: "element",
        escapableRaw: item.node[1].escapableRaw
      }, state));
    },
    leave: function leave(item, instructions, state) {
      item.state = item.previousState;
      instructions.push(new Instruction("close_HTML_ELEMENT", {}, state));
    }
  },
  HTML_ATTRIBUTE: {
    enter: function enter(item, instructions, state) {
      var attrName = item.node[1].attrName,
          config = { key: attrName };
      if (attrName === "xmlns") {
        config.namespaceAttr = true;
      }
      instructions.push(new Instruction("open_HTML_ATTRIBUTE", config, state));
    },
    leave: function leave(item, instructions, state) {
      instructions.push(new Instruction("close_HTML_ATTRIBUTE", {}, state));
    }
  },
  HTML_COMMENT: {
    enter: function enter(item, instructions, state) {
      instructions.push(new Instruction("insert_HTML_COMMENT", { content: item.node[1], type: "plaintext" }, state));
    }
  },
  PLAIN_TEXT: {
    enter: function enter(item, instructions, state) {
      instructions.push(new Instruction("insert_PLAIN_TEXT", { content: item.node[1], type: "plaintext" }, state));
    }
  }
});

var generateInstructions = {
  instructions: [function (ast, options) {
    return generateWalker(ast, options.results.instructions, options.results.state);
  }]
};

module.exports = generateInstructions;
//# sourceMappingURL=buildInstructions.js.map