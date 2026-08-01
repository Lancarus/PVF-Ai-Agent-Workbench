# Upgrade / Reinforce / Amplify / Enchant / Recipe 只读核查

状态：默认可用

用途：用于复核装备强化/增幅字段、强化保护标记、强化概率和费用修饰、副职业制作修饰、附魔卡片、徽章附魔、配方道具、配方商店和 `etc/itemdictionary` 配方索引的静态边界。本文只回答“配置在哪里、数字按哪个父块和 registry 解释、哪些结论必须继续实机验证”，不证明强化成功、增幅成功、附魔成功、制作成功、材料扣除成功、金币扣除成功、NPC UI 正常、客户端资源完整或服务端放行。

## 默认读法

1. 先读 `safety/README.zh-CN.md`，确认当前任务只读，不写 PVF。
2. 再读 `dictionaries/upgrade-reinforce-amplify-enchant-recipe-fields.zh-CN.md`，确认字段和父块边界。
4. 需要文件类型解释时读 `encyclopedia/pvf-file-types/upgrade-reinforce-amplify-enchant-recipe.zh-CN.md`。
5. 如果问题转向 NPC 商店、装备基础字段、stackable 容器、随机词条、活动奖励、客户端 UI 或资源加载，转读对应现有主题，不在本主题扩大采样。

## 核查顺序

2. 装备强化/增幅先读 `.equ` 本体：`[equipment upgrade]`、`[not amplify]`、`[limit upgradable level]`、`[possible kiri protect]`、`[impossible contents]`。
3. 强化概率和费用修饰先读 `.equ` 本体：`[upgrade prob increase]`、`[upgrade cost discount]`、`[assault cost discount]`。不要把文本说明当公式。
4. 副职业制作修饰必须把 `[expertjob only]` 和同文件的 `[prof ...]` 字段一起读。
5. 配方道具先读 `stackable/... .stk` 的 `[stackable type]`、`[int data]`、`[bead item]`、`[string data]`，再按父块解析其中的 stackable/equipment 候选。
6. 配方商店先读 NPC `[role]` 中的 `[item shop]` ID，再走 `itemshop/itemshop.lst` 和对应 `.shp [sell item]`。
7. 附魔卡片先读 `stackable/monstercard/*.stk`，确认 `[string data]` 的目标装备 token、`[int data]` 的卡面/怪物样列、`[enchant]` 内属性块和可选 `[need material]`。
8. 徽章也可出现 `[enchant]`，但它属于 avatar emblem/socket 边界，不能和怪物卡片附魔混成同一规则。
9. 裸数字必须按父块和正确 registry 解析。若同一数字跨 registry 命中，以当前父块决定，不按数字外形猜。

## 可接受结论


## 禁止结论

- 不把 `[possible kiri protect]` 写成保护券一定生效。
- 不把 `[upgrade prob increase]`、`[upgrade cost discount]` 的静态数值写成最终强化概率或最终扣费公式。
- 不把 `[equipment upgrade]` 条件写成强化/增幅操作成功。
- 不把 `[not amplify]` 写成服务端一定拒绝增幅，只能写为静态禁止增幅标记。
- 不把 `[limit upgradable level]` 写成实机等级限制一定生效。
- 不把 `[prof compound rate]`、`[prof result variation]`、`[prof material variation]` 等写成制作成功、产物翻倍或材料扣减成功。
- 不把配方 `[int data]` 的所有列硬命名为通用公式；只能按样本和父块解释。
- 不把 `.shp [sell item]` 写成 NPC 商店 UI 显示、购买成功或金币扣除成功。
- 不把 `[enchant]` 写成附魔成功、卡片消耗成功或装备属性实际改变。

## 验收提示

日常问到“强化字段在哪”“增幅书/净化书怎么闭合”“附魔卡片和配方怎么查”“为什么配方数字不能直接改”“为什么辅助 PVF 有更多配方”时，先从本文进入。若要证明强化、增幅、附魔、制作、购买、材料扣除、金币扣除、NPC UI 或服务端规则，必须进入后续实机或服务端验证阶段。
