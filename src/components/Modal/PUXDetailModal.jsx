import { useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, X, SquarePen } from 'lucide-react'
import { STAGE_DEFINITIONS } from '../../utils/constants'

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('zh-CN')
}

function sortMilestones(items) {
  return [...(items || [])].sort((a, b) => {
    const aDate = new Date(a.date || a.created_at || 0).getTime()
    const bDate = new Date(b.date || b.created_at || 0).getTime()
    return aDate - bDate
  })
}

export default function PUXDetailModal({
  open,
  member,
  onClose,
  onEdit,
}) {
  const stageProgressMap = useMemo(() => {
    const map = new Map()
    ;(member?.stage_progress || []).forEach((item) => {
      map.set(item.stage_number, item)
    })
    return map
  }, [member?.stage_progress])

  const milestones = useMemo(
    () => sortMilestones(member?.milestones),
    [member?.milestones],
  )

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.()
    }
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={handleBackdropClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="max-h-[90vh] w-full max-w-[800px] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-800 p-6 text-slate-100 shadow-2xl"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  {member?.name || 'PUX详情'}
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  产品线: {member?.product_line || '—'} | PO:{' '}
                  {member?.po_name || member?.po || '—'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onEdit?.(member)}
                  className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-900 transition hover:bg-cyan-400"
                >
                  <SquarePen size={16} />
                  编辑
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-slate-700 p-2 text-slate-200 transition hover:bg-slate-600"
                  aria-label="关闭弹窗"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
              <h3 className="text-base font-semibold text-white">完整信息</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-slate-300 md:grid-cols-2">
                <p>姓名: {member?.name || '—'}</p>
                <p>产品线: {member?.product_line || '—'}</p>
                <p>PO: {member?.po_name || member?.po || '—'}</p>
                <p>入职日期: {formatDate(member?.join_date)}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-white">阶段进展详情</h3>
              <div className="mt-3 space-y-3">
                {[1, 2, 3].map((stageNumber) => {
                  const stageConfig = STAGE_DEFINITIONS[stageNumber]
                  const progress = stageProgressMap.get(stageNumber)
                  const percent = Number(progress?.progress || 0)

                  return (
                    <div
                      key={stageNumber}
                      className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: stageConfig.color }}
                          />
                          <span className="font-medium text-slate-100">
                            {stageConfig.name}
                          </span>
                        </div>
                        <span className="text-sm text-slate-300">{percent}%</span>
                      </div>

                      <div className="mb-3 h-2 rounded-full bg-slate-700">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: stageConfig.color,
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-sm text-slate-300 md:grid-cols-2">
                        <p>开始日期: {formatDate(progress?.start_date)}</p>
                        <p>完成日期: {formatDate(progress?.completed_date)}</p>
                        <p className="md:col-span-2">
                          备注: {progress?.notes || progress?.remark || '暂无备注'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-base font-semibold text-white">里程碑时间线</h3>
              {!milestones.length ? (
                <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-sm text-slate-400">
                  暂无里程碑记录
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  {milestones.map((item, index) => (
                    <div key={item.id || `${item.title || 'milestone'}-${index}`} className="flex gap-3">
                      <div className="flex w-6 flex-col items-center">
                        <span className="mt-1 h-3 w-3 rounded-full bg-cyan-400" />
                        {index < milestones.length - 1 ? (
                          <span className="mt-1 h-full w-px bg-slate-600" />
                        ) : null}
                      </div>

                      <div className="flex-1 rounded-xl border border-slate-700 bg-slate-900/60 p-3">
                        <p className="font-medium text-slate-100">
                          {item.title || item.name || '里程碑'}
                        </p>
                        <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-400">
                          <Calendar size={13} />
                          {formatDate(item.date || item.created_at)}
                        </p>
                        {item.description ? (
                          <p className="mt-2 text-sm text-slate-300">{item.description}</p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

