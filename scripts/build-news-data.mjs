import { readFile, mkdir, writeFile } from "node:fs/promises";
import { rankStories, storyScore } from "./rank-news.mjs";

const source = JSON.parse(await readFile("data/news.json", "utf8"));
const sorted = [...source].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));

await mkdir("data/news", { recursive: true });
const latest = sorted.slice(0, 300);
await writeFile("data/news/latest.json", JSON.stringify(latest, null, 2) + "\n");
await writeFile("data/news/ranked.json", JSON.stringify(rankStories(latest).map(item => ({ ...item, ranking_score: storyScore(item) })), null, 2) + "\n");

const archives = new Map();
for (const item of sorted) {
  const date = new Date(item.published_at || 0);
  const key = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 7);
  if (!archives.has(key)) archives.set(key, []);
  archives.get(key).push(item);
}
for (const [month, items] of archives) await writeFile(`data/news/${month}.json`, JSON.stringify(items, null, 2) + "\n");
await writeFile("data/news/index.json", JSON.stringify({ generated_at:new Date().toISOString(), total:sorted.length, latest_count:latest.length, ranked_count:latest.length, archives:[...archives.keys()].sort().reverse() }, null, 2) + "\n");
console.log(`Built latest, ranked, and ${archives.size} monthly archive feeds from ${sorted.length} stories.`);
