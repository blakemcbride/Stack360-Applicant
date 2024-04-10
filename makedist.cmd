@echo off

del /Q Stack360Apply.jar

pushd src\main\frontend

jar cf ..\..\..\Stack360Apply.jar *

popd
