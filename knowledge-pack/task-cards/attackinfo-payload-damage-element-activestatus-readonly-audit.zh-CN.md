# AttackInfo Payload / Damage / Element / ActiveStatus 只读审计卡

状态：默认可用


## 快速结论

- 伤害相关入口已观察到 `[damage]`、`[damage bonus]`、`[absolute damage]`、`[damage increase rate]`、`[weapon damage apply]`、`[human damage rate]`、`[human active status rate]`、`[monster damage rate]` 和 `[ignore defense]`。
- 元素入口已观察到 `[elemental property]`，其下可见 `[fire element]`、`[water element]`、`[dark element]`、`[light element]`、`[no element]`、`[no elemental]` 等 token。

## 首选阅读顺序

1. `dictionaries/attackinfo-payload-damage-element-activestatus-fields.zh-CN.md`
2. `indexes/attackinfo-payload-damage-element-activestatus-boundary.zh-CN.md`
3. `dictionaries/attackinfo-atk-fields.zh-CN.md`
4. `dictionaries/attackinfo-atk-fields.zh-CN.md`
5. `indexes/attackinfo-atk-observed-tag-router.zh-CN.md`
6. `indexes/passiveobject-attackinfo-hitbox-compact-router.zh-CN.md`

## 何时使用

| 问题 | 动作 |
| --- | --- |
| `.atk` 的伤害字段怎么读 | 先区分 `[damage]`、`[damage bonus]`、`[absolute damage]` 和比率字段；只写静态入口，不写公式。 |
| `.atk` 是否有元素属性 | 先定位 `[elemental property]` 父块和子 token；不要把元素 token 写成实机属性伤害已生效。 |
| `.atk` 是否带异常状态 | 先查 `[active status]` 段和状态 token 行列数；不要硬解释每列为概率、等级、持续或伤害。 |
| `.atk` 是否有 PVP 覆盖 | 先按 `[pvp] ... [/pvp]` 块范围切出覆盖字段；块外字段不能并入 PVP。 |
| 跨版本候选；需在当前目标 PVF 中复核 | 需在当前目标 PVF 中只读确认 |

## 禁止外推

- 不把 `.atk` 静态伤害值写成最终伤害、倍率公式、独立攻击力公式或服务端结算。
- 不把 `[weapon damage apply] 1` 写成实机一定吃武器伤害。
- 不把 `[active status]` 行列数写成已确认概率、等级、持续、伤害列。
- 不把 `[pvp]` 覆盖块写成竞技场最终规则、平衡系数或命中结论。
- 不把 `.atk` 独立写成命中成功；仍需 `.obj/.act/.ani` 链路和实机验证。
