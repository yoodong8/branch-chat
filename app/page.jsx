"use client";

import { useState, useEffect, useRef, useMemo, forwardRef } from "react";
import {
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  PanelLeft,
  Search,
  Code2,
  MessageSquare,
  FolderOpen,
  Sparkles,
  Mic,
  ArrowUpRight,
  Loader2,
  Check,
  X,
  ListChecks,
} from "lucide-react";

// ============================================================
//   ID generator
// ============================================================
let _idCounter = 0;
const nid = (p = "m") =>
  `${p}-${Date.now().toString(36)}-${++_idCounter}`;

// ============================================================
//   LLM API
// ============================================================
const SYSTEM_PROMPT = `당신은 친근한 한국어 AI 어시스턴트입니다.
사용자의 아이디에이션과 브레인스토밍을 도와주세요.
답변은 자연스럽고 풍부하게, 단답이 아닌 2-4문장 정도로.
가끔 구체적인 예시나 후보, 키워드를 함께 제시해주세요.
포맷팅은 가볍게 사용하고, 너무 길어지지 않게 하세요.`;

async function callLLM(messages, opts = {}) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.text || "";
}

async function generateBranchLabel(userText) {
  try {
    const res = await fetch("/api/branch-label", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });
    if (!res.ok) return "새 갈래";
    const data = await res.json();
    return (data.label || "새 갈래").slice(0, 14);
  } catch {
    return "새 갈래";
  }
}

// ============================================================
//   Initial demo data
// ============================================================
const SAMPLE_RECENTS = [
  "채팅 LLM의 인지적 마찰 정의 및 인터랙션 설",
  "캔들 오브제 브랜딩",
  "교사의 회의감과 선한 영향력",
  "인터뷰 스크립트 편집 및 음성인식 오류 수정",
  "첫 번째 예시처럼 다른 사진 분석하기",
  "상업영화와 예술영화의 구분 기준",
  "README 파일의 기본 개념",
  "배려와 위선의 경계",
  "드니 빌뇌브 영화의 팔레스타인 역사 배경",
  "Figma 디자인을 HTML로 변환하기",
  "스킬 등록",
  "이미지 분석 및 감상 요청",
  "둥근 바디의 레드 컬러 제품 설명",
  "문제 진단 요청",
  "Blender에서 강아지 모델링",
];

function buildInitialConversations() {
  // pre-built so we can see the tree immediately
  const u1 = nid(),
    a1 = nid(),
    u2 = nid(),
    a2 = nid();
  const u3 = nid(),
    a3 = nid(); // branch A (default current)
  const u3b = nid(),
    a3b = nid(); // branch B
  const u4 = nid(),
    a4 = nid(); // continued on branch A

  const messages = {
    [u1]: {
      id: u1,
      parentId: null,
      role: "user",
      content: "캔들 오브제 브랜딩에 대해 같이 고민해줘",
    },
    [a1]: {
      id: a1,
      parentId: u1,
      role: "assistant",
      content:
        '좋아요. 캔들 오브제는 결국 "어떤 순간을 위한 물건인가"가 핵심이에요.\n\n몇 가지 큰 방향 — 일상의 작은 의식, 공간의 무드 메이커, 아니면 자기 자신/누군가에게 주는 작은 선물. 어떤 결로 가져가고 싶으신가요?',
    },
    [u2]: {
      id: u2,
      parentId: a1,
      role: "user",
      content: "요즘 사람들이 생일을 점점 부담스럽게 느끼는 이유가 뭘까?",
    },
    [a2]: {
      id: a2,
      parentId: u2,
      role: "assistant",
      content:
        "좋은 질문이에요. 몇 가지 이유가 맞물려 있는 것 같아요.\nSNS의 압박이 가장 크게 작용해요. 기대치와 현실의 간극, 나이 듦에 대한 의식,\n관계 정리의 피로감... 여러 이유가 맞물려 있어요.",
    },

    // ── Branch A (default) ──
    [u3]: {
      id: u3,
      parentId: a2,
      role: "user",
      content: "생일을 챙기지 않는다면 케이크도 필요 없을까?",
      branchLabel: "나를 위한 의식",
    },
    [a3]: {
      id: a3,
      parentId: u3,
      role: "assistant",
      content:
        "꼭 그렇지만은 않아요 😊\n\n케이크는 생일과 분리해서 생각해도 충분히 존재 이유가 있어요.\n혼자 조용히 켜두는 캔들처럼, 자기 자신을 위한 작은 의식이 될 수 있죠.",
    },
    [u4]: {
      id: u4,
      parentId: a3,
      role: "user",
      content: "자기 자신에게 주는 선물 컨셉으로 발전시켜보자",
    },
    [a4]: {
      id: a4,
      parentId: u4,
      role: "assistant",
      content:
        "'나를 위한 조용한 기념'이라는 방향으로 잡아볼게요.\n포장은 간결하게 — 크라프트지 질감에 작은 메모 카드 하나.\n'올해도 잘 버텼어'처럼 짧은 문장이 캔들 오브제와 어울릴 것 같아요.\n네이밍 후보도 같이 뽑아볼게요. Quietly, Solo Flame, Just Me Tonight...",
    },

    // ── Branch B ──
    [u3b]: {
      id: u3b,
      parentId: a2,
      role: "user",
      content: "관계 정리의 피로감 부분을 더 자세히 풀어줘",
      branchLabel: "관계 피로감",
    },
    [a3b]: {
      id: a3b,
      parentId: u3b,
      role: "assistant",
      content:
        '관계 정리의 피로감은 생일이 일종의 "리트머스 시험지"가 되기 때문이에요.\n\n누가 챙겨주는지, 누가 잊었는지가 시각화되고, 그 결과를 마주하는 게 부담이 되거든요. 내가 챙겨야 할 사람의 리스트와, 챙겨받는 사람의 리스트가 어긋날 때의 미묘한 상처도 있고요.',
    },
  };

  return [
    {
      id: nid("conv"),
      title: "캔들 오브제 브랜딩",
      messages,
      rootId: u1,
      activeLeafId: a4, // current = branch A leaf
    },
  ];
}

