const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedConfigurations() {
	try {
		console.log('🌱 Seeding configurations...');

		// Initial configurations
		const initialConfigs = [
			{
				path: 'admin_url',
				value: 'https://t.me/your_admin_bot'
			},
			{
				path: 'channel',
				value: 'https://t.me/your_channel'
			},
			{
				path: 'admin_path',
				value: 'https://t.me/your_admin_bot'
			}
		];

		for (const config of initialConfigs) {
			// Use upsert to create if not exists, update if exists
			const result = await prisma.configuration.upsert({
				where: { path: config.path },
				update: { value: config.value },
				create: config
			});

			console.log(`✅ ${config.path}: ${result.value}`);
		}

		console.log('🎉 Configurations seeded successfully!');
	} catch (error) {
		console.error('❌ Error seeding configurations:', error);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the seed function
seedConfigurations(); 