import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import PUXCard from '../PUXCard/PUXCard'
import { getPUXMembers } from '../../services/api'
import { STAGE_DEFINITIONS } from '../../utils/constants'

const STAGE_LIST = [1, 2, 3]

function parseProgress(member, stageNumber) {
  const stageItem = (member?.stage_progress || []).find(
    (item) => item.stage_number === stageNumber,
  )
  return {
    exists: Boolean(stageItem),
    progress: Number(stageItem?.progress || 0),
  }
}

function getMemberAverageProgress(member) {
  const stages = member?.stage_progress || []
  if (!stages.length) return 0
  const total = stages.reduce((sum, item) => sum + Number(item.progress || 0), 0)
  return total / stages.length
}

export default function PUXBoard() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedProductLine, setSelectedProductLine] = useState('all')
  const [selectedStage, setSelectedStage] = useState('all')
  const [poKeyword, setPoKeyword] = useState('')
  const [nameKeyword, setNameKeyword] = useState('')

  useEffect(() => {
    let mounted = true

    async function fetchMembers() {
      setLoading(true)
      setError('')

      try {
        const data = await getPUXMembers()
        if (!mounted) return

        setMembers(data || [])
        toast.success(`已加载 ${data?.length || 0} 位成员`)
      } catch (err) {
        if (!mounted) return
        const message = err?.message || '加载PUX成员失败'
        setError(message)
        toast.error(message)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMembers()

    return () => {
      mounted = false
    }
  }, [])

  const productLineOptions = useMemo(() => {
    const lines = Array.from(
      new Set(
        (members || [])
          .map((item) => item.product_line)
          .filter((item) => typeof item === 'string' && item.trim()),
      ),
    )
    return lines.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  }, [members])

  const filteredMembers = useMemo(() => {
    return (members || []).filter((member) => {
      const matchesProductLine =
        selectedProductLine === 'all' ||
        member.product_line === selectedProductLine

      const matchesPO =
        !poKeyword ||
        String(member.po_name || member.po || '')
          .toLowerCase()
          .includes(poKeyword.toLowerCase())

      const matchesName =
        !nameKeyword ||
        String(member.name || '')
          .toLowerCase()
          .includes(nameKeyword.toLowerCase())

      const matchesStage =
        selectedStage === 'all' ||
        parseProgress(member, Number(selectedStage)).exists

      return matchesProductLine && matchesPO && matchesName && matchesStage
    })
  }, [members, selectedProductLine, selectedStage, poKeyword, nameKeyword])

  const statistics = useMemo(() => {
    const total = filteredMembers.length
    const stageDistribution = STAGE_LIST.reduce((acc, stageNumber) => {
      acc[stageNumber] = filteredMembers.filter(
        (member) => parseProgress(member, stageNumber).exists,
      ).length
      return acc
    }, {})

    const averageCompletion = total
      ? filteredMembers.reduce((sum, member) => sum + getMemberAverageProgress(member), 0) /
        total
      : 0

    return {
      total,
      stageDistribution,
      averageCompletion,
    }
  }, [filteredMembers])

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-8 text-slate-200">
        正在加载成员数据...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-8 text-red-200">
        加载失败: {error}
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4 md:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <select
            value={selectedProductLine}
            onChange={(event) => setSelectedProductLine(event.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-400 focus:ring"
          >
            <option value="all">全部产品线</option>
            {productLineOptions.map((line) => (
              <option key={line} value={line}>
                {line}
              </option>
            ))}
          </select>

          <input
            value={poKeyword}
            onChange={(event) => setPoKeyword(event.target.value)}
            placeholder="搜索PO"
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400 focus:ring"
          />

          <input
            value={nameKeyword}
            onChange={(event) => setNameKeyword(event.target.value)}
            placeholder="搜索姓名"
            className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none ring-cyan-400 focus:ring"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedStage('all')}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                selectedStage === 'all'
                  ? 'bg-cyan-500 text-slate-900'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              全阶段
            </button>
            {STAGE_LIST.map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setSelectedStage(String(stage))}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  selectedStage === String(stage)
                    ? 'text-slate-900'
                    : 'text-slate-200'
                }`}
                style={{
                  backgroundColor:
                    selectedStage === String(stage)
                      ? STAGE_DEFINITIONS[stage].color
                      : '#334155',
                }}
              >
                {STAGE_DEFINITIONS[stage].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400">总人数</p>
          <p className="mt-2 text-2xl font-semibold text-white">{statistics.total}</p>
        </div>

        {STAGE_LIST.map((stage) => (
          <div
            key={stage}
            className="rounded-xl border border-slate-700 bg-slate-800 p-4"
          >
            <p className="text-xs text-slate-400">{STAGE_DEFINITIONS[stage].name}</p>
            <p
              className="mt-2 text-2xl font-semibold"
              style={{ color: STAGE_DEFINITIONS[stage].color }}
            >
              {statistics.stageDistribution[stage] || 0}
            </p>
          </div>
        ))}

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
          <p className="text-xs text-slate-400">平均完成度</p>
          <p className="mt-2 text-2xl font-semibold text-cyan-300">
            {Math.round(statistics.averageCompletion)}%
          </p>
        </div>
      </div>

      {!filteredMembers.length ? (
        <div className="rounded-2xl border border-slate-700 bg-slate-800 p-10 text-center text-slate-400">
          未找到符合条件的成员
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMembers.map((member) => (
            <PUXCard
              key={member.id}
              member={member}
              onClick={() => {
                toast(`已选中 ${member.name || '成员'}`, {
                  icon: '👀',
                })
              }}
            />
          ))}
        </div>
      )}
    </section>
  )
}

