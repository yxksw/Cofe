const CONTEXT_LINES = 2;
const BASE_URL = "/";

type DiffPart = { added?: boolean; removed?: boolean; value?: string };
type DiffRow = { type: "add" | "del" | "ctx"; text: string };
type DiffHunk = DiffRow[];

export function isLogEnabled() {
	try {
		const sp = new URLSearchParams(window.location.search);
		if (sp.get("__diff_log") === "1") return true;
		if (sp.get("__diff_debug") === "1") return true;
	} catch {}
	return false;
}

export function decodeHtmlEntities(value: string) {
	const t = document.createElement("textarea");
	t.innerHTML = String(value ?? "");
	return t.value;
}

export function normalizeUrlForCompare(raw: string) {
	const v = decodeHtmlEntities(String(raw ?? "").trim());
	if (!v) return "";
	try {
		const url = new URL(v, window.location.origin);
		const entries = Array.from(url.searchParams.entries()).sort((a, b) => {
			const k = a[0].localeCompare(b[0]);
			if (k !== 0) return k;
			return a[1].localeCompare(b[1]);
		});
		const qs = entries
			.map(([k, val]) => `${encodeURIComponent(k)}=${encodeURIComponent(val)}`)
			.join("&");
		return `${url.pathname}${qs ? `?${qs}` : ""}`;
	} catch {
		return v;
	}
}

export function normalizeGuid(guid: string, link: string) {
	const value = (guid || link || "").trim();
	if (!value) return "";
	try {
		const url = new URL(value, window.location.origin);
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return value;
	}
}

export function getRelativePath(absoluteUrl: string) {
	try {
		const url = new URL(absoluteUrl, window.location.origin);
		return `${url.pathname}${url.search}${url.hash}`;
	} catch {
		return absoluteUrl;
	}
}

export function normalizePathname(pathname: string) {
	const p = String(pathname || "");
	if (!p) return "/";
	const noQueryHash = p.split("#")[0].split("?")[0];
	if (noQueryHash.length > 1) return noQueryHash.replace(/\/+$/, "");
	return "/";
}

export function stripBasePath(pathname: string) {
	const base = normalizePathname(BASE_URL);
	const p = normalizePathname(pathname);
	if (!base || base === "/") return p;
	if (p === base) return "/";
	if (p.startsWith(`${base}/`)) return p.slice(base.length) || "/";
	return p;
}

export function clearInlineDiff(container: HTMLElement) {
	container.querySelectorAll("[data-post-inline-diff-inline]").forEach((el) => {
		if (!(el instanceof HTMLElement)) return;
		const kind = el.getAttribute("data-post-inline-diff-inline") || "";
		if (kind === "anchor") {
			el.remove();
			return;
		}
		if (kind === "add") {
			el.remove();
			return;
		}
		const text = document.createTextNode(el.textContent || "");
		el.replaceWith(text);
	});

	container
		.querySelectorAll("[data-post-inline-diff]")
		.forEach((el) => el.remove());
	container
		.querySelectorAll("[data-post-inline-diff-add-target]")
		.forEach((el) => el.removeAttribute("data-post-inline-diff-add-target"));
	container
		.querySelectorAll(".post-inline-diff-add-target")
		.forEach((el) => el.classList.remove("post-inline-diff-add-target"));
	container
		.querySelectorAll("[data-post-inline-diff-add-target-img]")
		.forEach((el) =>
			el.removeAttribute("data-post-inline-diff-add-target-img"),
		);
	container
		.querySelectorAll(".post-inline-diff-add-target-img")
		.forEach((el) => el.classList.remove("post-inline-diff-add-target-img"));
	container
		.querySelectorAll("[data-post-inline-diff-del-target]")
		.forEach((el) => el.removeAttribute("data-post-inline-diff-del-target"));
	container
		.querySelectorAll(".post-inline-diff-del-target")
		.forEach((el) => el.classList.remove("post-inline-diff-del-target"));
	container
		.querySelectorAll("[data-post-inline-diff-del-target-img]")
		.forEach((el) =>
			el.removeAttribute("data-post-inline-diff-del-target-img"),
		);
	container
		.querySelectorAll(".post-inline-diff-del-target-img")
		.forEach((el) => el.classList.remove("post-inline-diff-del-target-img"));
}

