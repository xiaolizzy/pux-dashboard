# PUX Dashboard

PUX 转型看板前端（React + Vite）+ 企业微信 webhook 定时提醒（Vercel Cron）。

## 1) 本地启动

```bash
npm install
npm run dev
```

## 2) 环境变量

复制 `.env.example` 到 `.env`，并填写：

- `VITE_SUPABASE_URL`: Supabase 项目地址
- `VITE_SUPABASE_ANON_KEY`: Supabase 匿名 key
- `WECOM_WEBHOOK_URL`: 企业微信机器人 webhook
- `PUX_FEEDBACK_FORM_URL`: PUX 填报表单链接
- `PO_FEEDBACK_FORM_URL`: PO 协作反馈表单链接
- `WECOM_MENTIONED_MOBILES`: 需要 @ 的手机号（可留空，逗号分隔）

## 3) 定时提醒说明

项目提供两个 API 路由：

- `/api/cron-pux-reminder`: 给 PUX 发周反馈提醒
- `/api/cron-po-reminder`: 给 PO 发协作反馈提醒
- `/forms/pux`: PUX 网页反馈表单
- `/forms/po`: PO 网页反馈表单

在 `vercel.json` 已配置定时任务（UTC 时间）：

- 周三 02:00 UTC（北京时间周三 10:00）触发 PUX 提醒
- 周四 02:00 UTC（北京时间周四 10:00）触发 PO 提醒

## 4) Vercel 部署步骤

1. 将代码推到 GitHub 仓库。
2. 在 Vercel 导入该仓库，Framework 选择 `Vite`。
3. 在 Vercel 项目设置中填入上述环境变量。
4. 完成部署后，手动访问以下地址做连通性验证：
   - `https://<your-domain>/api/cron-pux-reminder`
   - `https://<your-domain>/api/cron-po-reminder`
   - `https://<your-domain>/forms/pux`
   - `https://<your-domain>/forms/po`
5. 返回 `{"ok": true}` 即说明 webhook 已打通。

建议将环境变量设置为线上表单地址：

- `PUX_FEEDBACK_FORM_URL=https://<your-domain>/forms/pux`
- `PO_FEEDBACK_FORM_URL=https://<your-domain>/forms/po`

## 5) 调整提醒时间

修改 `vercel.json` 的 cron 表达式后重新部署即可。  
注意 Vercel cron 使用 UTC 时区。
