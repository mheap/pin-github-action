module.exports = function (input, allowEmpty) {
  // Check if it's a composite action
  let runs = input.contents.items.filter((n) => n.key == "runs");
  if (runs.length) {
    return extractFromComposite(input, allowEmpty);
  }

  return extractFromWorkflow(input, allowEmpty);
};

function extractFromComposite(input, allowEmpty) {
  let runs = input.contents.items.filter((n) => n.key == "runs");
  let steps = runs[0].value.items.filter((n) => n.key == "steps");

  if (!steps.length) {
    throw new Error("No runs.steps found");
  }

  const actions = new Set();
  steps = steps[0].value.items;
  for (let step of steps) {
    handleStep(actions, step);
  }
  return Array.from(actions);
}

function extractFromWorkflow(input, allowEmpty) {
  let actions = new Set();

  let jobs = input.contents.items.filter((n) => n.key == "jobs");
  if (!jobs.length) {
    throw new Error("No jobs found");
  }
  jobs = jobs[0].value.items;
  if (!jobs.length) {
    throw new Error("No jobs found");
  }

  for (let job of jobs) {
    let steps = job.value.items.filter((n) => n.key == "steps");
    if (!steps.length) {
      throw new Error("No job.steps found");
    }

    steps = steps[0].value.items;
    if (!steps.length) {
      throw new Error("No job.steps found");
    }

    for (let step of steps) {
      handleStep(actions, step);
    }
  }

  if (actions.size === 0 && !allowEmpty) {
    throw new Error("No Actions detected");
  }

  return Array.from(actions);
}

function handleStep(actions, step) {
  const uses = step.items.filter((n) => n.key == "uses");

  for (let use of uses) {
    const line = use.value.value.toString();

    if (line.substr(0, 9) == "docker://") {
      continue;
    }
    if (line.substr(0, 2) == "./") {
      continue;
    }

    const details = parseAction(line);
    let original = (use.value.comment || "").replace(" pin@", "");
    if (!original) {
      original = details.currentVersion;
    }

    actions.add({ ...details, pinnedVersion: original });
  }

  return actions;
}

function parseAction(str) {
  const [name, version] = str.split("@");
  let path = "";

  // The action could be in a subdirectory
  [owner, repo, ...path] = name.split("/");
  path = path.join("/");
  return { owner, repo, currentVersion: version, path };
}
