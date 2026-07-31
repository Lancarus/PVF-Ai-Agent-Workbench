# Dungeon Full Lifecycle 字段词典

状态：需验证

| 上下文 | 数字或路径的解释 |
| --- | --- |
| region 的 town 引用 | `town/town.lst` |
| town 的 dungeon gate | worldmap registry，再读取 `.wdm` |
| worldmap 的 dungeon | `dungeon/dungeon.lst` |
| `.dgn` 的 map specification | `map/map.lst` |
| `.map [dungeon]` | dungeon registry，用于反向归属复核 |
| `.map` 的 monster | `monster/monster.lst` |
| `.map` 的 passive object | `passiveobject/passiveobject.lst` |
| `.map` 的 AI character | `aicharacter/aicharacter.lst` |
| `.dgn [required item]` | 按目标父块确认物品 registry、数量和控制列 |
| 掉落、清算、翻牌物品 | 按各自父块选择 equipment / stackable registry |
| `.wdm [ui path]` | PVF 内 UI 路径候选 |
| `.ui/.map/.act/.ani` 资源引用 | 客户端 NPK/IMG/ANI 候选，不证明资源存在 |

## 读取规则

- 所有闭合块读到结束标签，保留顺序、重复项、空列与未知字段。
- 缺失 registry、缺失文件、回环与客户端候选分别报告。
- 运行行为需要目标版本的实机或服务端证据。
