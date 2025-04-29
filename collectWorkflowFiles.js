import fs from "fs";
import path from "path";
import glob from "fast-glob";

export default function (programArgs, recursive) {
  let filesToProcess = [];

  for (let pathname of programArgs) {
    if (process.env.WORKFLOWS_DIR) {
      // If WORKFLOWS_DIR is set, prepend it to the pathname
      pathname = path.join(process.env.WORKFLOWS_DIR, pathname);
    }

    if (fs.lstatSync(pathname).isFile()) {
      filesToProcess.push(pathname);
    } else {
      let globPattern = "*.{yaml,yml}";
      if (recursive) {
        globPattern = "**/*.{yaml,yml}";
      }

      const files = glob.sync(path.join(`${pathname}`, globPattern));
      filesToProcess = filesToProcess.concat(files);
    }
  }

  // If user will pass both file and directory, make sure to clear duplicates
  return [...new Set(filesToProcess)];
}
