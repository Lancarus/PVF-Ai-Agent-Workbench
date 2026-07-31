# Character / Job / GrowType / Class Enum Boundary

状态：需验证


## 方法边界

- 先使用既有职业 token、usable job、growtype、技能树、NUT job/growtype 调用等内容做定向线索；线索只决定检查方向，不直接进入 Workbench 结论。
- 数字 ID 必须回到父块和正确 registry；不能按数字外形猜全局含义。


| ID | `character/character.lst` | `.chr [job]` | `skill/skilllist.lst` | `.chr [growtype name]` 首层列表 |
| ---: | --- | --- | --- | --- |
| 0 | `Swordman/Swordman.chr` | `[swordman]` | `SwordmanSkill.lst` | 鬼剑士、剑魂、鬼泣、狂战士、阿修罗、征服者 |
| 1 | `Fighter/Fighter.chr` | `[fighter]` | `FighterSkill.lst` | 格斗家、气功师、散打、街霸、柔道家、格斗家 |
| 2 | `Gunner/Gunner.chr` | `[gunner]` | `GunnerSkill.lst` | 神枪手、漫游枪手、枪炮师、机械师、弹药专家、待确认占位 |
| 3 | `Mage/Mage.chr` | `[mage]` | `MageSkill.lst` | 魔法师、元素师、召唤师、战斗法师、魔道学者、魔法师 |
| 4 | `Priest/Priest.chr` | `[priest]` | `PriestSkill.lst` | 圣职者、圣骑士、蓝拳圣使、驱魔师、复仇者、待确认占位 |
| 5 | `Gunner/ATGunner.chr` | `[at gunner]` | `ATGunnerSkill.lst` | 神枪手、漫游枪手、枪炮师、机械师、弹药专家、神枪手 |
| 6 | `Thief/Thief.chr` | `[thief]` | `ThiefSkill.lst` | 暗夜使者、刺客、死灵术士、忍者、影武者、暗夜使者 |
| 7 | `Fighter/ATFighter.chr` | `[at fighter]` | `ATFighterSkill.lst` | 格斗家、气功师、散打、街霸、柔道家、格斗家 |
| 8 | `Mage/ATMage.chr` | `[at mage]` | `ATMageSkill.lst` | 魔法师、元素爆破师、冰结师、战斗法师、魔道学者、魔法师 |
| 9 | `Swordman/DemonicSwordman.chr` | `[demonic swordman]` | `DemonicSwordman.lst` | 黑暗武士、剑魂、鬼泣、狂战士、阿修罗、征服者 |
| 10 | `Mage/CreatorMage.chr` | `[creator mage]` | `CreatorMage.lst` | 创造者、元素师、召唤师、战斗法师、魔道学者、魔法师 |


## 入口覆盖矩阵

| 小桶 | 目标核验 | 结论 |
| --- | ---: | --- |
| `character/character.lst` | 需在当前目标 PVF 中只读确认 | 角色注册主入口。 |
| `character/**/*.chr` | 需在当前目标 PVF 中只读确认 | 目标 PVF 中需确认的 `.chr` 均与 `character.lst` 注册项对应。 |
| `skill/skilllist.lst` | 需在当前目标 PVF 中只读确认 | 职业技能 registry 入口，与角色顺序一致。 |
| `skill/autoskill.lst` | 需在当前目标 PVF 中只读确认 | 只覆盖 `0-8`，缺少 `DemonicSwordman` / `CreatorMage` autoskill 入口。 |
| `clientonly/skilltree/` | 需在当前目标 PVF 中只读确认 | SP/TP 技能树文件族；`Creator` 只有 `creator_sp.co`，未观察到 `creator_tp.co`。 |
| `etc/pvpskilltree/` | 需在当前目标 PVF 中只读确认 | PVP 技能树文件族；未观察到 demonic swordman、creator mage、atpriest、atswordman PVP 文件。 |
| `sqr/` `sq_getJob` | 需在当前目标 PVF 中只读确认 | 脚本文本存在 job 读取调用。 |
| `sqr/` `sq_getGrowType` | 需在当前目标 PVF 中只读确认 | 脚本文本存在 growtype 读取调用。 |

## 字段形态边界

