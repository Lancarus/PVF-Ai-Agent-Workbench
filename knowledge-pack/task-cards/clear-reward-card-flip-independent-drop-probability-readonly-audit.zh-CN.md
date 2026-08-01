# Clear Reward / Card Flip / Independent Drop / Probability 只读核查

状态：默认可用

用途：用于复核副本清算奖励、翻牌、独立掉落、PC 房/黑钻相关掉落、契约倍率和全局概率/倍率表的静态配置边界。该入口只回答“配置在哪里、数字应按哪个 registry 解析、哪些表互相关联、哪些结论必须实机验证”，不证明翻牌 UI 正常、奖励发放成功、概率实机一致、服务端放行或客户端资源完整。

## 默认读法

1. 先读 `safety/README.zh-CN.md`，确认当前任务只读，不写 PVF、不改客户端。
2. 再读 `dictionaries/clear-reward-card-flip-independent-drop-probability-fields.zh-CN.md`，确认标签和数字上下文。
4. 需要文件类型解释时读 `encyclopedia/pvf-file-types/clearreward-independentdrop-probability.zh-CN.md`。
5. 如果问题转向任务条件、门票、副本入口、怪物掉落、NPC 商店或客户端 UI 资源，转读 Quest、Dungeon、Monster、NPC Shop、Client Assets 等现有主题。

## 核查顺序

2. 全局清算/翻牌优先看 `etc/itemdropinfo_clearreward.etc`，不要把其中权重直接写成真实概率。
3. 全局掉落/奖励/稀有度支持表优先看 `etc/serverparameter.etc` 和相邻 `etc/itemdropinfo_*.etc`。
4. 独立掉落先从 `etc/independentdrop.lst` 解析到 `etc/independentdrop/*.etc`，再读每个文件的 `[list]`。
5. `[list]`、`[gold card blank item]`、`[pcroom card blank item]`、`[clear reward item]`、`[reward item rate]` 中的物品数字必须按字段上下文解析到 `stackable/stackable.lst` 或 `equipment/equipment.lst`，不能凭数字外形猜。
6. dungeon 特例标签只在 `.dgn` 父块内解释，例如 `[clear reward item]`、`[advance altar clear reward]`、`[result card]`、`[gold card use]`、`[gold drop prob]`。

## 可接受结论

- 可以说 dungeon 中观察到若干清算/翻牌/掉落概率特例标签，并列出命中范围。
- 可以说同一个数字跨 registry 可能含义不同，必须按父块上下文解析。

## 禁止结论

- 不把静态权重、倍率、概率表写成真实掉率。
- 不把 `[gold card create rate]` 或 `[gold card cost table]` 写成金币扣除成功。
- 不把 `[gold card blank item]`、`[pcroom card blank item]`、`[clear reward item]` 写成物品实机发放成功。
- 不把 PC 房、黑钻、premium、growth 字段写成服务端特权生效。
- 不把 `.dgn [gold card use]` 写成翻牌 UI 正常。

## 验收提示

日常问到“翻牌概率在哪”“独立掉落怎么查”“为什么数字不能直接当物品 ID”“黑钻卡/PC 房掉落和清算翻牌是什么关系”等问题，先从本 task-card 进入。若要证明概率、发放、扣费、入口放行或 UI 正常，必须进入后续实机或客户端/服务端验证阶段。
