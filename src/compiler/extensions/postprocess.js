let flush = function(results) {
  results.code = `export default (d=>{
  const frags = {};
  const nodeToString = node => {
    const div = d.createElement('div');
    div.appendChild(node);
    return div.innerHTML;
  };
  const template = {
    ${results.code.fragments.join(',\n    ')},
    ${results.code.renderers.join(',\n    ')}
  };
  template.render = template.r0;
  return template;
})(document);`;
};

let postprocess = function(results) {
  if (results) {
    flush(results);
  }
};

export default postprocess;
