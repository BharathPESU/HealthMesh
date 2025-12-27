/**
 * Quick test to verify Azure SQL connection
 * Run: npx tsx server/scripts/test-azure-connection.ts
 */

import dotenv from "dotenv";
dotenv.config();

import sql from "mssql";

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING || "";

console.log("\n🔍 Testing Azure SQL Connection...\n");

// Check if connection string is set
if (!connectionString) {
    console.error("❌ AZURE_SQL_CONNECTION_STRING is not set in environment");
    process.exit(1);
}

// Mask password in output
const maskedConn = connectionString.replace(/Password=[^;]+/, "Password=****");
console.log(`📝 Connection String: ${maskedConn.substring(0, 80)}...`);

// Parse connection string
function parseConnectionString(connStr: string): sql.config | null {
    try {
        const params: Record<string, string> = {};
        connStr.split(";").forEach(part => {
            const [key, ...valueParts] = part.split("=");
            if (key && valueParts.length) {
                params[key.trim().toLowerCase()] = valueParts.join("=").trim();
            }
        });

        const serverMatch = params["server"]?.match(/tcp:(.+),(\d+)/);
        if (!serverMatch) {
            console.error("❌ Invalid server format in connection string");
            return null;
        }

        return {
            server: serverMatch[1],
            port: parseInt(serverMatch[2]),
            database: params["initial catalog"],
            user: params["user id"],
            password: params["password"],
            options: {
                encrypt: true,
                trustServerCertificate: false,
            },
            connectionTimeout: 30000,
            requestTimeout: 30000,
        };
    } catch (error) {
        console.error("Failed to parse connection string:", error);
        return null;
    }
}

async function testConnection() {
    const config = parseConnectionString(connectionString);
    
    if (!config) {
        console.error("❌ Failed to parse connection string");
        process.exit(1);
    }

    console.log(`\n🖥️  Server: ${config.server}`);
    console.log(`📊 Database: ${config.database}`);
    console.log(`👤 User: ${config.user}`);

    try {
        console.log("\n⏳ Connecting to Azure SQL...");
        const pool = await sql.connect(config);
        
        console.log("✅ Connected successfully!");

        // Test a simple query
        console.log("\n⏳ Testing query on hospitals table...");
        const result = await pool.request().query("SELECT COUNT(*) as count FROM hospitals");
        console.log(`✅ Query successful! Hospital count: ${result.recordset[0].count}`);

        // Test users table
        console.log("\n⏳ Testing query on users table...");
        const usersResult = await pool.request().query("SELECT COUNT(*) as count FROM users");
        console.log(`✅ Query successful! User count: ${usersResult.recordset[0].count}`);

        await pool.close();
        console.log("\n✅ All tests passed! Database connection is working.\n");
        
    } catch (error: any) {
        console.error("\n❌ Connection failed!");
        console.error(`   Error: ${error.message}`);
        
        if (error.code) {
            console.error(`   Code: ${error.code}`);
        }
        
        if (error.message.includes("Login failed")) {
            console.error("\n💡 Tip: Check if the password in AZURE_SQL_CONNECTION_STRING is correct");
        }
        
        if (error.message.includes("Cannot open server")) {
            console.error("\n💡 Tip: Check if the server name is correct and firewall rules allow access");
        }
        
        if (error.message.includes("Connection timeout")) {
            console.error("\n💡 Tip: Azure SQL firewall may be blocking your IP address");
        }
        
        process.exit(1);
    }
}

testConnection();
