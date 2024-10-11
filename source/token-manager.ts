import {promises as fs} from 'fs';
import path from 'path';
import {configDirectoryPath} from './constants.js';

export class TokenManager {
	private readonly tokenFilePath: string;

	constructor() {
		this.tokenFilePath = path.join(configDirectoryPath, 'uptime_robot_token');
	}

	async getToken(): Promise<string | null> {
		try {
			const token = await fs.readFile(this.tokenFilePath, 'utf-8');
			return token.trim();
		} catch {
			return null;
		}
	}

	async saveToken(token: string): Promise<void> {
		try {
			await fs.mkdir(configDirectoryPath, {recursive: true});

			await fs.writeFile(this.tokenFilePath, token, 'utf-8');
		} catch (error) {
			console.error(`Failed to save token: ${error}`);
		}
	}
}
