let debug = () => {};
export default function (input, allowEmpty, comment, log) {
  debug = log.extend("extract-actions");
  // Check if it's a composite action
  let runs = input.contents.items.filter((n) => n.key == "runs");
  if (runs.length) {
    debug("Processing composite action");
    return extractFromComposite(input, allowEmpty, comment);
  }

  debug("Processing workflow");
  return extractFromWorkflow(input, allowEmpty, comment);
}

function extractFromComposite(input, allowEmpty, comment) {
  let runs = input.contents.items.filter((n) => n.key == "runs");
  let steps = runs[0].value.items.filter((n) => n.key == "steps");

  if (!steps.length) {
    throw new Error("No runs.steps found");
  }

  const actions = new Set();
  steps = steps[0].value.items;
  for (let step of steps) {
    handleStep(actions, step.items, comment);
  }
  return Array.from(actions);
}

function extractFromWorkflow(input, allowEmpty, comment) {
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
    // Check for
    let steps = job.value.items.filter(
      (n) => n.key == "steps" || n.key == "uses"
    );
    if (!steps.length) {
      throw new Error("No job.steps or job.uses found");
    }

    // It's a job with steps
    if (steps[0].value.items) {
      if (!steps[0].value.items.length) {
        throw new Error("No job.steps found");
      }

      for (let step of steps[0].value.items) {
        handleStep(actions, step.items, comment);
      }
    } else {
      // It's a job that calls a reusable workflow
      handleStep(actions, steps, comment);
    }
  }

  if (actions.size === 0 && !allowEmpty) {
    throw new Error("No Actions detected");
  }

  return Array.from(actions);
}

function handleStep(actions, items, comment) {
  const uses = items.filter((n) => n.key == "uses");

  for (let use of uses) {
    const line = use.value.value.toString();

    if (line.substr(0, 9) == "docker://") {
      debug(`Skipping docker:// action: '${line}'`);
      continue;
    }
    if (line.substr(0, 2) == "./") {
      debug(`Skipping local action: '${line}'`);
      continue;
    }

    const details = parseAction(line);

    comment = comment.replace("{ref}", "");

    let original = (use.value.comment || "").replace(comment, "");
    if (!original) {
      original = details.currentVersion;
    }

    // Legacy format, strip pin@ off
    if (original.includes("pin@")) {
      original = original.replace("pin@", "");
    }

    actions.add({ ...details, pinnedVersion: original });
  }

  return actions;
}

function parseAction(str) {
  const [name, version] = str.split("@");

  // The action could be in a subdirectory
  let [owner, repo, ...path] = name.split("/");
  path = path.join("/");
  return { owner, repo, currentVersion: version, path };
}
