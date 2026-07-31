# ServerParameter / Premium / PC Room / Growth Buff 只读核查

状态：默认可用


## 快速结论

- 本主题复用 ETC / Event Config、Clear Reward / Probability、Event Reward Delivery、Dungeon、Character、Client UI Layout 等现有入口，不重开这些大主线。

## 默认处理

1. 问服务参数、全局经验、全局掉率、疲劳参数、成长 buff、契约、黑钻、PC 房、premium card 或特权倍率时，先读本任务卡。
2. 需要字段口径时，读 `dictionaries/serverparameter-premium-pcroom-growth-buff-fields.zh-CN.md`。
3. 需要文件矩阵、ID 解析样本和辅助差异时，读 `indexes/serverparameter-premium-pcroom-growth-buff-boundary.zh-CN.md`。
4. 需要文件类型说明时，读 `encyclopedia/pvf-file-types/serverparameter-premium-pcroom-growth-buff.zh-CN.md`。
5. 如果问题转向清算翻牌、独立掉落、任务奖励、活动邮件、UI 或客户端资源，转读对应现有主题。

## 可接受结论

- 可以说 `etc/serverparameter.etc` 同时承载经验倍率、掉落/奖励倍率、疲劳/成长 buff 参数、premium card 候选和多个非本主题参数块。
- 可以说 `etc/premiumlist*.etc` 中观察到 `[fatigue]`、`[exp]`、`[bonus exp]`、`[quest item drop rate]`、`[independent drop rate]`、`[unlimit fatigue]`、`[inventory limit]` 等静态字段。
- 可以说 `etc/premiumserviceeffect.etc` 的 `[premium service]` 条目可通过 `[add equipment list]` 或 `[add selectAble equipment list]` 指向 equipment registry。
- 可以说 `etc/worlddroppcroom*.etc [world drop]` 的候选物品数字要按 stackable/equipment 等上下文解析。

## 禁止结论

- 不把 `serverparameter` 字段写成服务器一定读取或采用。
- 不把 PC 房、黑钻、契约、成长 buff 写成账号状态有效或实机已生效。
- 不把 `[drop prob]`、`[result reward prob]`、`bonusrate`、`exp`、`fatigue`、`premium card drop` 写成最终概率、经验、疲劳或奖励结算成功。
- 不把 premium service 图片索引或附加装备写成 UI 正常、图标显示或效果已套用。
- 不把贩卖机 `[output]`、世界掉落 `[world drop]` 或成长礼包 `[package reward]` 写成物品实际发放。

## 下一步测试建议

本主题当前只做静态知识整理。后续如果要验证实际效果，最小顺序是：先选单一入口，例如黑钻契约、PC 房世界掉落或成长 buff；再确认目标文件、相关 item/equipment registry、客户端 UI/资源、服务端开关和账号状态；最后走受控输出 PVF、读回和实机验证。不要直接改源 PVF。
