export function storyScore(item, now = Date.now()) {
  if (Number.isFinite(Number(item.score))) return Number(item.score);
  if (Number.isFinite(Number(item.importance))) return Number(item.importance);

  let score = 0;
  const text = `${item.title || ""} ${item.summary || ""} ${(item.tags || []).join(" ")}`.toLowerCase();
  if (item.category === "new-models") score += 24;
  if (item.category === "agent-skills") score += 18;
  if (item.category === "ai-deals") score += 12;
  if (["github", "api", "mcp", "workflow", "agent"].some((token) => text.includes(token))) score += 16;
  if (item.why_it_matters) score += 8;
  if (item.automation_angle || item.automation_angle_zh) score += 6;

  const published = new Date(item.published_at || 0).getTime();
  if (Number.isFinite(published)) {
    const ageHours = Math.max(0, (now - published) / 36e5);
    score += Math.max(0, 30 - ageHours / 4);
  }
  return Math.round(score * 100) / 100;
}

export function rankStories(items) {
  return [...items].sort((a, b) => storyScore(b) - storyScore(a) || new Date(b.published_at || 0) - new Date(a.published_at || 0));
}
