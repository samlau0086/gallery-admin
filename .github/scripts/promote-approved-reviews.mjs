import fs from 'node:fs/promises';
import path from 'node:path';

const pendingDir = 'src/content/reviews-pending';
const approvedDir = 'src/content/reviews';
const entries = await fs.readdir(pendingDir, { withFileTypes: true }).catch(() => []);
let moved = 0;

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
  const source = path.join(pendingDir, entry.name);
  let content;
  try {
    content = await fs.readFile(source, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  const status = content.match(/^status:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim();
  if (status !== 'approved' && status !== 'published') continue;
  const destination = path.join(approvedDir, entry.name);
  try {
    await fs.rename(source, destination);
  } catch (error) {
    if (error.code === 'ENOENT') continue;
    throw error;
  }
  const normalizedContent = content.replace(
    /^status:\s*["']?[^"'\r\n]+["']?\s*$/m,
    'status: "approved"',
  );
  await fs.writeFile(destination, normalizedContent, 'utf8');
  moved += 1;
}

if (moved) console.log(`Promoted ${moved} approved review(s).`);
