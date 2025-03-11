const models = require("../models");
const axios = require('axios');
const { Op } = require("sequelize");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
exports.findResult = async (req, res, next) => {
    let findMatches
    const now = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(now.getDate() - 2);
    try {
        findMatches = await models.game.findAll({
            where: {
                // startTime: { [Op.lte]: new Date() },
                startTime: {
                    [Op.between]: [twoDaysAgo, now]
                },
                sportsId: "sr:sport:2",
                competitionId: "sr:competition:132"
            },
            attributes: ["id", "sportsId", "sportsTableId", "competitionId", "gameId", "competitors1Id"],
            // limit: 1
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in having matches",
        });
    }
    // const uniqueMatchIds = [...new Set(findMatches.map(match => match.gameId))];

    // console.log("Unique Match IDs:", uniqueMatchIds);

    console.log(findMatches.length)
    // return false
    for (let i = 0; i < findMatches.length; i++) {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: "https://api.sportradar.com/basketball/production/v2/" + process.env.SPORTRADER_LOCALE + "/sport_events/" + findMatches[i].gameId + "/summary." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
            headers: {}
        };

        axios.request(config)
            .then(async (response) => {
                let allSports
                console.log(JSON.stringify(response.data.statistics));
                for (let j = 0; j < response.data.statistics.totals.competitors.length; j++) {
                    for (let k = 0; k < response.data.statistics.totals.competitors[j].players.length; k++) {
                        console.log("jhujkh")
                        let findPlayerStat = await models.playerStatAfterMatch.findOne({
                            where: {
                                sportsId: findMatches[i].sportsId,
                                competitionId: findMatches[i].competitionId,
                                gameId: findMatches[i].gameId,
                                playersId: response.data.statistics.totals.competitors[j].players[k].id
                            }
                        })
                        if (findPlayerStat) {
                            try{
                            await models.playerStatAfterMatch.update({
                                sportsId: findMatches[i].sportsId,
                                competitionId: findMatches[i].competitionId,
                                gameId: findMatches[i].gameId,
                                playersId: response.data.statistics.totals.competitors[j].players[k].id,
                                compititorId: response.data.statistics.totals.competitors[j].id,
                                assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.assists,
                                blocks: response.data.statistics.totals.competitors[j].players[k]?.statistics?.blocks,
                                defensive_rebounds: response.data.statistics.totals.competitors[j].players[k]?.statistics?.defensive_rebounds,
                                field_goals_attempted: response.data.statistics.totals.competitors[j].players[k]?.statistics.field_goals_attempted,
                                field_goals_made: response.data.statistics.totals.competitors[j].players[k]?.statistics?.field_goals_made,
                                free_throws_attempted: response.data.statistics.totals.competitors[j].players[k]?.statistics?.free_throws_attempted,
                                free_throws_made: response.data.statistics.totals.competitors[j].players[k]?.statistics?.free_throws_made,
                                minutes: response.data.statistics.totals.competitors[j].players[k]?.statistics?.minutes,
                                offensive_rebounds: response.data.statistics.totals.competitors[j].players[k]?.statistics?.offensive_rebounds,
                                personal_fouls: response.data.statistics.totals.competitors[j].players[k]?.statistics?.personal_fouls,
                                points: response.data.statistics.totals.competitors[j].players[k]?.statistics?.points,
                                steals: response.data.statistics.totals.competitors[j].players[k]?.statistics?.steals,
                                technical_fouls: response.data.statistics.totals.competitors[j].players[k]?.statistics?.technical_fouls,
                                three_pointers_attempted: response.data.statistics.totals.competitors[j].players[k]?.statistics?.three_pointers_attempted,
                                three_pointers_made: response.data.statistics.totals.competitors[j].players[k]?.statistics?.three_pointers_made,
                                total_rebounds: response.data.statistics.totals.competitors[j].players[k]?.statistics?.total_rebounds,
                                turnovers: response.data.statistics.totals.competitors[j].players[k]?.statistics?.turnovers
                            }, {
                                where: {
                                    id: findPlayerStat.id
                                }
                            })
                        }catch(e){
                            console.log("error on update", e)
                        }
                        }else{
                            try{
                            await models.playerStatAfterMatch.create({
                                sportsId: findMatches[i].sportsId,
                                competitionId: findMatches[i].competitionId,
                                gameId: findMatches[i].gameId,
                                playersId: response.data.statistics.totals.competitors[j]?.players[k]?.id,
                                compititorId: response.data.statistics.totals.competitors[j]?.id,
                                assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.assists,
                                blocks: response.data.statistics.totals.competitors[j].players[k]?.statistics?.blocks,
                                defensive_rebounds: response.data.statistics.totals.competitors[j].players[k]?.statistics?.defensive_rebounds,
                                field_goals_attempted: response.data.statistics.totals.competitors[j].players[k]?.statistics?.field_goals_attempted,
                                field_goals_made: response.data.statistics.totals.competitors[j].players[k]?.statistics?.field_goals_made,
                                free_throws_attempted: response.data.statistics.totals.competitors[j].players[k]?.statistics?.free_throws_attempted,
                                free_throws_made: response.data.statistics.totals.competitors[j].players[k]?.statistics?.free_throws_made,
                                minutes: response.data.statistics.totals.competitors[j].players[k]?.statistics?.minutes,
                                offensive_rebounds: response.data.statistics.totals.competitors[j].players[k]?.statistics?.offensive_rebounds,
                                personal_fouls: response.data.statistics.totals.competitors[j].players[k]?.statistics?.personal_fouls,
                                points: response.data.statistics.totals.competitors[j].players[k]?.statistics?.points,
                                steals: response.data.statistics.totals.competitors[j].players[k]?.statistics?.steals,
                                technical_fouls: response.data.statistics.totals.competitors[j].players[k]?.statistics?.technical_fouls,
                                three_pointers_attempted: response.data.statistics.totals.competitors[j].players[k]?.statistics?.three_pointers_attempted,
                                three_pointers_made: response.data.statistics.totals.competitors[j].players[k]?.statistics?.three_pointers_made,
                                total_rebounds: response.data.statistics.totals.competitors[j].players[k]?.statistics?.total_rebounds,
                                turnovers: response.data.statistics.totals.competitors[j].players[k]?.statistics?.turnovers
                            })}
                            catch(e){
                                console.log("error on create", e)
                            }
                        }
                    }

                }
                await sleep(2000);
                console.log("done")
            })
            .catch((e) => {
                console.log(e)
            })
    }

    return res.status(200).send({
        success: true,
        message: "All record stored"
      });

}

