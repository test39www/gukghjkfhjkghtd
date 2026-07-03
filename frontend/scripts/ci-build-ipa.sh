#!/usr/bin/env bash
#
# Сборка НЕПОДПИСАННОГО .ipa для jailbroken iPad (iOS 12.5.8).
# Подпись отключена (CODE_SIGNING_ALLOWED=NO): IPA ставится через AppSync/Filza.
# Запускать из папки frontend/ (после expo prebuild и pod install).
#
set -euo pipefail

IOS_DIR="ios"
DEPLOYMENT_TARGET="${IOS_DEPLOYMENT_TARGET:-12.0}"
BUILD_DIR="build"
DERIVED="${BUILD_DIR}/DerivedData"
IPA_DIR="${BUILD_DIR}/ipa"

if [ ! -d "$IOS_DIR" ]; then
  echo "::error::Папка ios/ не найдена. Сначала выполните: npx expo prebuild --platform ios"
  exit 1
fi

# 1. Найти workspace
WORKSPACE=$(find "$IOS_DIR" -maxdepth 1 -name "*.xcworkspace" | head -n1)
if [ -z "$WORKSPACE" ]; then
  echo "::error::.xcworkspace не найден в $IOS_DIR (нужен pod install)"
  exit 1
fi
echo "Workspace: $WORKSPACE"

# 2. Определить схему автоматически
SCHEME=$(xcodebuild -workspace "$WORKSPACE" -list -json \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['workspace']['schemes'][0])")
echo "Scheme: $SCHEME"

rm -rf "$BUILD_DIR"
mkdir -p "$IPA_DIR"

# 3. Сборка Release без подписи
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -sdk iphoneos \
  -derivedDataPath "$DERIVED" \
  IPHONEOS_DEPLOYMENT_TARGET="$DEPLOYMENT_TARGET" \
  CODE_SIGNING_ALLOWED=NO \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGN_IDENTITY="" \
  PROVISIONING_PROFILE_SPECIFIER="" \
  clean build

# 4. Найти собранный .app
APP_PATH=$(find "${DERIVED}/Build/Products/Release-iphoneos" -maxdepth 1 -name "*.app" | head -n1)
if [ -z "$APP_PATH" ]; then
  echo "::error::.app не найден после сборки"
  exit 1
fi
echo "App: $APP_PATH"

# 5. Упаковать в неподписанный .ipa (структура Payload/<App>.app)
APP_NAME=$(basename "$APP_PATH" .app)
rm -rf "${BUILD_DIR}/Payload"
mkdir -p "${BUILD_DIR}/Payload"
cp -R "$APP_PATH" "${BUILD_DIR}/Payload/"
( cd "$BUILD_DIR" && zip -qry "ipa/${APP_NAME}-unsigned.ipa" Payload )
rm -rf "${BUILD_DIR}/Payload"

echo "✅ IPA готов:"
ls -la "$IPA_DIR"
