const matcher = require("matcher");

module.exports = function (input, ignored) {
  // Nothing ignored, so it can't match
  if (ignored.length === 0) {
    return false;
  }

  // Exact match
  if (ignored.includes(input)) {
    return true;
  }

  // Glob match
  return matcher([input], ignored).length > 0;
};
