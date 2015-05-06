let suite = {
  name: 'Blocks',
  tests: [
    {
      description: 'Block with no inline partial',
      template: '{+block/}',
      context: {},
      expectedDom: (() => {
        let frag = document.createDocumentFragment();
        frag.appendChild(document.createTextNode(''));
        return frag;
      })()
    }
  ]
};

module.exports = suite;
