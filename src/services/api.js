import { createClient } from '@supabase/supabase-js'
import { MOCK_PUX_MEMBERS } from '../utils/mockMembers'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasSupabaseConfig =
  Boolean(supabaseUrl) &&
  Boolean(supabaseAnonKey) &&
  !supabaseUrl.includes('your-project') &&
  !supabaseAnonKey.includes('your-anon-key')

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

const TABLES = {
  puxMembers: 'pux_members',
  stageProgress: 'stage_progress',
  milestones: 'milestones',
  feedbackEntries: 'feedback_entries',
}

function isMissingFeedbackTable(error) {
  const message = String(error?.message || '').toLowerCase()
  return (
    error?.status === 404 ||
    message.includes('feedback_entries') ||
    message.includes('relation') ||
    message.includes('does not exist')
  )
}

function parseFeedbackFromMilestone(item) {
  const title = String(item?.title || '')
  if (!title.startsWith('[反馈-')) return null

  const source = title.includes('PO') ? 'po' : 'pux'
  return {
    id: item.id,
    pux_id: item.pux_id,
    source,
    project: title.replace(/^\[反馈-(PUX|PO)\]\s*/, ''),
    execution_process: source === 'pux' ? item.description : null,
    collaboration_feedback: source === 'po' ? item.description : null,
    conclusion: null,
    created_by: null,
    created_at: item.created_at,
  }
}

export async function getPUXMembers() {
  if (!supabase) {
    return MOCK_PUX_MEMBERS
  }

  const { data, error } = await supabase
    .from(TABLES.puxMembers)
    .select(
      `
      *,
      stage_progress (*),
      milestones (*),
      feedback_entries (*)
    `,
    )
    .order('created_at', { ascending: false })

  if (!error) {
    return data?.length ? data : MOCK_PUX_MEMBERS
  }

  if (!isMissingFeedbackTable(error)) {
    return MOCK_PUX_MEMBERS
  }

  const fallbackResult = await supabase
    .from(TABLES.puxMembers)
    .select(
      `
      *,
      stage_progress (*),
      milestones (*)
    `,
    )
    .order('created_at', { ascending: false })

  if (fallbackResult.error) return MOCK_PUX_MEMBERS

  const mergedData = (fallbackResult.data || []).map((item) => ({
    ...item,
    feedback_entries: (item.milestones || [])
      .map(parseFeedbackFromMilestone)
      .filter(Boolean),
  }))

  return mergedData.length ? mergedData : MOCK_PUX_MEMBERS
}

export async function createPUXMember(payload) {
  if (!supabase) {
    throw new Error('Supabase 未配置，暂不支持在线新增，请先配置真实环境变量。')
  }

  const { data, error } = await supabase
    .from(TABLES.puxMembers)
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function updatePUXMember(id, payload) {
  if (!supabase) {
    throw new Error('Supabase 未配置，暂不支持在线编辑，请先配置真实环境变量。')
  }

  const { data, error } = await supabase
    .from(TABLES.puxMembers)
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function deletePUXMember(id) {
  if (!supabase) {
    throw new Error('Supabase 未配置，暂不支持在线删除，请先配置真实环境变量。')
  }

  const { error } = await supabase.from(TABLES.puxMembers).delete().eq('id', id)

  if (error) {
    throw error
  }

  return true
}

export async function updateStageProgress(puxId, stageNumber, payload) {
  if (!supabase) {
    throw new Error('Supabase 未配置，暂不支持阶段更新，请先配置真实环境变量。')
  }

  const upsertPayload = {
    pux_id: puxId,
    stage_number: stageNumber,
    ...payload,
  }

  const { data, error } = await supabase
    .from(TABLES.stageProgress)
    .upsert(upsertPayload, { onConflict: 'pux_id,stage_number' })
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function addMilestone(payload) {
  if (!supabase) {
    throw new Error('Supabase 未配置，暂不支持里程碑新增，请先配置真实环境变量。')
  }

  const { data, error } = await supabase
    .from(TABLES.milestones)
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

export async function createFeedbackEntry(payload) {
  if (!supabase) {
    throw new Error('Supabase 未配置，暂不支持在线反馈提交，请先配置真实环境变量。')
  }

  const { data, error } = await supabase
    .from(TABLES.feedbackEntries)
    .insert(payload)
    .select()
    .single()

  if (!error) {
    return data
  }

  if (!isMissingFeedbackTable(error)) {
    throw error
  }

  // Fallback: when feedback_entries table is missing, persist feedback as milestone.
  const sourceLabel = payload.source === 'po' ? 'PO' : 'PUX'
  const milestonePayload = {
    pux_id: payload.pux_id,
    title: `[反馈-${sourceLabel}] ${payload.project || payload.conclusion || '反馈更新'}`,
    description:
      payload.execution_process ||
      payload.collaboration_feedback ||
      payload.conclusion ||
      '已提交反馈',
    date: new Date().toISOString().slice(0, 10),
  }

  const fallback = await addMilestone(milestonePayload)
  return {
    id: fallback.id,
    pux_id: payload.pux_id,
    source: payload.source,
    stage_number: payload.stage_number,
    project: payload.project || null,
    execution_process: payload.execution_process || null,
    collaboration_feedback: payload.collaboration_feedback || null,
    conclusion: payload.conclusion || null,
    created_by: payload.created_by || null,
    created_at: fallback.created_at,
  }
}

