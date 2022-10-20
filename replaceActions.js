module.exports = function (input, action) {
  let runs = input.contents.items.filter((n) => n.key == "runs");
  if (runs.length) {
    return replaceInComposite(input, action);
  }
  return replaceInWorkflow(input, action);
};

function replaceInReusable(input, action) {}

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
    const stepKeys = job.value.items.filter((n) => n.key == "steps");
    const usesKeys = job.value.items.filter((n) => n.key == "uses");

    if (stepKeys.length) {
      replaceStandard(
        stepKeys[0].value.items,
        actionString,
        replacement,
        action
      );
    } else if (usesKeys.length) {
      replaceReusable(usesKeys, actionString, replacement, action);
    }
  }

  return input;
}

function replaceReusable(uses, actionString, replacement, action) {
  for (let use of uses) {
    if (use.value.value == actionString) {
      use.value.value = replacement;
      use.value.comment = ` pin@${action.pinnedVersion}`;
    }
  }
}

function replaceStandard(steps, actionString, replacement, action) {
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
