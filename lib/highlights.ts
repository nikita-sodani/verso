"use client";

import type { Highlight, HighlightColor } from "./types";
import { uid } from "./util";

const CTX = 24;

function getTextNodes(root: Node): Text[] {
  const out: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = (node as Text).parentElement;
      if (!p) return NodeFilter.FILTER_REJECT;
      const tag = p.tagName;
      if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null = walker.nextNode();
  while (n) { out.push(n as Text); n = walker.nextNode(); }
  return out;
}

export function getPlainText(root: HTMLElement): string {
  return getTextNodes(root).map((t) => t.nodeValue ?? "").join("");
}

export function rangeToOffsets(root: HTMLElement, range: Range): { start: number; end: number } | null {
  // Use Range.toString() to count characters — this works correctly regardless
  // of whether startContainer/endContainer is a text node or an element node
  // (e.g. after triple-click Chrome sets the container to the <p> element).
  try {
    const preRange = document.createRange();
    preRange.selectNodeContents(root);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + range.toString().length;
    if (end <= start) return null;
    return { start, end };
  } catch {
    return null;
  }
}

export function buildHighlightFromSelection(
  root: HTMLElement,
  itemId: string,
  color: HighlightColor,
): Highlight | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return null;
  if (!root.contains(range.commonAncestorContainer)) return null;

  const offsets = rangeToOffsets(root, range);
  if (!offsets) return null;
  const full = getPlainText(root);
  let s = offsets.start;
  let e = offsets.end;
  while (s < e && /\s/.test(full[s])) s++;
  while (e > s && /\s/.test(full[e - 1])) e--;
  const text = full.slice(s, e);
  if (text.length < 2) return null;
  const prefix = full.slice(Math.max(0, s - CTX), s);
  const suffix = full.slice(e, e + CTX);

  return {
    id: uid("h_"),
    itemId,
    color,
    text,
    prefix,
    suffix,
    createdAt: Date.now(),
  };
}

function findRangeForHighlight(root: HTMLElement, h: Highlight): Range | null {
  const full = getPlainText(root);
  const probe = h.prefix + h.text + h.suffix;
  let start = full.indexOf(probe);
  if (start >= 0) start += h.prefix.length;
  else {
    const probe2 = h.text;
    start = full.indexOf(probe2);
    if (start < 0) return null;
  }
  const end = start + h.text.length;

  const nodes = getTextNodes(root);
  let acc = 0;
  let startNode: Text | null = null;
  let startOffset = 0;
  let endNode: Text | null = null;
  let endOffset = 0;
  for (const n of nodes) {
    const len = n.nodeValue?.length ?? 0;
    if (!startNode && acc + len > start) { startNode = n; startOffset = start - acc; }
    if (!endNode && acc + len >= end) { endNode = n; endOffset = end - acc; break; }
    acc += len;
  }
  if (!startNode || !endNode) return null;
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  return range;
}

export function applyHighlights(root: HTMLElement, highlights: Highlight[]): void {
  root.querySelectorAll("mark[data-vs-hl]").forEach((m) => {
    const parent = m.parentNode;
    if (!parent) return;
    while (m.firstChild) parent.insertBefore(m.firstChild, m);
    parent.removeChild(m);
    parent.normalize();
  });
  for (const h of highlights) {
    const range = findRangeForHighlight(root, h);
    if (!range) continue;
    wrapRange(range, h);
  }
}

function wrapRange(range: Range, h: Highlight) {
  const ancestor = range.commonAncestorContainer;
  const root: Node = ancestor.nodeType === Node.TEXT_NODE ? (ancestor.parentNode ?? ancestor) : ancestor;
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) {
    if (range.intersectsNode(n)) nodes.push(n as Text);
    n = walker.nextNode();
  }
  if (nodes.length === 0 && ancestor.nodeType === Node.TEXT_NODE) nodes.push(ancestor as Text);
  if (nodes.length === 0) return;
  for (const node of nodes) {
    const start = node === range.startContainer ? range.startOffset : 0;
    const end = node === range.endContainer ? range.endOffset : (node.nodeValue?.length ?? 0);
    if (end <= start) continue;
    const before = node.nodeValue?.slice(0, start) ?? "";
    const middle = node.nodeValue?.slice(start, end) ?? "";
    const after = node.nodeValue?.slice(end) ?? "";
    const mark = document.createElement("mark");
    mark.setAttribute("data-vs-hl", "1");
    mark.setAttribute("data-hl-id", h.id);
    mark.setAttribute("data-hl-color", h.color);
    mark.textContent = middle;
    const parent = node.parentNode;
    if (!parent) continue;
    if (before) parent.insertBefore(document.createTextNode(before), node);
    parent.insertBefore(mark, node);
    if (after) parent.insertBefore(document.createTextNode(after), node);
    parent.removeChild(node);
  }
}
