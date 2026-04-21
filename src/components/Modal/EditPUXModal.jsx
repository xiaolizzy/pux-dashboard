import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  addMilestone,
  createPUXMember,
  getPUXMembers,
  updatePUXMember,
  updateStageProgress,
} from '../../services/api'
import { STAGE_DEFINITIONS, STATUS_CONFIG } from '../../utils/constants'

const DEFAULT_STAGE_FORM = {
  status: 'not_started',
  progress: 0,
  notes: '',
}

function createInitialStageForm(stageProgress) {
  const map = new Map()
  ;(stageProgress || []).forEach((item) => {
    map.set(item.stage_number, item)
  })

  return {
    1: {
      status: map.get(1)?.status || DEFAULT_STAGE_FORM.status,
      progress: Number(map.get(1)?.progress || 0),
      notes: map.get(1)?.notes || map.get(1)?.remark || '',
    },
    2: {
      status: map.get(2)?.status || DEFAULT_STAGE_FORM.status,
      progress: Number(map.get(2)?.progress || 0),
      notes: map.get(2)?.notes || map.get(2)?.remark || '',
    },
    3: {
      status: map.get(3)?.status || DEFAULT_STAGE_FORM.status,
      progress: Number(map.get(3)?.progress || 0),
      notes: map.get(3)?.notes || map.get(3)?.remark || '',
    },
  }
}

function createInitialMemberForm(member) {
  return {
    name: member?.name || '',
    avatar_url: member?.avatar_url || '',
    product_line: member?.product_line || '',
    po_name: member?.po_name || member?.po || '',
    join_date: member?.join_date || '',
  }
}

function createInitialMilestones(member) {
  return (member?.milestones || []).map((item) => ({
    id: item.id || null,
    title: item.title || item.name || '',
    date: item.date || '',
    description: item.description || '',
  }))
}

function validateForm(memberForm) {
  const errors = {}
  if (!memberForm.name.trim()) errors.name = '姓名为必填项'
  if (!memberForm.po_name.trim()) errors.po_name = 'PO姓名为必填项'
  if (!memberForm.product_line.trim()) errors.product_line = '请选择产品线'
  return errors
}

