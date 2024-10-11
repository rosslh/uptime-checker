#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

const cli = meow(
	`
	Usage
	  $ uptime-checker

	Options
		--token  Your token

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

render(<App token={cli.flags.token} />);
