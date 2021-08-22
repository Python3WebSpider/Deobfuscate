import traverse from "@babel/traverse";
import { parse } from "@babel/parser";
import generate from "@babel/generator";
import * as types from "@babel/types";
import fs from "fs";

const code = fs.readFileSync("code4.js", "utf-8");
let ast = parse(code);

traverse(ast, {
  WhileStatement(path) {
    const { node, scope } = path;
    const { test, body } = node;
    let switchNode = body.body[0];
    let { discriminant, cases } = switchNode;
    let { object, property } = discriminant;
    let arrName = object.name;
    let binding = scope.getBinding(arrName);
    let { init } = binding.path.node;
    object = init.callee.object;
    property = init.callee.property;
    let argument = init.arguments[0].value;
    let arrayFlow = object.value[property.name](argument);
    let resultBody = [];
    arrayFlow.forEach((index) => {
      let switchCase = cases.filter((c) => c.test.value == index)[0];
      let caseBody = switchCase.consequent;
      if (types.isContinueStatement(caseBody[caseBody.length - 1])) {
        caseBody.pop();
      }
      resultBody = resultBody.concat(caseBody);
    });
    path.replaceWithMultiple(resultBody);
  },
});

const { code: output } = generate(ast);
console.log(output);
