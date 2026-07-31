# Clear Reward / Card Flip / Independent Drop / Probability Boundary

状态：默认可用


| 层 | 目标核验 | 结论 |
| --- | --- | --- |
| `etc/independentdrop.lst` | 需在当前目标 PVF 中只读确认 | 独立掉落 ID 稀疏；entry count 不是 ID 上限。 |
| `etc/independentdrop/*.etc` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| 独立掉落 `[list]` | 需在当前目标 PVF 中只读确认 | `[list]` 是候选列表形态；候选 ID 需按 registry 解析，不都是 stackable。 |
| `etc/itemdropinfo_clearreward.etc` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[drop prob]` profile | 需在当前目标 PVF 中只读确认 | count 与 profile 标签数量不强行等同；只记录观察形态。 |
| 金牌/PC 房空白卡候选 | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `etc/serverparameter.etc` | 需在当前目标 PVF 中只读确认 | 这是全局概率/倍率支持表，不能写成服务端实机采用。 |
| `etc/bloodclearreward.etc` | 需在当前目标 PVF 中只读确认 | 属于特殊清算奖励权重表，不等同于普通翻牌表。 |
| `etc/worlddroppcroom*.etc` | 需在当前目标 PVF 中只读确认 | PC 房/黑钻世界掉落是相邻掉落配置族，不是清算翻牌本体。 |
| `etc/premiumlist*.etc` | 需在当前目标 PVF 中只读确认 | 契约/成长倍率是加成线索，不证明服务端特权生效。 |

## Dungeon 标签命中矩阵

| 标签 | 目标核验 | 目标核验 |
| --- | ---: | --- |
| `[clear reward item]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[advance altar clear reward]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[advance altar survival clear reward]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[gold card use]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[reward item rate]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[result card]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[tournament clear reward gold rate]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[tournament clear reward exp]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[gold drop prob]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[common monster item drop prob]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[common champion item drop prob]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[super champion item drop prob]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |
| `[boss item drop prob]` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 |


| 样本 | 只读确认 | 用途 |
| --- | --- | --- |
| `etc/independentdrop.lst` | 10 个注册条目；路径大小写混用但实际文件可在 `etc/independentdrop/` 下读到。 | 证明 registry 到文件存在性闭合，且 ID 稀疏。 |
| `etc/independentdrop/1_magneus_normal.etc` | `[list]` 中多组 stackable 候选与权重/数值。 | 证明独立掉落常见候选列表形态。 |
| `etc/independentdrop/991hongse.etc` | `[list]` 中多组高位装备 ID，统一权重。 | 证明独立掉落候选不只限 stackable。 |
| `etc/itemdropinfo_clearreward.etc` | 金牌、PC 房卡、稀有度基准、难度/队伍倍率、item drop ref table 共存。 | 证明清算/翻牌核心支持表是多块组合，不是单一概率字段。 |
| `dungeon/towers/chn_event_01.dgn` | `[clear reward item]` 中观察到物品 ID 与数量列。 | 证明 dungeon 可以自带清算奖励物品。 |
| `dungeon/advancealtar/advancealtar_stage_01.dgn` | `[advance altar clear reward]` 中按 easy/medium/hard 子块列出候选。 | 证明特殊副本可有专用清算奖励结构。 |
| `dungeon/advancealtar/advancealtar_survival_01.dgn` | `[advance altar survival clear reward]` 中按 `[round]` 与 `[list]` 组织奖励。 | 证明轮次型清算奖励结构存在。 |
| `dungeon/shonantournament/bluedragon.dgn` | `[result card]` 内含 `[reward item rate]`，并有大会金币/经验清算标签。 | 证明结果卡与大会清算奖励是 dungeon 特例结构。 |
| `dungeon/warroom/grenselos20-30.dgn` | `[gold drop prob]` 和多类怪物 item drop prob 值为 0；对应 item drop list 为空。 | 证明特殊 dungeon 可显式关闭/置空掉落块，但不能推广到全局。 |

## ID 解析样本

