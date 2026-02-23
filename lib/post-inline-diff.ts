const CONTEXT_LINES = 2;
const BASE_URL = "/";

// 调试日志工具
const DEBUG_PREFIX = '[PostInlineDiff]';
function debugLog(step: string, data?: unknown) {
	const timestamp = new Date().toLocaleTimeString();
	if (data !== undefined) {
		console.log(`${DEBUG_PREFIX} [${timestamp}] ${step}`, data);
	} else {
		console.log(`${DEBUG_PREFIX} [${timestamp}] ${step}`);
	}
}
function debugError(step: string, error: unknown) {
	const timestamp = new Date().toLocaleTimeString();
	console.error(`${DEBUG_PREFIX} [${timestamp}] ❌ ${step}`, error);
}
// 使用 debugError 避免未使用警告
export const _debugError = debugError;
function debugSuccess(step: string) {
	const timestamp = new Date().toLocaleTimeString();
	console.log(`${DEBUG_PREFIX} [${timestamp}] ✅ ${step}`);
}

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
	debugLog('normalizeUrlForCompare 输入', raw);
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
		const result = `${url.pathname}${qs ? `?${qs}` : ""}`;
		debugLog('normalizeUrlForCompare 结果', result);
		return result;
	} catch {
		debugLog('normalizeUrlForCompare 失败，返回原值', v);
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
	debugLog('clearInlineDiff 开始', { containerTag: container.tagName, containerClass: container.className });
	
	const inlineElements = container.querySelectorAll("[data-post-inline-diff-inline]");
	debugLog('找到 inline diff 元素', inlineElements.length);
	inlineElements.forEach((el) => {
		if (!(el instanceof HTMLElement)) return;
		const kind = el.getAttribute("data-post-inline-diff-inline") || "";
		if (kind === "anchor" || kind === "add") {
			el.remove();
			return;
		}
		const text = document.createTextNode(el.textContent || "");
		el.replaceWith(text);
	});

	const diffElements = container.querySelectorAll("[data-post-inline-diff]");
	debugLog('找到 diff 元素', diffElements.length);
	diffElements.forEach((el) => el.remove());
	
	const addTargets = container.querySelectorAll("[data-post-inline-diff-add-target]");
	debugLog('找到 add target 标记', addTargets.length);
	addTargets.forEach((el) => el.removeAttribute("data-post-inline-diff-add-target"));
	
	const addTargetClasses = container.querySelectorAll(".post-inline-diff-add-target");
	addTargetClasses.forEach((el) => el.classList.remove("post-inline-diff-add-target"));
	
	const addTargetImgs = container.querySelectorAll("[data-post-inline-diff-add-target-img]");
	addTargetImgs.forEach((el) => el.removeAttribute("data-post-inline-diff-add-target-img"));
	
	const addTargetImgClasses = container.querySelectorAll(".post-inline-diff-add-target-img");
	addTargetImgClasses.forEach((el) => el.classList.remove("post-inline-diff-add-target-img"));
	
	const delTargets = container.querySelectorAll("[data-post-inline-diff-del-target]");
	delTargets.forEach((el) => el.removeAttribute("data-post-inline-diff-del-target"));
	
	const delTargetClasses = container.querySelectorAll(".post-inline-diff-del-target");
	delTargetClasses.forEach((el) => el.classList.remove("post-inline-diff-del-target"));
	
	const delTargetImgs = container.querySelectorAll("[data-post-inline-diff-del-target-img]");
	delTargetImgs.forEach((el) => el.removeAttribute("data-post-inline-diff-del-target-img"));
	
	const delTargetImgClasses = container.querySelectorAll(".post-inline-diff-del-target-img");
	delTargetImgClasses.forEach((el) => el.classList.remove("post-inline-diff-del-target-img"));
	
	debugSuccess('clearInlineDiff 完成');
}

