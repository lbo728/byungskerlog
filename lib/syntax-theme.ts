/**
 * One Dark 테마 (TipTap 에디터와 동일한 색상)
 *
 * TipTap의 CodeBlockLowlight와 동일한 색상을 사용하여
 * Write 페이지와 Post Detail 페이지의 코드 블록 스타일을 통일
 */

import type { CSSProperties } from "react";

type SyntaxStyle = {
  [key: string]: CSSProperties;
};

export const oneDarkCustom: SyntaxStyle = {
  'code[class*="language-"]': {
    color: "#abb2bf",
    background: "none",
    fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.875rem",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none",
  },
  'pre[class*="language-"]': {
    color: "#abb2bf",
    background: "#282c34",
    fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.875rem",
    textAlign: "left",
    whiteSpace: "pre",
    wordSpacing: "normal",
    wordBreak: "normal",
    wordWrap: "normal",
    lineHeight: "1.5",
    tabSize: 4,
    hyphens: "none",
    padding: "1rem",
    margin: "0",
    overflow: "auto",
    borderRadius: "0.5rem",
  },
  comment: {
    color: "#5c6370",
    fontStyle: "italic",
  },
  prolog: {
    color: "#5c6370",
  },
  doctype: {
    color: "#5c6370",
  },
  cdata: {
    color: "#5c6370",
  },
  punctuation: {
    color: "#abb2bf",
  },
  ".namespace": {
    opacity: 0.7,
  },
  property: {
    color: "#e06c75",
  },
  keyword: {
    color: "#c678dd",
  },
  tag: {
    color: "#e06c75",
  },
  "class-name": {
    color: "#e6c07b",
  },
  boolean: {
    color: "#d19a66",
  },
  constant: {
    color: "#d19a66",
  },
  symbol: {
    color: "#61aeee",
  },
  deleted: {
    color: "#e06c75",
  },
  number: {
    color: "#d19a66",
  },
  selector: {
    color: "#98c379",
  },
  "attr-name": {
    color: "#d19a66",
  },
  string: {
    color: "#98c379",
  },
  char: {
    color: "#98c379",
  },
  builtin: {
    color: "#e6c07b",
  },
  inserted: {
    color: "#98c379",
  },
  variable: {
    color: "#d19a66",
  },
  operator: {
    color: "#56b6c2",
  },
  entity: {
    color: "#e6c07b",
    cursor: "help",
  },
  url: {
    color: "#56b6c2",
  },
  ".language-css .token.string": {
    color: "#56b6c2",
  },
  ".style .token.string": {
    color: "#56b6c2",
  },
  atrule: {
    color: "#c678dd",
  },
  "attr-value": {
    color: "#98c379",
  },
  function: {
    color: "#61aeee",
  },
  regex: {
    color: "#56b6c2",
  },
  important: {
    color: "#c678dd",
    fontWeight: "bold",
  },
  bold: {
    fontWeight: "bold",
  },
  italic: {
    fontStyle: "italic",
  },
  // 추가 토큰
  "template-string": {
    color: "#98c379",
  },
  "template-punctuation": {
    color: "#98c379",
  },
  interpolation: {
    color: "#d19a66",
  },
  "interpolation-punctuation": {
    color: "#d19a66",
  },
  "function-variable": {
    color: "#61aeee",
  },
  parameter: {
    color: "#d19a66",
  },
  imports: {
    color: "#e06c75",
  },
  "maybe-class-name": {
    color: "#e6c07b",
  },
  console: {
    color: "#e6c07b",
  },
  method: {
    color: "#61aeee",
  },
  "method-variable": {
    color: "#61aeee",
  },
  "plain-text": {
    color: "#abb2bf",
  },
  // Python 특수 토큰
  decorator: {
    color: "#c678dd",
  },
  // JavaScript/TypeScript 특수 토큰
  "module": {
    color: "#e06c75",
  },
  "control-flow": {
    color: "#c678dd",
  },
  // CSS 특수 토큰
  "property-declaration": {
    color: "#56b6c2",
  },
  // JSON 특수 토큰
  "property-name": {
    color: "#e06c75",
  },
};
