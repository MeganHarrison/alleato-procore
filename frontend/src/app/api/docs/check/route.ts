import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  const docsRoot = path.join(process.cwd(), '../documentation/docs')
  
  try {
    await fs.access(docsRoot)
    return NextResponse.json({ exists: true, path: docsRoot })
  } catch {
    return NextResponse.json({ exists: false, path: docsRoot }, { status: 404 })
  }
}