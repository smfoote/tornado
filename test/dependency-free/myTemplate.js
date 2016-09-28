export default (d=>{
  const frags = {};
  const nodeToString = node => {
    const div = d.createElement('div');
    div.appendChild(node);
    return div.innerHTML;
  };
  const template = {
    f0: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      var p1 = d.createTextNode('');
      frag.appendChild(p1);
      res.p1 = p1;;
      return res;
    },
    f1: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      frag.appendChild(d.createTextNode('\n    '));
      var el0 = d.createElement('div');
      res.p2 = el0;
      var p3 = d.createTextNode('');
      el0.appendChild(p3);
      res.p3 = p3;
      frag.appendChild(el0);
      frag.appendChild(d.createTextNode('\n    '));
      var el1 = d.createElement('div');
      res.p4 = el1;
      el1.appendChild(d.createTextNode('\n      '));
      var el2 = d.createElement('button');
      res.p5 = el2;
      el2.appendChild(d.createTextNode('\n        '));
      var el3 = d.createElement('span');
      res.p6 = el3;
      el3.appendChild(d.createTextNode('Previous'));
      el2.appendChild(el3);
      el2.appendChild(d.createTextNode('\n        '));
      var el4 = d.createElement('li-icon');
      res.p7 = el4;
      res.p8 = el4;
      el2.appendChild(el4);
      el2.appendChild(d.createTextNode('\n      '));
      el1.appendChild(el2);
      el1.appendChild(d.createTextNode('\n      '));
      var el5 = d.createElement('button');
      res.p9 = el5;
      el5.appendChild(d.createTextNode('\n        '));
      var el6 = d.createElement('span');
      res.p10 = el6;
      el6.appendChild(d.createTextNode('Next'));
      el5.appendChild(el6);
      el5.appendChild(d.createTextNode('\n        '));
      var el7 = d.createElement('li-icon');
      res.p11 = el7;
      res.p12 = el7;
      el5.appendChild(el7);
      el5.appendChild(d.createTextNode('\n      '));
      el1.appendChild(el5);
      el1.appendChild(d.createTextNode('\n    '));
      frag.appendChild(el1);
      frag.appendChild(d.createTextNode('\n    '));
      var el8 = d.createElement('div');
      res.p13 = el8;
      el8.appendChild(d.createTextNode('\n      '));
      var p14 = d.createTextNode('');
      el8.appendChild(p14);
      res.p14 = p14;;
      el8.appendChild(d.createTextNode('\n    '));
      frag.appendChild(el8);
      frag.appendChild(d.createTextNode('\n    '));
      var p17 = d.createTextNode('');
      frag.appendChild(p17);
      res.p17 = p17;;
      frag.appendChild(d.createTextNode('\n'));
      return res;
    },
    f2: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      frag.appendChild(d.createTextNode('\n        '));
      var el9 = d.createElement('span');
      res.p15 = el9;
      var p16 = d.createTextNode('');
      el9.appendChild(p16);
      res.p16 = p16;
      frag.appendChild(el9);
      frag.appendChild(d.createTextNode('\n      '));
      return res;
    },
    f3: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      frag.appendChild(d.createTextNode('\n      '));
      var el10 = d.createElement('div');
      res.p18 = el10;
      el10.appendChild(d.createTextNode('\n        '));
      var p19 = d.createTextNode('');
      el10.appendChild(p19);
      res.p19 = p19;;
      el10.appendChild(d.createTextNode('\n        '));
      var p24 = d.createTextNode('');
      el10.appendChild(p24);
      res.p24 = p24;;
      el10.appendChild(d.createTextNode('\n        '));
      var p30 = d.createTextNode('');
      el10.appendChild(p30);
      res.p30 = p30;;
      el10.appendChild(d.createTextNode('\n      '));
      frag.appendChild(el10);
      frag.appendChild(d.createTextNode('\n    '));
      return res;
    },
    f4: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      frag.appendChild(d.createTextNode('\n          '));
      var el11 = d.createElement('span');
      res.p20 = el11;
      res.p21 = el11;
      var p23 = d.createTextNode('');
      el11.appendChild(p23);
      res.p23 = p23;
      frag.appendChild(el11);
      frag.appendChild(d.createTextNode('\n        '));
      return res;
    },
    f5: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      frag.appendChild(d.createTextNode('\n          '));
      var el12 = d.createElement('span');
      res.p25 = el12;
      res.p27 = el12;
      var p29 = d.createTextNode('');
      el12.appendChild(p29);
      res.p29 = p29;
      frag.appendChild(el12);
      frag.appendChild(d.createTextNode('\n        '));
      return res;
    },
    f6: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      frag.appendChild(d.createTextNode(' selected'));
      return res;
    },
    f7: function() {
      var res = {};
      var frag = d.createDocumentFragment();
      res.frag = frag;
      frag.appendChild(d.createTextNode('\n          '));
      var el13 = d.createElement('span');
      res.p31 = el13;
      res.p32 = el13;
      var p34 = d.createTextNode('');
      el13.appendChild(p34);
      res.p34 = p34;
      frag.appendChild(el13);
      frag.appendChild(d.createTextNode('\n        '));
      return res;
    },
    r0: function(c) {
      var root = this.f0();
      if (c['isCalendarVisible']) {
        root.p1.parentNode.replaceChild(this.r1(c), root.p1);
      }
      return root.frag;
    },
    r1: function(c) {
      var root = this.f1();
      root.p2.setAttribute('class','month-year');
      root.p3.parentNode.replaceChild(d.createTextNode(c['formattedDisplayMonth']), root.p3);
      root.p4.setAttribute('class','actions');
      root.p5.setAttribute('class','prev-month');
      root.p6.setAttribute('class','a11y-text');
      root.p7.setAttribute('type','arrow-left-icon');
      root.p8.setAttribute('size','small');
      root.p9.setAttribute('class','next-month');
      root.p10.setAttribute('class','a11y-text');
      root.p11.setAttribute('type','arrow-right-icon');
      root.p12.setAttribute('size','small');
      root.p13.setAttribute('class','weekdays');
      if (Array.isArray(c['dayNames'])) {
        const frag = document.createDocumentFragment();
        (c['dayNames']).map(item => {
          frag.appendChild(this.r2(item));
        });
        root.p14.parentNode.replaceChild(frag, root.p14);
      } else {

      }
      if (Array.isArray(c['weeks'])) {
        const frag = document.createDocumentFragment();
        (c['weeks']).map(item => {
          frag.appendChild(this.r3(item));
        });
        root.p17.parentNode.replaceChild(frag, root.p17);
      } else {

      }
      return root.frag;
    },
    r2: function(c) {
      var root = this.f2();
      root.p15.setAttribute('class','dayname');
      root.p16.parentNode.replaceChild(d.createTextNode(c), root.p16);
      return root.frag;
    },
    r3: function(c) {
      var root = this.f3();
      root.p18.setAttribute('class','week');
      if (Array.isArray(c['previousMonthDays'])) {
        const frag = document.createDocumentFragment();
        (c['previousMonthDays']).map(item => {
          frag.appendChild(this.r4(item));
        });
        root.p19.parentNode.replaceChild(frag, root.p19);
      } else {

      }
      if (Array.isArray(c['days'])) {
        const frag = document.createDocumentFragment();
        (c['days']).map(item => {
          frag.appendChild(this.r5(item));
        });
        root.p24.parentNode.replaceChild(frag, root.p24);
      } else {

      }
      if (Array.isArray(c['nextMonthDays'])) {
        const frag = document.createDocumentFragment();
        (c['nextMonthDays']).map(item => {
          frag.appendChild(this.r7(item));
        });
        root.p30.parentNode.replaceChild(frag, root.p30);
      } else {

      }
      return root.frag;
    },
    r4: function(c) {
      var root = this.f4();
      root.p20.setAttribute('class','day prev-month-day');
      root.p21.setAttribute('data-artdeco-date',[c['date']].join(''));
      root.p23.parentNode.replaceChild(d.createTextNode(c['dayOfMonth']), root.p23);
      return root.frag;
    },
    r5: function(c) {
      var root = this.f5();
      root.p25.setAttribute('class',['day',(c['isSelected'] ? nodeToString(this.r6(c)) : '')].join(''));
      root.p27.setAttribute('data-artdeco-date',[c['date']].join(''));
      root.p29.parentNode.replaceChild(d.createTextNode(c['dayOfMonth']), root.p29);
      return root.frag;
    },
    r6: function(c) {
      var root = this.f6();
      return root.frag;
    },
    r7: function(c) {
      var root = this.f7();
      root.p31.setAttribute('class','day next-month-day');
      root.p32.setAttribute('data-artdeco-date',[c['date']].join(''));
      root.p34.parentNode.replaceChild(d.createTextNode(c['dayOfMonth']), root.p34);
      return root.frag;
    }
  };
  template.render = template.r0;
  return template;
})(document);
