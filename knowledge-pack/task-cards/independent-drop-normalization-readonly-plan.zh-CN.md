# 独立掉落规范化与英雄档只读计划

状态：需验证

用途：识别重复内联掉落池，或按目标真实列形生成英雄档补值 preview。

## 先读

- `dictionaries/independent-drop-normalization-fields.zh-CN.md`
- `workflows/independent-drop-normalization-and-heroic-fill.zh-CN.md`

## 最小输入

- 目标 PVF。
- `normalize-list / heroic-fill / both`。
- heroic-fill 的显式比例；未给比例时只列候选，不计算写入值。

## 执行

1. 读取主体、registry 和少量 sidecar，先审计块边界与列数。
2. 规范化时先复用相同 sidecar，再考虑新 ID。
3. 英雄档必须跳过 `[list]`；type 0 与 type 1 使用不同列位。
4. 输出 shape-unresolved、registry 冲突、读取失败和逐行旧 / 新值。
5. type 0 / 1 必须按目标真实 token 数量和列位分别 readback，不要求两类行同长。
6. 默认不写 PVF，不声称概率实机成立。

## 运行边界

- sidecar、registry、主体引用三者闭合后，可用一次稳定入口的击杀 / 清图 / 清算验证“新路径无读取异常”；未掉出候选物不是失败，也不是概率证明。
- 客户端没有英雄难度入口时记 `BLOCKED_CLIENT_ENTRY`，保留静态 readback 结论，不为该阻断单独重测。
- 普通难度 smoke 不证明英雄列或 type 1 APC 行为。

## 禁止

- 在 `[list]` 内按英雄档列位改数字。
- 对 type 0 / 1 使用同一列位。
- 静默采用 1.5 或其他比例。
- 抽取列表时改变候选顺序、权重或数量。
