# Worldmap 副本接口布局词典

状态：默认可用

## 联合模型

```text
worldmap/worldmap.lst
  -> worldmap/*.wdm
       -> [ui path] -> worldmap/ui/*.ui
       -> [dungeon] -> dungeon/dungeon.lst
  .ui IDC_WORLDMAP_BUTTON* / 已确认等价结构
       -> dungeon ID -> dungeon/dungeon.lst
```

`.wdm` 和 `.ui` 是同一页面的两个配置层，必须双向核对；不能只编辑其中一侧。

## `.wdm` 字段

### `[map image]`

状态：默认可用

含义：worldmap 页面图案或地图图像引用。

边界：PVF 中写有路径不证明客户端资源存在、帧号有效或显示正常。

### `[ui path]`

状态：默认可用

含义：本 worldmap 页面对应的 `.ui` 路径。

边界：路径存在不证明控件可点。

### `[dungeon]`

状态：默认可用

含义：页面关联的副本集合。副本 ID 按 `dungeon/dungeon.lst` 解析。

边界：块内可能混有附加列或版本扩展，不能把所有数字都当 dungeon ID。先用目标同类样本确认记录形状。

### `[in progress]`

状态：需验证

含义：页面或入口的任务、进度、版本条件线索。

边界：不能与普通副本列表合并抽数，也不能仅凭静态配置宣布条件已满足。

## `.ui` 字段

### `[ui controls]`

状态：默认可用

含义：UI 控件容器。它可以包含按钮、气泡、背景或其他控件。

边界：不能把所有子控件都当副本入口。

### `IDC_WORLDMAP_BUTTON*`

状态：默认可用

含义：常见 worldmap 副本按钮标识。只有此类标识或已由目标最近邻证明等价的结构，才进入入口集合。

边界：后缀序号只是 UI 控件身份，不自动等于 dungeon ID。

### `[balloon]`

状态：需验证

含义：副本入口气泡/按钮的显示与交互记录，可关联控件坐标、方向、按钮号、资源和 dungeon ID。

边界：列顺序与附加字段需按目标 `.ui` 最近邻确认；不得凭通用 UI 标签盲写。

## 双向核对状态

- `matched`：`.wdm [dungeon]` 与 `.ui` 入口均解析到同一 dungeon。
- `wdm-only`：只在 `.wdm` 出现；可能是任务门控、隐藏入口、版本专用或遗漏。
- `ui-only`：只在 `.ui` 出现；可能是条件按钮、废弃控件或 `.wdm` 漏项。
- `conditional`：由 `[in progress]`、任务或物品条件解释的差异候选。
- `ambiguous`：UI 记录列形、控件类型或 ID 解析不唯一。
- `unresolved`：registry、路径或资源引用无法闭合。

差异状态是审阅结果，不自动等于错误。

## 原子入口计划

新增、删除或移动一个入口时，至少把下列字段作为一个原子计划审阅：

- worldmap registry 与 `.wdm` 身份。
- `.wdm [dungeon]` 成员及条件块。
- `.ui` 控件标识和按钮号。
- dungeon ID 及 `dungeon.lst` 解析结果。
- 控件 X/Y、方向和显示范围。
- dungeon 小图、worldmap 图案、气泡背景/边框等资源候选。
- 与其他入口的重叠、离群和背景有效范围。

任何一项 unresolved 时，不应生成“可以直接应用”的结论。
