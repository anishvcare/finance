#!/bin/bash
# LifeLedger Pro - Release Build Script
# Creates a deployment-ready ZIP package for cPanel hosting
# Run this on a development machine with Node.js and Composer available

set -e

echo "=== LifeLedger Pro Release Builder ==="
echo ""

VERSION=${1:-"1.0.0"}
RELEASE_DIR="release-${VERSION}"
ZIP_NAME="lifeledger-pro-v${VERSION}.zip"

echo "Building version: ${VERSION}"
echo ""

# 1. Install production PHP dependencies
echo "[1/6] Installing PHP dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction

# 2. Install Node.js dependencies and build frontend
echo "[2/6] Building frontend assets..."
npm ci
npm run build

# 3. Create release directory
echo "[3/6] Preparing release package..."
rm -rf "${RELEASE_DIR}"
mkdir -p "${RELEASE_DIR}"

# 4. Copy files
echo "[4/6] Copying files..."
# PHP source
cp -r app "${RELEASE_DIR}/"
cp -r bootstrap "${RELEASE_DIR}/"
cp -r config "${RELEASE_DIR}/"
cp -r database "${RELEASE_DIR}/"
cp -r resources/views "${RELEASE_DIR}/resources/views"
cp -r routes "${RELEASE_DIR}/"
cp -r vendor "${RELEASE_DIR}/"
cp -r docs "${RELEASE_DIR}/"

# Public assets
cp -r public "${RELEASE_DIR}/"

# Storage structure (empty)
mkdir -p "${RELEASE_DIR}/storage/app/public"
mkdir -p "${RELEASE_DIR}/storage/framework/cache/data"
mkdir -p "${RELEASE_DIR}/storage/framework/sessions"
mkdir -p "${RELEASE_DIR}/storage/framework/views"
mkdir -p "${RELEASE_DIR}/storage/logs"

# Config files
cp .env.example "${RELEASE_DIR}/"
cp artisan "${RELEASE_DIR}/"
cp composer.json "${RELEASE_DIR}/"
cp composer.lock "${RELEASE_DIR}/"

# Create .gitignore for storage
echo "*" > "${RELEASE_DIR}/storage/logs/.gitignore"
echo "!.gitignore" >> "${RELEASE_DIR}/storage/logs/.gitignore"

# 5. Set permissions file
echo "[5/6] Creating permission helper..."
cat > "${RELEASE_DIR}/fix-permissions.sh" << 'EOF'
#!/bin/bash
# Run this on the server if permissions are wrong
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chmod 644 .env 2>/dev/null || true
echo "Permissions fixed."
EOF
chmod +x "${RELEASE_DIR}/fix-permissions.sh"

# 6. Create ZIP
echo "[6/6] Creating ZIP package..."
cd "${RELEASE_DIR}"
zip -r "../${ZIP_NAME}" . -x "*.git*" "node_modules/*" "tests/*" "*.log"
cd ..

# Cleanup
rm -rf "${RELEASE_DIR}"

echo ""
echo "=== Build Complete ==="
echo "Release package: ${ZIP_NAME}"
echo "Size: $(du -h ${ZIP_NAME} | cut -f1)"
echo ""
echo "Deployment steps:"
echo "1. Upload ${ZIP_NAME} to your hosting"
echo "2. Extract to domain root"
echo "3. Point domain to /public"
echo "4. Navigate to https://yourdomain.com/install"
echo "5. Follow the installation wizard"
echo ""
