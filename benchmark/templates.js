/*eslint no-path-concat:0 */

var fs = require('fs');

module.exports = {
  templates: [
    {
      name: 'results',
      str: fs.readFileSync(__dirname + '/templates/results.td', 'utf8'),
      data: {
        name: 'results',
        elapsedTime: 6006
      }
    },
    {
      name: 'asyncResults',
      str: fs.readFileSync(__dirname + '/templates/results.td', 'utf8'),
      data: {
        name: 'results',
        elapsedTime: function() {
          return new Promise(function(res, rej) {
            setTimeout(function() {
              res(6006);
            }, 150);
          });
        }
      }
    },
    {
      name: 'search',
      str: fs.readFileSync(__dirname + '/templates/search.td', 'utf8'),
      data: {
        results: [
          {
            type: 'person',
            fullName: 'Steven Foote',
            headerText: 'Tornado Chaser',
            headlineText: 'Highland UT area',
            imageUrl: 'http://placekitten.com/g/50/50',
            connections: [
              {
                fullName: 'Jimmy Chan',
                position: 'Security Wrangler'
              }
            ]
          },
          {
            type: 'person',
            fullName: 'Jimmy Chan',
            headerText: 'Security Wrangler',
            headlineText: 'San Francisco Bay Area',
            imageUrl: 'http://placekitten.com/g/60/70',
            connections: [
              {
                fullName: 'Steven Foote',
                position: 'Tornado Chaser'
              }
            ]
          }
        ]
      }
    },
    {
      name: 'blocks',
      str: fs.readFileSync(__dirname + '/templates/blocks.td', 'utf8'),
      data: {}
    },
    {
      name: 'exists',
      str: fs.readFileSync(__dirname + '/templates/exists.td', 'utf8'),
      data: {
        isHeader: true,
        exists: true,
        notExists: true
      }
    },
    // {
    //   name: 'helper',
    //   str: fs.readFileSync(__dirname + '/templates/helper.td', 'utf8'),
    //   data: {
    //     exists: true
    //   }
    // },
    {
      name: 'partial',
      str: fs.readFileSync(__dirname + '/templates/partial.td', 'utf8'),
      data: {}
    },
    {
      name: 'reference',
      str: fs.readFileSync(__dirname + '/templates/reference.td', 'utf8'),
      data: {
        isHeader: true,
        exists: true,
        notExists: false,
        ref: 'ref',
        references: 'refs',
        over: 'under',
        place: 'Utah'
      }
    },
    {
      name: 'section',
      str: fs.readFileSync(__dirname + '/templates/section.td', 'utf8'),
      data: {}
    }
  ]
};