function buildRows(diffParts: DiffPart[]): DiffRow[] {
	debugLog('buildRows 开始', { diffPartsCount: diffParts.length });
	const rows: DiffRow[] = [];
	for (let i = 0; i < diffParts.length; i++) {
		const part = diffParts[i];
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
	debugLog('buildRows 完成', { rowsCount: rows.length });
	return rows;
}

function sliceWithContext(rows: DiffRow[]) {
	debugLog('sliceWithContext 开始', { rowsCount: rows.length });
	const changeIndexes: number[] = [];
	for (let i = 0; i < rows.length; i += 1) {
		if (rows[i].type !== "ctx") changeIndexes.push(i);
	}
	debugLog('变更行索引', changeIndexes);
	
	if (changeIndexes.length === 0) {
		debugLog('没有变更行，返回空数组');
		return [];
	}

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

	debugLog('sliceWithContext 完成', { outCount: out.length });
	return out;
}

function toHunks(
	rowsWithGaps: Array<DiffRow | { type: "gap"; text: string }>,
): DiffHunk[] {
	debugLog('toHunks 开始', { rowsCount: rowsWithGaps.length });
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
	debugLog('toHunks 完成', { hunksCount: hunks.length });
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

// 移除 Markdown 标记，提取纯文本
function stripMarkdown(line: string): string {
	return String(line ?? "")
		// 移除标题标记
		.replace(/^#{1,6}\s+/gm, '')
		// 移除粗体和斜体
		.replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
		.replace(/\*\*([^*]+)\*\*/g, '$1')
		.replace(/\*([^*]+)\*/g, '$1')
		.replace(/___([^_]+)___/g, '$1')
		.replace(/__([^_]+)__/g, '$1')
		.replace(/_([^_]+)_/g, '$1')
		// 移除行内代码
		.replace(/`([^`]+)`/g, '$1')
		// 移除链接标记，保留文本
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
		// 移除图片标记
		.replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
		// 移除列表标记
		.replace(/^[-*+]\s+/gm, '')
		.replace(/^\d+\.\s+/gm, '')
		// 移除引用标记
		.replace(/^>\s*/gm, '')
		// 移除水平线
		.replace(/^-{3,}$/gm, '')
		.replace(/^\*{3,}$/gm, '')
		// 移除 HTML 标签
		.replace(/<[^>]+>/g, '')
		.trim();
}

function normalizeForMatch(line: string) {
	// 首先尝试提取图片
	const imgSrc = extractImgSrc(line);
	if (imgSrc) return { kind: "img" as const, value: imgSrc };
	
	// 处理 Markdown 内容，提取纯文本
	const markdownText = normalizeLineText(stripMarkdown(line));
	if (markdownText) return { kind: "text" as const, value: markdownText };
	
	// 回退：处理 HTML 内容
	const htmlText = normalizeLineText(stripHtmlLine(line));
	if (htmlText) return { kind: "text" as const, value: htmlText };
	
	// 最后回退：原始内容
	const raw = normalizeLineText(line);
	if (raw) return { kind: "text" as const, value: raw };
	
	return { kind: "none" as const, value: "" };
}

export function findImgBySrc(container: HTMLElement, src: string) {
	debugLog('findImgBySrc 开始', { src: src?.substring(0, 50) });
	const normPath = normalizeUrlForCompare(src);
	if (!normPath) {
		debugLog('normPath 为空，返回 null');
		return null;
	}
	const imgs = Array.from(container.querySelectorAll("img"));
	debugLog('找到图片数量', imgs.length);
	
	for (let i = 0; i < imgs.length; i++) {
		const img = imgs[i];
		if (!(img instanceof HTMLImageElement)) continue;
		const cand = img.getAttribute("src") || img.getAttribute("data-src") || "";
		const candPath = normalizeUrlForCompare(cand);
		if (candPath === normPath) {
			debugLog(`找到匹配图片 #${i + 1}`);
			return img;
		}
		if (candPath && normPath && (candPath.includes(normPath) || normPath.includes(candPath))) {
			debugLog(`找到包含匹配图片 #${i + 1}`);
			return img;
		}
	}
	debugLog('未找到匹配图片');
	return null;
}

export function findBlockByText(container: HTMLElement, line: string) {
	debugLog('findBlockByText 开始', { line: line?.substring(0, 100) });
	const key = normalizeForMatch(line);
	debugLog('normalizeForMatch 结果', key);
	
	if (key.kind !== "text") {
		debugLog('不是文本类型，返回 null');
		return null;
	}
	
	// 简化为 fuwari-main 的实现方式
	const needle = key.value.slice(0, Math.min(48, key.value.length));
	debugLog('搜索关键词', { needle: needle.substring(0, 50) });
	
	const blocks = Array.from(container.querySelectorAll(
		"p, li, blockquote, pre, h1, h2, h3, h4, h5, h6",
	));
	debugLog('找到块级元素数量', blocks.length);
	
	for (let i = 0; i < blocks.length; i++) {
		const el = blocks[i];
		if (!(el instanceof HTMLElement)) continue;
		// 跳过已处理的 diff 元素
		if (el.closest(".post-inline-diff-add-line")) continue;
		if (el.closest(".post-inline-diff-del-line")) continue;
		if (el.classList.contains("post-inline-diff-del-target")) continue;
		
		const content = el.textContent || "";
		const normalizedContent = normalizeLineText(content);
		
		// 简单的 includes 检查（参考 fuwari-main）
		if (normalizedContent.includes(needle)) {
			debugLog(`找到匹配块 #${i + 1}`, { 
				tag: el.tagName, 
				text: content.substring(0, 50)
			});
			return el;
		}
	}
	
	debugLog('未找到匹配块');
	return null;
}

