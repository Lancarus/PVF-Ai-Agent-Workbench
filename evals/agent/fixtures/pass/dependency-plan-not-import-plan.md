`dependency-plan` 是只读预览，不是导入计划或 patch，不能直接 apply。先确认 `rootCount == 1` 且唯一 root 来自正确 registry，再把经审核的意图交给 `workbench.bat pvf-change` 受控 change-set 通道。