export default function EditPUXModal({ open, member, onClose, onSaved }) {
  const [loading, setLoading] = useState(false)
  const [productLineOptions, setProductLineOptions] = useState([])
  const [memberForm, setMemberForm] = useState(createInitialMemberForm(member))
  const [stageForm, setStageForm] = useState(
    createInitialStageForm(member?.stage_progress),
  )
  const [milestones, setMilestones] = useState(createInitialMilestones(member))
  const [errors, setErrors] = useState({})

  const isEditMode = Boolean(member?.id)

  useEffect(() => {
    if (!open) return

    setMemberForm(createInitialMemberForm(member))
    setStageForm(createInitialStageForm(member?.stage_progress))
    setMilestones(createInitialMilestones(member))
    setErrors({})
  }, [open, member])

  useEffect(() => {
    if (!open) return

    async function fetchProductLines() {
      try {
        const list = await getPUXMembers()
        const lines = Array.from(
          new Set(
            (list || [])
              .map((item) => item.product_line)
              .filter((item) => typeof item === 'string' && item.trim()),
          ),
        ).sort((a, b) => a.localeCompare(b, 'zh-CN'))
        setProductLineOptions(lines)
      } catch {
        setProductLineOptions([])
      }
    }

    fetchProductLines()
  }, [open])

  const mergedProductOptions = useMemo(() => {
    if (!memberForm.product_line) return productLineOptions
    if (productLineOptions.includes(memberForm.product_line)) return productLineOptions
    return [memberForm.product_line, ...productLineOptions]
  }, [productLineOptions, memberForm.product_line])

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget && !loading) {
      onClose?.()
    }
  }

  const handleMemberFormChange = (field, value) => {
    setMemberForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleStageChange = (stageNumber, field, value) => {
    setStageForm((prev) => ({
      ...prev,
      [stageNumber]: {
        ...prev[stageNumber],
        [field]: field === 'progress' ? Number(value) : value,
      },
    }))
  }

  const handleAddMilestone = () => {
    setMilestones((prev) => [...prev, { id: null, title: '', date: '', description: '' }])
  }

  const handleMilestoneChange = (index, field, value) => {
    setMilestones((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    )
  }

  const handleSave = async () => {
    const validationErrors = validateForm(memberForm)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      toast.error('请先修正表单错误')
      return
    }

    setLoading(true)
    try {
      const memberPayload = {
        name: memberForm.name.trim(),
        avatar_url: memberForm.avatar_url.trim() || null,
        product_line: memberForm.product_line.trim(),
        po_name: memberForm.po_name.trim(),
        join_date: memberForm.join_date || null,
      }

      const savedMember = isEditMode
        ? await updatePUXMember(member.id, memberPayload)
        : await createPUXMember(memberPayload)

      await Promise.all(
        [1, 2, 3].map((stageNumber) =>
          updateStageProgress(savedMember.id, stageNumber, {
            status: stageForm[stageNumber].status,
            progress: Number(stageForm[stageNumber].progress || 0),
            notes: stageForm[stageNumber].notes.trim(),
          }),
        ),
      )

      const newMilestones = milestones
        .filter((item) => !item.id)
        .filter((item) => item.title.trim())

      await Promise.all(
        newMilestones.map((item) =>
          addMilestone({
            pux_id: savedMember.id,
            title: item.title.trim(),
            date: item.date || null,
            description: item.description.trim() || null,
          }),
        ),
      )

      toast.success('成员信息已保存')
      onSaved?.(savedMember)
      onClose?.()
    } catch (error) {
      toast.error(error?.message || '保存失败，请稍后重试')
    } finally {
      setLoading(false)
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
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          >
            <h2 className="text-2xl font-semibold text-white">
              {isEditMode ? '编辑 PUX 成员' : '新建 PUX 成员'}
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm text-slate-300">姓名 *</label>
                <input
                  value={memberForm.name}
                  onChange={(event) => handleMemberFormChange('name', event.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                />
                {errors.name ? (
                  <p className="mt-1 text-xs text-red-300">{errors.name}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">头像 URL</label>
                <input
                  value={memberForm.avatar_url}
                  onChange={(event) =>
                    handleMemberFormChange('avatar_url', event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">产品线 *</label>
                <select
                  value={memberForm.product_line}
                  onChange={(event) =>
                    handleMemberFormChange('product_line', event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                >
                  <option value="">请选择产品线</option>
                  {mergedProductOptions.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
                {errors.product_line ? (
                  <p className="mt-1 text-xs text-red-300">{errors.product_line}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">PO 姓名 *</label>
                <input
                  value={memberForm.po_name}
                  onChange={(event) => handleMemberFormChange('po_name', event.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                />
                {errors.po_name ? (
                  <p className="mt-1 text-xs text-red-300">{errors.po_name}</p>
                ) : null}
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-300">入职日期</label>
                <input
                  type="date"
                  value={memberForm.join_date}
                  onChange={(event) => handleMemberFormChange('join_date', event.target.value)}
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                />
              </div>
            </div>

            <div className="mt-7 space-y-4">
              <h3 className="text-lg font-semibold text-white">阶段进展编辑</h3>
              {[1, 2, 3].map((stageNumber) => (
                <div
                  key={stageNumber}
                  className="rounded-xl border border-slate-700 bg-slate-900/60 p-4"
                >
                  <div className="mb-3 inline-flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: STAGE_DEFINITIONS[stageNumber].color }}
                    />
                    <p className="font-medium text-slate-100">
                      {STAGE_DEFINITIONS[stageNumber].name}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm text-slate-300">状态</label>
                      <select
                        value={stageForm[stageNumber].status}
                        onChange={(event) =>
                          handleStageChange(stageNumber, 'status', event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                      >
                        {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                          <option key={value} value={value}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm text-slate-300">
                        完成度: {stageForm[stageNumber].progress}%
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={stageForm[stageNumber].progress}
                        onChange={(event) =>
                          handleStageChange(stageNumber, 'progress', event.target.value)
                        }
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-sm text-slate-300">备注</label>
                    <textarea
                      value={stageForm[stageNumber].notes}
                      onChange={(event) =>
                        handleStageChange(stageNumber, 'notes', event.target.value)
                      }
                      rows={3}
                      className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">里程碑</h3>
                <button
                  type="button"
                  onClick={handleAddMilestone}
                  className="rounded-lg bg-cyan-500 px-3 py-1.5 text-sm font-medium text-slate-900 hover:bg-cyan-400"
                >
                  添加里程碑
                </button>
              </div>

              <div className="space-y-3">
                {milestones.map((item, index) => (
                  <div
                    key={item.id || `new-${index}`}
                    className="rounded-xl border border-slate-700 bg-slate-900/60 p-3"
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <input
                        value={item.title}
                        onChange={(event) =>
                          handleMilestoneChange(index, 'title', event.target.value)
                        }
                        placeholder="里程碑标题"
                        className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                      />
                      <input
                        type="date"
                        value={item.date}
                        onChange={(event) =>
                          handleMilestoneChange(index, 'date', event.target.value)
                        }
                        className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                      />
                    </div>
                    <textarea
                      value={item.description}
                      onChange={(event) =>
                        handleMilestoneChange(index, 'description', event.target.value)
                      }
                      rows={2}
                      placeholder="里程碑描述（可选）"
                      className="mt-3 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm outline-none ring-cyan-400 focus:ring"
                    />
                  </div>
                ))}
                {!milestones.length ? (
                  <p className="text-sm text-slate-400">暂无里程碑，点击上方按钮添加</p>
                ) : null}
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={loading}
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

