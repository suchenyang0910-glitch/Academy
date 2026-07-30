# Telegram Mini App 真机验收清单

更新时间：2026-07-28

这份清单用于每次发布后在真实 Telegram Mini App 里手动验收。它不替代自动化测试；它负责覆盖自动化测试看不到的 Telegram WebView、键盘、Stars、提醒、分享和移动端体验。

验收原则：

- 先跑服务器命令，再做真机点击。
- 只要 P0 项失败，就不要邀请新用户进入。
- 支付、邀请、提醒、学习证据必须以服务端记录为准，不能只看前端提示。
- iOS 和 Android 至少各测一次；如果只能测一台，优先 iOS，因为键盘和 WebView 更容易出怪毛病。

---

## 使用验收记录

每次真机验收前，建议先在 `mini-app` 目录生成一份记录文件：

```bash
npm run acceptance:new -- --operator "founder" --device "iPhone / Telegram"
```

生成的文件位于 `docs/acceptance-runs/`，用于记录设备、环境、P0 勾选项、失败原因和最终结论。它不是自动验收；它是把真实点击结果沉淀下来，方便 7–10 天个人试用和邀请第二位用户前复盘。

完成真机点击后，把记录文件里的 `acceptance_result: TODO` 改成 `acceptance_result: pass`，再执行：

```bash
npm run acceptance:validate -- --file ../docs/acceptance-runs/<记录文件名>.md
```

只有当所有 P0 勾选项都完成、且机器判定为 `pass` 时，才视为本轮真机验收通过。

---

## 0. 发布前服务器门禁

在 VPS 的 `/srv/academy/app/mini-app` 执行：

```bash
npm install
npm run deploy:check
```

验收标准：

- [ ] 输出包含 `OK postgres production schema`
- [ ] 输出包含 `restart_safe=yes`
- [ ] 输出包含 `next_action=restart_academy_service`
- [ ] 没有 `restart_safe=no`
- [ ] 没有 `Missing tables`
- [ ] 没有 `Missing indexes`
- [ ] 没有 `Missing migration`
- [ ] 没有 `Checksum mismatch`

通过后再执行：

```bash
sudo systemctl restart academy
sudo systemctl status academy --no-pager
curl -I https://academy.linkx.club
```

验收标准：

- [ ] `academy.service` 为 active/running
- [ ] `curl -I` 返回 200 或 30x，不返回 5xx

---

## 1. 进入与身份

从 Telegram Bot 打开 Mini App。

- [ ] 页面能打开，不显示“连接暂时走神了”
- [ ] 个人中心显示 Telegram ID
- [ ] 显示头像或头像占位
- [ ] 显示昵称
- [ ] 显示用户名（如果 Telegram 有）
- [ ] 显示语言
- [ ] 显示时区
- [ ] 显示当前课程数
- [ ] 刷新/关闭重开后仍能识别同一用户

失败处理：

- 如果身份为空：检查 Telegram initData 验证、Bot 打开入口、`ACADEMY_ALLOW_FOUNDER_PREVIEW`。
- 如果页面 401：确认从 Telegram Mini App 内打开，不要直接浏览器访问需要身份的接口。

---

## 2. UI 语言切换

在“我的”页切换语言。

- [ ] 中文可保存并刷新后保持
- [ ] 越南语可保存并刷新后保持
- [ ] 高棉语可保存并刷新后保持
- [ ] 泰文可保存并刷新后保持
- [ ] 底部 Tab 文案跟随语言变化
- [ ] 支付/邀请/提醒/个人中心文案跟随语言变化
- [ ] 课程正文缺少翻译时显示中文审核版提示，不假装已翻译

失败处理：

- 如果 UI 语言不保存：检查 `users.ui_locale` 写入和 `/api/academy/preferences`。
- 如果某语言页面出现空白：优先检查 `runtime-copy.ts` 和 `i18n.ts` 是否缺 key。

---

## 3. 选课与课程状态

进入课程页。

- [ ] 未选课用户会看到课程选择入口
- [ ] 至少选择 1 门课程后可进入今日学习
- [ ] 最多只能选择 3 门课程
- [ ] 允许中途更换课程
- [ ] 换课不会删除过去学习证据
- [ ] 每门课程独立显示 Day / 进度
- [ ] 当前课程数在个人中心更新

失败处理：

- 如果选课后今日页为空：检查 enrollments、lessons、`/api/academy/bootstrap`。
- 如果超过 3 门仍可保存：这是 P0 阻断，必须修。

---

## 4. 今日 Mission 与课程学习

进入今日页。

- [ ] 今日页优先展示 Today Mission / 当前课程任务
- [ ] 每个已选课程都有对应今日任务
- [ ] 课程正文先展示知识内容，再进入检查/作业
- [ ] AI Day 1 不直接要求复杂 Prompt，而是先讲 AI 基础概念和人机分工
- [ ] “继续多学一点”能打开额外学习内容
- [ ] 额外学习不会错误推进主线 Day

失败处理：

- 如果正文没有教学内容直接要求作业：课程内容需要回到“知识 → 示例 → 检查 → 实操”结构。
- 如果额外学习推进主线：检查 `learningAhead` / `isExtra`。

---

## 5. 选择题检查与提交

进入一节课程的课后检查。

- [ ] 选择题数量为 3–5 道
- [ ] 题目来自本课关键知识点
- [ ] 没选完时不能提交
- [ ] 答错时显示解释
- [ ] 至少达到通过规则后能提交学习证据
- [ ] 提交成功后今日任务状态更新
- [ ] 修正后重新提交可用
- [ ] 主观输入只作为实操证据/反思，不作为基础知识唯一通过条件

