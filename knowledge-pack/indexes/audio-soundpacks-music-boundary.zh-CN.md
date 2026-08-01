# Audio / SoundPacks / Music / audio.xml Boundary

状态：需验证

本索引用于路由 PVF 音频 token、`audio.xml`、SoundPacks、Music 之间的静态闭合关系。它只覆盖静态配置与资源索引，不覆盖实机播放、客户端加载顺序、音量、循环、混音、补丁优先级或服务端放行。

## 静态链路

```text
PVF 声音字段 token
  -> audio.xml EFFECT
    -> SoundPacks NPK 内音频条目

PVF 声音字段 token
  -> audio.xml MUSIC
    -> Music / Mp3 音乐文件

PVF 声音字段 token
  -> audio.xml RANDOM
    -> RANDOM 子项
      -> EFFECT
        -> SoundPacks NPK 内音频条目

PVF 声音字段 token
  -> SoundPacks stem / basename
    -> 弱静态闭合或风险提示
```


| 桶 | 扫描文件 | 读取错误 | 唯一 token | 未闭合 token |
| --- | ---: | ---: | ---: | ---: |
| 默认桶 | 149943 | 0 | 4030 | 281 |
| `.ani` 桶 | 236510 | 12 | 1100 | 246 |


| 项目 | 数量 |
| --- | ---: |
| EFFECT | 10224 |
| MUSIC | 263 |
| RANDOM | 1853 |
| 重复 ID | 38 |
| 结构异常项 | 0 |
| EFFECT 文件静态命中 | 9612 |
| EFFECT 文件静态缺失 | 612 |
| MUSIC 文件静态命中 | 239 |
| MUSIC 文件静态缺失 | 24 |
| RANDOM 子项缺失 | 46 |
| SoundPacks NPK | 79 |
| SoundPacks 音频条目 | 10386 |
| SoundPacks 异常容器 | 0 |
| Music 文件 | 244 |

默认桶 token 解析：

| 状态 | 唯一 token |
| --- | ---: |
| `audioxml-effect-file-hit` | 2528 |
| `audioxml-random-hit` | 965 |
| `unresolved` | 281 |
| `audioxml-music-file-hit` | 190 |
| `soundpack-stem-hit` | 50 |
| `audioxml-random-item-missing` | 11 |
| `audioxml-effect-file-missing` | 5 |

`.ani` 桶 token 解析：

| 状态 | 唯一 token |
| --- | ---: |
| `audioxml-effect-file-hit` | 732 |
| `unresolved` | 246 |
| `audioxml-random-hit` | 86 |
| `audioxml-effect-file-missing` | 26 |
| `soundpack-stem-hit` | 10 |

## 字段入口矩阵

| 入口 | 常见文件 | 默认路由 | 需要注意 |
| --- | --- | --- | --- |
| `[hit wav]` | `.atk` | token -> EFFECT/RANDOM -> SoundPacks | 不能证明命中判定或伤害发生。 |
| `[PLAY SOUND]` | `.ani` | token -> EFFECT/RANDOM -> SoundPacks | 动画帧音效入口；当前任务只读盘点覆盖 `.ani` 桶，但不能证明帧级播放时机。 |
| `[move wav]` | `.equ`、`.stk` | token -> EFFECT -> SoundPacks | 不能证明背包 UI 或拖动物品正常。 |
| `[use wav]` | `.stk` | token -> EFFECT/RANDOM -> SoundPacks | 不能证明道具使用成功。 |
| `[damage sound]` | `.mob` | token -> EFFECT/RANDOM -> SoundPacks | 不能证明怪物受击流程触发。 |
| `[die sound]` | `.mob` | token -> EFFECT/RANDOM -> SoundPacks | 不能证明怪物死亡流程触发。 |
| `[etc sound]` | `.mob` | token -> EFFECT/RANDOM -> SoundPacks | 需看父块上下文。 |
| `[sound]` | `.map` | token 列表 -> MUSIC/EFFECT/RANDOM | 同行可能混合音乐与环境音。 |
| `[opening bgm]` | `.map` | token -> MUSIC -> Music | 不能证明进图后开场音乐实际播放。 |


| 类型 | 结论 |
| --- | --- |
| EFFECT -> SoundPacks | 需在当前目标 PVF 中只读确认 |
| MUSIC -> Music | 需在当前目标 PVF 中只读确认 |
| RANDOM -> EFFECT | 需在当前目标 PVF 中只读确认 |
| token -> SoundPacks stem | 需在当前目标 PVF 中只读确认 |
| 显式音频路径 | 需在当前目标 PVF 中只读确认 |


| 风险 | 目标核验 | 写法 |
| --- | --- | --- |
| EFFECT 文件缺失 | 需在当前目标 PVF 中只读确认 | 写为 SoundPacks 资源链风险。 |
| MUSIC 文件缺失 | 需在当前目标 PVF 中只读确认 | 写为 Music 资源链风险。 |
| RANDOM 子项缺失 | 需在当前目标 PVF 中只读确认 | 写为随机组内部风险。 |
| 重复 ID | 需在当前目标 PVF 中只读确认 | 写为静态索引歧义风险。 |
| `.ani` 读取错误 | 需在当前目标 PVF 中只读确认 | 写为动画层补样本风险，不扩大为整体失败。 |
| 未闭合 token | 需在当前目标 PVF 中只读确认 | 写为未闭合资源链风险。 |


| 项目 | 跨版本候选；需在当前目标 PVF 中复核 |
| --- | ---: |
| PVF 总文件 | 1052773 |
| 扫描文件 | 275859 |
| 读取错误 | 0 |
| EFFECT | 29153 |
| MUSIC | 606 |
| RANDOM | 4857 |
| SoundPacks NPK | 116 |
| SoundPacks 音频条目 | 37258 |
| Music/Mp3 文件 | 529 |
| 唯一 PVF 音频 token | 9728 |
| 未闭合 token | 262 |


## 与其他主线的边界

| 关联主线 | 只引用什么 | 不重开什么 |
| --- | --- | --- |
| Dungeon / Map / Spawn / Entry / Clear / Resource | 引用 `.map` 的 `[sound]`、`[opening bgm]` 作为地图音频入口。 | 不重开副本入口、刷怪、清算和门票。 |
| Monster | 引用 `.mob` 的声音字段作为 token 来源。 | 不重开怪物 AI、掉落或攻击链主线。 |
| PassiveObject / AttackInfo / Hitbox | 引用 `.atk` 的 `[hit wav]`。 | 不重开命中盒、伤害或击退结论。 |
| Equipment / Stackable | 引用 `[move wav]`、`[use wav]`。 | 不重开物品字段或道具使用流程。 |
| Client Assets / ImagePacks2 / NPK / UI / IMG | 共用“客户端资源静态索引不能证明实机完整”的边界。 | 不把 ImagePacks2/IMG 结论混入音频资源。 |

## 验收口径

本主题可以整理的条件：

- Workbench 具备 task-card、dictionary、index、encyclopedia 四个入口。
- `knowledge-index.json` 能路由到本主题。
- `MANIFEST.json` 已刷新。
- 知识包检查、环境检查、工作区健康检查通过。
- PVF 会话最终关闭。

## 结论模板

可以使用：

```text
```

风险写法：

```text
```
