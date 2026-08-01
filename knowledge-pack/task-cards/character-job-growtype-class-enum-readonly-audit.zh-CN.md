# Character / Job / GrowType / Class Enum 只读审计卡

状态：默认可用


## 快速结论

- `.chr` 内的 `[growtype name]`、`[growtype N]`、`[awakening name]`、`[awakening N]` 属于该角色文件内部结构，不能脱离角色文件解释成全局转职枚举。
- 技能数字 ID 必须按职业技能 registry 解析。例：ID `254` 在 `swordman`、`atmage`、`priest` registry 下都是 comminterrupt 类技能，但在 `creatormage` registry 下解析为 `CreatorWind.skl`。
- 装备和消耗品大量使用 `[usable job]`，stackable 也可出现 `[item growtype]`；这只说明职业 token 被其它文件族引用，不证明装备可穿、物品可用或服务端放行。

## 首选阅读顺序

1. `dictionaries/character-job-growtype-class-enum-fields.zh-CN.md`
2. `indexes/character-job-growtype-class-enum-boundary.zh-CN.md`
3. `indexes/skill-learnability-tree-command-cooldown-boundary.zh-CN.md`
4. `indexes/skill-tree-default-pvp-entry-boundary.zh-CN.md`
5. `dictionaries/equipment-fields.zh-CN.md`
6. `dictionaries/stackable-fields.zh-CN.md`

## 何时使用

| 问题 | 动作 |
| --- | --- |
| 某个角色 ID 是什么 | 先查 `character/character.lst`，再读对应 `.chr` 的 `[job]` 与 `[growtype name]`。 |
| 某个技能 ID 属于哪个技能 | 先确定父职业 registry，例如 `skill/atmageskill.lst`，再解析 ID。不要用裸数字猜。 |
| 技能树里的 `[index]` 是什么 | 先看同一个 `[character job]` 的职业 token，再按该职业技能 registry 解析。 |
| PVP 技能树里的 `[job index]` / `[grow type index]` 是什么 | 先把 `[job index]` 回到 `character/character.lst` / `skill/skilllist.lst` 同序入口，再在该文件块内解释 growtype 数字。 |
| 装备或消耗品里的 `[usable job]` 是什么 | 只当职业 token 限制字段；是否实际可穿、可用、可交易、可发放必须另测。 |
| 辅助 PVF 有 ATPriest / ATSwordman | 需在当前目标 PVF 中只读确认 |

## 禁止外推

- 不把 `.chr` 里的 growtype 名称写成全局运行时枚举表。
- 不把 skill registry 的数字 ID 写成全局技能 ID。
- 不把 `clientonly/skilltree` 的 UI 排布写成技能可学、可用或显示正常。
- 不把 `etc/pvpskilltree` 写成 PVP 最终规则。
- 不把 NUT 文本里的 `sq_getJob`、`sq_getGrowType` 或 `ENUM_CHARACTERJOB_*` 写成实机行为已验证。
