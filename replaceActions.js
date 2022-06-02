module.exports = function (input, action, literal, raw) {
  if (literal){
    return replaceLiteral(raw, action);
  }

  let runs = input.contents.items.filter((n) => n.key == "runs");
  if (runs.length) {
    return replaceInComposite(input, action);
  }

  return replaceInWorkflow(input, action);
};

/* replace unparsed - literal - strings rather than parsed - logical - strings.
  This is to prevent changes to syntax */
function replaceLiteral(input,action){
  let actionString = `${action.owner}/${action.repo}`;
  if (action.path) {
    actionString += `/${action.path}`;
  }

  const replacement = `${actionString}@${action.newVersion}`;

  actionString += `@${action.currentVersion}`;

  // next: replace
  // caution: actionString could conceivably be from an untrusted source
  let re = new RegExp(`^[ \t]*(-[ \t]*)?uses: ${actionString}([ \t]+)?(?:\\n|\$)`, 'g')
  let replacementWithComment = `uses: ${replacement}  # pin@${action.pinnedVersion}\n`;
  input = input.replace(
              re,
              replacementWithComment
              );
  return input;
}

function replaceInComposite(input, action) {
  let actionString = `${action.owner}/${action.repo}`;
  if (action.path) {
    actionString += `/${action.path}`;
  }

  const replacement = `${actionString}@${action.newVersion}`;

  actionString += `@${action.currentVersion}`;

  const runs = input.contents.items.filter((n) => n.key == "runs")[0].value
    .items;
  const steps = runs.filter((n) => n.key == "steps")[0].value.items;

  for (let step of steps) {
    const uses = step.items.filter((n) => n.key == "uses");
    for (let use of uses) {
      if (use.value.value == actionString) {
        use.value.value = replacement;
        use.value.comment = ` pin@${action.pinnedVersion}`;
      }
    }
  }

  return input;
}

function replaceInWorkflow(input, action) {
  let actionString = `${action.owner}/${action.repo}`;
  if (action.path) {
    actionString += `/${action.path}`;
  }

  const replacement = `${actionString}@${action.newVersion}`;

  actionString += `@${action.currentVersion}`;

  const jobs = input.contents.items.filter((n) => n.key == "jobs")[0].value
    .items;

  for (let job of jobs) {
    const steps = job.value.items.filter((n) => n.key == "steps")[0].value
      .items;
    for (let step of steps) {
      const uses = step.items.filter((n) => n.key == "uses");
      for (let use of uses) {
        if (use.value.value == actionString) {
          use.value.value = replacement;
          use.value.comment = ` pin@${action.pinnedVersion}`;
        }
      }
    }
  }

  return input;
}
