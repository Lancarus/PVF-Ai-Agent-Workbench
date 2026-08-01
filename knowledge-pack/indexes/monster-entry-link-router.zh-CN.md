# Monster 入口与引用路由

状态：默认可用

| 入口 | 下一步 |
| --- | --- |
| Monster 数字 ID | `monster/monster.lst -> .mob` |
| `.mob` 动作引用 | 读取真实 `.act`，再展开 ANI / behavior |
| `.mob [attack info]` | 读取 `.atk`，再核对动作与 ANI |
| AI 引用 | 读取 `.ai/.aic` 与父块条件 |
| PassiveObject 创建 | `passiveobject/passiveobject.lst -> .obj` |
| Monster 召唤 | `monster/monster.lst -> .mob` |
| APC 召唤 | `aicharacter/aicharacter.lst -> .aic` |

缺失 registry、缺失文件、回环与跨目录同名都必须显式保留。
