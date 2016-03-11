"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var namedEntities = _interopRequire(require("../utils/namedHTMLEntities"));

var hexDecEntities = _interopRequire(require("../utils/hexDecHTMLEntities"));

var visitor = _interopRequire(require("../visitors/visitor"));

var generatedWalker = visitor.build({
  HTML_ENTITY: function HTML_ENTITY(node) {
    var entity = node[1];
    var value = undefined;
    var entityType = namedEntities[entity];
    var entityAlias = hexDecEntities[entity];
    if (entityAlias) {
      entityType = namedEntities[entityAlias.entityName];
    }
    if (entityType) {
      value = entityType.characters;
    }
    node[0] = "PLAIN_TEXT";
    node[1] = value;
  }
});

var htmlEntities = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

module.exports = htmlEntities;
//# sourceMappingURL=htmlEntities.js.map