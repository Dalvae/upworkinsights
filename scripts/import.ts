import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const API_URL = process.env.API_URL || 'http://localhost:8787';
const JOBS_DIR = process.env.JOBS_DIR || './data';

async function main() {
  console.log(`Importing from ${JOBS_DIR} to ${API_URL}`);

  const files = (await readdir(JOBS_DIR)).filter((f) => f.endsWith('.json'));
  console.log(`Found ${files.length} JSON files`);

  let totalJobs = 0;
  let totalInserted = 0;
  let totalErrors = 0;

  for (const file of files) {
    try {
      const content = await readFile(join(JOBS_DIR, file), 'utf-8');
      const data = JSON.parse(content);

      if (!data.jobs || data.jobs.length === 0) {
        console.log(`  Skipping ${file} (no jobs)`);
        continue;
      }

      console.log(`  ${file}: ${data.jobs.length} jobs`);

      const response = await fetch(`${API_URL}/api/import/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = (await response.json()) as any;

      if (result.ok) {
        totalJobs += result.total;
        totalInserted += result.inserted;
        totalErrors += result.errors;
        console.log(`    -> ${result.inserted} inserted, ${result.errors} errors`);
      } else {
        console.error(`    -> Error: ${result.error}`);
      }
    } catch (e) {
      console.error(`  Error processing ${file}:`, e);
    }
  }

  console.log(`\nDone! Total: ${totalJobs} jobs, ${totalInserted} inserted, ${totalErrors} errors`);
}

main().catch(console.error);
