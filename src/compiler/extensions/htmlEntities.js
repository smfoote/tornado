'use strict';
import namedEntities from '../utils/namedHTMLEntities';
import hexDecEntities from '../utils/hexDecHTMLEntities';

import visitor from '../visitors/visitor';
let generatedWalker = visitor.build({
  HTML_ENTITY(node) {
    let entity = node[1];
    let value;
    let entityType = namedEntities[entity];
    let entityAlias = hexDecEntities[entity];
    if (entityAlias) {
      entityType = namedEntities[entityAlias.entityName];
    }
    if (entityType) {
      value = entityType.characters;
    }
    node[0] = 'PLAIN_TEXT';
    node[1] = value;
  }
});

let htmlEntities = {
  transforms: [function (ast, options) {
    return generatedWalker(ast, options.context);
  }]
};

export default htmlEntities;
