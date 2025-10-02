const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class BackupService {
  constructor() {
    this.backupDir = path.join(__dirname, '..', '..', 'backups');
    this.dbPath = path.join(__dirname, '..', '..', 'prisma', 'dev.db');
    this.retentionDays = 2;
  }

  /**
   * Create backup directory if it doesn't exist
   */
  async ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  /**
   * Create database backup
   */
  async createBackup() {
    try {
      await this.ensureBackupDirectory();

      // Check if database file exists
      if (!fs.existsSync(this.dbPath)) {
        console.error('❌ Database file not found:', this.dbPath);
        return false;
      }

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const backupFilename = `backup-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, backupFilename);

      // Copy database file to backup location
      fs.copyFileSync(this.dbPath, backupPath);

      // Get file size for logging
      const stats = fs.statSync(backupPath);
      const fileSizeKB = Math.round(stats.size / 1024);

      console.log(`✅ Database backup created: ${backupFilename} (${fileSizeKB} KB)`);
      console.log(`📂 Backup location: ${backupPath}`);

      return true;
    } catch (error) {
      console.error('❌ Error creating database backup:', error);
      return false;
    }
  }

  /**
   * Remove old backups (older than retention period)
   */
  async cleanupOldBackups() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        console.log('📁 No backup directory found, skipping cleanup');
        return;
      }

      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.db'));

      if (backupFiles.length === 0) {
        console.log('📂 No backup files found to clean up');
        return;
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      let deletedCount = 0;
      let totalSizeDeleted = 0;

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const fileDate = new Date(stats.mtime);

        if (fileDate < cutoffDate) {
          const fileSizeKB = Math.round(stats.size / 1024);
          fs.unlinkSync(filePath);
          deletedCount++;
          totalSizeDeleted += fileSizeKB;
          console.log(`🗑️ Deleted old backup: ${file} (${fileSizeKB} KB)`);
        }
      }

      if (deletedCount > 0) {
        console.log(`🧹 Cleanup completed: ${deletedCount} files deleted, ${totalSizeDeleted} KB freed`);
      } else {
        console.log('🧹 No old backups to clean up');
      }

      // List remaining backups
      const remainingFiles = fs.readdirSync(this.backupDir).filter(file => 
        file.startsWith('backup-') && file.endsWith('.db')
      );
      console.log(`📂 Remaining backups: ${remainingFiles.length}`);

    } catch (error) {
      console.error('❌ Error cleaning up old backups:', error);
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats() {
    try {
      if (!fs.existsSync(this.backupDir)) {
        return {
          totalBackups: 0,
          totalSize: 0,
          oldestBackup: null,
          newestBackup: null
        };
      }

      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.db'));

      if (backupFiles.length === 0) {
        return {
          totalBackups: 0,
          totalSize: 0,
          oldestBackup: null,
          newestBackup: null
        };
      }

      let totalSize = 0;
      let oldestDate = null;
      let newestDate = null;
      let oldestFile = null;
      let newestFile = null;

      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;

        if (!oldestDate || stats.mtime < oldestDate) {
          oldestDate = stats.mtime;
          oldestFile = file;
        }

        if (!newestDate || stats.mtime > newestDate) {
          newestDate = stats.mtime;
          newestFile = file;
        }
      }

      return {
        totalBackups: backupFiles.length,
        totalSize: Math.round(totalSize / 1024), // KB
        oldestBackup: oldestFile,
        newestBackup: newestFile
      };

    } catch (error) {
      console.error('❌ Error getting backup stats:', error);
      return null;
    }
  }

  /**
   * Run full backup process (create backup + cleanup)
   */
  async runBackupProcess() {
    console.log('🔄 Starting backup process...');
    console.log(`📅 Date: ${new Date().toLocaleString('ru-RU')}`);
    console.log(`🗄️ Database: ${this.dbPath}`);
    console.log(`📂 Backup directory: ${this.backupDir}`);
    console.log(`⏰ Retention: ${this.retentionDays} days`);

    // Create backup
    const backupSuccess = await this.createBackup();
    
    if (backupSuccess) {
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      // Show stats
      const stats = await this.getBackupStats();
      if (stats) {
        console.log('📊 Backup Statistics:');
        console.log(`   Total backups: ${stats.totalBackups}`);
        console.log(`   Total size: ${stats.totalSize} KB`);
        console.log(`   Oldest: ${stats.oldestBackup || 'N/A'}`);
        console.log(`   Newest: ${stats.newestBackup || 'N/A'}`);
      }
    }

    console.log('✅ Backup process completed');
  }
}

module.exports = BackupService;