function buildRows(diffParts: DiffPart[]): DiffRow[] {
	const rows: DiffRow[] = [];
	for (const part of diffParts) {
		const type: DiffRow["type"] = part?.added
			? "add"
			: part?.removed
				? "del"
				: "ctx";
		const value = String(part?.value ?? "");
		const lines = value.split("\n");
		if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
		for (const line of lines) rows.push({ type, text: line });
	}
	return rows;
}

function sliceWithContext(rows: DiffRow[]) {
	const changeIndexes: number[] = [];
	for (let i = 0; i < rows.length; i += 1) {
		if (rows[i].type !== "ctx") changeIndexes.push(i);
	}
	if (changeIndexes.length === 0) return [];

	const keep = new Array(rows.length).fill(false);
	for (const idx of changeIndexes) {
		const start = Math.max(0, idx - CONTEXT_LINES);
		const end = Math.min(rows.length - 1, idx + CONTEXT_LINES);
		for (let i = start; i <= end; i += 1) keep[i] = true;
	}

	const out: Array<DiffRow | { type: "gap"; text: string }> = [];
	let inGap = false;
	for (let i = 0; i < rows.length; i += 1) {
		if (keep[i]) {
			out.push(rows[i]);
			inGap = false;
			continue;
		}
		if (!inGap) {
			out.push({ type: "gap", text: "…" });
			inGap = true;
		}
	}

	return out;
}

function toHunks(
	rowsWithGaps: Array<DiffRow | { type: "gap"; text: string }>,
): DiffHunk[] {
	const hunks: DiffHunk[] = [];
	let current: DiffHunk = [];
	for (const row of rowsWithGaps) {
		if (row.type === "gap") {
			if (current.length) hunks.push(current);
			current = [];
			continue;
		}
		current.push(row);
	}
	if (current.length) hunks.push(current);
	return hunks;
}

function normalizeLineText(text: string) {
	return String(text ?? "")
		.replace(/\r\n/g, "\n")
		.replace(/\r/g, "\n")
		.replace(/\u00A0/g, " ")
		.replace(/[ \t]*\n[ \t]*/g, " ")
		.replace(/[ \t]{2,}/g, " ")
		.replace(/[ \t]+$/g, "")
		.trim();
}

function extractImgSrc(line: string) {
	const s = String(line ?? "");
	const m = s.match(/<img[^>]*\s(?:src|data-src)=["']([^"']+)["']/i);
	return m?.[1] ? String(m[1]).trim() : null;
}

function stripHtmlLine(line: string) {
	const tmp = document.createElement("div");
	tmp.innerHTML = String(line ?? "");
	return tmp.textContent || tmp.innerText || "";
}

function normalizeForMatch(line: string) {
	const text = normalizeLineText(stripHtmlLine(line));
	if (text) return { kind: "text" as const, value: text };
	const imgSrc = extractImgSrc(line);
	if (imgSrc) return { kind: "img" as const, value: imgSrc };
	const raw = normalizeLineText(line);
	if (raw) return { kind: "text" as const, value: raw };
	return { kind: "none" as const, value: "" };
}

export function findImgBySrc(container: HTMLElement, src: string) {
	const normPath = normalizeUrlForCompare(src);
	if (!normPath) return null;
	const imgs = Array.from(container.querySelectorAll("img"));
	for (const img of imgs) {
		if (!(img instanceof HTMLImageElement)) continue;
		const cand = img.getAttribute("src") || img.getAttribute("data-src") || "";
		const candPath = normalizeUrlForCompare(cand);
		if (candPath === normPath) return img;
		if (candPath && normPath && (candPath.includes(normPath) || normPath.includes(candPath)))
			return img;
	}
	return null;
}

export function findBlockByText(container: HTMLElement, line: string) {
	const key = normalizeForMatch(line);
	if (key.kind !== "text") return null;
	const needle = key.value.slice(0, 48);
	const blocks = Array.from(container.querySelectorAll(
		"p, li, blockquote, pre, h1, h2, h3, h4, h5, h6",
	));
	for (const el of blocks) {
		if (!(el instanceof HTMLElement)) continue;
		if (el.closest(".post-inline-diff-add-line")) continue;
		if (el.closest(".post-inline-diff-del-line")) continue;
		if (el.classList.contains("post-inline-diff-del-target")) continue;
		const content = el.textContent || "";
		if (!normalizeLineText(content).includes(needle)) continue;
		return el;
	}
	return null;
}

