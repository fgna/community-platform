import { NextResponse } from 'next/server';
import { existsSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

const APK_PATHS = [
  join(process.cwd(), 'public', 'app', 'community.apk'),
  join(process.cwd(), '..', 'mobile-android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
];

function findApk(): string | null {
  for (const p of APK_PATHS) {
    if (existsSync(p)) return p;
  }
  return null;
}

export async function GET() {
  const apkPath = findApk();

  if (!apkPath) {
    return new NextResponse(
      '<html><body style="background:#090d16;color:#f3f4f6;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1 style="font-size:1.2rem">APK not available yet</h1><p style="opacity:0.6;margin:8px 0 16px">Rebuild with <code>docker compose build</code> to include the APK.</p><a href="/get-app" style="color:#c5a880">← Back</a></div></body></html>',
      { status: 404, headers: { 'Content-Type': 'text/html' } },
    );
  }

  const buffer = readFileSync(apkPath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="community.apk"',
      'Content-Length': statSync(apkPath).size.toString(),
    },
  });
}

export async function HEAD() {
  const apkPath = findApk();
  if (!apkPath) {
    return new NextResponse(null, { status: 404 });
  }
  return new NextResponse(null, { status: 200 });
}
