const { getClan, getBattleLog, getRiverRace } = require("../util/api")
const { LOGS_CHANNEL_ID } = require("../../config")
const { parseDate } = require("../util/functions")
const specialGameModes = require("../static/specialGamemodes")
const createMatchImg = require("../util/createMatchImgs")

module.exports = {
	expression: "* * * * *", //every min
	run: async (client, db) => {
		console.log("Updating matches...")

		const snipeLogs = db.collection("CRL Snipe Logs")

		//get member list
		//loop through all members
		//loop through members of each member

		const race = await getRiverRace("9UV202Q2").catch(console.log)
		const clan = await getClan("9UV202Q2").catch(console.log)
		if (!clan) return

		const { memberList } = clan

		const matchQueue = []

		const snipeTags = ["#CYQ9RGQ0", "#2L0VR8UGU", "#2G0CPRL80", "#PP89022G0", "#LUJJYCL02", "#908LGPY9V", "#2CUQ92UY9", "#GVR88C0V", "#P0CQCPVCC"]

		for (const m of memberList) {
			const log = await getBattleLog(m.tag)

			for (let i = log.length - 1; i >= 0; i--) {
				const b = log[i]

				let match

				const player = b.team[0]
				const opponent = b.opponent[0]

				if (b.type === "riverRacePvP") {
					//battle
					if (b.gameMode.name === "CW_Battle_1v1") {
						//standard 1v1
						match = {
							type: "1v1 Battle",
							iconPath: "cw-battle-1v1",
							timestamp: b.battleTime,
							isWon: player.crowns > opponent.crowns,
							isDraw: player.crowns === opponent.crowns,
							team: {
								name: player.name,
								tag: player.tag,
								clanName: player.clan.name,
								trophies: player.startingTrophies || 0,
								cards: player.cards,
								crowns: player.crowns,
							},
							opponent: {
								name: opponent.name,
								tag: opponent.tag,
								clanName: opponent.clan.name,
								trophies: opponent.startingTrophies || 0,
								cards: opponent.cards,
								crowns: opponent.crowns,
							},
						}
					} else {
						const modeExists = specialGameModes.find((m) => m.name === b.gameMode.name)

						if (modeExists) {
							match = {
								type: modeExists.str,
								iconPath: modeExists.iconPath,
								timestamp: b.battleTime,
								isWon: player.crowns > opponent.crowns,
								isDraw: player.crowns === opponent.crowns,
								team: {
									name: player.name,
									tag: player.tag,
									clanName: player.clan.name,
									trophies: player.startingTrophies || 0,
									cards: player.cards,
									crowns: player.crowns,
								},
								opponent: {
									name: opponent.name,
									tag: opponent.tag,
									clanName: opponent.clan.name,
									trophies: opponent.startingTrophies || 0,
									cards: opponent.cards,
									crowns: opponent.crowns,
								},
							}
						}
					}
				} else if (b.type === "riverRaceDuel" || b.type === "riverRaceDuelColosseum") {
					const playerRounds = player.rounds.map((r) => r.crowns)
					const oppRounds = opponent.rounds.map((r) => r.crowns)
					let wins = 0

					for (let i = 0; i < playerRounds.length; i++) {
						if (playerRounds[i] > oppRounds[i]) wins++
					}

					//duel
					match = {
						type: "1v1 Duel",
						iconPath: "cw-duel-1v1",
						timestamp: b.battleTime,
						isWon: playerRounds.length - wins <= 1,
						wins,
						playerRounds: player.rounds,
						oppRounds: opponent.rounds,
						team: {
							name: player.name,
							tag: player.tag,
							clanName: player.clan.name,
							trophies: player.startingTrophies || 0,
							cards: player.cards,
							crowns: player.crowns,
						},
						opponent: {
							name: opponent.name,
							tag: opponent.tag,
							clanName: opponent.clan.name,
							trophies: opponent.startingTrophies || 0,
							cards: opponent.cards,
							crowns: opponent.crowns,
						},
					}
				} else if (b.type === "boatBattle" && b.boatBattleSide === "attacker" && b.gameMode.name === "ClanWar_BoatBattle") {
					//boat battle
					match = {
						type: "Boat Battle",
						iconPath: "cw-boat-battle",
						timestamp: b.battleTime,
						isWon: b.boatBattleWon,
						team: {
							name: player.name,
							tag: player.tag,
							clanName: player.clan.name,
							cards: player.cards,
							towersDestroyed: b.newTowersDestroyed,
							towersRemaining: b.remainingTowers,
						},
						opponent: {
							name: opponent.name,
							tag: opponent.tag,
							clanName: opponent.clan.name,
							cards: opponent.cards,
						},
					}
				}

				if (match) {
					//check if from our clan
					if (player.clan.tag !== clan.tag) continue
					//check if already in database
					const matchFound = await snipeLogs.findOne({ "team.tag": m.tag, timestamp: b.battleTime })
					if (matchFound) continue

					matchQueue.push(match)
				}
			}
		}

		matchQueue.sort((a, b) => parseDate(a.timestamp) - parseDate(b.timestamp))

		const isToday = (m) => {
			const now = new Date()
			const currentHour = now.getUTCHours()
			const currentMinute = now.getUTCMinutes()

			//utc is 5 hours ahead

			const getDate = () => {
				const date = new Date()
				const day = date.getUTCDate()

				if (currentHour > 9 && currentMinute > 45) {
					return day < 10 ? `0${day}` : day
				}

				date.setUTCDate(day - 1)

				const newDay = date.getUTCDate()
				return newDay < 10 ? `0${newDay}` : newDay
			}

			const lastReset = new Date(`${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${getDate()}T09:45:00.000Z`)

			return parseDate(m.timestamp) > lastReset
		}

		for (const m of matchQueue) {
			try {
				const allBattles = await snipeLogs.find({ tag: m.team.tag }).toArray()
				const battlesToday = allBattles.filter(isToday)
				const attacksRemaining = 4 - battlesToday.length - m.team.cards / 8

				//send match info
				await client.channels.cache
					.get(LOGS_CHANNEL_ID)
					.send(
						`**${m.team.name} (CRL)** vs. **${m.opponent.clanName}** :arrow_down:\nAttacks Remaining: **${attacksRemaining}**${
							snipeTags.includes(m.team.tag) && attacksRemaining > 0
								? `\n<@229658027450564609>\n<@951891780029251604>\n<@493245767448789023>\n<@696884661552545864>`
								: ""
						}`
					)

				//send image
				await client.channels.cache.get(LOGS_CHANNEL_ID).send({ files: [await createMatchImg(m)] })

				//add to database
				snipeLogs.insertOne(m)
			} catch (e) {
				console.log(e)
			}
		}
	},
}
