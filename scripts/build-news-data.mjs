import { readFile, mkdir, writeFile } from "node:fs/promises";
import { rankStories, storyScore } from "./rank-news.mjs";

const MAX_HOME_AGE_DAYS = 30;
const MAX_HOME_ITEMS = 300;
const source = JSON.parse(await readFile("data/news.json", "utf8"));
const chronological = [...source].sort((a, b) => new Date(b.published_at || 0) - new Date(a.published_at || 0));
const now = Date.now();
const cutoff = now - MAX_HOME_AGE_DAYS * 864e5;

await mkdir("data/news", { recursive: true });
const fresh = chronological.filter(item => {
  const published = new Date(item.published_at || 0).getTime();
  return Number.isFinite(published) && published >= cutoff;
});
const recentWindow = fresh.slice(0, MAX_HOME_ITEMS);
const rankedLatest = rankStories(recentWindow).map(item => ({ ...item, ranking_score: storyScore(item, now) }));
await writeFile("data/news/latest.json", JSON.stringify(rankedLatest, null, 2) + "\n");

const archives = new Map();
for (const item of chronological) {
  const date = new Date(item.published_at || 0);
  const key = Number.isNaN(date.getTime()) ? "unknown" : date.toISOString().slice(0, 7);
  if (!archives.has(key)) archives.set(key, []);
  archives.get(key).push(item);
}
for (const [month, items] of archives) await writeFile(`data/news/${month}.json`, JSON.stringify(items, null, 2) + "\n");
await writeFile("data/news/index.json", JSON.stringify({ generated_at:new Date().toISOString(), total:chronological.length, fresh_total:fresh.length, latest_count:rankedLatest.length, homepage_max_age_days:MAX_HOME_AGE_DAYS, ranking:"importance/actionability + freshness", archives:[...archives.keys()].sort().reverse() }, null, 2) + "\n");
console.log(`Built ${rankedLatest.length} fresh homepage stories; archived ${chronological.length} total stories across ${archives.size} months.`);
