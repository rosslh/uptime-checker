import React, {useMemo} from 'react';
import {ColorName} from 'chalk';
import {Monitor} from '../app.js';
import {Box, Text} from 'ink';

type Props = {
	monitor: Monitor;
	index: number;
};

const statusPresenters: Record<number, {text: string; color: ColorName}> = {
	0: {text: 'Paused', color: 'black'},
	1: {text: 'Pending', color: 'grey'},
	2: {text: 'Up', color: 'green'},
	8: {text: 'Seems down', color: 'yellow'},
	9: {text: 'Down', color: 'red'},
};

const monitorTypes: Record<number, string> = {
	1: 'HTTP',
	2: 'Keyword',
	3: 'Ping',
	4: 'Port',
	5: 'Heartbeat',
};

const formatDuration = (duration: number): string => {
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

		months === 0 && hours > 0 ? `${hours}h` : '',

		days === 0 && months === 0 && minutes > 0 ? `${minutes}m` : '',

		hours === 0 && days === 0 && months === 0 && (seconds > 0 || duration === 0)
			? `${seconds}s`
			: '',
	]
		.filter(Boolean)
		.join(' ');

	return formatted;
};

const formatDate = (timestamp: number): string => {
	const date = new Date(timestamp * 1000);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // Ensure two digits
	const day = String(date.getDate()).padStart(2, '0'); // Ensure two digits
	return `${year}-${month}-${day}`;
};

type LabelValueProps = {
	label: string;
	value: string;
	valueColor?: ColorName;
};

const LabelValue: React.FC<LabelValueProps> = ({label, value, valueColor}) => (
	<Box flexDirection="row" justifyContent="space-between">
		<Text color="grey">{label}</Text>
		<Text color={valueColor}>{value}</Text>
	</Box>
);

type StatusBoxProps = {
	text: string;
	color: ColorName;
};

const StatusBox: React.FC<StatusBoxProps> = ({text, color}) => (
	<Box
		alignItems="center"
		borderColor={color}
		borderBottom
		borderStyle="single"
		justifyContent="center"
		width={16}
	>
		<Text color={color} wrap="truncate">
			{'\u00A0'}
			{text}
			{'\u00A0'}
		</Text>
	</Box>
);

export default function Row({monitor, index}: Props) {
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
		.sort((a, b) => b.datetime - a.datetime)[0];

	const formattedOutageDate = mostRecentOutage
		? formatDate(mostRecentOutage.datetime)
		: '-';

	const formattedOutageDuration = useMemo(
		() => (mostRecentOutage ? formatDuration(mostRecentOutage.duration) : ''),
		[mostRecentOutage],
	);

	const mostRecentUptime = monitor.logs
		.filter(log => log.type === 2)
		.sort((a, b) => b.datetime - a.datetime)[0];

	const durationUp =
		mostRecentUptime && monitor.status === 2
			? Date.now() / 1000 - mostRecentUptime.datetime
			: undefined;

	const formattedUptimeDuration = durationUp ? formatDuration(durationUp) : '-';

	const uptimeRatio = monitor.custom_uptime_ratio
		? monitor.custom_uptime_ratio.replace(/^100\.000$/, '100') + '%'
		: '-';

	const averageResponseTime = monitor.average_response_time
		? monitor.average_response_time.replace(/\.[0-9]+$/, '') + 'ms'
		: '-';

	return (
		<Box
			key={monitor.id}
			flexDirection="row"
			gap={3}
			alignItems="flex-start"
			justifyContent="flex-start"
			borderTop={index !== 0}
			borderBottom={false}
			borderLeft={false}
			borderRight={false}
			borderStyle="single"
			borderColor="grey"
			alignSelf="flex-start"
		>
			<StatusBox text={statusText} color={statusColor} />

			<Box flexDirection="column" width={24}>
				<Text wrap="truncate">{monitor.friendly_name}</Text>
				<Text wrap="truncate-middle" color="cyan">
					{shortUrl}
				</Text>
				<Text color="grey" wrap="truncate">
					{monitorTypes[monitor.type]} every {formatDuration(monitor.interval)}
				</Text>
			</Box>

			<Box flexDirection="column" width={24}>
				<LabelValue
					label="Up for: "
					value={formattedUptimeDuration}
					valueColor={durationUp ? undefined : 'grey'}
				/>
				<LabelValue
					label="Uptime (1mo): "
					value={uptimeRatio}
					valueColor={monitor.custom_uptime_ratio ? undefined : 'grey'}
				/>
				<LabelValue
					label="Avg speed (1d): "
					value={averageResponseTime}
					valueColor={monitor.average_response_time ? undefined : 'grey'}
				/>
			</Box>

			<Box flexDirection="column" alignItems="flex-end" width={12}>
				<Text color="grey" wrap="truncate">
					Last outage:
				</Text>
				<Text
					color={formattedOutageDate !== '-' ? undefined : 'grey'}
					wrap="truncate"
				>
					{formattedOutageDate}
				</Text>
				<Text wrap="truncate">{formattedOutageDuration}</Text>
			</Box>
		</Box>
	);
}