exports.findResultNHL = async (req, res, next) => {
    let findMatches
    const now = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(now.getDate() - 2);
    try {
        findMatches = await models.game.findAll({
            where: {
                // startTime: { [Op.lte]: new Date() },
                startTime: {
                    [Op.between]: [twoDaysAgo, now]
                },
                sportsId: "sr:sport:4",
                competitionId: "sr:competition:234"
            },
            attributes: ["id", "sportsId", "sportsTableId", "competitionId", "gameId", "competitors1Id"],
            // limit: 1
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in having matches",
        });
    }
    // const uniqueMatchIds = [...new Set(findMatches.map(match => match.gameId))];

    // console.log("Unique Match IDs:", uniqueMatchIds);

    // console.log(findMatches.length)
    // return false
    for (let i = 0; i < findMatches.length; i++) {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: "https://api.sportradar.com/icehockey/production/v2/" + process.env.SPORTRADER_LOCALE + "/sport_events/" + findMatches[i].gameId + "/summary." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
            headers: {}
        };

        axios.request(config)
            .then(async (response) => {
                let allSports
                console.log(JSON.stringify(response.data.statistics));
                for (let j = 0; j < response.data.statistics.totals.competitors.length; j++) {
                    for (let k = 0; k < response.data.statistics.totals.competitors[j].players.length; k++) {
                        console.log("jhujkh")
                        let findPlayerStat = await models.playerStatAfterMatch.findOne({
                            where: {
                                sportsId: findMatches[i].sportsId,
                                competitionId: findMatches[i].competitionId,
                                gameId: findMatches[i].gameId,
                                playersId: response.data.statistics.totals.competitors[j].players[k].id
                            }
                        })
                        if (findPlayerStat) {
                            try{
                            await models.playerStatAfterMatch.update({
                                sportsId: findMatches[i].sportsId,
                                competitionId: findMatches[i].competitionId,
                                gameId: findMatches[i].gameId,
                                playersId: response.data.statistics.totals.competitors[j].players[k].id,
                                compititorId: response.data.statistics.totals.competitors[j].id,
                                assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.assists,
                                first_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.first_assists,
                                goalie_minutes_played: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goalie_minutes_played,
                                goals: response.data.statistics.totals.competitors[j].players[k]?.statistics.goals,
                                goals_conceded: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goals_conceded,
                                penalties: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalties,
                                penalty_minutes: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalty_minutes,
                                plus_minus: response.data.statistics.totals.competitors[j].players[k]?.statistics?.plus_minus,
                                points: response.data.statistics.totals.competitors[j].players[k]?.statistics?.points,
                                saves: response.data.statistics.totals.competitors[j].players[k]?.statistics?.saves,
                                second_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.second_assists,
                                shots_on_goal: response.data.statistics.totals.competitors[j].players[k]?.statistics?.shots_on_goal
                            }, {
                                where: {
                                    id: findPlayerStat.id
                                }
                            })
                        }catch(e){
                            console.log("error on update", e)
                        }
                        }else{
                            try{
                            await models.playerStatAfterMatch.create({
                                sportsId: findMatches[i].sportsId,
                                competitionId: findMatches[i].competitionId,
                                gameId: findMatches[i].gameId,
                                playersId: response.data.statistics.totals.competitors[j].players[k].id,
                                compititorId: response.data.statistics.totals.competitors[j].id,
                                assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.assists,
                                first_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.first_assists,
                                goalie_minutes_played: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goalie_minutes_played,
                                goals: response.data.statistics.totals.competitors[j].players[k]?.statistics.goals,
                                goals_conceded: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goals_conceded,
                                penalties: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalties,
                                penalty_minutes: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalty_minutes,
                                plus_minus: response.data.statistics.totals.competitors[j].players[k]?.statistics?.plus_minus,
                                points: response.data.statistics.totals.competitors[j].players[k]?.statistics?.points,
                                saves: response.data.statistics.totals.competitors[j].players[k]?.statistics?.saves,
                                second_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.second_assists,
                                shots_on_goal: response.data.statistics.totals.competitors[j].players[k]?.statistics?.shots_on_goal
                            })}
                            catch(e){
                                console.log("error on create", e)
                            }
                        }
                    }

                }
                await sleep(2000);
                console.log("done")
            })
            .catch((e) => {
                console.log(e)
            })
    }

    return res.status(200).send({
        success: true,
        message: "All record stored"
      });

}