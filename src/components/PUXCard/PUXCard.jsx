import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Award, Calendar, TrendingUp } from 'lucide-react'
import { STAGE_DEFINITIONS } from '../../utils/constants'

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80'

function getTenureLabel(joinDate) {
  if (!joinDate) return '未知'
  const start = new Date(joinDate)
  if (Number.isNaN(start.getTime())) return '未知'

  const now = new Date()
  const monthDiff =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth())

  if (monthDiff < 1) return '不足1个月'
  if (monthDiff < 12) return `${monthDiff}个月`
  const years = Math.floor(monthDiff / 12)
  const months = monthDiff % 12
  return months ? `${years}年${months}个月` : `${years}年`
}

function normalizeProgress(progressList) {
  const map = new Map()
  ;(progressList || []).forEach((item) => {
    map.set(item.stage_number, item)
  })

  return [1, 2, 3].map((stageNumber) => {
    const stageMeta = STAGE_DEFINITIONS[stageNumber]
    const stageData = map.get(stageNumber) || {}
    return {
      stageNumber,
      name: stageMeta?.name || `阶段${stageNumber}`,
      color: stageMeta?.color || '#94a3b8',
      progress: Number(stageData.progress || 0),
      status: stageData.status || 'not_started',
      isCurrent: Boolean(stageData.is_current),
    }
  })
}

export default function PUXCard({ member, onClick }) {
  const [expanded, setExpanded] = useState(false)

  const stageProgress = useMemo(
    () => normalizeProgress(member?.stage_progress),
    [member?.stage_progress],
  )

  const currentStage =
    stageProgress.find((item) => item.isCurrent) ||
    stageProgress.find((item) => item.status === 'in_progress') ||
    stageProgress[0]

  const milestones = (member?.milestones || [])
    .slice()
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
    .slice(0, 2)

  const handleToggle = () => {
    setExpanded((prev) => !prev)
    onClick?.(member)
  }

  return (
    <motion.article
      role="button"
      tabIndex={0}
      onClick={handleToggle}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleToggle()
        }
      }}
      className="cursor-pointer rounded-2xl border border-slate-700 bg-slate-800 p-5 text-slate-100 shadow-sm"
      style={{ backgroundColor: '#1E293B' }}
      whileHover={{ y: -6, boxShadow: '0 18px 40px rgba(15, 23, 42, 0.55)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      layout
    >
      <div className="flex items-start gap-4">
        <img
          src={member?.avatar_url || DEFAULT_AVATAR}
          alt={member?.name || '成员头像'}
          className="h-14 w-14 rounded-full border border-slate-600 object-cover"
        />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-white">
            {member?.name || '未命名成员'}
          </h3>
          <p className="mt-1 truncate text-sm text-slate-300">
            {member?.product_line || '未设置产品线'}
          </p>

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <User size={14} />
              PO: {member?.po_name || member?.po || '未分配'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} />
              入职: {getTenureLabel(member?.join_date)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {stageProgress.map((stage) => (
          <div key={stage.stageNumber} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                {stage.name}
              </span>
              <span className="text-slate-400">{stage.progress}%</span>
            </div>

            {stage.isCurrent ? (
              <div className="rounded-md border border-cyan-400/40 bg-cyan-500/10 p-2">
                <div className="mb-1 flex items-center justify-between text-[11px] text-cyan-200">
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp size={12} />
                    当前阶段
                  </span>
                  <span>{stage.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-700">
                  <motion.div
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: stage.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.progress}%` }}
                    transition={{ duration: 0.45, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-1.5 rounded-full bg-slate-700">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${stage.progress}%`,
                    backgroundColor: stage.color,
                    opacity: 0.65,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-700 pt-4">
        <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
          最近里程碑
        </p>
        {milestones.length ? (
          <ul className="space-y-2">
            {milestones.map((item, idx) => (
              <li
                key={item.id || `${item.title || 'milestone'}-${idx}`}
                className="rounded-lg bg-slate-700/40 px-3 py-2 text-sm text-slate-200"
              >
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-300">
                  <Award size={14} />
                  {item.title || item.name || '里程碑'}
                </span>
                {item.date || item.created_at ? (
                  <span className="ml-2 text-xs text-slate-400">
                    {new Date(item.date || item.created_at).toLocaleDateString()}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">暂无里程碑记录</p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="mt-4 overflow-hidden border-t border-slate-700 pt-4"
          >
            <p className="text-sm text-slate-300">
              点击详情查看完整阶段计划与历史里程碑。
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  )
}

