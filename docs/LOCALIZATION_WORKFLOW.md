# Academy 本地化内容工作流

目标：课程、Quiz、提醒和证据量规可以有独立语言版本，但未审核翻译不得覆盖正式学习内容。

## 1. 生成翻译草稿模板

在 `mini-app` 目录运行：

```bash
npm run content:i18n:template -- --locale vi --course ai-command-skills --days 1-7
```

可选参数：

- `--locale vi|km|th`
- `--course ai-command-skills|english|business|founder-note|quiz`
- `--days 1-7`
- `--source-version v1`
- `--status draft|pending_review`
- `--out content/localization/ai-vi-day1-7.draft.json`

脚本会生成可提交给 Course Review Center 的 JSON，其中：

- `courses[]` 保存课程标题、副标题和简介翻译；
- `lessons[]` 保存课文标题、目标、正文、练习说明和 Quiz；
- `criteriaJson` 保留结构化 Quiz 数据，翻译时只能翻译展示文案，不得修改 option id、JSON key、受控值或课程 ID。

## 2. 填写翻译

翻译时遵守：

- 不翻译代码、命令、产品名、证据 ID、JSON key；
- 不修改 `lessonId`、`courseId`、`correctOptionId`、option `id`；
- 解释可以本地化，但必须保持原题知识点一致；
- 如果不确定，应保留中文并在 review note 标记。

## 3. 导入前校验

在 `mini-app` 目录运行：

```bash
npm run content:i18n:validate -- --file ../content/localization/ai-command-skills-vi-day1-7.draft.json
```

校验会检查：

- `action` 必须是 `import_localization_draft`；
- `locale` 只能是 `vi`、`km`、`th`；
- `status` 必须是 `draft` 或 `pending_review`；
- `allowOverwriteApproved` 必须是 `false`；
- 课程标题、副标题、简介不能为空；
- 每节课标题、目标、正文、练习说明不能为空；
- 每节课的 `criteriaJson.assessment.type` 必须是 `multiple_choice`；
- 每节课必须有 3–5 道选择题；
- 每题必须有问题、选项、正确选项和解释，且 `correctOptionId` 必须匹配某个 option `id`。

校验通过只代表结构可导入，不代表翻译质量已审核。正式展示仍必须经过 Course Review Center 审核。

如果只是检查刚生成、尚未填写的模板骨架，可以运行：

```bash
npm run content:i18n:validate -- --file ../content/localization/ai-command-skills-km-day1-7.draft.json --allow-empty-template
```

模板模式只检查课程 ID、lesson ID、day、Quiz 结构、选项和正确答案映射；空标题、空正文会显示 warning，不代表可以导入发布。

## 4. 导入为 draft

把填写后的 JSON 提交到：

```http
POST /api/academy/admin/course-review
Authorization: Bearer <ACADEMY_CRON_SECRET>
Content-Type: application/json
```

action 为：

```json
{
  "action": "import_localization_draft",
  "locale": "vi",
  "sourceVersion": "v1",
  "status": "draft",
  "allowOverwriteApproved": false,
  "courses": [],
  "lessons": []
}
```

安全规则：

- 默认只写入 `draft` 或 `pending_review`；
- 默认跳过已经 `approved` 的翻译；
- `zh-Hans` 是源语言，不允许作为导入目标；
- 用户端只读取 `approved` 翻译，因此导入 draft 不会影响正式学习内容。

## 5. 审核发布

打开：

```text
/api/academy/admin/course-review
```

确认 Lesson Translation Review 后，通过：

```json
{
  "action": "review_lesson_localization",
  "lessonId": "ai-command-skills-day-001",
  "locale": "vi",
  "status": "approved"
}
```

课程级翻译同理通过 `course_localizations` 导入后，在 Course Review Center 查看覆盖情况；只有 `approved` 翻译会进入用户端。

## 6. 源课程改版后的规则

当质量事件触发 `create_new_version` 后：

1. 新建 draft `course_content_versions`；
2. 相关翻译需要重新检查；
3. 未复核语言继续回退中文审核版；
4. 不允许机器翻译自动覆盖正式课程。

## 7. 非课程文案覆盖检查

课程翻译之外，提醒、支付、退款、邀请裂变、积分账本和个人中心说明也必须有用户当前 UI 语言版本。每次修改这些商业/提醒文案后，在 `mini-app` 目录运行：

```bash
npm run content:i18n:check-copy
```

该检查会覆盖：

- 个人中心、支付状态、Stars 配置状态、退款/发票说明；
- 邀请分享、有效邀请定义、积分账本说明；
- 学习提醒偏好、测试提醒、提醒历史和提醒诊断；
- L1-L4 灰色幽默提醒文案池的中文、越南语、高棉语和泰语结构。

检查通过只代表四语言结构没有漏项，不代表文案质量已经审核。正式发布前仍需由人工检查语气、价格、规则和法律/退款说明是否一致。