| 数字 | 正确上下文 | 目标核验 |
| --- | --- | --- |
| `7279` | `etc/itemdropinfo_clearreward.etc [gold card blank item]` 候选物品 | 需在当前目标 PVF 中只读确认 |
| `7454` | `[pcroom card blank item]` 候选物品 | 需在当前目标 PVF 中只读确认 |
| `7455` | `[pcroom card blank item]` 与 `worlddroppcroom.etc [world drop]` 候选物品 | 需在当前目标 PVF 中只读确认 |
| `2651400` | 独立掉落 `[list]` 候选 | 需在当前目标 PVF 中只读确认 |
| `690060026` | 独立掉落 `[list]` 候选 | 需在当前目标 PVF 中只读确认 |
| `2019664` | 独立掉落高位候选 | 需在当前目标 PVF 中只读确认 |
| `10005022` | dungeon `[clear reward item]` 候选 | 需在当前目标 PVF 中只读确认 |
| `10005004` | dungeon `[clear reward item]` 候选 | 需在当前目标 PVF 中只读确认 |
| `2749211` | 极限祭坛清算奖励候选 | 需在当前目标 PVF 中只读确认 |
| `2749213` | 极限祭坛清算奖励候选 | 需在当前目标 PVF 中只读确认 |
| `900` | 极限祭坛 event 候选 | 需在当前目标 PVF 中只读确认 |
| `3323` | 青龙大会 `[reward item rate]` 候选 | 需在当前目标 PVF 中只读确认 |
| `31013` | `serverparameter.etc [premium card drop]` 样本数字 | 需在当前目标 PVF 中只读确认 |


- `etc/itemdropinfo_clearreward.etc` 是清算/翻牌支持表，不是唯一掉落概率来源。
- `etc/serverparameter.etc` 是全局概率/倍率支持表，不替代 dungeon、quest、monster 或 independentdrop 的局部配置。
- `etc/independentdrop.lst` 是独立掉落 registry；独立掉落候选 ID 可能落在 stackable 或 equipment。
- `etc/worlddroppcroom*.etc` 是 PC 房/黑钻世界掉落相邻表；与 `[pcroom card blank item]` 有物品层关联，但不等同于翻牌。
- `.dgn` 内的 `[clear reward item]`、`[advance altar clear reward]`、`[result card]`、`[gold card use]` 等是 dungeon 局部特例，不代表全局。
- 权重、倍率、阈值、profile 名称和 tag 存在都只能证明静态配置存在。


| 项 | 跨版本候选；需在当前目标 PVF 中复核 |
| --- | --- |
| registry 规模 | 需在当前目标 PVF 中只读确认 |
| 独立掉落路径 | 跨版本候选；需在当前目标 PVF 中复核 |
| clearreward 文件 | 同样存在 `etc/bloodclearreward.etc` 与 `etc/itemdropinfo_clearreward.etc`。 |
| clearreward 内容 | 需在当前目标 PVF 中只读确认 |
| PC 房相关 | PC 房相关文件更多，并观察到一组 raid reward UI 动画文件；这只提示辅助目标有更多客户端/UI 线索。 |
| dungeon 标签 | `[clear reward item]` 3 个、`[advance altar clear reward]` 13 个、`[gold card use]` 23 个、`[reward item rate]` 2 个、`[result card]` 2 个、warroom 掉落概率类 5 个。 |

## 静态不能证明

- 不能证明 `drop prob`、`bonusrate`、`weight`、`basis`、`dicision` 表示的数值就是实机最终概率。
- 不能把上述局部样本外推为所有 dungeon 的 boss 判定、轮次计数、任务条件、门票扣除或物品条件。
- 不能证明客户端 UI、动画、ImagePacks2 或音频资源完整。

## 后续工作入口

- 要查任务奖励、任务掉落或门票：转 Quest / Type / Reward / Drop / Ticket Boundary。
- 要查副本入口、地图、怪物刷新或 clear 条件：转 Dungeon / Map / Spawn / Entry / Clear / Resource Boundary。
- 要查怪物自身掉落：转 Monster 或 Monster AI / Action / Attack Cross-Layer Boundary。
- 要查礼包、随机箱、袖珍罐内部候选池：转 Stackable Container / Package Boundary。
- 要证明概率或发放：进入实机测试或服务端运行验证阶段，不用静态 Workbench 硬推。
