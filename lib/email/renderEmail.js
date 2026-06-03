'use strict';

var React = require('react');

async function renderEmail(element) {
  var mod = await import('@react-email/render');
  var render = mod.render || mod.default.render || mod.default;
  return render(element);
}

module.exports = { renderEmail: renderEmail };