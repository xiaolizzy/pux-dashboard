import { sendWecomMarkdown } from './_lib/wecom.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  try {
    const result = await sendWecomMarkdown({
      title: 'PUX协作反馈提醒',
      audience: 'PO同学',
      formUrl: process.env.PO_FEEDBACK_FORM_URL,
    })

    return res.status(200).json({ ok: true, result })
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
}
