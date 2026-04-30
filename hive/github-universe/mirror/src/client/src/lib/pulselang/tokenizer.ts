export type TokenKind =
  | "LBRACKET" | "RBRACKET"
  | "LANGLE"   | "RANGLE"
  | "LBRACE"   | "RBRACE"
  | "COLON"    | "ASSIGN"
  | "RETURN"   | "FUSION"
  | "EQUALS"   | "LPAREN" | "RPAREN"
  | "DOT"      | "PIPE"
  | "IDENT"    | "EOF";

export interface Token {
  kind: TokenKind;
  value: string;
  pos: number;
}

const SINGLE: Record<string, TokenKind> = {
  "⟦": "LBRACKET", "⟧": "RBRACKET",
  "⟨": "LANGLE",   "⟩": "RANGLE",
  "{":  "LBRACE",  "}":  "RBRACE",
  ":":  "COLON",   "≔": "ASSIGN",
  "↧": "RETURN",  "⊕": "FUSION",
  "=":  "EQUALS",  "(":  "LPAREN",
  ")":  "RPAREN",  ".":  "DOT",
  "|":  "PIPE",
};

const STRUCTURAL = new Set(Object.keys(SINGLE));

export class TokenizeError extends Error {
  constructor(msg: string, public pos: number) { super(msg); }
}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/[\s,\n\r\t]/.test(ch)) { i++; continue; }

    if (ch === "/" && src[i + 1] === "/") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }

    if (ch === ";") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }

    if (STRUCTURAL.has(ch)) {
      tokens.push({ kind: SINGLE[ch], value: ch, pos: i });
      i++;
      continue;
    }

    const start = i;
    while (
      i < src.length &&
      !STRUCTURAL.has(src[i]) &&
      !/[\s,\n\r\t;]/.test(src[i])
    ) i++;

    if (i > start) {
      tokens.push({ kind: "IDENT", value: src.slice(start, i), pos: start });
    } else {
      i++;
    }
  }
  tokens.push({ kind: "EOF", value: "", pos: i });
  return tokens;
}
