import { NextRequest, NextResponse } from 'next/server';
import { existsSync, statSync, createReadStream } from 'fs';
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

export async function GET(request: NextRequest) {
  const apkPath = findApk();

  if (!apkPath) {
    const origin = request.nextUrl.origin;
    return NextResponse.redirect(new URL('/get-app', origin));
  }

  const stat = statSync(apkPath);
  const { Readable } = await import('stream');
  const nodeStream = createReadStream(apkPath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': 'application/vnd.android.package-archive',
      'Content-Disposition': 'attachment; filename="community.apk"',
      'Content-Length': stat.size.toString(),
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
