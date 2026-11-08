import { NextResponse } from 'next/server';
// No guard needed for public file serving
import path from 'path';
import fs from 'fs/promises';

/** GET /app/uploads/[file]
 *  Serves a public file from the uploads directory.
 */
async function handleGet(req: Request, ctx: any) {
  const file = ctx.params?.file;
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });

  // Prevent path traversal: only allow a plain filename inside public/uploads.
  const safeFile = path.basename(String(file));
  if (!safeFile || safeFile === '.' || safeFile === '..' || safeFile !== String(file)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(uploadsDir, safeFile);
  if (filePath !== path.join(uploadsDir, safeFile)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const data = await fs.readFile(filePath);
    const mime = 'application/octet-stream'; // simple fallback; real code could derive from extension
    return new NextResponse(data, {
      status: 200,
      headers: { 'Content-Type': mime },
    });
  } catch (err) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export const GET = handleGet;
