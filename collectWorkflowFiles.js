import fs from "fs";
import path from "path";

export default function (programArgs) {
  let filesToProcess = [];

  for (const pathname of programArgs) {
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
