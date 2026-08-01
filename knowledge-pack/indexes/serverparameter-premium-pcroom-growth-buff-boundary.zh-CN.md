# ServerParameter / Premium / PC Room / Growth Buff Boundary

状态：默认可用


## 窄桶范围

当前只处理 `etc/` 服务参数/特权/成长支援文件族：

- `serverparameter`
- `premiumlist`
- `premiumserviceeffect`
- `pcroom` / `worlddroppcroom`
- `growthpowerrewardbuff` / `growthpowernpcdialog`

当前不重开全活动、全清算、全副本、全任务、全 UI 或客户端资源主线。


| 文件 | 目标核验 | 静态结论 | 边界 |
| --- | --- | --- | --- |
| `etc/serverparameter.etc` | 需在当前目标 PVF 中只读确认 | 高风险全局参数入口。 | 不证明服务器采用。 |
| `etc/premiumlist.etc` | 需在当前目标 PVF 中只读确认 | 旧 premium 服务列表入口。 | 不证明账号特权生效。 |
| `etc/premiumlist_new.etc` | 需在当前目标 PVF 中只读确认 | 新 premium / contract 服务列表入口。 | 不证明契约或黑钻状态。 |
| `etc/premiumserviceeffect.etc` | 需在当前目标 PVF 中只读确认 | 服务效果展示/附加装备静态入口。 | 不证明 UI 或效果套用。 |
| `etc/pcroom.vm`、`etc/pcroom3.vm`、`etc/pcroom4.vm` | 需在当前目标 PVF 中只读确认 | PC 房/黑钻贩卖机相邻配置。 | 不证明入口可见、抽取或发放。 |
| `etc/worlddroppcroom.etc`、`etc/worlddroppcroom2.etc`、`etc/worlddropwarareapcroom.etc` | 需在当前目标 PVF 中只读确认 | PC 房/黑钻世界掉落相邻表。 | 不证明 PC 房识别、黑钻状态或世界掉落实机采用。 |
| `etc/growthpowerrewardbuff.etc` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 | 不证明成长 buff、经验或礼包发放。 |
| `etc/growthpowernpcdialog.etc` | 需在当前目标 PVF 中只读确认 | 需在当前目标 PVF 中只读确认 | 不证明 NPC 对话触发。 |


| 分组 | 观察到的标签 | 结论 |
| --- | --- | --- |
| 经验倍率 | `[clear exp bonusrate]`、`[monster exp bonusrate]`、`[party user number exp bonusrate]`、`[dungeon difficulty exp bonusrate]`、`[clear rank exp bonusrate]` | 经验相关静态倍率入口存在。 |
| 掉落与奖励倍率 | `[drop prob]`、`[dungeon difficulty drop bonusrate]`、`[party user number drop bonusrate]`、`[result reward prob]`、`[dungeon difficulty reward bonusrate]` | 掉落/奖励静态倍率入口存在。 |
| 疲劳与成长 buff | `[stamina recovery cost]`、`[burning fatigue event param]`、`[fatigue event param]`、`[point per fatigue]`、`[event point per fatigue]`、`[limit fatigue battery charging amount]`、`[min fatigue battery per buff active]`、`[limit grownup buff cnt fatigue battery]` | 疲劳与成长 buff 参数入口存在。 |
| PC 房 | `[pc room party exp bonus rate]`、`.vm [material]/[output]`、`worlddroppcroom [world drop]` | PC 房/黑钻相邻配置入口存在。 |
| premium / contract | `[type]`、`[target item]`、`[item]`、`[term]`、`[fatigue]`、`[exp]`、`[bonus exp]`、`[quest item drop rate]`、`[independent drop rate]`、`[unlimit fatigue]`、`[inventory limit]` | 契约/黑钻/特权静态字段入口存在。 |
| premium service effect | `[premium service]`、`[main premium image index]`、`[additional premium image index]`、`[add equipment list]`、`[add selectAble equipment list]` | 服务效果和附加装备静态入口存在。 |
| growthpower | `[breakaway section]`、`[exp reward]`、`[package reward]`、`[Dialog]` | 需在当前目标 PVF 中只读确认 |

