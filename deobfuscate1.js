import traverse from "@babel/traverse";
import { parse } from "@babel/parser";
import generate from "@babel/generator";
import * as types from "@babel/types";
import fs from "fs";

const code = fs.readFileSync("code1.js", "utf-8");
let ast = parse(code);

traverse(ast, {
  "UnaryExpression|BinaryExpression|ConditionalExpression|CallExpression": (
    path
  ) => {
    // console.log(path);
    const { confident, value } = path.evaluate();
    console.log({ confident, value });
    if (value == Infinity || value == -Infinity) return;
    confident && path.replaceWith(types.valueToNode(value));
  },
});

const { code: output } = generate(ast);
console.log(output);
