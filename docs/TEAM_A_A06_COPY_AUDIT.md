# Team A — A-06 商业关键文案多语言复核

> Task ID：ACAD-A-006  
> 范围：Profile 页的商业关键文案（订阅/试用/到期、积分抵扣、结算预览、活动摘要、邀请返积分规则、支付结果状态）。

## 1. 已完成的多语言覆盖

已将以下关键文案全部纳入 `copyFor()`（支持 `zh-Hans` / `vi` / `km` / `th`）：

- 权益状态：trial / paid / reward / expired
- 积分抵扣：开启/关闭、切换按钮、锚定比例与单次抵扣上限提示
- 结算预览：标题与一行摘要（原价/主优惠/积分/应付）
- 锁单中状态文案
- 支付结果状态：pending / paid / failed / cancelled
- 活动摘要：标题、无活动占位、截止时间前缀
- 邀请返积分：标题、阶梯规则、有效邀请定义、下一位返利提示

对应代码位置：

- 多语言字典：[i18n.ts](file:///e:/academy/mini-app/lib/i18n.ts)
- Profile 视图使用：[page.tsx](file:///e:/academy/mini-app/app/page.tsx)

## 2. 仍需后续补齐的非关键文案（不阻断当前商业闭环）

以下属于非商业关键文案，当前仍存在硬编码中文，后续可在 A-06 之外逐步统一：

- 分享文案（shareAcademy 的分享正文）
- Telegram Stars 配置说明与 Founder 提示
- 课程与学习监督部分的部分提醒/说明文案

## 3. 结论

Profile 页的商业关键文案已具备四语言覆盖，满足“先保证付费/结算/奖励口径一致”的交付标准。
