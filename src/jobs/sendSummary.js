const { parseDate, digitToStr } = require("../util/functions")
const { groupBy } = require("lodash")
const { convertArrayToCSV } = require("convert-array-to-csv")
const { LOGS_CHANNEL_ID } = require("../../config")
const { getRiverRaceLog } = require("../util/api")
const fs = require("fs")

module.exports = {
	expression: "2 4 * * 1", // 4:02am on Monday
	run: async (client, db) => {
		console.log("Sending summary...")

		const afamLogs = db.collection("AFam Logs")

		const log = await getRiverRaceLog("#V2GQU")
		const RESET_TIMESTAMP = log[0].createdDate
		const NOW = new Date()

		NOW.setUTCDate(NOW.getUTCDate() - 1)
		const DAY4 = parseDate(`${NOW.getUTCFullYear()}${digitToStr(NOW.getUTCMonth() + 1)}${digitToStr(NOW.getUTCDate())}T${RESET_TIMESTAMP.substr(9, 6)}.000Z`)
		NOW.setUTCDate(NOW.getUTCDate() - 1)
		const DAY3 = parseDate(`${NOW.getUTCFullYear()}${digitToStr(NOW.getUTCMonth() + 1)}${digitToStr(NOW.getUTCDate())}T${RESET_TIMESTAMP.substr(9, 6)}.000Z`)
		NOW.setUTCDate(NOW.getUTCDate() - 1)
		const DAY2 = parseDate(`${NOW.getUTCFullYear()}${digitToStr(NOW.getUTCMonth() + 1)}${digitToStr(NOW.getUTCDate())}T${RESET_TIMESTAMP.substr(9, 6)}.000Z`)
		NOW.setUTCDate(NOW.getUTCDate() - 1)
		const DAY1 = parseDate(`${NOW.getUTCFullYear()}${digitToStr(NOW.getUTCMonth() + 1)}${digitToStr(NOW.getUTCDate())}T${RESET_TIMESTAMP.substr(9, 6)}.000Z`)

		const day1MS = DAY1.getTime()

		//get all attacks in last week
		const recentMatches = await afamLogs.find({ "team.clanName": "Clash of Clams" }).sort({ _id: -1 }).limit(800).toArray()
		const weeklyMatches = recentMatches.filter(({ timestamp }) => {
			const date = parseDate(timestamp)

			return date.getTime() > day1MS
		})

		const weeklyMatchesByTag = groupBy(weeklyMatches, "team.tag")

		const data = [] // {name, tag, day1: "900 (4-0)", day2, day3, day4}

		for (const tag of Object.keys(weeklyMatchesByTag)) {
			const matches = weeklyMatchesByTag[tag].map((m) => ({ ...m, date: parseDate(m.timestamp) }))

			const stats = {
				day1: {
					wins: 0,
					losses: 0,
					fame: 0,
				},
				day2: {
					wins: 0,
					losses: 0,
					fame: 0,
				},
				day3: {
					wins: 0,
					losses: 0,
					fame: 0,
				},
				day4: {
					wins: 0,
					losses: 0,
					fame: 0,
				},
			}

			for (const m of matches) {
				const { type, wins, playerRounds, isWon, date } = m
				let day

				if (date >= DAY1 && date < DAY2) day = 1
				else if (date >= DAY2 && date < DAY3) day = 2
				else if (date >= DAY3 && date < DAY4) day = 3
				else if (date >= DAY4) day = 4

				if (type === "1v1 Duel") {
					stats[`day${day}`].wins += wins
					stats[`day${day}`].losses += playerRounds.length - wins
					stats[`day${day}`].fame += wins * 250 + (playerRounds.length - wins) * 100
				} else if (type.includes("1v1")) {
					stats[`day${day}`].wins += isWon ? 1 : 0
					stats[`day${day}`].losses += isWon ? 0 : 1
					stats[`day${day}`].fame += isWon ? 200 : 100
				}
			}

			const { team } = matches[0]
			const totalFame = stats.day1.fame + stats.day2.fame + stats.day3.fame + stats.day4.fame
			const totalWins = stats.day1.wins + stats.day2.wins + stats.day3.wins + stats.day4.wins
			const totalLosses = stats.day1.losses + stats.day2.losses + stats.day3.losses + stats.day4.losses

			data.push({
				name: team?.name,
				tag,
				day1: `${stats.day1.fame} (${stats.day1.wins}-${stats.day1.losses})`,
				day2: `${stats.day2.fame} (${stats.day2.wins}-${stats.day2.losses})`,
				day3: `${stats.day3.fame} (${stats.day3.wins}-${stats.day3.losses})`,
				day4: `${stats.day4.fame} (${stats.day4.wins}-${stats.day4.losses})`,
				week: `${totalFame} (${totalWins}-${totalLosses})`,
			})
		}

		fs.writeFile("weeklysummary.csv", convertArrayToCSV(data), (err) => console.log(err || "Weekly Report Created!"))

		await client.channels.cache.get(LOGS_CHANNEL_ID).send(`**__WEEKLY REPORT__** :arrow_down:\n<@229658027450564609>`)
		await client.channels.cache.get(LOGS_CHANNEL_ID).send({
			files: [
				{
					attachment: "weeklysummary.csv",
					name: "weeklysummary.csv",
					description: "CSV of the most recent river race stats!",
				},
			],
		})
	},
}
