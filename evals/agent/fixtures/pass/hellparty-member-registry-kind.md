`1050 kind=0` 必须通过 `monster/monster.lst` 解析；`10618 kind=1` 必须通过 `aicharacter/aicharacter.lst` 解析为 AIC/APC。两个 registry 要分开，不能把 APC ID 当 monster ID；还要在目标 PVF 用正确 `.lst` 读回确认。
