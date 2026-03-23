export interface ProgramNode {
  type: "Program";
  universeOp: string;
  contextId: string;
  statements: StatementNode[];
}

export type StatementNode = FieldDeclNode | AssignNode | ReturnNode;

export interface FieldDeclNode {
  type: "FieldDecl";
  name: string;
  typeName: string;
}

export interface AssignNode {
  type: "Assign";
  target: string;
  callExpr: CallExprNode;
}

export interface CallExprNode {
  type: "CallExpr";
  callee: string;
  args: ArgNode[];
}

export interface ArgNode {
  type: "Arg";
  key: string;
  value: string | CallExprNode;
}

export interface ReturnNode {
  type: "Return";
  name: string;
}
