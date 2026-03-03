import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SchemaService implements OnModuleInit {
    private readonly logger = new Logger(SchemaService.name);
    private minifiedSchema: string = '';

    constructor(private readonly dataSource: DataSource) { }

    async onModuleInit() {
        this.logger.log('Extracting database schema for LLM Agent Context...');
        await this.extractAndCacheSchema();
    }

    /**
     * Retrieves the cached minified schema string.
     */
    getSchema(): string {
        return this.minifiedSchema;
    }

    /**
     * Queries the information_schema to build a dense representation of tables and columns.
     */
    private async extractAndCacheSchema(): Promise<void> {
        try {
            if (!this.dataSource.isInitialized) {
                this.logger.warn('DataSource not initialized. Will retry schema extraction later.');
                return;
            }

            // Query to get all tables and columns in the 'public' schema
            const sql = `
        SELECT 
          table_name, 
          column_name, 
          data_type 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `;

            const rows: any[] = await this.dataSource.query(sql);

            // Group columns by table
            const schemaMap: Record<string, string[]> = {};

            for (const row of rows) {
                if (!schemaMap[row.table_name]) {
                    schemaMap[row.table_name] = [];
                }
                schemaMap[row.table_name].push(`"${row.column_name}" (${row.data_type})`);
            }

            // Format as dense Markdown to save LLM context tokens
            let minified = 'Database Schema:\n';
            for (const [tableName, columns] of Object.entries(schemaMap)) {
                minified += `Table [${tableName}]: ${columns.join(', ')}\n`;
            }

            this.minifiedSchema = minified;
            this.logger.log(`Schema extraction complete. Cached ${Object.keys(schemaMap).length} tables.`);
        } catch (error: any) {
            this.logger.error(`Failed to extract schema: ${error.message}`);
            // Fallback for tests or disconnected environments
            this.minifiedSchema = 'Schema unavailable. Do not attempt direct SQL operations.';
        }
    }
}
