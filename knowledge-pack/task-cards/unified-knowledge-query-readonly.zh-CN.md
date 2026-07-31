# 统一知识查询只读任务卡

状态：默认可用

## 先读

- `dictionaries/unified-knowledge-query-boundary-quick.zh-CN.md`
- `safety/README.zh-CN.md`

## 执行

1. 选择 source、claims、nut、tag、bookmark、lineage、planner 或 client 中唯一 kind。
2. NUT、tag、bookmark 直接查询随包事实；其余 kind 只查询任务明确提供的 artifact。所有查询都限制返回数。
3. 记录 artifact SHA、0 命中边界和专项证据状态。
4. 涉及目标 PVF 时做 raw readback 与 registry 解析。
5. 写入需求切换到受控 `pvf-change`，不能直接 apply 查询结果。

## 禁止

- 不默认加载全部任务 artifact 或来源全文。
- 不把索引命中当最终证据，不把 0 命中当不存在证明。
- 不猜未知 API、数字 ID、registry 或职业分支。
- 不写简体化显示文本或 HTML 数字实体回 PVF。
- 不越权写客户端。
