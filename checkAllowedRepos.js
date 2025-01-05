import matcher from "matcher";

let debug = () => {};
export default function (input, ignored, log) {
  debug = log.extend("check-allowed-repos");
  // Nothing ignored, so it can't match
  if (ignored.length === 0) {
    return false;
  }

  // Exact match
  if (ignored.includes(input)) {
    debug(`Skipping ${input} due to exact match in ${ignored}`);
    return true;
  }

  // Glob match
  const isMatch = matcher([input], ignored).length > 0;

  if (isMatch) {
    debug(`Skipping ${input} due to pattern match in ${ignored}`);
  }
  return isMatch;
}
