import escapeStringRegexp from "escape-string-regexp";

export default function (input, action, comment) {
  const { currentVersion, owner, newVersion, path, repo } = action;

  const actionId = `${owner}/${repo}${path ? `/${path}` : ""}`;
  const newComment = generateComment(action, comment);

  // Capture an optional quote (either `"` or `'`)
  const quotePattern = "([\"'])?";

  const regexpUpdate = new RegExp(
    `uses(\\s*):(\\s+)${quotePattern}${escapeStringRegexp(
      actionId
    )}@${escapeStringRegexp(currentVersion)}\\3(\\s*)#[^\\n]*`,
    "g"
  );

  if (regexpUpdate.test(input)) {
    return input.replace(
      regexpUpdate,
      `uses$1:$2$3${actionId}@${newVersion}$3$4#${newComment}`
    );
  }

  const regexpPin = new RegExp(
    `uses(\\s*):(\\s+)${quotePattern}${escapeStringRegexp(
      actionId
    )}@${escapeStringRegexp(currentVersion)}\\3`,
    "g"
  );

  return input.replace(
    regexpPin,
    `uses$1:$2$3${actionId}@${newVersion}$3 #${newComment}`
  );
}

function generateComment(action, comment) {
  if (!comment) {
    comment = ` pin@{ref}`;
  }
  return `${comment.replace("{ref}", action.pinnedVersion)}`;
}
