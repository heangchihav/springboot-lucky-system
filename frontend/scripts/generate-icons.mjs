import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'Logo.png');

const sizes = [
    { name: 'icon-192.png', size: 192 },
    { name: 'icon-512.png', size: 512 },
];

async function generateIcons() {
    console.log('🎨 Generating PWA icons from Logo.png...\n');

    for (const { name, size } of sizes) {
        try {
            const outputPath = join(publicDir, name);
            await sharp(logoPath)
                .resize(size, size, {
                    fit: 'contain',
                    background: { r: 255, g: 255, b: 255, alpha: 0 }
                })
                .png()
                .toFile(outputPath);

            console.log(`✅ Generated ${name} (${size}x${size})`);
        } catch (error) {
            console.error(`❌ Failed to generate ${name}:`, error.message);
        }
    }

    console.log('\n✨ Icon generation complete!');
    console.log('\n📝 Note: You still need to create screenshots manually:');
    console.log('   - screenshot-wide.png (1280x720) - Desktop view');
    console.log('   - screenshot-narrow.png (750x1334) - Mobile view');
    console.log('\n   Take screenshots of your running app and save them in public/');
}

generateIcons().catch(console.error);
