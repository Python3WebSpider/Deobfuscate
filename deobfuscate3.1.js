import traverse from "@babel/traverse";
import { parse } from "@babel/parser";
import generate from "@babel/generator";
import * as t from "@babel/types";
import fs from "fs";

const code = fs.readFileSync("code3.js", "utf-8");
let ast = parse(code);

function callToStr(path) {
  // 将对象进行替换
  var node = path.node;

  if (!t.isObjectExpression(node.init)) return;

  // 获取对象内所有属性
  var objPropertiesList = node.init.properties;

  if (objPropertiesList.length == 0) return;

  // 对象名
  var objName = node.id.name;
  // 是否可删除该对象：发生替换时可删除，否则不删除
  var del_flag = false;

  objPropertiesList.forEach((prop) => {
    var key = prop.key.value;
    if (t.isFunctionExpression(prop.value)) {
      var retStmt = prop.value.body.body[0];

      // 该path的最近父节点
      var fnPath = path.getFunctionParent();
      fnPath.traverse({
        CallExpression: function (_path) {
          if (!t.isMemberExpression(_path.node.callee)) return;

          var _node = _path.node.callee;
          if (!t.isIdentifier(_node.object) || _node.object.name !== objName)
            return;
          if (
            !(
              t.isStringLiteral(_node.property) ||
              t.isIdentifier(_node.property)
            )
          )
            return;
          if (!(_node.property.value == key || _node.property.name == key))
            return;
          // if (!t.isStringLiteral(_node.property) || _node.property.value != key)
          //     return;

          var args = _path.node.arguments;

          // 二元运算
          if (t.isBinaryExpression(retStmt.argument) && args.length === 2) {
            _path.replaceWith(
              t.binaryExpression(retStmt.argument.operator, args[0], args[1])
            );
          }
          // 逻辑运算
          else if (
            t.isLogicalExpression(retStmt.argument) &&
            args.length == 2
          ) {
            _path.replaceWith(
              t.logicalExpression(retStmt.argument.operator, args[0], args[1])
            );
          }
          // 函数调用
          else if (
            t.isCallExpression(retStmt.argument) &&
            t.isIdentifier(retStmt.argument.callee)
          ) {
            _path.replaceWith(t.callExpression(args[0], args.slice(1)));
          }
          del_flag = true;
        },
      });
    } else if (t.isStringLiteral(prop.value)) {
      var retStmt = prop.value.value;

      // 该path的最近父节点
      var fnPath = path.getFunctionParent();
      fnPath.traverse({
        MemberExpression: function (_path) {
          var _node = _path.node;
          if (!t.isIdentifier(_node.object) || _node.object.name !== objName)
            return;
          if (
            !(
              t.isStringLiteral(_node.property) ||
              t.isIdentifier(_node.property)
            )
          )
            return;
          if (!(_node.property.value == key || _node.property.name == key))
            return;
          // if (!t.isStringLiteral(_node.property) || _node.property.value != key)
          //     return;

          _path.replaceWith(t.stringLiteral(retStmt));
          del_flag = true;
        },
      });
    }
  });
  if (del_flag) {
    // 如果发生替换，则删除该对象
    path.remove();
  }
}

traverse(ast, { VariableDeclarator: { exit: [callToStr] } });

const { code: output } = generate(ast);
console.log(output);
