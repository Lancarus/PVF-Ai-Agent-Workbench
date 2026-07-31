# PVP Mission 只读审计任务卡

状态：默认可用


## 快速结论

- PVP Mission 的正式入口是 `pvp_mission/mission.lst`，不是 `n_quest/quest.lst`。
- 未注册 `.msn` 只能作为风险桶，不能默认写成可达任务。
- `[condition]` 可覆盖参赛、胜场、击杀、连胜、复仇、剩余 HP、频道移动、晋级和练习模式连击等条件。
- `[reward item]` 必须按父块解析物品 registry；字段细节继续读取 Equipment / Stackable 词典。

## 默认处理

1. 问 PVP Mission 注册链、`.msn` 字段、条件类型、未注册风险时，先读本任务卡。
2. 需要字段解释时，读 `dictionaries/pvp-mission-fields.zh-CN.md`。
3. 需要条件、奖励与未注册风险边界时，读 `indexes/pvp-mission-msn-boundary.zh-CN.md`。
4. 如问题落到普通 Quest，回到 `n_quest/quest.lst` 主线；不要把两条 registry 混用。

## 不能直接下结论

- 文件里写了 `[join]`、`[winning count]`、`[kill count]` 等条件，不等于实机计数器一定增长。
- 文件里写了 `[reward item]`、`[reward skill]`、`[reward sp]`，不等于实机奖励发放成功。
- `prev mission` / `next mission` 静态闭合，不等于 UI 会展示链式任务。
- 未注册 `.msn` 文件存在，不等于任务系统会路由它。

## 下一步测试建议

最小实机测试应只选注册任务：

1. 选一条 `[join]` 或 `[hereafter join]`，确认 PVP 场次计数是否增长。
2. 选一条 `[winning count]`，确认胜场计数是否增长并触发完成。
3. 选一条有 `[reward item]` 的低风险任务，确认完成后背包物品变化。
4. 选一条 `[move_channel]` / `[move_channel_total]`，确认频道移动是否能触发。
5. 对未注册 `.msn` 只做存在性记录，除非先找到显式调用入口。
