import path from "path";
import { existsSync, promises as fs } from "fs";
import "./src/module-aliases.mjs";
import { render } from "./src/page-renderer-pre.mjs";

// loader doesn't show up in argv
const [_node, _binStr, srcDir, outputDir, ...args] = process.argv;

main();

async function main() {
  // require pageWrapper
  let pageWrapper;
  // Imports are expected to be in posix. We receive a full path here through
  // the import.meta.url, use the srcDir and convert it to posix.
  // It also can't import if it begins with a drive letter on Windows, so
  // we find the relative path from this file to the srcDir.
  const pageWrapperPath =
    "./" +
    path.posix.join(
      ...path
        .relative(path.dirname(fileURLToPath(import.meta.url)), srcDir)
        .split(path.sep),
      "src",
      "page-wrapper.js"
    );
  try {
    wrapper = await import(pageWrapperPath);
    pageWrapper = wrapper.default;
  } catch (e) {
    console.error("no user pagewrapper supplied/n", e);
  }

  // TODO: no data for now
  const data = {};
  // render html
  return Promise.all(
    args.map(async (file) => {
      const nodeComponent = await import(path.resolve(srcDir, file));
      return render({
        component: nodeComponent.default,
        pageWrapper,
        data,
        browserPageWrapperPath: "/src/page-wrapper.js",
        browserComponentPath: path.resolve("/", file),
        // .js(on)
        browserDataPath: path.resolve("/", `${file}on`),
      }).then((html) => {
        // write HTML file out for page
        const htmlFilePath = path.resolve(
          outputDir,
          file.replace("src/pages/", "").replace(".js", ".html")
        );
        return fs.writeFile(htmlFilePath, html);
      });
    })
  );
}
