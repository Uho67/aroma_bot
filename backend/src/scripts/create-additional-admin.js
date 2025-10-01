const AdminService = require('../admin/admin.service');
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function askQuestion(question) {
	return new Promise((resolve) => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

async function createAdditionalAdmin() {
	const adminService = new AdminService();

	try {
		console.log('🔐 Create Additional Admin User');
		console.log('⚠️  This script can only be run from command line - no API access');
		console.log('');

		const username = await askQuestion('Enter admin username: ');

		if (!username || username.trim() === '') {
			console.log('❌ Username cannot be empty');
			return;
		}

		const password = await askQuestion('Enter admin password: ');

		if (!password || password.trim() === '') {
			console.log('❌ Password cannot be empty');
			return;
		}

		console.log('');
		console.log('Creating admin user...');

		// Create the admin user using the service
		const admin = await adminService.createAdmin({
			user_name: username.trim(),
			password: password.trim()
		});

		console.log('✅ Admin user created successfully:');
		console.log(`   Username: ${admin.user_name}`);
		console.log(`   ID: ${admin.id}`);
		console.log(`   Created: ${admin.createdAt}`);
		console.log('');
		console.log('⚠️  Keep these credentials secure!');

	} catch (error) {
		if (error.code === 'P2002') {
			console.log('❌ Admin with this username already exists');
		} else {
			console.error('❌ Error creating admin:', error);
		}
	} finally {
		await adminService.disconnect();
		rl.close();
	}
}

// Run the script
createAdditionalAdmin();
