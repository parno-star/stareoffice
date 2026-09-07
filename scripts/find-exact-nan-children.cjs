const ts = require("typescript");
const fs = require("fs");
const path = require("path");

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
const matches = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

  function visit(node) {
    if (ts.isJsxElement(node)) {
      // Check its children
      // We are looking for children where there is exactly one JsxExpression child (or among whitespace)
      const nonWhitespaceChildren = node.children.filter(c => {
        if (ts.isJsxText(c)) {
          return c.text.trim().length > 0;
        }
        return true;
      });

      for (const child of nonWhitespaceChildren) {
        if (ts.isJsxExpression(child) && child.expression) {
          const exprText = child.expression.getText(sf).trim();
          // Check if exprText is an arithmetic operation or a number variable
          // or Math function or division or subtraction or Number()
          const tag = node.openingElement.tagName.getText(sf);
          
          matches.push({
            file,
            tag,
            line: sf.getLineAndCharacterOfPosition(child.getStart(sf)).line + 1,
            expr: exprText,
            isSoleChild: nonWhitespaceChildren.length === 1
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sf);
}

fs.writeFileSync("jsx-children-exprs.json", JSON.stringify(matches, null, 2));
console.log(`Saved ${matches.length} JSX expression children to jsx-children-exprs.json`);
