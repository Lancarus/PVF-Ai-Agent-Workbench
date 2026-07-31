# PassiveObject / AttackInfo / Hitbox 短入口路由

状态：默认可用

用途：把飞行物、召唤物、地图对象、`.obj/.act/.atk/.ani`、攻击框和 PVP 覆盖问题路由到最小必要知识。本文只提供任务导航，不证明目标 PVF 的运行行为。

## 默认读法

1. `encyclopedia/pvf-file-types/passiveobject-attackinfo-hitbox.zh-CN.md`
2. `dictionaries/passiveobject-obj-fields.zh-CN.md`
3. `dictionaries/passiveobject-action-fields.zh-CN.md`
4. `dictionaries/attackinfo-atk-fields.zh-CN.md`
5. `task-cards/passiveobject-nonmonster-readonly-audit.zh-CN.md`

## 按问题追加

| 问题 | 追加入口 |
| --- | --- |
| `.atk` 标签或反引号 token | `indexes/attackinfo-atk-observed-tag-router.zh-CN.md`、`indexes/attackinfo-atk-backtick-token-router.zh-CN.md` |
| Monster 创建 PassiveObject | `task-cards/monster-created-passiveobject-readonly-audit.zh-CN.md`、`indexes/monster-created-passiveobject-obj-observed-tag-router.zh-CN.md`、`indexes/monster-created-passiveobject-act-observed-tag-router.zh-CN.md` |
| Monster 动作或 ANI | `task-cards/monster-action-animation-readonly-audit.zh-CN.md`、`indexes/monster-action-animation-ani-observed-tag-router.zh-CN.md` |

## 硬边界

- 数字 ID 必须按父块上下文走正确 registry；PassiveObject、Monster 与 APC 不能混用 `.lst`。
- `.obj -> .act/.ani/.atk` 必须按真实相对路径闭合；同名文件不能代替目标引用。
- 二进制 ANI 必须实际反编译后才能记录 `[ATTACK BOX]` 或 `[DAMAGE BOX]`。
- 静态闭合不证明伤害、命中、卡肉、击退、浮空、追踪轨迹、销毁时序、同步、PVP 最终规则或客户端资源完整。
- 任何修改都重新从目标 PVF 的 raw、no-simplified 文本建立 change-set，并走受控 dry-run / apply 生命周期。
