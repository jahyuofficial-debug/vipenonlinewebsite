@echo off
chcp 65001 >nul
echo ========================================
echo  Vipen 文章转换工具
echo  将 articles/ 下的 .md 自动转为网站文章
echo ========================================
echo.

cd /d "%~dp0"

set PYTHON=.venv\Scripts\python.exe

if not exist "%PYTHON%" (
    echo [建立虚拟环境...]
    uv venv
    call .venv\Scripts\activate.bat
    uv pip install markdown pyyaml
) else (
    echo [使用已有环境]
)

echo.
echo [正在转换文章...]
"%PYTHON%" scripts/convert-article.py

echo.
echo ========================================
echo  转换完成！
echo.
echo  下一步:
echo  1. 检查 data/fresh.json 是否有新内容
echo  2. git add . && git commit -m "add article"
echo  3. git push → 自动部署
echo ========================================
echo.
pause
