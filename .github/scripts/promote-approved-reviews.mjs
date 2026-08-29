import fs from 'node:fs/promises';
import path from 'node:path';

const pendingDir = 'src/content/reviews-pending';
const approvedDir = 'src/content/reviews';
const entries = await fs.readdir(pendingDir, { withFileTypes: true }).catch(() => []);
let moved = 0;

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
  const source = path.join(pendingDir, entry.name);
  const content = await fs.readFile(source, 'utf8');
  const status = content.match(/^status:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
  if (status !== 'approved' && status !== 'published') continue;
  const normalizedContent = content.replace(
    /^status:\s*["']?[^"'\r\n]+["']?\s*$/m,
    'status: "approved"',
  );
  await fs.writeFile(source, normalizedContent, 'utf8');
  await fs.rename(source, path.join(approvedDir, entry.name));
  moved += 1;
}

if (moved) console.log(`Promoted ${moved} approved review(s).`);
