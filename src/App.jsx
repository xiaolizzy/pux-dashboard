import { motion } from 'framer-motion'
import { Toaster, toast } from 'react-hot-toast'
import { Plus } from 'lucide-react'
import PUXBoard from './components/Dashboard/PUXBoard'
import FeedbackFormPage from './components/Forms/FeedbackFormPage'

function getPageType() {
  const pathname = window.location.pathname
  if (pathname === '/forms/pux') return 'pux-form'
  if (pathname === '/forms/po') return 'po-form'
  return 'dashboard'
}

function App() {
  const pageType = getPageType()

  if (pageType === 'pux-form') {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #334155',
            },
          }}
        />
        <FeedbackFormPage source="pux" />
      </div>
    )
  }

  if (pageType === 'po-form') {
    return (
      <div className="min-h-screen bg-background text-text-primary">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1E293B',
              color: '#F8FAFC',
              border: '1px solid #334155',
            },
          }}
        />
        <FeedbackFormPage source="po" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1E293B',
            color: '#F8FAFC',
            border: '1px solid #334155',
          },
        }}
      />

      <motion.main
        className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <header className="mb-6 rounded-2xl border border-slate-700 bg-slate-800/70 p-4 backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/20 text-cyan-300">
                <span className="font-heading text-base font-bold tracking-wide">PUX</span>
              </div>
              <div>
                <p className="font-heading text-xl font-bold text-white sm:text-2xl">
                  PUX转型看板
                </p>
                <p className="text-xs text-slate-400 sm:text-sm">
                  实时追踪成员阶段进展与里程碑
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  收集入口：/forms/pux（PUX反馈） /forms/po（PO反馈）
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => toast('请在后续版本接入新增弹窗', { icon: '✨' })}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              <Plus size={16} />
              新增PUX成员
            </button>
          </div>
        </header>

        <PUXBoard />
      </motion.main>
    </div>
  )
}

export default App
