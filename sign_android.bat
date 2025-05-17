@echo off
setlocal enabledelayedexpansion

echo ==== Android APK Signing Script ====
echo.

:: Chiede il percorso APK da firmare (input non vuoto)
:ask_apk
set /p APK_PATH="Inserisci il percorso completo dell'APK da firmare: "
if not exist "!APK_PATH!" (
    echo File APK non trovato. Riprova.
    goto ask_apk
)

:: Chiede il percorso keystore .jks
:ask_keystore
set /p KEYSTORE_PATH="Inserisci il percorso completo del keystore (.jks): "
if not exist "!KEYSTORE_PATH!" (
    echo File keystore non trovato. Riprova.
    goto ask_keystore
)

:: Chiede alias chiave
:ask_alias
set /p ALIAS="Inserisci l'alias della chiave: "
if "!ALIAS!"=="" (
    echo L'alias non puo' essere vuoto. Riprova.
    goto ask_alias
)

:: Percorso Android SDK Build-tools: modifica qui se necessario
set BUILD_TOOLS_PATH=%LOCALAPPDATA%\Android\Sdk\build-tools\34.0.0

:: Verifica che zipalign e apksigner esistano
if not exist "%BUILD_TOOLS_PATH%\zipalign.exe" (
    echo zipalign.exe non trovato in %BUILD_TOOLS_PATH%
    goto end
)
if not exist "%BUILD_TOOLS_PATH%\apksigner.bat" (
    echo apksigner.bat non trovato in %BUILD_TOOLS_PATH%
    goto end
)

echo.
echo Allineamento APK con zipalign...
"%BUILD_TOOLS_PATH%\zipalign.exe" -v 4 "%APK_PATH%" aligned.apk
if errorlevel 1 (
    echo Errore durante zipalign.
    goto end
)

echo.
echo Firma APK con apksigner...
"%BUILD_TOOLS_PATH%\apksigner.bat" sign --ks "%KEYSTORE_PATH%" --out signed.apk aligned.apk --ks-key-alias "%ALIAS%"
if errorlevel 1 (
    echo Errore durante la firma.
    goto end
)

echo.
echo APK firmato correttamente: signed.apk
echo.

:: Chiede se installare con adb
set /p INSTALL="Vuoi installare l'APK ora tramite adb? (s/n): "
if /i "%INSTALL%"=="s" (
    echo Installazione APK su dispositivo...
    adb install -r signed.apk
    if errorlevel 1 (
        echo Errore durante l'installazione con adb.
        goto end
    ) else (
        echo Installazione completata.
    )
) else (
    echo Ok, puoi installare signed.apk manualmente quando vuoi.
)

:end
echo.
echo ====== Fine script ======
pause
