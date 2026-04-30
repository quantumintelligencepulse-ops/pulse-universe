import { Token, TokenKind } from "./tokenizer";
import {
  ProgramNode, StatementNode, FieldDeclNode,
  AssignNode, CallExprNode, ArgNode, ReturnNode,
} from "./ast";

export class ParseError extends Error {
  constructor(msg: string, public pos: number) { super(msg); }
}

export class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token { return this.tokens[this.pos]; }

  private consume(kind?: TokenKind): Token {
    const t = this.tokens[this.pos];
    if (kind && t.kind !== kind) {
      throw new ParseError(
        `Expected ${kind} but got ${t.kind} ('${t.value}')`,
        t.pos
      );
    }
    this.pos++;
    return t;
  }

  parse(): ProgramNode {
    this.consume("LBRACKET");
    const universeOp = this.consume("IDENT").value;
    this.consume("RBRACKET");
    this.consume("LANGLE");
    const contextId = this.consume("IDENT").value;
    this.consume("RANGLE");

    this.consume("LBRACE");
    const statements: StatementNode[] = [];
    while (this.peek().kind !== "RBRACE" && this.peek().kind !== "EOF") {
      statements.push(this.parseStatement());
    }
    this.consume("RBRACE");

    return { type: "Program", universeOp, contextId, statements };
  }

  private parseStatement(): StatementNode {
    const t = this.peek();

    if (t.kind === "RETURN") {
      this.consume("RETURN");
      const name = this.consume("IDENT").value;
      return { type: "Return", name } as ReturnNode;
    }

    const name = this.consume("IDENT").value;

    if (this.peek().kind === "COLON") {
      this.consume("COLON");
      const typeName = this.consume("IDENT").value;
      return { type: "FieldDecl", name, typeName } as FieldDeclNode;
    }

    if (this.peek().kind === "ASSIGN") {
      this.consume("ASSIGN");
      const callExpr = this.parseCallExpr();
      return { type: "Assign", target: name, callExpr } as AssignNode;
    }

    throw new ParseError(
      `Expected ':' or '≔' after '${name}', got '${this.peek().value}'`,
      t.pos
    );
  }

  private parseCallExpr(): CallExprNode {
    const callee = this.consume("IDENT").value;
    this.consume("LPAREN");
    const args: ArgNode[] = [];
    while (this.peek().kind !== "RPAREN" && this.peek().kind !== "EOF") {
      args.push(this.parseArg());
    }
    this.consume("RPAREN");
    return { type: "CallExpr", callee, args };
  }

  private parseArg(): ArgNode {
    // Peek ahead: if we see IDENT = ... it's a key=value arg
    // If we see IDENT ( ... or IDENT followed by non-EQUALS, it's a bare value arg
    const firstIdent = this.consume("IDENT").value;
    const next = this.peek();

    if (next.kind === "EQUALS") {
      // key=value form: firstIdent is the key
      this.consume("EQUALS");
      const nextNext = this.tokens[this.pos + 1];
      if (this.peek().kind === "IDENT" && nextNext?.kind === "LPAREN") {
        return { type: "Arg", key: firstIdent, value: this.parseCallExpr() };
      }
      const value = this.consume("IDENT").value;
      return { type: "Arg", key: firstIdent, value };
    }

    // bare value form: firstIdent is the value (synthesize key γ_auto)
    if (next.kind === "LPAREN") {
      // firstIdent is itself a callee — parse it as a nested call expr but
      // we already consumed the callee, so reconstruct by re-inserting a fake call
      this.consume("LPAREN");
      const innerArgs: ArgNode[] = [];
      while (this.peek().kind !== "RPAREN" && this.peek().kind !== "EOF") {
        innerArgs.push(this.parseArg());
      }
      this.consume("RPAREN");
      const innerCall: CallExprNode = { type: "CallExpr", callee: firstIdent, args: innerArgs };
      return { type: "Arg", key: "γ_auto", value: innerCall };
    }

    // plain bare ident
    return { type: "Arg", key: "γ_auto", value: firstIdent };
  }
}
