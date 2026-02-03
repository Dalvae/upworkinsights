import { createClient } from "@supabase/supabase-js";

const db = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);

const { data, error } = await db.from("jobs").select("id, proposals_tier, title, description").not("proposals_tier", "is", null);
if (error) { console.error(error); process.exit(1); }

console.log("Found", data.length, "jobs with proposals_tier");

for (const job of data) {
  const raw = job.proposals_tier;
  const lower = raw.toLowerCase();
  let parsed = raw;
  if (lower.includes("lessthan5")) parsed = "Less than 5";
  else if (lower.includes("5to10")) parsed = "5 to 10";
  else if (lower.includes("10to15")) parsed = "10 to 15";
  else if (lower.includes("15to20")) parsed = "15 to 20";
  else if (lower.includes("20to50")) parsed = "20 to 50";
  else if (lower.includes("50plus") || lower.includes("50+")) parsed = "50+";

  const updates: Record<string, string> = {};
  if (parsed !== raw) updates.proposals_tier = parsed;

  // Also strip HTML from title and description
  const cleanTitle = job.title.replace(/<[^>]*>/g, "");
  const cleanDesc = job.description.replace(/<[^>]*>/g, "");
  if (cleanTitle !== job.title) updates.title = cleanTitle;
  if (cleanDesc !== job.description) updates.description = cleanDesc;

  if (Object.keys(updates).length > 0) {
    const { error: upErr } = await db.from("jobs").update(updates).eq("id", job.id);
    if (upErr) console.error("Error updating", job.id, upErr);
    else console.log(job.id, Object.keys(updates).join(", "), "updated");
  }
}
console.log("Done");
