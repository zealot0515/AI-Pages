import { readFile, mkdir, writeFile } from "node:fs/promises";
import { rankStories, storyScore } from "./rank-news.mjs";

const source = JSON.parse(await readFile("data/news.json", "utf8"));
const chronological = [...source].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

await mkdir("data/news", { recursive: true });
const recentWindow = chronological.slice(0, 300);
const rankedLatest = rankStories(recentWindow).map(item => ({ ...item, ranking_score: storyScore(item) }));
await writeFile("data/news/latest.json", JSON.stringify(rankedLatest, null, 2) + "\n");

const archives = new Map();
for (const item of chronological) {
  const date = new Date(item.published_at || 0);
  const key = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 7);
  if (!archives.has(key)) archives.set(key, []);
  archives.get(key).push(item);
}
for (const [month, items] of archives) await writeFile(`data/news/${month}.json`, JSON.stringify(items, null, 2) + "\n");
await writeFile("data/news/index.json", JSON.stringify({ generated_at:new Date().toISOString(), total:chronological.length, latest_count:rankedLatest.length, ranking:"importance/actionability + freshness", archives:[...archives.keys()].sort().reverse() }, null, 2) + "\n");
console.log(`Built ranked latest feed and ${archives.size} monthly archives from ${chronological.length} stories.`);
