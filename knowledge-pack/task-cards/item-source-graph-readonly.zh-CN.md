# 物品来源图只读查询

状态：默认可用

用途：反查一个目标物品在任务、掉落、商店、礼包、摇号和配方中的静态来源。

## 先读

- `dictionaries/item-source-graph-fields.zh-CN.md`
- `workflows/item-source-graph.zh-CN.md`

## 最小输入

- 目标 PVF。
- 物品路径，或“registry + ID”。
- 可选来源类别。

## 执行

1. 先闭合物品 registry 身份并读回目标脚本。
2. 按来源桶窄扫描，记录每条边的文件和父块。
3. 与目标 itemdictionary 对照，分开 dictionary-only、source-only、unresolved。
4. 0 命中只说明本次静态范围未观察到。

## 禁止

- 只按名称或裸数字反查。
- 把 itemdictionary 记录当最终来源证明。
- 直接用生成图覆盖 itemdictionary 大表。
- 把权重或掉落表写成实机发放事实。

