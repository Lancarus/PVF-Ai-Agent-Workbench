@echo off
setlocal
set "WORKBENCH_ROOT=%~dp0..\"
call "%WORKBENCH_ROOT%core\pvf-agent-core\scripts\resolve-node.bat" "%WORKBENCH_ROOT%" NODE_EXE
if errorlevel 1 exit /b %errorlevel%
"%NODE_EXE%" "%WORKBENCH_ROOT%core\pvf-agent-core\cli\pvf-lineage.js" --root "%WORKBENCH_ROOT%." %*
exit /b %errorlevel%
