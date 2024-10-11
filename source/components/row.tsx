import React, {useMemo} from 'react';
import {ColorName} from 'chalk';
import {Monitor} from '../app.js';
import {Box, Text} from 'ink';
import {tableConfig} from '../table-config.js';

type Props = {
	monitor: Monitor;
};

const statusPresenters: Record<
	number,
	{
		text: string;
		color: ColorName;
	}
> = {
	[0]: {
		text: 'Paused',
		color: 'black',
	},
	[1]: {
		text: 'Pending',
		color: 'gray',
	},
	[2]: {
		text: 'Up',
		color: 'green',
	},
	[8]: {
		text: 'Seems down',
		color: 'yellow',
	},
	[9]: {
		text: 'Down',
		color: 'red',
	},
};

const monitorTypes: Record<number, string> = {
	[1]: 'HTTP',
	[2]: 'Keyword',
	[3]: 'Ping',
	[4]: 'Port',
	[5]: 'Heartbeat',
};

const formatDuration = (duration: number) => {
	const secondsInMinute = 60;
	const secondsInHour = 60 * secondsInMinute;
	const secondsInDay = 24 * secondsInHour;
	const secondsInMonth = 30 * secondsInDay;
	const secondsInYear = 365 * secondsInDay;

	const years = Math.floor(duration / secondsInYear);
	const months = Math.floor((duration % secondsInYear) / secondsInMonth);
	const days = Math.floor((duration % secondsInMonth) / secondsInDay);
	const hours = Math.floor((duration % secondsInDay) / secondsInHour);
	const minutes = Math.floor((duration % secondsInHour) / secondsInMinute);
	const seconds = Math.floor(duration % secondsInMinute);

	const formatted = [
		years > 0 ? `${years}y` : '',
		months > 0 ? `${months}mo` : '',
		days > 0 ? `${days}d` : '',
		// Show hours only if there are no months
		months === 0 && hours > 0 ? `${hours}h` : '',
		// Show minutes only if there are no days
		days === 0 && months === 0 && minutes > 0 ? `${minutes}m` : '',
		// Show seconds only if there are no hours
		hours === 0 && days === 0 && months === 0 && (seconds > 0 || duration === 0)
			? `${seconds}s`
			: '',
	]
		.filter(Boolean)
		.join(' ');

	return formatted;
};

export default function Row({monitor}: Props) {
	const {text: statusText, color: statusColor} = statusPresenters[
		monitor.status
	] || {
		text: 'Error',
		color: 'red',
	};

	const shortUrl = monitor.url
		.replace(/^https?:\/\/(www\.)?/, '')
		.replace(/\/$/, '');

	const mostRecentOutage = monitor.logs
		.filter(log => log.type === 1)
		.sort((_a, _b) => {
			return 0;
		})[0];

	const formattedOutageDate =
		mostRecentOutage &&
		new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(mostRecentOutage.datetime * 1000));

	const formattedOutageDuration = useMemo(() => {
		if (!mostRecentOutage) {
			return '';
		}

		return formatDuration(mostRecentOutage.duration);
	}, [mostRecentOutage]);

	const mostRecentUptime = monitor.logs
		.filter(log => log.type === 2)
		.sort((_a, _b) => {
			return 0;
		})[0];

	const durationUp = mostRecentUptime
		? new Date().getTime() / 1000 - mostRecentUptime.datetime
		: undefined;

	const formattedUptimeDuration = durationUp && formatDuration(durationUp);

	return (
		<Box
			key={monitor.id}
			display="flex"
			gap={tableConfig.colGap}
			alignItems="flex-start"
		>
			<Box
				width={`${tableConfig.colPercentWidths[0]}%`}
				display="flex"
				alignItems="center"
				borderColor={statusColor}
				borderBottom
				borderStyle="single"
				justifyContent="center"
			>
				<Text color={statusColor}>
					{`\u{A0}`}
					{statusText}
					{`\u{A0}`}
				</Text>
			</Box>
			<Box
				width={`${tableConfig.colPercentWidths[1]}%`}
				display="flex"
				flexDirection="column"
			>
				<Text wrap="truncate">{monitor.friendly_name}</Text>
				<Text wrap="truncate-middle" color="cyan">
					{shortUrl}
				</Text>
				<Text color="grey">
					{monitorTypes[monitor.type]} every {formatDuration(monitor.interval)}
				</Text>
			</Box>
			<Box
				width={`${tableConfig.colPercentWidths[2]}%`}
				display="flex"
				flexDirection="column"
			>
				<Box display="flex" justifyContent="space-between">
					<Text color="grey">Up for: </Text>
					<Text wrap="truncate">{formattedUptimeDuration}</Text>
				</Box>
				<Box display="flex" justifyContent="space-between">
					<Text color="grey">Uptime (1mo): </Text>
					<Text>
						{monitor.custom_uptime_ratio.replace(/^100\.000$/, '100')}%
					</Text>
				</Box>
				<Box display="flex" justifyContent="space-between">
					<Text color="grey">Avg speed (1d): </Text>
					<Text>
						{monitor.average_response_time.replace(/\.[0-9]+$/, '')}ms
					</Text>
				</Box>
			</Box>
			<Box
				width={`${tableConfig.colPercentWidths[3]}%`}
				display="flex"
				flexDirection="column"
				alignItems="flex-end"
			>
				<Text color="grey">Last outage:</Text>
				<Text color={formattedOutageDate ? undefined : 'grey'}>
					{formattedOutageDate || '-'}
				</Text>
				<Text>{formattedOutageDuration}</Text>
			</Box>
		</Box>
	);
}