| 场景 | 字段形态 | 目标核验 | 风险 |
| --- | --- | --- | --- |
| 角色注册 | `character/character.lst` 数字 ID -> `.chr` | 需在当前目标 PVF 中只读确认 | 不证明角色可创建。 |
| 职业 token | `.chr [job]` | 需在当前目标 PVF 中只读确认 | token 拼写空格很重要。 |
| growtype 名称 | `.chr [growtype name]` | 需在当前目标 PVF 中只读确认 | 不等于全局枚举。 |
| growtype 分块 | `.chr [growtype N]` | 需在当前目标 PVF 中只读确认 | 不证明转职开放或 UI 正常。 |
| 默认技能 | `.chr [skill]` | 需在当前目标 PVF 中只读确认 | 不证明创建后实际拥有。 |
| SP/TP 技能树 | `[character job]` + `[index]` | 需在当前目标 PVF 中只读确认 | 不证明技能可学。 |
| PVP 技能树 | `[job index]` + `[grow type index]` | 需在当前目标 PVF 中只读确认 | 不证明 PVP 最终规则。 |
| AutoSkill | `[job]` + `[growtype]` | 需在当前目标 PVF 中只读确认 | 不证明自动加点或创建默认技能实机生效。 |
| 装备/消耗品限制 | `[usable job]` | 需在当前目标 PVF 中只读确认 | 不证明可穿、可用或服务端放行。 |
| 道具 growtype | `[item growtype]` | 需在当前目标 PVF 中只读确认 | 不证明技能加成实机成功。 |

## 跨 registry 数字 ID 样本

| ID | 上下文 registry | 目标核验 | 结论 |
| ---: | --- | --- | --- |
| 7 | `skill/ATMageSkill.lst` | 需在当前目标 PVF 中只读确认 | 技能 ID 必须带职业上下文。 |
| 222 | `skill/ATMageSkill.lst` | 需在当前目标 PVF 中只读确认 | 同一数字在不同职业下可不同。 |
| 222 | `skill/PriestSkill.lst` | 需在当前目标 PVF 中只读确认 | 不能用裸 ID 解释技能。 |
| 174 | `skill/SwordmanSkill.lst` | 需在当前目标 PVF 中只读确认 | 可与其它职业同名但路径不同。 |
| 174 | `skill/ATMageSkill.lst` | 需在当前目标 PVF 中只读确认 | 同名不等于同一文件或同一运行行为。 |
| 254 | `skill/SwordmanSkill.lst` | 需在当前目标 PVF 中只读确认 | comminterrupt 类样本之一。 |
| 254 | `skill/ATMageSkill.lst` | 需在当前目标 PVF 中只读确认 | 同数字按职业变路径。 |
| 254 | `skill/PriestSkill.lst` | 需在当前目标 PVF 中只读确认 | 同数字按职业变路径。 |
| 254 | `skill/CreatorMage.lst` | 需在当前目标 PVF 中只读确认 | 同数字不保证同类技能。 |


| 项 | 跨版本候选；需在当前目标 PVF 中复核 | 处理方式 |
| --- | --- | --- |
| `character/character.lst` | 仍为 11 entries，但 ID `9` / `10` 为 `ATPriest` / `ATSwordman`。 | 需在当前目标 PVF 中只读确认 |
| `character/**/*.chr` | 13 files，包含 `DemonicSwordman`、`CreatorMage`、`ATPriest`、`ATSwordman`。 | 文件存在不等于角色注册；仍以父 registry 为准。 |
| `skill/skilllist.lst` | ID `9` / `10` 为 `ATPriestSkill.lst` / `ATSwordmanSkill.lst`。 | 需在当前目标 PVF 中只读确认 |
| `clientonly/skilltree/` | 25 files，含 `atpriest_sp/tp` 和 `atswordman_sp/tp`。 | 可作为未来差异复核方向。 |
| `etc/pvpskilltree/` | 需在当前目标 PVF 中只读确认 | 不说明缺失职业在 PVP 实机不可用，只记录静态入口缺口。 |
| 通用 registry 工具列表 | 可能不展示 `ATPriestSkill.lst` / `ATSwordmanSkill.lst` 为默认主 registry。 | 以实际父入口文件为准，不只看工具标签清单。 |

## 可复用规则

- 角色 ID 先走 `character/character.lst`。
- 职业技能 ID 先确定职业，再走对应 `skill/*Skill.lst` 或同级职业技能 `.lst`。
- `at` 前缀按独立角色/分支 token 处理；`atgunner`、`atmage`、`atfighter` 不解释为觉醒、TP 或 Ex 阶段。
- 技能树 `[index]` 先看同块 `[character job]`，再按职业 registry 解析。
- PVP `[job index]` 先回到角色/技能入口顺序，再解释同块 `[grow type index]`。
- `[usable job]` 只记录职业 token 限制，不证明实机可用。
- NUT 中的 job/growtype 调用只证明脚本文本存在相关读取点，不证明运行分支触发。

## 未证明事项

- 不证明新建角色、转职、觉醒、技能学习、自动加点、SP/TP 扣点、命令释放或冷却实机正确。
- 不证明装备/消耗品/称号/时装/宝珠等职业限制在客户端或服务端实际生效。
- 不证明任务职业限制、PVP 技能表、UI 技能树、客户端资源、NUT 分支或服务端枚举一致。
