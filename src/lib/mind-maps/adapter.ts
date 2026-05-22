import type { MindElixirData, NodeObj } from "mind-elixir";

type GeneratedBranch = {
  title?: unknown;
  subtopics?: unknown;
  key_points?: unknown;
};

type GeneratedMindMap = {
  title?: unknown;
  central_theme?: unknown;
  branches?: unknown;
  practical_applications?: unknown;
  study_questions?: unknown;
  nodes?: unknown;
  markdown?: unknown;
};

function text(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 8);
}

function nodeId(seed: string, index: number) {
  return `${seed}-${index}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 48);
}

function listNodes(items: string[], seed: string): NodeObj[] {
  return items.map((item, index) => ({
    id: nodeId(seed, index),
    topic: item,
  }));
}

function branchNode(branch: GeneratedBranch, index: number): NodeObj {
  const title = text(branch.title, `Tema ${index + 1}`);
  const subtopics = listNodes(stringList(branch.subtopics), `sub-${index}`);
  const keyPoints = stringList(branch.key_points);

  return {
    id: nodeId(`branch-${title}`, index),
    topic: title,
    expanded: true,
    direction: index % 2 === 0 ? 0 : 1,
    children: [
      ...subtopics,
      ...(keyPoints.length
        ? [
            {
              id: nodeId(`points-${title}`, index),
              topic: "Pontos-chave",
              expanded: true,
              children: listNodes(keyPoints, `point-${index}`),
            },
          ]
        : []),
    ],
  };
}

function parseMarkdownBranches(markdown: unknown): GeneratedBranch[] {
  if (typeof markdown !== "string" || !markdown.trim()) return [];

  const lines = markdown.split(/\r?\n/);
  const branches: GeneratedBranch[] = [];
  let current: { title: string; subtopics: string[]; key_points: string[] } | null = null;
  let mode: "subtopics" | "key_points" = "subtopics";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^#{3,5}\s*(?:\d+[.)-]?\s*)?(.+)$/);
    if (heading) {
      const title = heading[1].replace(/\*\*/g, "").trim();
      if (!/subt[oó]picos|pontos?\s*chave|tema\s*central/i.test(title)) {
        current = { title, subtopics: [], key_points: [] };
        branches.push(current);
      }
      continue;
    }

    if (/subt[oó]picos/i.test(line)) {
      mode = "subtopics";
      continue;
    }

    if (/pontos?\s*chave/i.test(line)) {
      mode = "key_points";
      continue;
    }

    const bullet = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
    if (bullet && current) {
      const value = bullet[1].replace(/\*\*/g, "").trim();
      if (value && !/subt[oó]picos|pontos?\s*chave/i.test(value)) {
        current[mode].push(value);
      }
    }
  }

  return branches.slice(0, 10);
}

export function toMindElixirData(mapJson: unknown, fallbackTitle: string): MindElixirData {
  const source = (mapJson && typeof mapJson === "object" ? mapJson : {}) as GeneratedMindMap;
  const title = text(source.central_theme, text(source.title, fallbackTitle));
  const legacyNodes = Array.isArray(source.nodes) ? source.nodes : [];
  const branches = Array.isArray(source.branches) && source.branches.length ? (source.branches as GeneratedBranch[]) : parseMarkdownBranches(source.markdown);
  const children: NodeObj[] = branches.length
    ? branches.map(branchNode)
    : legacyNodes.map((node, index) => ({
        id: nodeId("legacy-node", index),
        topic: text(node, `Topico ${index + 1}`),
        direction: index % 2 === 0 ? 0 : 1,
      }));
  const applications = stringList(source.practical_applications);
  const questions = stringList(source.study_questions);

  if (applications.length) {
    children.push({
      id: "practical-applications",
      topic: "Aplicacoes praticas",
      expanded: true,
      direction: 0,
      children: listNodes(applications, "application"),
    });
  }

  if (questions.length) {
    children.push({
      id: "study-questions",
      topic: "Perguntas de estudo",
      expanded: true,
      direction: 1,
      children: listNodes(questions, "question"),
    });
  }

  return {
    nodeData: {
      id: "tepm-root",
      topic: title,
      expanded: true,
      children: children.length
        ? children
        : [
            {
              id: "fallback-summary",
              topic: "Resumo",
              children: [{ id: "fallback-note", topic: fallbackTitle }],
            },
          ],
    },
  };
}