function findContextBefore(
	container: HTMLElement,
	hunk: DiffHunk,
	rowIndex: number,
) {
	debugLog('findContextBefore 开始', { rowIndex });
	for (let i = rowIndex - 1; i >= 0; i -= 1) {
		const row = hunk[i];
		if (row?.type !== "ctx") continue;
		const el = findBlockByText(container, row.text);
		if (el) {
			debugLog('找到上下文元素（前）');
			return el;
		}
	}
	debugLog('未找到上下文元素（前）');
	return null;
}

function findContextAfter(
	container: HTMLElement,
	hunk: DiffHunk,
	rowIndex: number,
) {
	debugLog('findContextAfter 开始', { rowIndex });
	for (let i = rowIndex + 1; i < hunk.length; i += 1) {
		const row = hunk[i];
		if (row?.type !== "ctx") continue;
		const el = findBlockByText(container, row.text);
		if (el) {
			debugLog('找到上下文元素（后）');
			return el;
		}
	}
	debugLog('未找到上下文元素（后）');
	return null;
}

export function lineExistsInArticle(container: HTMLElement, line: string) {
	debugLog('lineExistsInArticle 开始', { line: line?.substring(0, 50) });
	const key = normalizeForMatch(line);
	debugLog('normalizeForMatch 结果', key);
	
	if (key.kind === "img") {
		const exists = !!findImgBySrc(container, key.value);
		debugLog('图片是否存在', exists);
		return exists;
	}
	if (key.kind !== "text") {
		debugLog('不是文本类型，返回 false');
		return false;
	}
	const exists = !!findBlockByText(container, line);
	debugLog('文本行是否存在', exists);
	return exists;
}

