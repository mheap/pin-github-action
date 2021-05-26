module.exports = function(action) {
  return /\b([a-f0-9]{40})\b/.test(action.currentVersion);
};
