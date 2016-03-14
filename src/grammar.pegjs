{

  var tornadoBodyTypes = {
    '?': 'exists',
    '^': 'notExists',
    '#': 'section',
    '@': 'helper',
    '+': 'block',
    '<': 'inlinePartial',
    '%': 'pragma'
  };
}

start
  = n:nodes {
    return ['TEMPLATE', ['TORNADO_BODY'].concat([{name: null, type: 'bodies', body: n}])];
  }

nodes
  = (part / plain_text)*

part
  = element / comment / html_entity / tornado_comment / tornado_body / tornado_partial / tornado_reference

attr_part
  = tornado_comment / tornado_body / tornado_reference / tornado_partial / html_entity / attr_text

single_quote_attr_part
  = tornado_comment / tornado_body / tornado_reference / tornado_partial / html_entity / single_quote_attr_text

element
  = e:start_tag contents:nodes end_tag {
    return ['HTML_ELEMENT',{
      tag_info: e,
      tag_contents: contents
    }];
  }
  / e:(self_closing_tag / start_tag) {
    return ['HTML_ELEMENT', {
      tag_info: e
    }]
  }

start_tag
  = langle k:key a:attributes ws* rangle {
    return {key: k, attributes: a};
  }

self_closing_tag
  = langle k:key a:attributes ws* "/" rangle {
    return {key: k, attributes: a};
  }

end_tag
  = langleslash key ws* rangle

key
  = k:[a-zA-Z0-9\-]+ {
    return k.join('');
  }

attribute
  = name:attribute_name ws* equals ws* quote val:attr_part* quote {
    return ['HTML_ATTRIBUTE', {
      attrName: name,
      value: val
    }];
   }
  / name:attribute_name ws* equals ws* single_quote val:single_quote_attr_part* single_quote {
    return ['HTML_ATTRIBUTE', {
      attrName: name,
      value: val
    }];
  }
  / name:attribute_name ws* equals ws* val:(tornado_reference / no_quote_attr_text) {
    return ['HTML_ATTRIBUTE', {
      attrName: name,
      value: val
    }];
  }
  / name:attribute_name {
    return ['HTML_ATTRIBUTE', {
      attrName: name
    }];
  }

attributes
  = a:(ws+ a:attribute {return a;})* {
    return a;
  }

attribute_name
  = name:(!ws !quote !single_quote !rangle !equals char:[^\/]{return char;})+ {
    return name.join('');
  }

comment
  = "<!--" comment:(!"-->" c:. {return c;})* "-->" {
    return ['HTML_COMMENT', comment.join('')]
  }

tornado_comment
  = lbrace "!" comment:(!"!}" c:. {return c;})* "!" rbrace {
    return ['TORNADO_COMMENT', comment.join('')]
  }

tornado_body
  = start:tornado_body_tag_start ws* rbrace contents:nodes bodies:tornado_bodies end:tornado_body_tag_end &{
    if(!end || start.key !== end.key) {
      error('Expected end tag for "' + start.key + '" ' + start.type + ' body, start tag was "' + start.key + '" and end tag was "' + end.key + '"');
    }
    return true;
  }
  {
    // combine the default body into bodies
    start.bodies = bodies;
    start.body = contents;
    start.key = start.key.split('.');
    return ['TORNADO_BODY', start];
  }
  / start:tornado_body_tag_start ws* "/" rbrace {
    start.bodies = [];
    start.key = start.key.split('.');
    return ['TORNADO_BODY', start];
  }

tornado_bodies
  = b:(lbrace ":" type:key rbrace contents:nodes{return ['TORNADO_BODY', {name: type, type: 'bodies', body: contents}];})* {
    return b;
  }

tornado_body_type
  = [#?^<+@%]


// TODO: tornado body key can be a reference e.g. {#"{foo}"/}
tornado_body_tag_start
  = lbrace type:tornado_body_type ws* id:tornado_key p:tornado_params {
    return {
      type: tornadoBodyTypes[type],
      key: id,
      params: p
    };
  }

tornado_body_tag_end
  = lbraceslash id:tornado_key rbrace {
    return {key: id};
  }

tornado_reference
  = lbrace r:tornado_key filters:tornado_filters rbrace {
    var key = r.split('.');
    if (r === '.') {
      key = [];
    }
    return ['TORNADO_REFERENCE', {key: key, filters: filters}]
  }

// TODO: tornado partial key can be a reference e.g. {#"{foo}"/}
tornado_partial
  = lbrace rangle ws* key:(tornado_key / string) params:tornado_params "/"rbrace {
    return ['TORNADO_PARTIAL', {
      key: key,
      params: params
    }];
  }

tornado_key
  = first:[a-zA-Z_$\.] after:[a-zA-Z0-9_$-\.]* {
    return first + after.join('');
  }

tornado_array_part
  = d:("." k:tornado_key {return k})+ { return d; }

tornado_filters
  = ("|" type:key {return {type: type};})*

tornado_params
  = p:(ws+ p:tornado_param {return p;})* {
    return p;
  }

tornado_param
  = key:key equals val:(number / string) {
    return ['TORNADO_PARAM', {
      key: key,
      val: val
    }]
  }
  / key:key equals val:tornado_key {
    var path = val.split('.');
    if (val === '.') {
      path = [];
    }
    return ['TORNADO_PARAM', {
      key: key,
      val: ['TORNADO_REFERENCE', {key: path}]
    }]
  }

tornado_tag
  = lbrace ws* [#?^><+%:@/~%] (!rbrace !eol .)+ ws* rbrace
    / tornado_reference

string
  = quote n:non_quote* quote{
    return n.join('');
  }

number "number"
  = n:(float / integer) { return n; }

float "float"
  = l:integer "." r:integer+ { return parseFloat(l + "." + r.join('')); }

integer "integer"
  = sign:[-]? digits:[0-9]+ {
    sign = sign ? sign : '';
    return parseInt(sign + digits.join(""), 10);
}

plain_text
  = b:(!comment !tornado_comment !start_tag !end_tag !self_closing_tag !html_entity !tornado_tag c:. {return c;})+ {
    return ['PLAIN_TEXT', b.join('').replace(/\n/g, '\\n')];
  }

html_entity
  = entity:(ampersand char:entity_chars semicolon) {
    return ['HTML_ENTITY', entity.join('')];
  }

entity_chars
  = char:[#a-zA-Z0-9]+ {
    return char.join('');
  }

attr_text
  = b:(!tornado_comment !tornado_body !tornado_reference !tornado_partial !html_entity !quote c:.{return c;})+ {
    return ['PLAIN_TEXT', b.join('')];
  }

single_quote_attr_text
  = b:(!tornado_comment !tornado_body !tornado_reference !tornado_partial !html_entity !single_quote c:.{return c;})+ {
    return ['PLAIN_TEXT', b.join('')];
  }

no_quote_attr_text
  = val:(!quote !single_quote !equals !langle !rangle char:[^`]{return char;})+ {
    return ['PLAIN_TEXT', val.join('')];
  }

ws
  = [\t\v\f\n \u00A0\uFEFF]

langleslash
  = "</"

langle
  = "<"

rangle
  = ">"

rangleslash
  = "/>"

lbraceslash
  = "{/"

rbraceslash
  = "/}"

lbrace
  = "{"

rbrace
  = "}"

equals
  = "="

quote
  = "\""

single_quote
  = "'"

ampersand
  = "&"

semicolon
  = ";"

non_quote
  = [^\"]

eol
  = "\n"        //line feed
  / "\r\n"      //carriage + line feed
  / "\r"        //carriage return
  / "\u2028"    //line separator
  / "\u2029"    //paragraph separator