export function findAnchorElement(container: HTMLElement, hunk: DiffHunk) {
	debugLog('findAnchorElement 开始', { hunkSize: hunk.length });
	const pick = (row: DiffRow) => String(row?.text ?? "").trim();
	const ctx = hunk.find((r) => r.type === "ctx" && pick(r).length >= 6);
	const anchorLine = ctx?.text ?? "";
	debugLog('锚点行', anchorLine?.substring(0, 50));
	
	if (!anchorLine) {
		debugLog('锚点行为空，返回 null');
		return null;
	}

	const key = normalizeForMatch(anchorLine);
	debugLog('normalizeForMatch 结果', key);
	
	if (key.kind === "img") {
		const img = findImgBySrc(container, key.value);
		if (img) debugLog('找到图片锚点');
		return img;
	}
	const el = findBlockByText(container, anchorLine);
	if (el) debugLog('找到文本锚点');
	return el;
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
	debugLog('createDeletionNode', { text: text?.substring(0, 50), includeAnchor });
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
	debugLog('createAdditionNode', { text: text?.substring(0, 50), includeAnchor });
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
	debugLog('========== applyInlineDiff 开始 ==========');
	debugLog('输入参数', { 
		containerTag: container.tagName, 
		containerClass: container.className,
		diffPartsCount: diffParts.length 
	});
	
	const log = isLogEnabled();
	debugLog('日志是否启用', log);
	
	debugLog('Step 1: 清除旧的 diff');
	clearInlineDiff(container);
	
	debugLog('Step 2: 构建行');
	const rows = buildRows(diffParts);
	
	debugLog('Step 3: 切分上下文');
	const focused = sliceWithContext(rows);
	
	debugLog('Step 4: 构建 hunks');
	const hunks = toHunks(focused);
	debugLog('hunks 数量', hunks.length);

	const anchorState = { inserted: false };
	
	for (let hunkIndex = 0; hunkIndex < hunks.length; hunkIndex++) {
		const hunk = hunks[hunkIndex];
		debugLog(`处理 hunk #${hunkIndex + 1}/${hunks.length}`, { hunkSize: hunk.length });
		
		let idx = 0;
		while (idx < hunk.length) {
			const row = hunk[idx];
			debugLog(`处理行 #${idx + 1}/${hunk.length}`, { type: row.type, text: row.text?.substring(0, 50) });
			
			if (idx + 1 < hunk.length) {
				const next = hunk[idx + 1];
				const isReplace =
					(row.type === "del" && next.type === "add") ||
					(row.type === "add" && next.type === "del");
				
				if (isReplace) {
					debugLog('检测到替换操作');
					const oldHtml = row.type === "del" ? row.text : next.text;
					const newHtml = row.type === "add" ? row.text : next.text;
					const oldKey = normalizeForMatch(oldHtml);
					const newKey = normalizeForMatch(newHtml);
					let target: HTMLElement | null = null;
					let isImgReplace = false;

					if (newKey.kind === "img") {
						debugLog('查找图片目标');
						target = findImgBySrc(container, newKey.value);
						isImgReplace = true;
					} else {
						debugLog('查找文本目标');
						target = findBlockByText(container, newHtml);
					}

					if (target instanceof HTMLElement) {
						debugLog('找到目标元素，应用替换样式');
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
					} else {
						debugLog('未找到目标元素');
					}
				}
			}

			if (row.type === "add") {
			debugLog('处理添加操作');
			let endIdx = idx;
			while (endIdx + 1 < hunk.length && hunk[endIdx + 1].type === "add") {
				endIdx++;
			}
			debugLog('连续添加行数', endIdx - idx + 1);
			
			for (let i = idx; i <= endIdx; i++) {
				const addRow = hunk[i];
				const key = normalizeForMatch(addRow.text);
				
				if (key.kind === "img") {
					debugLog('查找图片添加目标');
					const img = findImgBySrc(container, key.value);
					if (img instanceof HTMLElement) {
						debugLog('找到图片，应用样式');
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
				// 对于新增内容，首先尝试在文章中查找对应的元素
				debugLog('查找新增内容对应的元素');
				const target = findBlockByText(container, addRow.text);
				
				if (target instanceof HTMLElement) {
					// 如果找到了，给该元素添加新增样式
					debugLog('找到对应元素，应用新增样式');
					target.classList.add("post-inline-diff-add-target");
					target.setAttribute("data-post-inline-diff-add-target", "1");
					if (!anchorState.inserted) {
						const anchor = document.createElement("span");
						anchor.id = "post-diff";
						anchor.setAttribute("data-post-inline-diff", "1");
						target.parentNode?.insertBefore(anchor, target);
						anchorState.inserted = true;
					}
				} else {
					// 如果没找到，可能是全新的内容，尝试在合适位置插入
					debugLog('未找到对应元素，尝试插入新节点');
					
					// 查找上下文元素作为插入位置参考
					const before = findContextBefore(container, hunk, i);
					const after = findContextAfter(container, hunk, i);
					
					// 创建新增内容节点
					const addNode = createAdditionNode(addRow.text, !anchorState.inserted);
					if (!anchorState.inserted) anchorState.inserted = true;
					
					if (after) {
						// 在上下文元素之后插入
						debugLog('在上下文元素后插入新增节点');
						after.parentNode?.insertBefore(addNode, after.nextSibling);
					} else if (before) {
						// 在上下文元素之前插入
						debugLog('在上下文元素前插入新增节点');
						before.parentNode?.insertBefore(addNode, before.nextSibling);
					} else {
						// 如果没有上下文，插入到容器末尾
						debugLog('没有上下文，插入到容器末尾');
						container.appendChild(addNode);
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

			debugLog('处理删除操作');
			const key = normalizeForMatch(row.text);
			if (key.kind === "none") {
				debugLog('空内容，跳过');
				idx += 1;
				continue;
			}

			if (lineExistsInArticle(container, row.text)) {
				debugLog('行存在于文章中，应用删除样式');
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

			debugLog('行不存在于文章中，创建删除节点');
			const before = findContextBefore(container, hunk, idx);
			const after = findContextAfter(container, hunk, idx);
			const node = createDeletionNode(row.text, !anchorState.inserted);
			if (!anchorState.inserted) anchorState.inserted = true;

			if (after) {
				debugLog('在上下文后插入');
				insertAfter(node, after);
			} else if (before) {
				debugLog('在上下文前插入');
				before.parentNode?.insertBefore(node, before.nextSibling);
			} else {
				debugLog('追加到容器');
				container.appendChild(node);
			}
			idx += 1;
		}
	}

	debugSuccess('========== applyInlineDiff 完成 ==========');
	if (log) {
		console.log("[PostInlineDiff] Applied diff hunks:", hunks.length);
	}
}