function findContextBefore(
	container: HTMLElement,
	hunk: DiffHunk,
	rowIndex: number,
) {
	for (let i = rowIndex - 1; i >= 0; i -= 1) {
		const row = hunk[i];
		if (row?.type !== "ctx") continue;
		const el = findBlockByText(container, row.text);
		if (el) return el;
	}
	return null;
}

function findContextAfter(
	container: HTMLElement,
	hunk: DiffHunk,
	rowIndex: number,
) {
	for (let i = rowIndex + 1; i < hunk.length; i += 1) {
		const row = hunk[i];
		if (row?.type !== "ctx") continue;
		const el = findBlockByText(container, row.text);
		if (el) return el;
	}
	return null;
}

export function lineExistsInArticle(container: HTMLElement, line: string) {
	const key = normalizeForMatch(line);
	if (key.kind === "img") return !!findImgBySrc(container, key.value);
	if (key.kind !== "text") return false;
	return !!findBlockByText(container, line);
}

export function findAnchorElement(container: HTMLElement, hunk: DiffHunk) {
	const pick = (row: DiffRow) => String(row?.text ?? "").trim();
	const ctx = hunk.find((r) => r.type === "ctx" && pick(r).length >= 6);
	const anchorLine = ctx?.text ?? "";
	if (!anchorLine) return null;

	const key = normalizeForMatch(anchorLine);
	if (key.kind === "img") return findImgBySrc(container, key.value);
	return findBlockByText(container, anchorLine);
}

export function sanitizeHtmlFragment(html: string) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(
		`<div>${String(html || "")}</div>`,
		"text/html",
	);
	const root = doc.body.firstElementChild;
	if (!root) return String(html || "");

	root
		.querySelectorAll("script, iframe, object, embed, style")
		.forEach((el) => el.remove());
	root.querySelectorAll("*").forEach((el) => {
		const attrs = Array.from(el.attributes);
		for (const attr of attrs) {
			if (attr.name.startsWith("on")) el.removeAttribute(attr.name);
		}
	});

	return root.innerHTML;
}

function shouldRenderLineAsHtml(line: string) {
	const t = String(line || "").trim();
	return /<[a-z][\s\S]*>/i.test(t) || /<\/[a-z][\s\S]*>/i.test(t);
}

export function createDeletionNode(
	text: string,
	includeAnchor: boolean,
) {
	const el = document.createElement("div");
	el.setAttribute("data-post-inline-diff", "1");
	el.className = "post-inline-diff-del-line";

	if (includeAnchor) {
		const anchor = document.createElement("span");
		anchor.id = "post-diff";
		anchor.setAttribute("data-post-inline-diff", "1");
		el.appendChild(anchor);
	}

	const del = document.createElement("del");
	const raw = normalizeLineText(text);
	if (shouldRenderLineAsHtml(raw))
		del.innerHTML = " " + sanitizeHtmlFragment(raw);
	else del.textContent = ` ${raw}`;

	el.appendChild(del);
	return el;
}

export function createAdditionNode(
	text: string,
	includeAnchor: boolean,
) {
	const el = document.createElement("div");
	el.setAttribute("data-post-inline-diff", "1");
	el.className = "post-inline-diff-add-line";

	if (includeAnchor) {
		const anchor = document.createElement("span");
		anchor.id = "post-diff";
		anchor.setAttribute("data-post-inline-diff", "1");
		el.appendChild(anchor);
	}

	const content = document.createElement("div");
	content.className = "post-inline-diff-add-content";

	const raw = String(text ?? "").trim();
	if (shouldRenderLineAsHtml(raw))
		content.innerHTML = sanitizeHtmlFragment(raw);
	else content.textContent = raw;

	el.appendChild(content);
	return el;
}

function insertAfter(node: Node, ref: Node | null) {
	const parent = ref?.parentNode;
	if (!parent) return false;
	parent.insertBefore(node, ref.nextSibling);
	return true;
}

