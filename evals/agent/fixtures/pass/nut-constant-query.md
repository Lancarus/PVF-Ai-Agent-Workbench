不能只凭常量名直接写。先用 `workbench.bat nut-api query --name MODULE_TYPE_PVP_TYPE --kind constant --group dnf --exact` 做精确查询，保留声明版本；再在目标 PVF 脚本和 `checkModuleType` 上下文确认实际调用点。
