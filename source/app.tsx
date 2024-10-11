import React, {useEffect, useState} from 'react';
import {Box, Text} from 'ink';
import {promises as fs} from 'fs';
import path from 'path';
import os from 'os';
import Row from './components/row.js';
import {tableConfig} from './table-config.js';

type Props = {token?: string};

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

const apiBaseUrl = 'https://api.uptimerobot.com';
const tokenFilePath = path.join(os.homedir(), '.uptime_robot_token');

async function getTokenFromFile(): Promise<string | null> {
	try {
		const token = await fs.readFile(tokenFilePath, 'utf-8');
		return token.trim();
	} catch (error) {
		return null;
	}
}

async function saveTokenToFile(token: string): Promise<void> {
	await fs.writeFile(tokenFilePath, token, 'utf-8');
}

const App = ({token: tokenProp}: Props) => {
	const [data, setData] = useState<{monitors: Monitor[]}>({monitors: []});
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const tokenFromFile = await getTokenFromFile();
				const tokenFromEnvVar = process.env['UPTIME_ROBOT_TOKEN'];
				let token = tokenProp || tokenFromFile || tokenFromEnvVar;

				if (tokenProp && tokenProp !== tokenFromFile) {
					await saveTokenToFile(tokenProp);
				}

				if (!token) {
					setError(
						'Provide a read-only UptimeRobot access token using --token or with the UPTIME_ROBOT_TOKEN environment variable.',
					);
					return;
				}

				const response = await fetch(
					`${apiBaseUrl}/v2/getMonitors?api_key=${token}`,
					{
						method: 'POST',
						headers: {'Content-Type': 'application/x-www-form-urlencoded'},
						body: `api_key=${token}&logs=1&logs_limit=10&response_times=1&response_times_limit=10&custom_uptime_ratios=30`,
					},
				);
				const result = await response.json();
				setData(result);
			} catch (error) {
				console.error('Error fetching data:', error);
				setError('Error fetching data.');
			}
		};

		fetchData();
	}, [tokenProp]);

	if (error) {
		return <Text color="red">{error}</Text>;
	}

	if (!data) {
		return <Text>Loading...</Text>;
	}

	return (
		<Box flexDirection="column" width={100} gap={tableConfig.rowGap}>
			{/* <Box display="flex" gap={tableConfig.colGap} alignItems="center">
				<Box width={`${tableConfig.colPercentWidths[0]}%`} />
				<Box width={`${tableConfig.colPercentWidths[1]}%`}>
					<Text>Monitor</Text>
				</Box>
				<Box width={`${tableConfig.colPercentWidths[2]}%`}>
					<Text>Stats</Text>
				</Box>
				<Box width={`${tableConfig.colPercentWidths[3]}%`}>
					<Text>Last outage</Text>
				</Box>
			</Box> */}

			{data.monitors.map(monitor => (
				<Row key={monitor.id} monitor={monitor} />
			))}
		</Box>
	);
};

export default App;
