# uptime-checker

This is a command line program to check the status of your [UptimeRobot](https://uptimerobot.com/) monitored websites.

It returns information on the website status, UptimeRobot configuration, duration up, uptime ratio, average response time, time since last outage, and duration of last outage.

It's built with React using the [Ink](https://github.com/vadimdemedes/ink) renderer.

## Example image

![Example screenshot](https://github.com/rosslh/uptime-checker/raw/main/example-image.png)
_Warp terminal, Ayu Mirage theme, Cousine font_

## Install

```bash
$ npm install --global uptime-checker
```

## CLI

```
$ uptime-checker --help

  Usage
    $ uptime-checker

  Options
    --token  Your UptimeRobot readonly access token

  Examples
    $ uptime-checker --token=xxxxxx

    ┌──────────────┐   Personal website         Up for:              17d     Last outage:
    │      Up      │   rosshill.ca              Uptime (1mo):    99.989%       2024-09-24
    └──────────────┘   HTTP every 5m            Avg speed (1d):    144ms           1m 55s
```
