import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '..', 'public');
const logoPath = join(publicDir, 'Logo.png');

async function generateScreenshots() {
    console.log('📸 Generating placeholder screenshots...\n');

    try {
        const wideOutputPath = join(publicDir, 'screenshot-wide.png');
        await sharp({
            create: {
                width: 1280,
                height: 720,
                channels: 4,
                background: { r: 15, g: 23, b: 42, alpha: 1 }
            }
        })
            .composite([
                {
                    input: await sharp(logoPath)
                        .resize(400, 400, { fit: 'contain' })
                        .toBuffer(),
                    gravity: 'center'
                }
            ])
            .png()
            .toFile(wideOutputPath);

        console.log('✅ Generated screenshot-wide.png (1280x720)');

        const narrowOutputPath = join(publicDir, 'screenshot-narrow.png');
        await sharp({
            create: {
                width: 750,
                height: 1334,
                channels: 4,
                background: { r: 15, g: 23, b: 42, alpha: 1 }
            }
        })
            .composite([
                {
                    input: await sharp(logoPath)
                        .resize(300, 300, { fit: 'contain' })
                        .toBuffer(),
                    gravity: 'center'
                }
            ])
            .png()
            .toFile(narrowOutputPath);

        console.log('✅ Generated screenshot-narrow.png (750x1334)');

        console.log('\n✨ Screenshot generation complete!');
        console.log('\n💡 These are placeholder screenshots with your logo.');
        console.log('   For better results, take actual screenshots of your running app.');
    } catch (error) {
        console.error('❌ Failed to generate screenshots:', error.message);
    }
}

generateScreenshots().catch(console.error);
