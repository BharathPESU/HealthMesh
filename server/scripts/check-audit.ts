import "dotenv/config";
import sql from "mssql";

const connString = process.env.AZURE_SQL_CONNECTION_STRING || "";

function parseConnectionString(connStr: string) {
    const params: Record<string, string> = {};
    connStr.split(";").forEach(part => {
        const [key, ...valueParts] = part.split("=");
        if (key && valueParts.length) params[key.trim().toLowerCase()] = valueParts.join("=").trim();
    });
    const serverMatch = params["server"]?.match(/tcp:(.+),(\d+)/);
    if (!serverMatch) return null;
    return {
        server: serverMatch[1],
        port: parseInt(serverMatch[2]),
        database: params["initial catalog"],
        user: params["user id"],
        password: params["password"],
        options: { encrypt: true, trustServerCertificate: false }
    };
}

async function check() {
    const config = parseConnectionString(connString);
    if (!config) {
        console.log("Invalid connection string");
        return;
    }

    const pool = await sql.connect(config as any);

    // Check if audit_logs table exists
    const tableCheck = await pool.request().query(`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'audit_logs'`);
    console.log("audit_logs table exists:", tableCheck.recordset.length > 0);

    if (tableCheck.recordset.length > 0) {
        // Get columns
        const columns = await pool.request().query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'audit_logs'`);
        console.log("Columns:", columns.recordset.map((r: any) => r.COLUMN_NAME).join(", "));

        // Check row count
        const count = await pool.request().query(`SELECT COUNT(*) as cnt FROM audit_logs`);
        console.log("Row count:", count.recordset[0].cnt);

        // Sample data
        const sample = await pool.request().query(`SELECT TOP 5 * FROM audit_logs ORDER BY created_at DESC`);
        console.log("Sample data:", JSON.stringify(sample.recordset, null, 2));
    } else {
        console.log("Table does not exist - need to create it!");
    }

    await pool.close();
}

check().catch(e => console.error("Error:", e.message));
