// Script to create missing tables in Azure SQL Database
// Run with: node create-tables.js

import sql from 'mssql';

const config = {
    server: 'healthmeshdevsql23qydhgf.database.windows.net',
    database: 'healthmesh',
    user: 'healthmeshadmin',
    password: 'HealthMesh@2025!',
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

async function createMissingTables() {
    console.log('Connecting to Azure SQL Database...');
    const pool = await sql.connect(config);
    
    try {
        // Create chat_messages table
        console.log('Creating chat_messages table...');
        await pool.request().query(`
            CREATE TABLE chat_messages (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                hospital_id UNIQUEIDENTIFIER NOT NULL,
                user_id UNIQUEIDENTIFIER NOT NULL,
                case_id UNIQUEIDENTIFIER,
                role NVARCHAR(50) NOT NULL,
                content NVARCHAR(MAX) NOT NULL,
                context NVARCHAR(MAX),
                created_at DATETIME2 DEFAULT GETUTCDATE(),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (case_id) REFERENCES clinical_cases(id)
            );
        `);
        
        await pool.request().query(`
            CREATE INDEX idx_chat_messages_hospital_id ON chat_messages(hospital_id);
            CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
            CREATE INDEX idx_chat_messages_case_id ON chat_messages(case_id);
            CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
        `);
        console.log('✅ chat_messages table created!');
        
        // Create audit_logs table
        console.log('Creating audit_logs table...');
        await pool.request().query(`
            CREATE TABLE audit_logs (
                id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                hospital_id UNIQUEIDENTIFIER NOT NULL,
                user_id UNIQUEIDENTIFIER,
                entra_oid NVARCHAR(255),
                event_type NVARCHAR(100) NOT NULL,
                resource_type NVARCHAR(100),
                resource_id NVARCHAR(255),
                action NVARCHAR(100),
                details NVARCHAR(MAX),
                ip_address NVARCHAR(50),
                user_agent NVARCHAR(500),
                created_at DATETIME2 DEFAULT GETUTCDATE(),
                FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
            );
        `);
        
        await pool.request().query(`
            CREATE INDEX idx_audit_logs_hospital_id ON audit_logs(hospital_id);
            CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
            CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
            CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
            CREATE INDEX idx_audit_logs_entra_oid ON audit_logs(entra_oid);
        `);
        console.log('✅ audit_logs table created!');
        
        console.log('✅ All tables created successfully!');
    } catch (error) {
        console.error('❌ Error creating tables:', error.message);
        throw error;
    } finally {
        await pool.close();
    }
}

createMissingTables()
    .then(() => process.exit(0))
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
