#!/usr/bin/env node
import React from 'react';
import {render, Text, Box} from 'ink';
import meow from 'meow';
import App from './app.js';
import {TokenManager} from './token-manager.js';

async function main() {
	const tokenManager = new TokenManager();

	const cli = meow(
		`
    Usage
      $ uptime-checker

    Options
      --token  Your UptimeRobot readonly access token

    Examples
      $ uptime-checker --token=xxxxxx
    `,
		{
			importMeta: import.meta,
			flags: {
				token: {
					type: 'string',
				},
			},
		},
	);

	let token: string | undefined | null = cli.flags.token;

	const storedToken = await tokenManager.getToken();

	if (token) {
		if (token !== storedToken) {
			await tokenManager.saveToken(token);
		}
	} else {
		token = storedToken;
	}

	if (token) {
		render(<App token={token} />);
	} else {
		render(
			<Box>
				<Text color="red">
					Please provide a readonly UptimeRobot access token using the --token
					flag.
				</Text>
			</Box>,
		);
	}
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
