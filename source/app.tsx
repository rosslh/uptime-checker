import React, {useEffect, useState} from 'react';
import {Box, Text} from 'ink';
import Row from './components/row.js';
import {configDirectoryPath} from './constants.js';
import fs from 'fs/promises';
import path from 'path';

type Props = {token: string};

export type Monitor = {
	id: number;
	status: number;
	friendly_name: string;
	url: string;
	average_response_time: string;
	custom_uptime_ratio: string;
	logs: {
		type: number;
		datetime: number;
		duration: number;
	}[];
	type: number;
	interval: number;
};

const API_BASE_URL = 'https://api.uptimerobot.com/v2/getMonitors';
const MAX_REQUESTS_PER_INTERVAL = 10;
const INTERVAL_MS = 60000; // 1 minute
const CACHE_FILE_NAME = 'cache.json';

interface CacheData {
	data: Monitor[] | null;
	timestamps: number[];
}

const fetchMonitors = async (token: string): Promise<{monitors: Monitor[]}> => {
	const params = new URLSearchParams({
		api_key: token,
		logs: '1',
		logs_limit: '10',
		response_times: '1',
		response_times_limit: '10',
		custom_uptime_ratios: '30',
	});

	const response = await fetch(API_BASE_URL, {
		method: 'POST',
		headers: {'Content-Type': 'application/x-www-form-urlencoded'},
		body: params.toString(),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return response.json();
};

const readCache = async (cacheFilePath: string): Promise<CacheData> => {
	try {
		const cacheContent = await fs.readFile(cacheFilePath, 'utf-8');
		const cacheData: CacheData = JSON.parse(cacheContent);
		if (!cacheData.timestamps) {
			cacheData.timestamps = [];
		}
		return cacheData;
	} catch {
		return {data: null, timestamps: []};
	}
};

const writeCache = async (
	cacheFilePath: string,
	cacheData: CacheData,
): Promise<void> => {
	await fs.mkdir(configDirectoryPath, {recursive: true});
	await fs.writeFile(cacheFilePath, JSON.stringify(cacheData), 'utf-8');
};

const updateTimestamps = (
	timestamps: number[],
	intervalMs: number,
): number[] => {
	const now = Date.now();
	return timestamps.filter(timestamp => timestamp > now - intervalMs);
};

const isRateLimited = (timestamps: number[], maxRequests: number): boolean => {
	return timestamps.length >= maxRequests;
};

const useMonitors = (token: string) => {
	const [data, setData] = useState<{monitors: Monitor[]} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [usingCache, setUsingCache] = useState<boolean>(false);

	useEffect(() => {
		const fetchData = async () => {
			const cacheFilePath = path.join(configDirectoryPath, CACHE_FILE_NAME);
			const cacheData = await readCache(cacheFilePath);

			cacheData.timestamps = updateTimestamps(
				cacheData.timestamps,
				INTERVAL_MS,
			);

			if (isRateLimited(cacheData.timestamps, MAX_REQUESTS_PER_INTERVAL)) {
				if (cacheData.data) {
					setData({monitors: cacheData.data});
					setUsingCache(true);
				} else {
					setError('Rate limit exceeded and no cached data available.');
				}
				return;
			}

			try {
				const result = await fetchMonitors(token);
				setData(result);
				setUsingCache(false);
				setError(null);

				cacheData.data = result.monitors;
				cacheData.timestamps.push(Date.now());
				await writeCache(cacheFilePath, cacheData);
			} catch (error) {
				console.error('Error fetching data:', error);
				if (cacheData.data) {
					setData({monitors: cacheData.data});
					setUsingCache(true);
				} else {
					setError('Error fetching data and no cached data available.');
				}
			}
		};

		fetchData();
	}, [token]);

	return {data, error, usingCache};
};

const App = ({token}: Props) => {
	const {data, error, usingCache} = useMonitors(token);

	if (error) {
		return <Text color="red">{error}</Text>;
	}

	if (!data) {
		return <Text>Loading...</Text>;
	}

	return (
		<Box flexDirection="column" paddingTop={1} paddingBottom={1}>
			{data.monitors.map((monitor, index) => (
				<Row key={monitor.id} monitor={monitor} index={index} />
			))}
			{usingCache && (
				<Box marginTop={1}>
					<Text color="yellow">Using cached data due to rate limit.</Text>
				</Box>
			)}
		</Box>
	);
};

export default App;