失败处理：

- 如果用户明明理解但选择题过不去：题目或正文知识点需要进入 Course Quality Review。
- 如果自然语言匹配仍决定通过：与需求不符，应改回选择题/规则评分。

---

## 6. 移动端输入体验

在 iOS 和 Android 分别测试。

- [ ] 输入框聚焦后页面不会整体放大
- [ ] 键盘弹出后提交按钮不被挡住
- [ ] 长文本输入不卡死
- [ ] 关闭键盘后页面可继续滚动
- [ ] 底部 Tab 不遮挡关键按钮

失败处理：

- iOS 放大通常是输入字号小于 16px 或 viewport/容器滚动问题。
- 按钮被挡通常需要检查 lesson page sticky footer 和 safe-area。

---

## 7. 笔记与进度

进入笔记页和进度页。

- [ ] 可保存一条学习笔记
- [ ] 保存后刷新仍存在
- [ ] 笔记不要求绑定某一课也能保存
- [ ] 进度页显示有效学习日
- [ ] 进度页显示 evidence 数量
- [ ] 进度页显示能力图谱或能力节点状态
- [ ] 能力证明导出可用（JSON / Markdown）

失败处理：

- 如果进度只按打开次数计算：不符合 Evidence-first。
- 如果笔记保存失败：检查 `/api/academy/notes` 和数据库权限。

---

## 8. Telegram 提醒

在“我的”页测试提醒。

- [ ] 显示提醒开关/提醒窗口
- [ ] 显示下一次提醒时间或诊断原因
- [ ] 点击“发送测试提醒”后 Telegram 收到 Bot 消息
- [ ] 提醒历史新增记录
- [ ] delivered / failed 状态可见
- [ ] 连续中断时页面显示阻断原因
- [ ] 已完成今日任务后不会继续错误催促

服务器补充检查：

```bash
sudo systemctl status academy-reminders.timer --no-pager
sudo journalctl -u academy-reminders.service -n 80 --no-pager
```

推荐补充执行：

```bash
set -a
source /etc/academy/academy.env
set +a

npm run reminders:check -- --base-url https://academy.linkx.club
```

验收标准：

- [ ] 输出包含 `reminder_health=ok`
- [ ] 输出包含 `systemd_checked=yes`
- [ ] 输出包含 `next_action=send_test_reminder_from_mini_app_and_confirm_telegram_delivery`

失败处理：

- 如果测试提醒收不到：先查 Bot token、Telegram ID、webhook、Bot 是否被用户拉黑。
- 如果页面显示中断但没消息：查 reminder timer/service 与 reminder event 写入。

---

## 9. Telegram Stars 支付状态

在“我的”页查看 Access Status。

- [ ] $9.9/月目标价展示正确
- [ ] Stars 未配置时显示“待定/禁用原因”，不能创建发票
- [ ] Stars 已配置时显示实际 Stars 数
- [ ] 点击支付必须在 Telegram Mini App 内打开 invoice
- [ ] paid / pending / failed / cancelled 状态都有清晰提示
- [ ] 前端 paid 不单独发放权限，必须等 Telegram successful_payment 服务端回调
- [ ] refunded_payment 后权益状态可追踪

失败处理：

- 如果 Stars 仍待定：检查 `ACADEMY_STARS_MONTHLY` 或别名变量、`TELEGRAM_BOT_TOKEN`、`TELEGRAM_WEBHOOK_SECRET`。
- 如果支付成功但权限不变：优先查 Telegram webhook 和 `payment_transactions`。

---

## 10. 邀请与裂变

在“我的”页测试邀请。

- [ ] 显示邀请链接或分享入口
- [ ] 可复制邀请链接
- [ ] 被邀请者打开后记录 start parameter
- [ ] 仅注册不算有效邀请
- [ ] 被邀请者完成认证、选课、付费并产生有效学习行为后才 qualified
- [ ] 邀请奖励进入 `credits_ledger`
- [ ] 前 3 个有效邀请奖励比例为 10% / 15% / 20%
- [ ] 第 4 个起固定 10%
- [ ] 重复邀请/空账号不会发奖

失败处理：

- 如果注册就算有效：这是反刷漏洞，必须修。
- 如果奖励没有进账本：检查 `credits_ledger.business_key` 幂等逻辑。

---

## 11. 后台只读检查

使用 `ACADEMY_CRON_SECRET` 查看后台。

```bash
curl -sS \
  -H "Authorization: Bearer ${ACADEMY_CRON_SECRET}" \
  https://academy.linkx.club/api/academy/admin/bot/validation-dashboard \
  -o /tmp/academy-validation-dashboard.html
```

- [ ] Dashboard 可访问
- [ ] 未带 Bearer Token 时不能访问
- [ ] 可看到 Seed Users
- [ ] 可看到 FWPR-7
- [ ] 可看到 Day21 DoD
- [ ] 可看到 Evidence 提交率
- [ ] 可看到 Quiz Needs Review
- [ ] 可看到 Payment / Referral funnel
- [ ] 可看到 Reminder Conversion

---

## 12. P0 发布判定

全部满足才允许邀请新用户：

- [ ] 服务器 `deploy:check` 通过
- [ ] Mini App 能从 Telegram 打开
- [ ] 身份、语言、选课、今日任务可用
- [ ] 选择题提交闭环可用
- [ ] 笔记和进度可用
- [ ] 测试提醒可收到
- [ ] Stars 状态不会误导用户
- [ ] 邀请规则不把空账号算有效
- [ ] 页面没有 iOS 放大和键盘挡按钮问题

如果只自己试用，可以允许 P1/P2 项未完成；如果邀请第二位用户，P0 必须全部通过。
