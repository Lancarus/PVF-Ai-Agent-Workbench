# Monster Tag 路由

状态：需验证

用途：把 `.mob` 标签问题路由到纯字段知识，不保存历史命中统计。

1. 先通过 `monster/monster.lst` 解析 ID。
2. 读取 `dictionaries/monster-fields.zh-CN.md` 与 `task-cards/monster-mob-readonly-audit.zh-CN.md`。
3. 标签含义用 `workbench.bat knowledge-query tag` 查询，并在目标 `.mob` 中读回父块。
4. 动作、AI、AttackInfo、掉落、召唤与 PassiveObject 分别继续走对应任务卡。

未知标签、历史拼写和大小写变体原样保留；零命中不证明不存在。
