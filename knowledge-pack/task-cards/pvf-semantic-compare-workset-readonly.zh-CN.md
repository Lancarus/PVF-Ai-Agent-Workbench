# 双 PVF 语义对比与工作集只读分析

状态：默认可用

用途：比较两份 PVF 的路径集合和解析后语义内容，并通过覆盖、并集、交集、Match、Remove 收窄工作集。

## 先读

- `dictionaries/pvf-quality-semantic-analysis-fields.zh-CN.md`
- `workflows/pvf-semantic-compare-workset.zh-CN.md`

## 最小输入

- 两份 `Script.pvf` 及各自角色。
- 路径前缀、扩展名或查询条件。
- 结果上限和是否需要 ST / Section 频次。

## 执行

1. 记录双方完整 SHA。
2. 输出 only-left、only-right、common-equal、common-different、unresolved。
3. 共有路径以解析后语义比较，不用大小相同代替。
4. 每次结果集运算记录输入 / 输出计数；超过 8,000 先收窄。
5. 高命中、高频次、结果相似都不授权批改。

## 禁止

- 隐藏 5,000 条后的截断。
- 把解析失败算作相同或不同。
- 把结果集直接当 apply patch。
- 用裸数字跨 registry 合并搜索结果。

