import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createFeedbackEntry, getPUXMembers } from '../../services/api'
import { STAGE_DEFINITIONS } from '../../utils/constants'

function getFormConfig(source) {
  if (source === 'po') {
    return {
      title: 'PO 协作反馈表',
      description: '请根据本周协作情况填写反馈。',
      source: 'po',
    }
  }

  return {
    title: 'PUX 周进展反馈表',
    description: '请提交本周转型进展与下一步计划。',
    source: 'pux',
  }
}

export default function FeedbackFormPage({ source = 'pux' }) {
  const config = useMemo(() => getFormConfig(source), [source])
  const [members, setMembers] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    pux_id: '',
    stage_number: '',
    project: '',
    execution_process: '',
    collaboration_feedback: '',
    conclusion: '',
    created_by: '',
  })

  useEffect(() => {
    let mounted = true

    async function loadMembers() {
      try {
        const data = await getPUXMembers()
        if (!mounted) return
        setMembers(data || [])
      } catch (error) {
        if (!mounted) return
        toast.error(error?.message || '成员加载失败')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadMembers()
    return () => {
      mounted = false
    }
  }, [])

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function getPayload() {
    const payload = {
      source: config.source,
      pux_id: form.pux_id,
      stage_number: form.stage_number ? Number(form.stage_number) : null,
      project: form.project.trim() || null,
      execution_process: form.execution_process.trim() || null,
      collaboration_feedback: form.collaboration_feedback.trim() || null,
      conclusion: form.conclusion.trim() || null,
      created_by: form.created_by.trim() || null,
    }

    return payload
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!form.pux_id) {
      toast.error('请选择 PUX 成员')
      return
    }
    if (!form.created_by.trim()) {
      toast.error('请填写提交人')
      return
    }

    if (config.source === 'pux' && !form.execution_process.trim()) {
      toast.error('请填写执行过程')
      return
    }

    if (config.source === 'po' && !form.collaboration_feedback.trim()) {
      toast.error('请填写协作反馈')
      return
    }

    setSubmitting(true)
    try {
      await createFeedbackEntry(getPayload())
      toast.success('提交成功，感谢反馈')
      setForm({
        pux_id: '',
        stage_number: '',
        project: '',
        execution_process: '',
        collaboration_feedback: '',
        conclusion: '',
        created_by: '',
      })
    } catch (error) {
      toast.error(error?.message || '提交失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-800/70 p-5 sm:p-6">
        <h1 className="text-2xl font-bold text-white">{config.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{config.description}</p>

        {loading ? (
          <p className="mt-6 text-slate-300">正在加载成员列表...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1 block text-sm text-slate-200">PUX 成员</label>
              <select
                value={form.pux_id}
                onChange={(event) => setField('pux_id', event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 focus:ring"
              >
                <option value="">请选择</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}（{member.product_line}）
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-200">阶段（可选）</label>
              <select
                value={form.stage_number}
                onChange={(event) => setField('stage_number', event.target.value)}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 outline-none ring-cyan-400 focus:ring"
              >
                <option value="">不指定阶段</option>
                {Object.entries(STAGE_DEFINITIONS).map(([stage, item]) => (
                  <option key={stage} value={stage}>
                    {stage}. {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-200">项目/业务（可选）</label>
              <input
                value={form.project}
                onChange={(event) => setField('project', event.target.value)}
                placeholder="例如：棚拍探索、通用 Agent 90 分场景"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400 focus:ring"
              />
            </div>

            {config.source === 'pux' ? (
              <div>
                <label className="mb-1 block text-sm text-slate-200">执行过程 *</label>
                <textarea
                  value={form.execution_process}
                  onChange={(event) => setField('execution_process', event.target.value)}
                  rows={4}
                  placeholder="本周做了什么、核心投入在哪、当前处于什么阶段"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400 focus:ring"
                />
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-sm text-slate-200">协作反馈 *</label>
                <textarea
                  value={form.collaboration_feedback}
                  onChange={(event) => setField('collaboration_feedback', event.target.value)}
                  rows={4}
                  placeholder="本周协作质量、主动性、对研发对接能力评价"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400 focus:ring"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm text-slate-200">结论 / 下周重点（可选）</label>
              <textarea
                value={form.conclusion}
                onChange={(event) => setField('conclusion', event.target.value)}
                rows={3}
                placeholder="例如：顺利推进 / 刚起步待观察 / 需要资源支持"
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400 focus:ring"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-slate-200">提交人 *</label>
              <input
                value={form.created_by}
                onChange={(event) => setField('created_by', event.target.value)}
                placeholder={config.source === 'pux' ? '填写你的姓名' : '填写 PO 姓名'}
                className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400 focus:ring"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? '提交中...' : '提交反馈'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