export function applyInlineDiff(container: HTMLElement, diffParts: DiffPart[]) {
	const log = isLogEnabled();
	clearInlineDiff(container);
	const rows = buildRows(diffParts);
	const focused = sliceWithContext(rows);
	const hunks = toHunks(focused);

	const anchorState = { inserted: false };
	for (const hunk of hunks) {
		let idx = 0;
		while (idx < hunk.length) {
			const row = hunk[idx];
			if (idx + 1 < hunk.length) {
				const next = hunk[idx + 1];
				const isReplace =
					(row.type === "del" && next.type === "add") ||
					(row.type === "add" && next.type === "del");
				if (isReplace) {
					const oldHtml = row.type === "del" ? row.text : next.text;
					const newHtml = row.type === "add" ? row.text : next.text;
					const oldKey = normalizeForMatch(oldHtml);
					const newKey = normalizeForMatch(newHtml);
					let target: HTMLElement | null = null;
					let isImgReplace = false;

					if (newKey.kind === "img") {
						target = findImgBySrc(container, newKey.value);
						isImgReplace = true;
					} else {
						target = findBlockByText(container, newHtml);
					}

					if (target instanceof HTMLElement) {
						if (isImgReplace) {
							target.classList.add("post-inline-diff-add-target-img");
							target.setAttribute("data-post-inline-diff-add-target-img", "1");
						} else {
							target.classList.add("post-inline-diff-add-target");
							target.setAttribute("data-post-inline-diff-add-target", "1");
						}
						const t =
							oldKey.kind === "img" ? `[图片] ${oldKey.value}` : oldKey.value;
						const node = createDeletionNode(t, !anchorState.inserted);
						if (!anchorState.inserted) anchorState.inserted = true;
						target.parentNode?.insertBefore(node, target);
						idx += 2;
						continue;
					}
				}
			}

			if (row.type === "add") {
				let endIdx = idx;
				while (endIdx + 1 < hunk.length && hunk[endIdx + 1].type === "add") {
					endIdx++;
				}
				for (let i = idx; i <= endIdx; i++) {
					const addRow = hunk[i];
					const key = normalizeForMatch(addRow.text);
					if (key.kind === "img") {
						const img = findImgBySrc(container, key.value);
						if (img instanceof HTMLElement) {
							img.classList.add("post-inline-diff-add-target-img");
							img.setAttribute("data-post-inline-diff-add-target-img", "1");
							if (!anchorState.inserted) {
								const anchor = document.createElement("span");
								anchor.id = "post-diff";
								anchor.setAttribute("data-post-inline-diff", "1");
								img.parentNode?.insertBefore(anchor, img);
								anchorState.inserted = true;
							}
						}
					} else {
						const target = findBlockByText(container, addRow.text);
						if (target instanceof HTMLElement) {
							target.classList.add("post-inline-diff-add-target");
							target.setAttribute("data-post-inline-diff-add-target", "1");
							if (!anchorState.inserted) {
								const anchor = document.createElement("span");
								anchor.id = "post-diff";
								anchor.setAttribute("data-post-inline-diff", "1");
								target.parentNode?.insertBefore(anchor, target);
								anchorState.inserted = true;
							}
						}
					}
				}
				idx = endIdx + 1;
				continue;
			}

			if (row.type !== "del") {
				idx += 1;
				continue;
			}

			const key = normalizeForMatch(row.text);
			if (key.kind === "none") {
				idx += 1;
				continue;
			}

			if (lineExistsInArticle(container, row.text)) {
				if (key.kind === "img") {
					const img = findImgBySrc(container, key.value);
					if (img instanceof HTMLElement) {
						img.classList.add("post-inline-diff-del-target-img");
						img.setAttribute("data-post-inline-diff-del-target-img", "1");
						if (!anchorState.inserted) {
							const anchor = document.createElement("span");
							anchor.id = "post-diff";
							img.parentNode?.insertBefore(anchor, img);
							anchorState.inserted = true;
						}
					}
				} else {
					const target = findBlockByText(container, row.text);
					if (target instanceof HTMLElement) {
						target.classList.add("post-inline-diff-del-target");
						target.setAttribute("data-post-inline-diff-del-target", "1");
						if (!anchorState.inserted) {
							const anchor = document.createElement("span");
							anchor.id = "post-diff";
							target.parentNode?.insertBefore(anchor, target);
							anchorState.inserted = true;
						}
					}
				}
				idx += 1;
				continue;
			}

			const before = findContextBefore(container, hunk, idx);
			const after = findContextAfter(container, hunk, idx);
			const node = createDeletionNode(row.text, !anchorState.inserted);
			if (!anchorState.inserted) anchorState.inserted = true;

			if (after) {
				insertAfter(node, after);
			} else if (before) {
				before.parentNode?.insertBefore(node, before.nextSibling);
			} else {
				container.appendChild(node);
			}
			idx += 1;
		}
	}

	if (log) {
		console.log("[PostInlineDiff] Applied diff hunks:", hunks.length);
	}
}
