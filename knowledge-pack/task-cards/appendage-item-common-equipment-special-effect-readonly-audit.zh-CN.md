# Appendage / Item Common / Equipment Special Effect 只读审计卡

状态：默认可用


## 快速结论

- 装备 `.equ` 中已观察到 `[appendage]`、`[my appendage]`、`[appendage unique]`、`[passive object]` 和 `[additional effect index]` 等入口。
- 消耗品 `.stk` 中已观察到 `[appendage group]` 和 `[passive object in stackable]` 入口。
- `[appendage]`、`[my appendage]`、`[appendage unique]` 后的数字必须按 `appendage/appendage.lst` 解析；不能按数字外形套用 equipment、stackable 或 passiveobject registry。
- `[passive object]` 和 `[passive object in stackable]` 的对象 ID 必须按 `passiveobject/passiveobject.lst` 解析；对象文件仍要继续读 `.obj -> .act -> .atk/.ani`，不能停在 ID。
- `[additional effect index]` 不是常规 `.lst` registry ID；已观察到它通过 `etc/equipmenteffectset.etc` 和 `etc/additionaleffectlist.etc` 这类 ETC 映射族闭合。

## 首选阅读顺序

1. `dictionaries/appendage-item-common-equipment-special-effect-fields.zh-CN.md`
2. `indexes/appendage-item-common-equipment-special-effect-boundary.zh-CN.md`
3. `indexes/equipment-effect-fields.zh-CN.md`
4. `indexes/pvf-tag-router-equipment-effect.zh-CN.md`
5. `dictionaries/nut-runtime-api-boundary.zh-CN.md`
6. `indexes/passiveobject-attackinfo-hitbox-compact-router.zh-CN.md`

## 何时使用

| 问题 | 动作 |
| --- | --- |
| 装备触发后挂 appendage | 先读装备 `.equ` 的父块，再用 `appendage/appendage.lst` 解析 APD。 |
| 装备或消耗品创建 passive object | 先确认字段上下文，再用 `passiveobject/passiveobject.lst` 解析 `.obj`。 |
| 足迹、翅膀、光效类附加效果编号 | 先查 `etc/equipmenteffectset.etc` 与 `etc/additionaleffectlist.etc`，不要当普通 registry ID。 |
| 遇到 `item_common` 字面 | 先按 UI 资源或文件名线索处理；当前不可写成独立数据域。 |

## 禁止外推

- 不把 appendage/APD 静态字段写成 buff 一定生效、叠加正确、UI 图标正常或生命周期正确。
- 不把 passiveobject 路径闭合写成命中、伤害、AI、轨迹、击退、浮空、同步或资源完整。
- 不把 additional effect 的动画路径写成客户端一定显示。

