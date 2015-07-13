import simpleDom from 'simple-dom';

global.document = new simpleDom.Document();

Object.defineProperty(simpleDom.Element.prototype, 'innerHTML', {
  get() {
    let serializer = new simpleDom.HTMLSerializer(simpleDom.voidMap);
    return this.firstChild ? serializer.serialize(this.firstChild) : '';
  }
});

simpleDom.Node.prototype.replaceChild = function(newNode, oldNode) {
  this.insertBefore(newNode, oldNode);
  this.removeChild(oldNode);
};

let tdSSR = {
  render(template, context) {
    let frag = template.render(context);
    let outer = document.createElement('div');
    outer.appendChild(frag);
    return outer.innerHTML;
  }
};

export default tdSSR;
