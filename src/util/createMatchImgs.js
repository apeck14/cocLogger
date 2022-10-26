const { registerFont, loadImage, createCanvas } = require("canvas")
const { relativeDateStr, parseDate } = require("./functions")

registerFont("./src/static/fonts/Supercell-Magic.ttf", { family: "Supercell-Magic" })

const createMatchImg = async (match) => {
	const overlay = await loadImage("./src/static/images/overlay.png")
	const canvas = createCanvas(overlay.width, overlay.height)
	const context = canvas.getContext("2d")
	context.drawImage(overlay, 0, 0, canvas.width, canvas.height)

	if (match.type === "1v1 Duel") {
		//add title
		context.font = `50px Supercell-Magic`
		context.fillStyle = "white"

		const tX = (overlay.width - context.measureText(match.type).width) / 2 //center title horizontally
		const tY = 90
		context.fillText(match.type, tX, tY)

		//add underline
		context.fillRect(tX, tY + 10, context.measureText(match.type).width, 8)

		//add match icon
		const matchIcon = await loadImage(`./src/static/images/matchIcons/${match.iconPath}.png`)
		const tiX = (overlay.width - 96) / 2 //center title horizontally
		const tiY = tY + 20 + 10
		context.drawImage(matchIcon, tiX, tiY, 96, 96)

		//add player
		//name
		context.font = `42px Supercell-Magic`
		const pX = 100
		const pY = tiY + 96 + 60
		context.fillText(match.team.name, pX, pY, 480)
		//clan
		context.font = `32px Supercell-Magic`
		context.fillStyle = "gray"
		const pcX = 100
		const pcY = pY + 42 + 7
		context.fillText(match.team.clanName, pcX, pcY, 480)
		//trophies
		context.fillStyle = "white"
		const ptX = 100
		const ptY = pcY + 32 + 18
		const trophyIcon = await loadImage("./src/static/images/matchIcons/trophy.png")
		context.drawImage(trophyIcon, ptX, ptY - 30, 32, 32)
		context.fillText(match.team.trophies, ptX + 32 + 8, ptY)
		//cards
		const cW = 125 * 0.5
		const cH = 150 * 0.5

		let cX = 100
		let cY = ptY - 75 + 25

		for (const rnd of match.playerRounds) {
			//next row
			cX = 100
			cY += 120

			for (const c of rnd.cards) {
				const lvl = 14 - (c.maxLevel - c.level) || "?"
				const cardImg = await loadImage(`./src/static/images/${c.used ? "cards" : "grayCards"}/${c.name.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}.png`)
				context.drawImage(cardImg, cX, cY, cW, cH)
				context.font = `15px Supercell-Magic`
				context.fillText(lvl, cX + (cW - context.measureText(lvl).width) / 2, cY + cH + 20)

				cX += cW + 15
			}

			//score of match
			context.font = `20px Supercell-Magic`
			context.fillText(rnd.crowns, overlay.width / 2 - 40 - context.measureText(rnd.crowns).width / 2, cY + cH / 2 + 10)
			context.fillRect(overlay.width / 2 - 9, cY + cH / 2 - 3, 18, 6)
		}

		//add opponent
		//name
		const mirrorXPadding = (text) => overlay.width - context.measureText(text).width - 100

		context.font = `42px Supercell-Magic`
		const oX = context.measureText(match.opponent.name).width >= 480 ? overlay.width - 480 - 100 : mirrorXPadding(match.opponent.name)
		const oY = pY
		context.fillText(match.opponent.name, oX, oY, 480)
		//clan
		context.font = `32px Supercell-Magic`
		context.fillStyle = "gray"
		const ocX = context.measureText(match.opponent.clanName).width >= 480 ? overlay.width - 480 - 100 : mirrorXPadding(match.opponent.clanName)
		const ocY = pcY
		context.fillText(match.opponent.clanName, ocX, ocY, 480)
		//trophies
		context.fillStyle = "white"
		const otX = mirrorXPadding(match.opponent.trophies) - 32 - 8
		const otY = ptY
		context.drawImage(trophyIcon, otX, otY - 30, 32, 32)
		context.fillText(match.opponent.trophies, otX + 32 + 8, otY)
		//cards
		let cX2 = overlay.width - 100 - cW * 8 - 15 * 7
		let cY2 = ptY - 75 + 25

		for (const rnd of match.oppRounds) {
			//next row
			cX2 = overlay.width - 100 - cW * 8 - 15 * 7
			cY2 += 120

			//score of match
			context.font = `20px Supercell-Magic`
			context.fillText(rnd.crowns, overlay.width / 2 + 40 - context.measureText(rnd.crowns).width / 2, cY2 + cH / 2 + 10)

			for (const c of rnd.cards) {
				const lvl = 14 - (c.maxLevel - c.level) || "?"
				const cardImg = await loadImage(`./src/static/images/${c.used ? "cards" : "grayCards"}/${c.name.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}.png`)
				context.drawImage(cardImg, cX2, cY2, cW, cH)
				context.font = `15px Supercell-Magic`
				context.fillText(lvl, cX2 + (cW - context.measureText(lvl).width) / 2, cY2 + cH + 20)

				cX2 += cW + 15
			}
		}

		//add crowns
		//minus sign
		context.fillRect(overlay.width / 2 - 16, tiY + 96 + 93, 32, 8)
		//team crowns
		const blueCrown = await loadImage("./src/static/images/matchIcons/crown-blue.png")
		context.drawImage(blueCrown, overlay.width / 2 - 16 - 160, tiY + 96 + 70, 60, 49)
		context.font = `35px Supercell-Magic`
		context.fillText(match.wins, (100 - context.measureText(match.team.crowns).width) / 2 + (overlay.width / 2 - 16 - 100), tiY + 96 + 110)
		//opponent crowns
		const redCrown = await loadImage("./src/static/images/matchIcons/crown-red.png")
		context.drawImage(redCrown, overlay.width / 2 + 16 + 100, tiY + 96 + 70, 60, 49)
		context.fillText(match.playerRounds.length - match.wins, overlay.width / 2 + 16 + (100 - context.measureText(match.opponent.crowns).width) / 2, tiY + 96 + 110)

		//add relative time stamp
		context.font = `20px Supercell-Magic`
		context.fillText(relativeDateStr(parseDate(match.timestamp)), 100, overlay.height - 50)
	} else if (match.type === "Boat Battle") {
		//add title
		context.font = `50px Supercell-Magic`
		context.fillStyle = "white"

		const tX = (overlay.width - context.measureText(match.type).width) / 2 //center title horizontally
		const tY = 90
		context.fillText(match.type, tX, tY)

		//add underline
		context.fillRect(tX, tY + 10, context.measureText(match.type).width, 8)

		//add match icon
		const matchIcon = await loadImage(`./src/static/images/matchIcons/${match.iconPath}.png`)
		const tiX = (overlay.width - 96) / 2 //center title horizontally
		const tiY = tY + 20 + 10
		context.drawImage(matchIcon, tiX, tiY, 96, 96)

		//add player
		//name
		context.font = `42px Supercell-Magic`
		const pX = 100
		const pY = tiY + 96 + 60
		context.fillText(match.team.name, pX, pY, 480)
		//clan
		context.font = `32px Supercell-Magic`
		context.fillStyle = "gray"
		const pcX = 100
		const pcY = pY + 42 + 7
		context.fillText(match.team.clanName, pcX, pcY, 480)
		//cards
		context.fillStyle = "white"
		let cX = 100
		let cY = pcY + 40
		for (let i = 0; i < match.team.cards.length; i++) {
			if (i === 4) {
				cX = 100
				cY += 180
			}

			const c = match.team.cards[i]
			const lvl = 14 - (c.maxLevel - c.level) || "?"
			const cardImg = await loadImage(`./src/static/images/cards/${c.name.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}.png`)
			context.drawImage(cardImg, cX, cY, 125, 150)
			context.font = `22px Supercell-Magic`
			context.fillText(lvl, cX + (125 - context.measureText(lvl).width) / 2, cY + 150 + 23)

			cX += 125 + 31
		}

		//add tower stats
		//towers destroyed
		context.font = `28px Supercell-Magic`
		const tdX = canvas.width / 2 + (canvas.width / 2 - context.measureText("Towers").width * 2 - 200) / 2
		const tdY = tiY + 96 + 60
		context.fillText("Towers", tdX, tdY)
		const td2X = tdX - (context.measureText("Destroyed").width - context.measureText("Towers").width) / 2
		const td2Y = tdY + 28 + 15
		context.fillText("Destroyed", td2X, td2Y)
		//image
		const tdImg = await loadImage("./src/static/images/matchIcons/cw2-boat-battle-red-fs8.png")
		const tdiW = 104 * 2
		const tdiH = 128 * 2
		const tdiX = tdX + context.measureText("Towers").width / 2 - tdiW / 2
		const tdiY = pcY + 40
		context.drawImage(tdImg, tdiX, tdiY, tdiW, tdiH)
		const towerTxtWidth = context.measureText("Towers").width
		context.font = `100px Supercell-Magic`
		const tditX = tdX + towerTxtWidth / 2 - context.measureText(match.team.towersDestroyed).width / 2
		const tditY = tdiY + 165
		context.fillText(match.team.towersDestroyed, tditX, tditY)

		//towers remaining
		context.font = `28px Supercell-Magic`
		const trX = canvas.width - (tdX - canvas.width / 2) - context.measureText("Towers").width
		const trY = tiY + 96 + 60
		context.fillText("Towers", trX, trY)
		const tr2X = trX - (context.measureText("Remaining").width - context.measureText("Towers").width) / 2
		const tr2Y = trY + 28 + 15
		context.fillText("Remaining", tr2X, tr2Y)
		//image
		const trImg = await loadImage("./src/static/images/matchIcons/cw2-boat-battle-fs8.png")
		const triW = tdiW
		const triH = tdiH
		const triX = trX + towerTxtWidth / 2 - triW / 2
		const triY = tdiY
		context.drawImage(trImg, triX, triY, triW, triH)
		context.font = `100px Supercell-Magic`
		const tritX = trX + towerTxtWidth / 2 - context.measureText(match.team.towersRemaining).width / 2
		const tritY = tditY
		context.fillText(match.team.towersRemaining, tritX, tritY)

		//add relative time stamp
		context.font = `20px Supercell-Magic`
		context.fillText(relativeDateStr(parseDate(match.timestamp)), 100, overlay.height - 50)
	} else {
		//1v1 Battle
		//add title
		context.font = `50px Supercell-Magic`
		context.fillStyle = "white"

		const tX = (overlay.width - context.measureText(match.type).width) / 2 //center title horizontally
		const tY = 90
		context.fillText(match.type, tX, tY)

		//add underline
		context.fillRect(tX, tY + 10, context.measureText(match.type).width, 8)

		//add match icon
		const matchIcon = await loadImage(`./src/static/images/matchIcons/${match.iconPath}.png`)
		const tiX = (overlay.width - 96) / 2 //center title horizontally
		const tiY = tY + 20 + 10
		context.drawImage(matchIcon, tiX, tiY, 96, 96)

		//add player
		//name
		context.font = `42px Supercell-Magic`
		const pX = 100
		const pY = tiY + 96 + 60
		context.fillText(match.team.name, pX, pY, 480)
		//clan
		context.font = `32px Supercell-Magic`
		context.fillStyle = "gray"
		const pcX = 100
		const pcY = pY + 42 + 7
		context.fillText(match.team.clanName, pcX, pcY, 480)
		//trophies
		context.fillStyle = "white"
		const ptX = 100
		const ptY = pcY + 32 + 18
		const trophyIcon = await loadImage("./src/static/images/matchIcons/trophy.png")
		context.drawImage(trophyIcon, ptX, ptY - 30, 32, 32)
		context.fillText(match.team.trophies, ptX + 32 + 8, ptY)
		//cards
		let cX = 100
		let cY = ptY + 40
		for (let i = 0; i < match.team.cards.length; i++) {
			if (i === 4) {
				cX = 100
				cY += 180
			}

			const c = match.team.cards[i]
			const lvl = 14 - (c.maxLevel - c.level) || "?"
			const cardImg = await loadImage(`./src/static/images/cards/${c.name.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}.png`)
			context.drawImage(cardImg, cX, cY, 125, 150)
			context.font = `22px Supercell-Magic`
			context.fillText(lvl, cX + (125 - context.measureText(lvl).width) / 2, cY + 150 + 23)

			cX += 125 + 31
		}

		//add opponent
		//name
		const mirrorXPadding = (text) => overlay.width - context.measureText(text).width - 100

		context.font = `42px Supercell-Magic`
		const oX = context.measureText(match.opponent.name).width >= 480 ? overlay.width - 480 - 100 : mirrorXPadding(match.opponent.name)
		const oY = pY
		context.fillText(match.opponent.name, oX, oY, 480)
		//clan
		context.font = `32px Supercell-Magic`
		context.fillStyle = "gray"
		const ocX = context.measureText(match.opponent.clanName).width >= 480 ? overlay.width - 480 - 100 : mirrorXPadding(match.opponent.clanName)
		const ocY = pcY
		context.fillText(match.opponent.clanName, ocX, ocY, 490)
		//trophies
		context.fillStyle = "white"
		const otX = mirrorXPadding(match.opponent.trophies) - 32 - 8
		const otY = ptY
		context.drawImage(trophyIcon, otX, otY - 30, 32, 32)
		context.fillText(match.opponent.trophies, otX + 32 + 8, otY)
		//cards
		let cX2 = overlay.width - 100 - 125 * 4 - 31 * 3
		let cY2 = otY + 40
		for (let i = 0; i < match.opponent.cards.length; i++) {
			if (i === 4) {
				cX2 = overlay.width - 100 - 125 * 4 - 31 * 3
				cY2 += 180
			}

			const c = match.opponent.cards[i]
			const lvl = 14 - (c.maxLevel - c.level) || "?"
			const cardImg = await loadImage(`./src/static/images/cards/${c.name.toLowerCase().replaceAll(" ", "-").replaceAll(".", "")}.png`)
			context.drawImage(cardImg, cX2, cY2, 125, 150)
			context.font = `22px Supercell-Magic`
			context.fillText(lvl, cX2 + (125 - context.measureText(lvl).width) / 2, cY2 + 150 + 23)

			cX2 += 125 + 31
		}

		//add crowns
		//minus sign
		context.fillRect(overlay.width / 2 - 16, tiY + 96 + 93, 32, 8)
		//team crowns
		const blueCrown = await loadImage("./src/static/images/matchIcons/crown-blue.png")
		context.drawImage(blueCrown, overlay.width / 2 - 16 - 160, tiY + 96 + 70, 60, 49)
		context.font = `35px Supercell-Magic`
		context.fillText(match.team.crowns, (100 - context.measureText(match.team.crowns).width) / 2 + (overlay.width / 2 - 16 - 100), tiY + 96 + 110)
		//opponent crowns
		const redCrown = await loadImage("./src/static/images/matchIcons/crown-red.png")
		context.drawImage(redCrown, overlay.width / 2 + 16 + 100, tiY + 96 + 70, 60, 49)
		context.fillText(match.opponent.crowns, overlay.width / 2 + 16 + (100 - context.measureText(match.opponent.crowns).width) / 2, tiY + 96 + 110)

		//add relative time stamp
		context.font = `20px Supercell-Magic`
		context.fillText(relativeDateStr(parseDate(match.timestamp)), 100, overlay.height - 50)
	}

	return canvas.toBuffer()
}

module.exports = createMatchImg