// ============================================================
//   Main App
// ============================================================
export default function App() {
  const [conversations, setConversations] = useState(() =>
    buildInitialConversations()
  );
  const [activeConvId, setActiveConvId] = useState(
    () => conversations[0].id
  );
  const [pendingBranchFromId, setPendingBranchFromId] = useState(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareNodes, setCompareNodes] = useState([]);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState(null);

  const messageRefs = useRef({});
  const chatScrollRef = useRef(null);
  const inputRef = useRef(null);
  const lastProgScrollAt = useRef(0);

  const activeConv =
    conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Path from root → leaf
  const currentPath = useMemo(() => {
    if (!activeConv.activeLeafId) return [];
    const path = [];
    let id = activeConv.activeLeafId;
    while (id && activeConv.messages[id]) {
      path.unshift(id);
      id = activeConv.messages[id].parentId;
    }
    return path;
  }, [activeConv.activeLeafId, activeConv.messages]);

  const currentPathSet = useMemo(
    () => new Set(currentPath),
    [currentPath]
  );

  function getChildren(parentId) {
    return Object.values(activeConv.messages)
      .filter((m) => m.parentId === parentId)
      .sort((a, b) => (a.id < b.id ? -1 : 1));
  }

  function updateActiveConv(updater) {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConvId ? { ...c, ...updater(c) } : c
      )
    );
  }

  // ── Auto-highlight current node based on viewport ──
  useEffect(() => {
    const root = chatScrollRef.current;
    if (!root) return;

    function onScroll() {
      // Don't override during programmatic scroll
      if (Date.now() - lastProgScrollAt.current < 700) return;

      const rect = root.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      let best = null;
      let bestDist = Infinity;
      currentPath.forEach((id) => {
        const el = messageRefs.current[id];
        if (!el) return;
        const r = el.getBoundingClientRect();
        const elCenter = r.top + r.height / 2;
        const d = Math.abs(elCenter - center);
        if (d < bestDist) {
          bestDist = d;
          best = id;
        }
      });
      if (best && best !== highlightedNodeId) setHighlightedNodeId(best);
    }

    onScroll();
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, [currentPath, highlightedNodeId]);

  // ── On path change, highlight last node ──
  useEffect(() => {
    if (currentPath.length > 0) {
      const last = currentPath[currentPath.length - 1];
      setHighlightedNodeId(last);
      // scroll to bottom on first render / new message
      setTimeout(() => {
        const el = messageRefs.current[last];
        if (el && chatScrollRef.current) {
          lastProgScrollAt.current = Date.now();
          el.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 30);
    }
    // eslint-disable-next-line
  }, [activeConv.activeLeafId]);

  // ── Send message ──
  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    const isBranching = !!pendingBranchFromId;
    const parentId = isBranching
      ? pendingBranchFromId
      : activeConv.activeLeafId;

    setPendingBranchFromId(null);

    const userMsgId = nid();
    const userMsg = {
      id: userMsgId,
      parentId,
      role: "user",
      content: text,
      ...(isBranching ? { branchLabel: "..." } : {}),
    };

    updateActiveConv((c) => ({
      messages: { ...c.messages, [userMsgId]: userMsg },
      activeLeafId: userMsgId,
      rootId: c.rootId || userMsgId,
    }));

    setIsLoading(true);

    try {
      // Build context from root → parent → new user msg
      const ctx = [];
      let cursor = parentId;
      const ancestors = [];
      while (cursor) {
        ancestors.unshift(cursor);
        cursor = activeConv.messages[cursor]?.parentId;
      }
      ancestors.forEach((aid) => {
        const m = activeConv.messages[aid];
        if (m) ctx.push(m);
      });
      ctx.push(userMsg);

      const replyText = await callLLM(ctx);

      const aiMsgId = nid();
      const aiMsg = {
        id: aiMsgId,
        parentId: userMsgId,
        role: "assistant",
        content: replyText,
      };

      updateActiveConv((c) => ({
        messages: { ...c.messages, [aiMsgId]: aiMsg },
        activeLeafId: aiMsgId,
      }));

      // Async branch label generation
      if (isBranching) {
        const label = await generateBranchLabel(text);
        updateActiveConv((c) => ({
          messages: {
            ...c.messages,
            [userMsgId]: { ...c.messages[userMsgId], branchLabel: label },
          },
        }));
      }
    } catch (e) {
      const errId = nid();
      updateActiveConv((c) => ({
        messages: {
          ...c.messages,
          [errId]: {
            id: errId,
            parentId: userMsgId,
            role: "assistant",
            content:
              "⚠ 응답을 가져오지 못했어요: " +
              (e.message || "알 수 없는 오류"),
          },
        },
        activeLeafId: errId,
      }));
    } finally {
      setIsLoading(false);
    }
  }

  function startBranch(messageId) {
    setPendingBranchFromId(messageId);
    setCompareMode(false);
    setCompareNodes([]);
    setTimeout(() => inputRef.current?.focus(), 30);
  }

  function cancelBranch() {
    setPendingBranchFromId(null);
  }

  // ── Sibling navigation ──
  // For an AI message, look at its parent (user msg). If that user msg has siblings,
  // we can switch between branches.
  function getSiblingInfo(messageId) {
    const m = activeConv.messages[messageId];
    if (!m || m.role !== "assistant") return null;
    const parent = activeConv.messages[m.parentId];
    if (!parent || !parent.parentId) return null;

    const branchPointId = parent.parentId;
    const branches = getChildren(branchPointId);
    if (branches.length <= 1) return null;

    const idx = branches.findIndex((s) => s.id === parent.id);
    return { idx, total: branches.length, branchPointId };
  }

  function switchBranchAt(branchPointId, direction) {
    const branches = getChildren(branchPointId);
    if (branches.length <= 1) return;

    const currentChildInPath = currentPath.find(
      (id) => activeConv.messages[id]?.parentId === branchPointId
    );
    let idx = branches.findIndex((c) => c.id === currentChildInPath);
    if (idx === -1) idx = 0;
    let newIdx = idx + direction;
    if (newIdx < 0) newIdx = branches.length - 1;
    if (newIdx >= branches.length) newIdx = 0;

    // Follow first child to leaf
    let leaf = branches[newIdx].id;
    while (true) {
      const ch = getChildren(leaf);
      if (ch.length === 0) break;
      leaf = ch[0].id;
    }
    updateActiveConv(() => ({ activeLeafId: leaf }));
  }

  // ── Tree layout ──
  const treeLayout = useMemo(() => {
    const positions = {};
    let nextCol = 0;

    function visit(id, col, depth) {
      positions[id] = { col, depth };
      const children = Object.values(activeConv.messages)
        .filter((m) => m.parentId === id)
        .sort((a, b) => (a.id < b.id ? -1 : 1));
      if (children.length === 0) return;
      // First child stays in same column (mainline);
      // additional children fan out to new columns.
      visit(children[0].id, col, depth + 1);
      for (let i = 1; i < children.length; i++) {
        nextCol++;
        visit(children[i].id, nextCol, depth + 1);
      }
    }

    if (activeConv.rootId && activeConv.messages[activeConv.rootId]) {
      visit(activeConv.rootId, 0, 0);
    }
    return positions;
  }, [activeConv.messages, activeConv.rootId]);

  // ── Click tree node ──
  function handleTreeNodeClick(nodeId) {
    if (compareMode) {
      setCompareNodes((prev) => {
        if (prev.includes(nodeId))
          return prev.filter((id) => id !== nodeId);
        if (prev.length >= 2) return [prev[1], nodeId];
        return [...prev, nodeId];
      });
      return;
    }

    // Switch active path so it goes through nodeId
    let leaf = nodeId;
    while (true) {
      const ch = getChildren(leaf);
      if (ch.length === 0) break;
      // Prefer current path child if available, else first
      let next = ch[0];
      for (const c of ch) {
        if (currentPathSet.has(c.id)) {
          next = c;
          break;
        }
      }
      leaf = next.id;
    }
    updateActiveConv(() => ({ activeLeafId: leaf }));
    setHighlightedNodeId(nodeId);
    setTimeout(() => {
      const el = messageRefs.current[nodeId];
      if (el) {
        lastProgScrollAt.current = Date.now();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
  }

  function toggleCompare() {
    if (compareMode) {
      setCompareMode(false);
      setCompareNodes([]);
    } else {
      setCompareMode(true);
      setCompareNodes([]);
      setPendingBranchFromId(null);
    }
  }

  function getPathTo(nodeId) {
    const path = [];
    let id = nodeId;
    while (id) {
      path.unshift(id);
      id = activeConv.messages[id]?.parentId;
    }
    return path;
  }

  function startNewChat() {
    const id = nid("conv");
    setConversations((prev) => [
      {
        id,
        title: "새 대화",
        messages: {},
        rootId: null,
        activeLeafId: null,
      },
      ...prev,
    ]);
    setActiveConvId(id);
    setPendingBranchFromId(null);
    setCompareMode(false);
    setCompareNodes([]);
  }

  // ── Render ──
  return (
    <div className="h-screen w-full flex bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      <SidebarPanel
        conversations={conversations}
        activeConvId={activeConvId}
        onSelect={setActiveConvId}
        onNewChat={startNewChat}
      />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top bar */}
        <div className="h-14 flex items-center px-6 border-b border-zinc-800/30 shrink-0">
          <button className="flex items-center gap-1.5 text-base text-zinc-200 hover:text-zinc-100 px-2 py-1 rounded-md hover:bg-zinc-800/40">
            <span>{activeConv.title}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          </button>
        </div>

        {/* Content area */}
        {compareMode && compareNodes.length === 2 ? (
          <CompareView
            nodes={compareNodes}
            messages={activeConv.messages}
            getPathTo={getPathTo}
          />
        ) : (
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto px-6 lg:px-12 py-8"
          >
            <div className="max-w-3xl mx-auto space-y-7">
              {currentPath.length === 0 && (
                <div className="text-center text-zinc-500 py-20">
                  <p className="text-lg mb-2">새 대화를 시작해 보세요</p>
                  <p className="text-sm">
                    AI 메시지의 분기 아이콘을 누르면 새 갈래로 이어집니다.
                  </p>
                </div>
              )}
              {currentPath.map((id, idx) => {
                const m = activeConv.messages[id];
                if (!m) return null;
                const branchPointIdx = pendingBranchFromId
                  ? currentPath.indexOf(pendingBranchFromId)
                  : -1;
                const dimmed =
                  branchPointIdx >= 0 && idx > branchPointIdx;
                const siblingInfo = getSiblingInfo(id);
                const isHighlighted = id === highlightedNodeId;
                return (
                  <MessageBlock
                    key={id}
                    message={m}
                    dimmed={dimmed}
                    siblingInfo={siblingInfo}
                    isHighlighted={isHighlighted}
                    refCallback={(el) => (messageRefs.current[id] = el)}
                    onBranch={() => startBranch(id)}
                    onSwitchBranch={(dir) =>
                      siblingInfo &&
                      switchBranchAt(siblingInfo.branchPointId, dir)
                    }
                    isPendingBranchSource={pendingBranchFromId === id}
                  />
                );
              })}
              {isLoading && <LoadingIndicator />}
              <div className="h-32" />
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="px-6 lg:px-12 pb-6 pt-2 shrink-0">
          <div className="max-w-3xl mx-auto">
            {pendingBranchFromId && (
              <div className="flex items-center gap-2 mb-2 text-xs px-3 py-2 bg-amber-500/10 text-amber-200 rounded-lg border border-amber-500/30">
                <GitBranch className="w-3.5 h-3.5" />
                <span>
                  이 메시지에서 새 갈래로 이어집니다. 메시지를 입력해
                  분기를 시작하세요.
                </span>
                <button
                  onClick={cancelBranch}
                  className="ml-auto hover:text-amber-100 px-1.5 py-0.5 rounded hover:bg-amber-500/15"
                >
                  취소
                </button>
              </div>
            )}
            <Composer
              ref={inputRef}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <TreePanel
        messages={activeConv.messages}
        layout={treeLayout}
        currentPathSet={currentPathSet}
        currentPath={currentPath}
        highlightedNodeId={highlightedNodeId}
        compareMode={compareMode}
        compareNodes={compareNodes}
        hoveredNodeId={hoveredNodeId}
        onHoverNode={setHoveredNodeId}
        onClickNode={handleTreeNodeClick}
        onToggleCompare={toggleCompare}
        pendingBranchFromId={pendingBranchFromId}
      />
    </div>
  );
}

// ============================================================
//   Sidebar
// ============================================================
function SidebarPanel({ conversations, activeConvId, onSelect, onNewChat }) {
  const recentTitles = useMemo(() => {
    const dynamicTitles = conversations.map((c) => c.title);
    const merged = [...dynamicTitles];
    SAMPLE_RECENTS.forEach((t) => {
      if (!merged.includes(t)) merged.push(t);
    });
    return merged;
  }, [conversations]);

  return (
    <div
      className="shrink-0 bg-zinc-950 border-r border-zinc-800/40 flex flex-col"
      style={{ width: "260px" }}
    >
      {/* Window controls */}
      <div className="px-4 pt-4 pb-1 flex items-center gap-1.5">
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ff5f57" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#febc2e" }} />
        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28c840" }} />
        <div className="flex-1" />
        <button className="w-6 h-6 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <PanelLeft className="w-3.5 h-3.5" />
        </button>
        <button className="w-6 h-6 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab pill (Chat / list / code) */}
      <div className="px-3 mt-3 flex items-center gap-1">
        <button className="flex-1 h-9 rounded-lg bg-zinc-800/70 flex items-center justify-center gap-1.5 text-sm text-zinc-100 font-medium">
          <MessageSquare className="w-4 h-4" />
          Chat
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <ListChecks className="w-4 h-4" />
        </button>
        <button className="w-9 h-9 rounded-lg hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <Code2 className="w-4 h-4" />
        </button>
      </div>

      {/* Main items */}
      <div className="px-3 mt-4 space-y-0.5 text-sm">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800/50"
        >
          <Plus className="w-4 h-4 text-zinc-400" />
          <span>New chat</span>
        </button>
        <SidebarItem icon={<FolderOpen className="w-4 h-4" />} label="Projects" />
        <SidebarItem icon={<Sparkles className="w-4 h-4" />} label="Artifacts" />
        <SidebarItem icon={<RotateCcw className="w-4 h-4" />} label="Customize" />
      </div>

      {/* Recents */}
      <div className="px-4 mt-5 mb-1.5 text-xs uppercase text-zinc-500 tracking-wider font-medium">
        Recents
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 text-xs">
        {recentTitles.map((title, i) => {
          const conv = conversations.find((c) => c.title === title);
          const isActive = conv && conv.id === activeConvId;
          return (
            <button
              key={`${title}-${i}`}
              onClick={() => conv && onSelect(conv.id)}
              className={`w-full text-left px-2.5 py-1.5 rounded-lg truncate transition ${
                isActive
                  ? "bg-zinc-800/70 text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30"
              } ${!conv ? "text-zinc-500/70" : ""}`}
            >
              {title}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-zinc-800/40 flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-orange-700/90 flex items-center justify-center text-xs font-medium">
          동
        </div>
        <div className="text-xs text-zinc-300 flex-1 truncate">
          동현 <span className="text-zinc-500">· Pro</span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
      </div>
    </div>
  );
}

function SidebarItem({ icon, label }) {
  return (
    <button className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-zinc-200 hover:bg-zinc-800/50">
      <span className="text-zinc-400">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ============================================================
//   Message block
// ============================================================
function MessageBlock({
  message,
  dimmed,
  siblingInfo,
  isHighlighted,
  refCallback,
  onBranch,
  onSwitchBranch,
  isPendingBranchSource,
}) {
  if (message.role === "user") {
    return (
      <div
        ref={refCallback}
        data-msg-id={message.id}
        className={`flex justify-end transition-opacity duration-300 ${
          dimmed ? "opacity-25" : ""
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl bg-zinc-800/80 text-zinc-100 whitespace-pre-wrap break-words text-base leading-relaxed transition ${
            isHighlighted ? "ring-1 ring-zinc-600" : ""
          }`}
          style={{ maxWidth: "80%" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={refCallback}
      data-msg-id={message.id}
      className={`group transition-opacity duration-300 ${
        dimmed ? "opacity-25" : ""
      }`}
    >
      <div className="text-zinc-200 whitespace-pre-wrap break-words text-base leading-relaxed">
        {message.content}
      </div>

      <div className="flex items-center gap-0.5 mt-3">
        <ActionButton title="복사">
          <Copy className="w-3.5 h-3.5" />
        </ActionButton>
        <ActionButton title="좋아요">
          <ThumbsUp className="w-3.5 h-3.5" />
        </ActionButton>
        <ActionButton title="별로예요">
          <ThumbsDown className="w-3.5 h-3.5" />
        </ActionButton>
        <ActionButton title="다시 생성">
          <RotateCcw className="w-3.5 h-3.5" />
        </ActionButton>
        <ActionButton
          title="가지치기 — 이 메시지에서 새 갈래"
          onClick={onBranch}
          highlighted={isPendingBranchSource}
        >
          <GitBranch className="w-3.5 h-3.5" />
        </ActionButton>

        {siblingInfo && siblingInfo.total > 1 && (
          <div className="flex items-center gap-1.5 ml-2 text-xs text-zinc-500">
            <button
              onClick={() => onSwitchBranch(-1)}
              className="hover:text-zinc-200 p-1 rounded"
              title="이전 갈래"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>
              {siblingInfo.idx + 1}/{siblingInfo.total}
            </span>
            <button
              onClick={() => onSwitchBranch(1)}
              className="hover:text-zinc-200 p-1 rounded"
              title="다음 갈래"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ children, title, onClick, highlighted }) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-7 h-7 rounded-md flex items-center justify-center transition ${
        highlighted
          ? "bg-amber-500/20 text-amber-300"
          : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}

function LoadingIndicator() {
  return (
    <div className="flex items-center gap-2 text-zinc-500 text-sm py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>생각하는 중...</span>
    </div>
  );
}

// ============================================================
//   Composer
// ============================================================
const Composer = forwardRef(function Composer(
  { value, onChange, onSend, disabled },
  ref
) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl px-4 pt-3 pb-2.5 backdrop-blur shadow-sm focus-within:border-zinc-600/70">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        placeholder="메시지를 입력하세요..."
        rows={1}
        disabled={disabled}
        className="w-full bg-transparent resize-none outline-none text-zinc-100 placeholder-zinc-500 text-base leading-relaxed disabled:opacity-50 max-h-40"
        style={{ minHeight: "24px" }}
      />
      <div className="flex items-center justify-between mt-1.5">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200">
          <Plus className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1 text-xs text-zinc-400 px-2 py-1 rounded-md hover:bg-zinc-800/40 hover:text-zinc-200">
            <span>Sonnet 4.6</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <button
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 disabled:opacity-30 disabled:hover:bg-transparent"
            title="보내기 (Enter)"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================
//   Tree Panel
// ============================================================
function TreePanel({
  messages,
  layout,
  currentPathSet,
  currentPath,
  highlightedNodeId,
  compareMode,
  compareNodes,
  hoveredNodeId,
  onHoverNode,
  onClickNode,
  onToggleCompare,
  pendingBranchFromId,
}) {
  const allNodes = Object.values(messages);
  if (allNodes.length === 0) {
    return (
      <div
        className="shrink-0 bg-zinc-950 border-l border-zinc-800/40 flex flex-col"
        style={{ width: "280px" }}
      >
        <TreeHeader
          compareMode={compareMode}
          onToggleCompare={onToggleCompare}
          compareCount={compareNodes.length}
        />
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-600 px-6 text-center">
          대화를 시작하면 여기에 갈래가 그려져요.
        </div>
      </div>
    );
  }

  const cols = Math.max(0, ...Object.values(layout).map((p) => p.col)) + 1;
  const rows =
    Math.max(0, ...Object.values(layout).map((p) => p.depth)) + 1;

  const COL_W = 36;
  const ROW_H = 36;
  const PAD_X = 28;
  const PAD_Y = 26;

  const width = Math.max(180, PAD_X * 2 + (cols - 1) * COL_W);
  const height = Math.max(120, PAD_Y * 2 + (rows - 1) * ROW_H);

  function pos(id) {
    const p = layout[id];
    if (!p) return null;
    return {
      x: PAD_X + p.col * COL_W,
      y: PAD_Y + p.depth * ROW_H,
    };
  }

  // Pending branch — dim path nodes after branch point
  const pendingIdx = pendingBranchFromId
    ? currentPath.indexOf(pendingBranchFromId)
    : -1;
  const pendingDimSet = new Set();
  if (pendingIdx >= 0) {
    for (let i = pendingIdx + 1; i < currentPath.length; i++) {
      pendingDimSet.add(currentPath[i]);
    }
  }

  return (
    <div
      className="shrink-0 bg-zinc-950 border-l border-zinc-800/40 flex flex-col"
      style={{ width: "280px" }}
    >
      <TreeHeader
        compareMode={compareMode}
        onToggleCompare={onToggleCompare}
        compareCount={compareNodes.length}
      />

      <div className="flex-1 overflow-auto p-3 relative">
        <svg
          width={width}
          height={height}
          className="block"
          style={{ overflow: "visible" }}
        >
          {/* Edges */}
          {allNodes.map((m) => {
            if (!m.parentId) return null;
            const p = pos(m.parentId);
            const c = pos(m.id);
            if (!p || !c) return null;
            const inActivePath =
              currentPathSet.has(m.id) && currentPathSet.has(m.parentId);
            const dimmed =
              pendingDimSet.has(m.id) || pendingDimSet.has(m.parentId);
            const stroke = dimmed
              ? "#27272a"
              : inActivePath
              ? "#a1a1aa"
              : "#3f3f46";

            // Path: vertical if same col, S-curve otherwise
            const d =
              p.x === c.x
                ? `M ${p.x} ${p.y + 6} L ${c.x} ${c.y - 6}`
                : `M ${p.x} ${p.y + 6} C ${p.x} ${
                    (p.y + c.y) / 2
                  } ${c.x} ${(p.y + c.y) / 2} ${c.x} ${c.y - 6}`;
            return (
              <path
                key={`e-${m.id}`}
                d={d}
                stroke={stroke}
                strokeWidth="1.4"
                fill="none"
                className="transition-all duration-300"
              />
            );
          })}

          {/* Nodes */}
          {allNodes.map((m) => {
            const p = pos(m.id);
            if (!p) return null;
            const inPath = currentPathSet.has(m.id);
            const isHighlight = m.id === highlightedNodeId;
            const isHover = m.id === hoveredNodeId;
            const isCompareSel = compareNodes.includes(m.id);
            const dimmed = pendingDimSet.has(m.id);
            const isBranchSrc = pendingBranchFromId === m.id;

            let fill;
            if (isCompareSel) fill = "#fbbf24";
            else if (isBranchSrc) fill = "#fbbf24";
            else if (isHighlight) fill = "#fafafa";
            else if (inPath) fill = "#d4d4d8";
            else fill = "#52525b";

            if (dimmed) fill = "#3f3f46";

            const r =
              isHighlight || isHover || isCompareSel || isBranchSrc
                ? 6.5
                : 4;

            return (
              <g key={`n-${m.id}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={12}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => onHoverNode(m.id)}
                  onMouseLeave={() => onHoverNode(null)}
                  onClick={() => onClickNode(m.id)}
                />
                {(isHighlight || isCompareSel || isBranchSrc) && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={r + 4}
                    fill="none"
                    stroke={isCompareSel || isBranchSrc ? "#fbbf24" : "#fafafa"}
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={r}
                  fill={fill}
                  className="pointer-events-none transition-all duration-200"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {hoveredNodeId &&
          (() => {
            const m = messages[hoveredNodeId];
            const p = pos(hoveredNodeId);
            if (!m || !p) return null;
            const label =
              m.branchLabel ||
              (m.role === "user"
                ? m.content.slice(0, 16) + (m.content.length > 16 ? "…" : "")
                : "AI 응답");
            // place the tooltip relative to the scrolling container — using
            // the container's padding (12) + svg position
            return (
              <div
                className="absolute pointer-events-none px-2 py-1 bg-zinc-800 text-zinc-100 text-xs rounded-md shadow-lg whitespace-nowrap border border-zinc-700/50 z-10"
                style={{
                  left: `${12 + p.x + 14}px`,
                  top: `${12 + p.y - 10}px`,
                }}
              >
                {label}
              </div>
            );
          })()}
      </div>
    </div>
  );
}

function TreeHeader({ compareMode, onToggleCompare, compareCount }) {
  return (
    <>
      <div className="h-14 flex items-center px-4 border-b border-zinc-800/30 gap-2 shrink-0">
        <div className="flex-1" />
        <button className="w-7 h-7 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-500">
          <ArrowUpRight className="w-4 h-4" />
        </button>
        <button className="w-7 h-7 rounded-md hover:bg-zinc-800/40 flex items-center justify-center text-zinc-400">
          <GitBranch className="w-4 h-4" />
        </button>
      </div>
      <div className="px-3 pt-3 pb-2 shrink-0">
        <button
          onClick={onToggleCompare}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition ${
            compareMode
              ? "bg-zinc-800/80 border-zinc-700 text-zinc-100"
              : "bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          <span>분할 비교</span>
          <Toggle on={compareMode} />
        </button>
        {compareMode && (
          <div className="text-xs text-zinc-500 mt-2 px-1 leading-relaxed">
            트리에서 비교할 두 점을 선택하세요 ({compareCount}/2)
          </div>
        )}
      </div>
    </>
  );
}

function Toggle({ on }) {
  return (
    <div
      className={`w-9 h-5 rounded-full transition relative ${
        on ? "bg-amber-500" : "bg-zinc-700"
      }`}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow"
        style={{ left: on ? "18px" : "2px" }}
      />
    </div>
  );
}

// ============================================================
//   Compare View
// ============================================================
function CompareView({ nodes, messages, getPathTo }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
      <div className="grid grid-cols-2 gap-4 mx-auto" style={{ maxWidth: "1100px" }}>
        {nodes.map((nodeId, i) => {
          const path = getPathTo(nodeId);
          const node = messages[nodeId];
          // try to find the branch label by walking up to a node with a branchLabel
          let lbl = null;
          let cur = nodeId;
          while (cur) {
            const m = messages[cur];
            if (m?.branchLabel && m.branchLabel !== "...") {
              lbl = m.branchLabel;
              break;
            }
            cur = m?.parentId;
          }
          return (
            <div
              key={nodeId}
              className="bg-zinc-900/30 rounded-xl border border-zinc-800/50 p-4"
              style={{ minHeight: "200px" }}
            >
              <div className="text-xs text-amber-400 mb-3 font-medium uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {lbl || `갈래 ${i + 1}`}
              </div>
              <div className="space-y-3">
                {path.map((id) => {
                  const m = messages[id];
                  if (!m) return null;
                  if (m.role === "user") {
                    return (
                      <div key={id} className="flex justify-end">
                        <div
                          className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-100 text-xs whitespace-pre-wrap leading-relaxed"
                          style={{ maxWidth: "90%" }}
                        >
                          {m.content}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={id}
                      className="text-zinc-200 text-xs whitespace-pre-wrap leading-relaxed"
                    >
                      {m.content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