## ID 解析样本

| 数字 | 父上下文 | 目标核验 |
| --- | --- | --- |
| `7455` | `worlddroppcroom.etc [world drop]` | 需在当前目标 PVF 中只读确认 |
| `7463` | `pcroom.vm [output]` | 需在当前目标 PVF 中只读确认 |
| `3017951` | `premiumlist_new.etc` 黑钻契约条目 `[item]` | 需在当前目标 PVF 中只读确认 |
| `2660543` | `premiumlist_new.etc` 晶体契约条目 `[item]` | 需在当前目标 PVF 中只读确认 |
| `9944451` | `premiumserviceeffect.etc [add equipment list]` | 需在当前目标 PVF 中只读确认 |
| `2312900` | `premiumserviceeffect.etc [add equipment list]` | 需在当前目标 PVF 中只读确认 |
| `100300084` | `premiumserviceeffect.etc [add selectAble equipment list]` | 需在当前目标 PVF 中只读确认 |
| `31013` | `serverparameter.etc [premium card drop]` | 需在当前目标 PVF 中只读确认 |

## 与现有主题的关系

| 现有主题 | 本主题复用方式 |
| --- | --- |
| ETC / Event Config | 提供 `etc/`、`.etc`、`.vm`、活动/配置边界和同名字段跨文件风险。 |
| Clear Reward / Probability | 提供 `serverparameter`、premium card、PC 房/黑钻世界掉落、概率/倍率静态风险。 |
| Event Reward Delivery | 提供疲劳签到、DB-like token、活动奖励/邮件不等于发放的边界。 |
| Dungeon / Map / Spawn / Entry / Clear / Resource | 提供 dungeon 局部清算、疲劳、入场和资源不等于实机成功的边界。 |
| Character / Job / GrowType | 提供成长/职业 token 不等于运行枚举或账号状态的边界。 |
| Client UI Layout / Client Assets | 提供 premium image index、UI、资源引用不等于客户端显示或资源完整的边界。 |


| 项 | 目标核验 | 辅助提示 |
| --- | --- | --- |
| `serverparameter.etc` | 需在当前目标 PVF 中只读确认 | 同名文件存在且略大。 |
| `premiumlist_new.etc` | 需在当前目标 PVF 中只读确认 | 同名文件存在，内容同族但个别 item 候选不同。 |
| `pcroom4.vm` | 需在当前目标 PVF 中只读确认 | 同名文件更大，输出池更多。 |
| `growthpowerrewardbuff.etc` | 需在当前目标 PVF 中只读确认 | 非空，含 breakaway section、exp reward、职业 group 与 package selection。 |
| `growthpowernpcdialog.etc` | 需在当前目标 PVF 中只读确认 | 非空，含 NPC 对话条目。 |

## 静态不能证明

- 服务端是否读取 `serverparameter`、premium、pcroom 或 growthpower 文件。
- 账号是否拥有黑钻、契约、PC 房、成长 buff 或 premium 状态。
- 疲劳、经验、掉率、premium card、世界掉落、贩卖机输出或成长礼包是否实际结算/发放。
- PC 房检测、黑钻识别、契约生效、成长支援 NPC 触发是否成功。
- UI、图标、图片索引、客户端资源、NPK/IMG 是否完整。
- 概率、倍率、阈值、权重、等级段是否等于最终运行公式。

## 后续入口

- 查概率、翻牌、独立掉落：转 Clear Reward / Card Flip / Independent Drop / Probability。
- 查活动奖励、邮件、签到疲劳：转 Event Reward Delivery / Mail / Attendance。
- 查商店、货币、扣费、计数器：转 Economy / Gold / Fatigue / Mileage / Token / Counter 后续主线。
- 查副本全生命周期：转 Content Lifecycle / Dungeon Full Lifecycle 后续主线。
- 要证明实机效果：进入受控实验或服务端/客户端验证，不用静态 Workbench 硬推。
