import fs from "fs";
import path from "path";

export default function (programArgs) {
  let filesToProcess = [];

  for (let pathname of programArgs) {
    if (process.env.WORKFLOWS_DIR) {
      // If WORKFLOWS_DIR is set, prepend it to the pathname
      pathname = path.join(process.env.WORKFLOWS_DIR, pathname);
    }

    if (fs.lstatSync(pathname).isFile()) {
      filesToProcess.push(pathname);
    } else {
      const files = fs
        .readdirSync(pathname)
        .filter((f) => {
          return f.includes(".yaml") || f.includes(".yml");
        })
        .map((f) => path.join(pathname, f));
      filesToProcess = filesToProcess.concat(files);
    }
  }

  // If user will pass both file and directory, make sure to clear duplicates
  return [...new Set(filesToProcess)];
}
