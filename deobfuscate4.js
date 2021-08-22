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
    if (!types.isLiteral(test, { value: true })) return;
    if (body.body.length != 2) return;
    let switchNode = body.body[0],
      breakNode = body.body[1];
    if (
      !types.isSwitchStatement(switchNode) ||
      !types.isBreakStatement(breakNode)
    ) {
      return;
    }
    let { discriminant, cases } = switchNode;
    if (!types.isMemberExpression(discriminant)) return;
    let { object, property } = discriminant;
    if (!types.isIdentifier(object) || !types.isUpdateExpression(property))
      return;

    let arrName = object.name;
    let binding = scope.getBinding(arrName);
    if (!binding || !binding.path || !binding.path.isVariableDeclarator())
      return;
    let { init } = binding.path.node;
    if (
      !types.isCallExpression(init) ||
      !types.isMemberExpression(init.callee) ||
      !init.arguments.length > 0
    ) {
      return;
    }

    object = init.callee.object;
    property = init.callee.property;
    let argument = init.arguments[0].value;

    if (!types.isStringLiteral(object) || !types.isIdentifier(property)) {
      return;
    }

    let arrayFlow = object.value[property.name](argument);
    let resultBody = [];
    arrayFlow.forEach((index) => {
      let switchCases = cases.filter(
        (switchCase) => switchCase.test.value == index
      );
      let switchCase = switchCases.length > 0 ? switchCases[0] : undefined;
      if (!switchCase) {
        return;
      }
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
