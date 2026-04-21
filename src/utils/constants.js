export const STAGE_DEFINITIONS = {
  1: {
    key: 'stage_1',
    name: '研发对接',
    color: '#10B981',
  },
  2: {
    key: 'stage_2',
    name: '创意推进',
    color: '#F59E0B',
  },
  3: {
    key: 'stage_3',
    name: '全栈运营',
    color: '#EF4444',
  },
}

export const STATUS_CONFIG = {
  not_started: {
    label: '未开始',
    color: '#9CA3AF',
  },
  in_progress: {
    label: '进行中',
    color: '#3B82F6',
  },
  completed: {
    label: '已完成',
    color: '#10B981',
  },
}

export const SUPABASE_CONFIG = {
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  schema: import.meta.env.VITE_SUPABASE_SCHEMA || 'public',
}

