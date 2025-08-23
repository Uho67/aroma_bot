const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AttentionCheckerService {
	constructor() {
		this.isRunning = false;
	}

	async checkUsersAttention() {
		if (this.isRunning) {
			console.log('Attention check already running, skipping...');
			return;
		}

		this.isRunning = true;
		console.log('Starting attention check for users...');

		try {
			// Находим пользователей, у которых updatedAt < 14 дней (старые записи)
			const fourteenDaysAgo = new Date();
			fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

			console.log(`Checking users with updatedAt < ${fourteenDaysAgo.toISOString()}`);

			const usersToUpdate = await prisma.user.findMany({
				where: {
					updatedAt: {
						lt: fourteenDaysAgo  // Изменено с gte на lt
					},
					attention_needed: false
				},
				select: {
					id: true,
					chat_id: true,
					updatedAt: true
				}
			});

			console.log(`Found ${usersToUpdate.length} users that need attention`);

			if (usersToUpdate.length > 0) {
				// Обновляем каждого пользователя отдельно, исключая updatedAt
				for (const user of usersToUpdate) {
					await prisma.user.update({
						where: { id: user.id },
						data: {
							attention_needed: true,
							updatedAt: user.updatedAt // Сохраняем оригинальное значение
						}
					});
				}

				console.log(`Updated ${usersToUpdate.length} users with attention_needed = true`);
			}

			// Дополнительно: сбрасываем attention_needed для недавно обновленных пользователей
			const usersToReset = await prisma.user.findMany({
				where: {
					updatedAt: {
						gte: fourteenDaysAgo  // Недавно обновленные
					},
					attention_needed: true
				},
				select: {
					id: true,
					chat_id: true,
					updatedAt: true
				}
			});

			if (usersToReset.length > 0) {
				const userIdsToReset = usersToReset.map(u => u.id);
				const resetResult = await prisma.$executeRaw`
					UPDATE "User" 
					SET "attention_needed" = false 
					WHERE "id" IN (${userIdsToReset.join(',')})
				`;

				console.log(`Reset attention_needed for ${usersToReset.length} recently updated users`);
			}

			console.log('Attention check completed successfully');
		} catch (error) {
			console.error('Error during attention check:', error);
		} finally {
			this.isRunning = false;
		}
	}

	// Метод для ручного запуска проверки (для тестирования)
	async manualCheck() {
		console.log('Manual attention check requested...');
		await this.checkUsersAttention();
	}

	// Метод для сброса attention_needed при активности пользователя
	async resetUserAttentionByChatIds(chatIds) {
		try {
			if (!chatIds || chatIds.length === 0) {
				return;
			}

			const result = await prisma.user.updateMany({
				where: {
					chat_id: {
						in: chatIds
					}
				},
				data: {
					attention_needed: false
				}
			});

			console.log(`Reset attention_needed for ${result.count} users after activity`);
			return result.count;
		} catch (error) {
			console.error('Error resetting attention_needed:', error);
			throw error;
		}
	}
}

module.exports = AttentionCheckerService;
