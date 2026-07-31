# Worldmap 副本接口布局只读计划

状态：默认可用

用途：检查一个 worldmap 页面的 `.wdm` 副本集合、`.ui` 按钮、坐标、条件和客户端资源候选是否一致。

## 先读

- `safety/README.zh-CN.md`
- `dictionaries/worldmap-dungeon-interface-layout-fields.zh-CN.md`
- `workflows/worldmap-dungeon-interface-layout.zh-CN.md`

## 执行

1. worldmap ID 通过 `worldmap/worldmap.lst` 解析 `.wdm`。
2. 用 `.wdm [ui path]` 读取对应 `.ui`。
3. `.wdm [dungeon]` 与 UI 入口中的 dungeon ID 分别通过 `dungeon/dungeon.lst` 解析。
4. UI 只识别 `IDC_WORLDMAP_BUTTON*` 或目标已确认的等价入口；不能把所有 `[ui controls]` 当副本按钮。
5. 输出 matched、wdm-only、ui-only、conditional、ambiguous、unresolved。
6. 检查坐标重叠、离群、背景有效范围和资源候选。
7. 新增/删除入口只生成原子计划；默认不写 PVF 或客户端。

## 必须汇报

- `.wdm` 与 `.ui` 的解析路径。
- 两侧入口集合及差异分类。
- 每个按钮的 dungeon registry 结果、坐标、方向和条件。
- 客户端资源仅为候选。
- 需要写出时必须重新取得 raw 文本并走受控生命周期。

## 禁止

- 抽取 `.wdm` 内所有数字当 dungeon ID。
- 把按钮后缀当 dungeon ID。
- 看到 `.wdm` 与 `.ui` 不同就静默补齐或删除。
- 只改 `.ui` 或只改 `.wdm` 后宣称入口已完整。
