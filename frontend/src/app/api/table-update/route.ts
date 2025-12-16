import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table, id, data } = body

    if (!table || !id || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: table, id, or data' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Remove fields that shouldn't be updated
    const { id: _, created_at, updated_at, ...updateData } = data

    // Update the record
    const { data: updatedRecord, error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating record:', error)
      return NextResponse.json(
        { error: 'Failed to update record', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updatedRecord })
  } catch (error) {
    console.error('Error in table-update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
