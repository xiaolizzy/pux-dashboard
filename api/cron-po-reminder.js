import { buildWecomPayload, sendWecomMarkdown } from './_lib/wecom.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  const isCronRequest = Boolean(req.headers['x-vercel-cron'])
  const forceSend = String(req.query?.send || '') === '1'
  const dryRun = !isCronRequest && !forceSend

  try {
    const messageInput = {
      title: 'PUX协作反馈提醒',
      audience: 'PO同学',
      formUrl: process.env.PO_FEEDBACK_FORM_URL,
    }

    if (dryRun) {
      return res.status(200).json({
        ok: true,
        dry_run: true,
        message: 'Dry run only; add ?send=1 to send manually.',
        payload_preview: buildWecomPayload(messageInput),
      })
    }

    const result = await sendWecomMarkdown(messageInput)

    return res.status(200).json({
      ok: true,
      dry_run: false,
      sent_by: isCronRequest ? 'vercel-cron' : 'manual',
      result,
    })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
}
