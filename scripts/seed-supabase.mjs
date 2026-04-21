import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { MOCK_PUX_MEMBERS } from '../src/utils/mockMembers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

function loadEnvFromFile(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const raw = fs.readFileSync(filePath, 'utf8')
  const result = {}

  raw.split('\n').forEach((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return
    const idx = trimmed.indexOf('=')
    if (idx <= 0) return
    const key = trimmed.slice(0, idx).trim()
    const value = trimmed.slice(idx + 1).trim()
    result[key] = value
  })

  return result
}

const envFromFile = loadEnvFromFile(path.join(projectRoot, '.env'))
const supabaseUrl = process.env.VITE_SUPABASE_URL || envFromFile.VITE_SUPABASE_URL
const supabaseAnonKey =
  process.env.VITE_SUPABASE_ANON_KEY || envFromFile.VITE_SUPABASE_ANON_KEY

if (
  !supabaseUrl ||
  !supabaseAnonKey ||
  supabaseUrl.includes('your-project') ||
  supabaseAnonKey.includes('your-anon-key')
) {
  throw new Error(
    '请先在 .env 中填写真实 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY',
  )
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function upsertMemberWithPayload(memberPayload, member) {
  const { data: existing, error: queryError } = await supabase
    .from('pux_members')
    .select('id')
    .eq('name', member.name)
    .eq('product_line', member.product_line)
    .maybeSingle()

  if (queryError) throw queryError

  if (existing?.id) {
    const { data, error } = await supabase
      .from('pux_members')
      .update(memberPayload)
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error) throw error
    return data.id
  }

  const { data, error } = await supabase
    .from('pux_members')
    .insert(memberPayload)
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

async function upsertMember(member) {
  const fullPayload = {
    name: member.name,
    product_line: member.product_line,
    po_name: member.po_name,
    join_date: member.join_date || null,
    avatar_url: member.avatar_url || null,
  }

  try {
    return await upsertMemberWithPayload(fullPayload, member)
  } catch (error) {
    const message = error?.message || ''
    if (!message.includes('Could not find the') || !message.includes('pux_members')) {
      throw error
    }

    // Backward compatibility: existing table may not contain newer columns.
    const compatiblePayload = {
      name: member.name,
      product_line: member.product_line,
      po_name: member.po_name,
    }
    return upsertMemberWithPayload(compatiblePayload, member)
  }
}

async function upsertStageProgress(memberId, stage) {
  const payload = {
    pux_id: memberId,
    stage_number: stage.stage_number,
    status: stage.status || 'not_started',
    progress: Number(stage.progress || 0),
    notes: stage.notes || '',
    is_current: Boolean(stage.is_current),
  }

  const { error } = await supabase
    .from('stage_progress')
    .upsert(payload, { onConflict: 'pux_id,stage_number' })
  if (error) throw error
}

async function insertMilestone(memberId, milestone) {
  const payload = {
    pux_id: memberId,
    title: milestone.title || '里程碑',
    date: milestone.date || null,
    description: milestone.description || null,
  }

  const { data: existed, error: checkError } = await supabase
    .from('milestones')
    .select('id')
    .eq('pux_id', memberId)
    .eq('title', payload.title)
    .maybeSingle()
  if (checkError) throw checkError
  if (existed?.id) return

  const { error } = await supabase.from('milestones').insert(payload)
  if (error) throw error
}

async function seed() {
  let successCount = 0

  for (const member of MOCK_PUX_MEMBERS) {
    const memberId = await upsertMember(member)
    for (const stage of member.stage_progress || []) {
      await upsertStageProgress(memberId, stage)
    }
    for (const milestone of member.milestones || []) {
      await insertMilestone(memberId, milestone)
    }
    successCount += 1
    console.log(`已处理: ${member.name}`)
  }

  console.log(`完成，共处理 ${successCount} 位成员。`)
}

seed().catch((error) => {
  console.error('写入失败:', error.message || error)
  process.exit(1)
})

