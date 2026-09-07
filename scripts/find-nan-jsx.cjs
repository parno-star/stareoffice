const fs = require("fs");
const path = require("path");
const ts = require("typescript");

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (full.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

const files = walk("./src");
const candidates = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, false);

  function visit(node) {
    if (ts.isJsxElement(node)) {
      const nonWhitespace = node.children.filter(c => {
        if (ts.isJsxText(c)) {
          return c.text.trim().length > 0;
        }
        return true;
      });
      if (nonWhitespace.length === 1 && ts.isJsxExpression(nonWhitespace[0])) {
        const expr = nonWhitespace[0].expression;
        if (expr) {
          const text = expr.getText(sourceFile);
          // Look for direct math operations or variables that might be NaN
          if (/[/%*+-]|Math\.|parseInt|parseFloat|Number\(|trend|pct|rate|ratio|progress|count|avg/i.test(text)) {
            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
            candidates.push({
              file,
              line: line + 1,
              tag: node.openingElement.tagName.getText(sourceFile),
              expr: text.replace(/\s+/g, " "),
            });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

fs.writeFileSync("candidates.json", JSON.stringify(candidates, null, 2));
console.log(`Saved ${candidates.length} candidates to candidates.json`);
