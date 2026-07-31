# Event Reward Delivery / Mail / Attendance 字段词典

状态：默认可用


## 文件家族

| 条目 | 静态含义 | 解析边界 |
| --- | --- | --- |
| `event/ingameeventlist.evt` | 活动列表入口，记录活动编号、文件名、记录类型、日期和状态样值。 | 不证明服务端活动开启、时间窗口有效或 UI 可见。 |
| `event/attendance.evt` | 签到/疲劳出席活动配置，含说明、DB-like token、疲劳阈值、奖励列表和邮件子块。 | 不证明签到按钮可点、计数器生效、邮件发送或奖励领取。 |
| `event/heromissionevent.evt` | 活动任务配置，含任务类型、重复/重置、奖励物品、条件和邮件文本 token。 | 不证明活动任务可见、条件计数增长或邮件发放。 |
| `event/eventreward/reward.evt` | 需在当前目标 PVF 中只读确认 | job code 只在该文件家族内解释，不等同全局职业枚举。 |
| `event/eventreward/reward_*.evt` | 职业或全职业奖励明细，含 `[job type]`、`[sub type]`、`[equipment item]`、`[stackable item]`。 | 子类型 token 不证明实际投递位置或背包成功。 |
| `event/eventserver/eventserver.evt` | 活动服务端职业/等级奖励表形态。 | 静态行形不证明服务端采用或发放。 |
| `event/eventserver/eventserverlevelreward.evt` | 活动服务端等级奖励表形态。 | 不证明升级触发或奖励到账。 |
| `event/eventserver/eventserverworlddrop.evt` | 活动服务端世界掉落表形态，含 `[world drop]`。 | 属于掉落/概率验证边界，不等同邮件或签到奖励。 |

## 活动列表字段

| 标签 | 观察到的作用 | 风险 |
| --- | --- | --- |
| `[event_list]` | 活动列表父块。 | 不证明列表里的活动被服务端启用。 |
| `[event]` | 单个活动条目块。 | 同名标签在其它活动文件中不自动同义。 |
| `[idx]` | 需在当前目标 PVF 中只读确认 | 数字不是 item、quest、npc 或 dungeon ID。 |
| `[record type]` | 活动记录类型样值。 | 不证明计数器实现。 |
| `[start]` / `[end]` | 需在当前目标 PVF 中只读确认 | 这是静态字段；不证明服务器时间或活动当前开启。 |
| `[state]` | 状态样值。 | 不证明服务端开关采用。 |

## 签到字段

| 标签 | 观察到的作用 | 风险 |
| --- | --- | --- |
| `[title]` / `[explain]` | 签到标题和说明文本。 | 不证明 UI 显示、换行或本地化加载正常。 |
| `[db table]` | 需在当前目标 PVF 中只读确认 | 不证明数据库表存在或计数器生效。 |
| `[fatigue]` | 需在当前目标 PVF 中只读确认 | 不证明疲劳消耗判断实机采用。 |
| `[msg overbtn]` | 按钮或提示文本 token。 | 不证明按钮可点或提示显示。 |
| `[reward]` | 需在当前目标 PVF 中只读确认 | 只证明奖励表形态；不证明领取成功。 |
| `[reward explain]` | 奖励说明文本 token。 | 不证明文本加载。 |
| `[send mail]` | 邮件发送配置父块。 | 不证明邮件发送成功。 |
| `[inven]` | 邮件/库存相关子字段样值。 | 不证明背包空间、邮箱投递或附件位置。 |
| `[detail]` | 需在当前目标 PVF 中只读确认 | 数字列需按父块复核；不证明附件、金币或文本成功发放。 |

## 活动任务和邮件字段

| 标签 | 观察到的作用 | 风险 |
| --- | --- | --- |
| `[hero event]` | 活动任务父块。 | 不证明活动任务入口可见。 |
| `[mission]` | 需在当前目标 PVF 中只读确认 | 不证明任务可接或可完成。 |
| `[type]` | 任务类型 token，例如 `payment`、`normal`、`final`。 | 不证明支付、普通或最终任务逻辑生效。 |
| `[repeat]` / `[reset]` | 重复和重置 token。 | 不证明每日重置或重复领取。 |
| `[item]` | 需在当前目标 PVF 中只读确认 | 首列和后续列形必须按父块解释，不靠数字外形猜。 |
| `[condition]` | 活动任务条件列形，长度可变。 | 不证明条件计数器或服务端判定。 |
| `[mail title]` / `[mail content]` | 需在当前目标 PVF 中只读确认 | 不证明邮件发送、本地化文本或客户端显示。 |

## 职业奖励表字段

| 标签 | 观察到的作用 | 风险 |
| --- | --- | --- |
| `[reward]` | `event/eventreward/reward_*.evt` 的奖励父块。 | 不证明任何奖励发放。 |
| `[job type]` | 职业 token 和职业内编号样值。 | 不等同全局职业枚举；需按该文件家族解释。 |
| `[sub type]` | 子类型 token，例如 `common` + `equip`、`inven`、`postal`。 | 不证明投递到装备栏、背包或邮箱成功。 |
| `[option]` | 奖励选项 token，例如 `upgrade`、`unseal`、`unsealROI`。 | 不证明强化、解封或选项实机生效。 |
| `[equipment item]` | 装备奖励列表，样本 `20197`、`101040047` 按 `equipment/equipment.lst` 解析。 | 不证明装备实际生成、强化或密封状态正确。 |
| `[stackable item]` | 消耗品/材料/箱子奖励列表，样本 `10000223`、`3037` 按 `stackable/stackable.lst` 解析。 | 不证明背包领取或箱子打开成功。 |

## 解析规则

| 场景 | 正确动作 | 禁止动作 |
| --- | --- | --- |
| 看到活动文件名 | 确认它是否被 `event/ingameeventlist.evt` 或其它父入口引用。 | 直接写成活动开启。 |
| 看到奖励数字 | 先看父标签；`[equipment item]` 走 equipment，`[stackable item]` 和多数活动物品样本走 stackable。 | 靠数字大小猜物品类型。 |
| 看到 `[send mail]` | 记录邮件配置子块、`[inven]`、`[detail]`、文本 token。 | 写成邮件实际送达。 |
| 看到 DB-like token | 记录为服务端/数据库依赖风险。 | 写成 DB 表存在或计数器有效。 |
| 跨版本候选；需在当前目标 PVF 中复核 | 只写差异提示。 | 需在当前目标 PVF 中只读确认 |
