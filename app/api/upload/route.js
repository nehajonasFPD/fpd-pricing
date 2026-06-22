import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { isAuthenticatedRequest } from '../../../lib/auth.mjs'

export async function POST(request) {
  try {
    if (!(await isAuthenticatedRequest(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const result = {}

    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer())
        const name = value.name.toLowerCase()

        if (name.endsWith('.csv')) {
          result[key] = buffer.toString('utf-8')
        } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
          const wb = XLSX.read(buffer, { type: 'buffer' })
          if (key === 'bible') {
            const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('stock eta')) || wb.SheetNames[0]
            result[key] = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName])
          } else {
            result[key] = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[0]])
          }
        }
        console.log(`Processed ${key}: ${result[key]?.length || 0} chars`)
      } else {
        result[key] = value
      }
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed: ' + err.message }, { status: 500 })
  }
}
