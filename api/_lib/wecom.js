const webhook = process.env.WECOM_WEBHOOK_URL
const mentionedMobileList = (process.env.WECOM_MENTIONED_MOBILES || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean)

function buildMarkdown(title, audience, formUrl) {
  return (
    `# ${title}\n` +
    `> 请相关同学在今天内完成填写\n\n` +
    `- 对象：${audience}\n` +
    `- 入口：[点击填写反馈](${formUrl})\n` +
    `- 说明：本提醒由系统定时发送，若已提交可忽略。`
  )
}

export async function sendWecomMarkdown({ title, audience, formUrl }) {
  if (!webhook) {
    throw new Error('Missing WECOM_WEBHOOK_URL')
  }
  if (!formUrl) {
    throw new Error('Missing formUrl')
  }

  const payload = {
    msgtype: 'markdown',
    markdown: {
      content: buildMarkdown(title, audience, formUrl),
    },
  }

  if (mentionedMobileList.length) {
    payload.markdown.mentioned_mobile_list = mentionedMobileList
  }

  const response = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Webhook failed ${response.status}: ${text}`)
  }

  return response.json()
}

export function buildWecomPayload({ title, audience, formUrl }) {
  const payload = {
    msgtype: 'markdown',
    markdown: {
      content: buildMarkdown(title, audience, formUrl),
    },
  }

  if (mentionedMobileList.length) {
    payload.markdown.mentioned_mobile_list = mentionedMobileList
  }

  return payload
}
