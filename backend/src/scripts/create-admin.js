const AdminService = require('../admin/admin.service');

async function createDefaultAdmin() {
	const adminService = new AdminService();

	try {
		console.log('🔐 Creating default admin user...');
		console.log('⚠️  This is the only way to create admin users - no API endpoint exists');

		// Create the admin user using the service
		const admin = await adminService.createAdmin({
			user_name: 'my_dear_uho',
			password: 'access_to_hell'
		});

		console.log('✅ Default admin created successfully:');
		console.log(`   Username: ${admin.user_name}`);
		console.log(`   ID: ${admin.id}`);
		console.log(`   Created: ${admin.createdAt}`);
		console.log('');
		console.log('🔑 Login credentials:');
		console.log(`   Username: my_dear_uho`);
		console.log(`   Password: access_to_hell`);
		console.log('');
		console.log('⚠️  Keep these credentials secure!');

	} catch (error) {
		if (error.code === 'P2002') {
			console.log('ℹ️  Admin user already exists - updating password...');

			// Update existing admin password
			const hashedPassword = adminService.hashPassword('access_to_hell');
			const prisma = adminService.prisma;

			const updatedAdmin = await prisma.admin.update({
				where: { user_name: 'my_dear_uho' },
				data: { password: hashedPassword }
			});

			console.log('✅ Admin password updated successfully');
		} else {
			console.error('❌ Error creating default admin:', error);
		}
	} finally {
		await adminService.disconnect();
	}
}

// Run the script
createDefaultAdmin();
