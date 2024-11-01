const escapeStringRegexp = require("escape-string-regexp");

module.exports = function (input, action, comment) {
  const { currentVersion, owner, newVersion, path, repo } = action;

  const actionId = `${owner}/${repo}${path ? `/${path}` : ""}`;
  const newComment = generateComment(action, comment);

  const regexpUpdate = new RegExp(
    `uses(\\s*):(\\s+)${escapeStringRegexp(actionId)}@${escapeStringRegexp(
      currentVersion
    )}(\\s*)#[^\\n]*`,
    "g"
  );

  if (regexpUpdate.test(input)) {
    return input.replace(
      regexpUpdate,
      `uses$1:$2${actionId}@${newVersion}$3#${newComment}`
    );
  }

  const regexpPin = new RegExp(
    `uses(\\s*):(\\s+)${escapeStringRegexp(actionId)}@${escapeStringRegexp(
      currentVersion
    )}`,
    "g"
  );

  return input.replace(
    regexpPin,
    `uses$1:$2${actionId}@${newVersion} #${newComment}`
  );
};

function generateComment(action, comment) {
  if (!comment) {
    comment = ` pin@{ref}`;
  }
  return `${comment.replace("{ref}", action.pinnedVersion)}`;
}
