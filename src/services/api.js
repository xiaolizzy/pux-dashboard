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
      milestones (*)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) return MOCK_PUX_MEMBERS

  return data?.length ? data : MOCK_PUX_MEMBERS
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

  if (error) {
    throw error
  }

  return data
}

