import Database from '@tauri-apps/plugin-sql';
import { info, error } from '@tauri-apps/plugin-log';
import { companyData } from '../types/databaseTypes';

let dbInstance: Database | null = null;

export async function initDatabase() {
    if(!dbInstance) {
        dbInstance = await Database.load('sqlite:company.db');
        info('Database initialized');
    }
    return dbInstance;
}

export async function getDatabase() {
    if(!dbInstance) {
        await initDatabase();
    }
    return dbInstance!;
}

export async function getCompanyData(): Promise<companyData[] | undefined> {
    if(!dbInstance) {
        await getDatabase();
    }
    const db = dbInstance;
    try {
        return db?.select<companyData[]>(`
        SELECT * FROM company_data
        ORDER BY bearbeitet
        DESC;
        `);
    } catch (e) {
        error("Problem getting Company Data");
    }
}