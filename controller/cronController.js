const cron = require("node-cron");
const models = require("../models");
const axios = require('axios');
const { combineTableNames } = require("sequelize/lib/utils");
const { Op } = require("sequelize");
const { checkCurrentResult } = require("../function/resultCalculation");
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
let minimumOddsValue = 1.8

module.exports = function (app) {
  cron.schedule("30 2,5,8,10,12,15,19 * * *", async () => { // 3.30 am
    // cron.schedule("* * * * *", async () => {
    try {
      await models.cronLog.create({
        cronName: "match list create"
      })
    } catch (e) {
      await models.cronLog.create({
        cronName: "match list create catch"
      })
    }
    let allSports
    try {
      allSports = await models.sports.findAll({
        where: { status: "A" },
        attributes: ["id", "sportsId"]
      })
    } catch (e) {
      console.log("error on finding game name", e)
    }
    // console.log(allSports)

    for (let ii = 0; ii < allSports.length; ii++) {
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sports/" + allSports[ii].sportsId + "/competitions." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
        headers: {}
      };
      console.log(allSports[ii].sportsId, process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sports/" + allSports[ii].sportsId + "/competitions." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY)

      await axios.request(config)
        .then(async (response) => {
          let allCompetition
          // console.log(JSON.stringify(response));
          // console.log(JSON.stringify(response.data.competitions.length));
          for (let i = 0; i < response.data.competitions.length; i++) {
            let findSameCompetition
            try {
              findSameCompetition = await models.competitions.findOne({
                where: { competitionsId: response.data.competitions[i].id },
                attributes: ["id", "competitionsId"]
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in finding competetion name",
                error: e.message
              });
            }
            console.log("response.data.competitions[i]....", response.data.competitions[i])
            if (findSameCompetition) {
              try {
                await models.competitions.update({
                  sportsId: allSports[ii].sportsId,
                  competitionsId: response.data.competitions[i].id,
                  name: response.data.competitions[i].name,
                  gender: response.data.competitions[i].gender,
                  market: response.data.competitions[i].market,
                  futures: response.data.competitions[i].futures,
                  playerProps: response.data.competitions[i].player_props,
                  categoryId: response.data.competitions[i].category.id,
                  categoryName: response.data.competitions[i].category.name,
                  categoryCountryCode: response.data.competitions[i].category.country_code,
                }, {
                  where: { id: findSameCompetition.id }
                })
              } catch (e) {
                return res.status(500).send({
                  success: false,
                  message: "error, in updating competition name",
                  error: e.message
                });
              }
            } else {
              try {
                await models.competitions.create({
                  sportsId: allSports[ii].sportsId,
                  competitionsId: response.data.competitions[i].id,
                  name: response.data.competitions[i].name,
                  gender: response.data.competitions[i].gender,
                  market: response.data.competitions[i].market,
                  futures: response.data.competitions[i].futures,
                  playerProps: response.data.competitions[i].player_props,
                  categoryId: response.data.competitions[i].category.id,
                  categoryName: response.data.competitions[i].category.name,
                  categoryCountryCode: response.data.competitions[i].category.country_code,
                })
              } catch (e) {
                return res.status(500).send({
                  success: false,
                  message: "error, in creating competition name",
                  error: e.message
                });
              }
            }

            // game  ----------------------------
            // if (response.data.competitions[i].id != "sr:competition:486" || response.data.competitions[i].id != "sr:competition:648") {
              let gameConfig = {
                method: 'get',
                maxBodyLength: Infinity,
                url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/competitions/" + response.data.competitions[i].id + "/schedules." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
                headers: {}
              };
              await axios.request(gameConfig)
                .then(async (gameResponse) => {
                  if(response.data.competitions[i].id=="sr:competition:648"){
                    allSports[ii].sportsId="sr:FNCAAsport:2"
                }
                  console.log(JSON.stringify(gameResponse.data?.schedules?.length));
                  console.log(JSON.stringify(gameResponse.data));
                  for (let j = 0; j < gameResponse.data?.schedules?.length; j++) {
                    let findSameGame
                    try {
                      findSameGame = await models.game.findOne({
                        where: { gameId: gameResponse.data.schedules[j].sport_event.id },
                        attributes: ["id", "gameId"]
                      })
                    } catch (e) {
                      return res.status(500).send({
                        success: false,
                        message: "error, in finding game name",
                        error: e.message
                      });
                    }
                    if (findSameGame) {
                      try {
                        await models.game.update({
                          sportsId: allSports[ii].sportsId,
                          competitionId: response.data.competitions[i].id,
                          gameId: gameResponse.data.schedules[j].sport_event.id,
                          startTime: gameResponse.data.schedules[j].sport_event.start_time,
                          startTimeConfirmed: gameResponse.data.schedules[j].sport_event.start_time_confirmed,
                          competitors1Id: gameResponse.data.schedules[j].sport_event.competitors[0]?.id,
                          competitors1Name: gameResponse.data.schedules[j].sport_event.competitors[0]?.name,
                          competitors1Country: gameResponse.data.schedules[j].sport_event.competitors[0]?.country,
                          competitors1CountryCode: gameResponse.data.schedules[j].sport_event.competitors[0]?.country_code,
                          competitors1Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[0]?.abbreviation,
                          competitors1Qualifier: gameResponse.data.schedules[j].sport_event.competitors[0]?.qualifier,
                          competitors1RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[0]?.rotation_number,
                          competitors2Id: gameResponse.data.schedules[j].sport_event.competitors[1]?.id,
                          competitors2Name: gameResponse.data.schedules[j].sport_event.competitors[1]?.name,
                          competitors2Country: gameResponse.data.schedules[j].sport_event.competitors[1]?.country,
                          competitors2CountryCode: gameResponse.data.schedules[j].sport_event.competitors[1]?.country_code,
                          competitors2Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[1]?.abbreviation,
                          competitors2Qualifier: gameResponse.data.schedules[j].sport_event.competitors[1]?.qualifier,
                          competitors2RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[1]?.rotation_number,
                        }, {
                          where: { id: findSameGame.id }
                        })
                      } catch (e) {
                        console.log(e)
                        return res.status(500).send({
                          success: false,
                          message: "error, in updating game name",
                          error: e.message
                        });
                      }
                    } else {
                      try {
                        await models.game.create({
                          sportsId: allSports[ii].sportsId,
                          competitionId: response.data.competitions[i].id,
                          gameId: gameResponse.data.schedules[j].sport_event.id,
                          startTime: gameResponse.data.schedules[j].sport_event.start_time,
                          startTimeConfirmed: gameResponse.data.schedules[j].sport_event.start_time_confirmed,
                          competitors1Id: gameResponse.data.schedules[j].sport_event.competitors[0]?.id,
                          competitors1Name: gameResponse.data.schedules[j].sport_event.competitors[0]?.name,
                          competitors1Country: gameResponse.data.schedules[j].sport_event.competitors[0]?.country,
                          competitors1CountryCode: gameResponse.data.schedules[j].sport_event.competitors[0]?.country_code,
                          competitors1Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[0]?.abbreviation,
                          competitors1Qualifier: gameResponse.data.schedules[j].sport_event.competitors[0]?.qualifier,
                          competitors1RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[0]?.rotation_number,
                          competitors2Id: gameResponse.data.schedules[j].sport_event.competitors[1]?.id,
                          competitors2Name: gameResponse.data.schedules[j].sport_event.competitors[1]?.name,
                          competitors2Country: gameResponse.data.schedules[j].sport_event.competitors[1]?.country,
                          competitors2CountryCode: gameResponse.data.schedules[j].sport_event.competitors[1]?.country_code,
                          competitors2Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[1]?.abbreviation,
                          competitors2Qualifier: gameResponse.data.schedules[j].sport_event.competitors[1]?.qualifier,
                          competitors2RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[1]?.rotation_number,
                        })
                      } catch (e) {
                        console.log(e)
                        return res.status(500).send({
                          success: false,
                          message: "error, in creating game name",
                          error: e.message
                        });
                      }
                    }
                  }

                }).catch((e) => {
                  console.log(e)
                })
            // }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  })

  // for other data
  // cron.schedule("22 20 * * *", async () => { // 12.30 am
  cron.schedule("0 3,6,9,11,13,16,20 * * *", async () => {  //4 am ....
    console.log("cron")
    try {
      await models.cronLog.create({
        cronName: "player list create"
      })
    } catch (e) {
      await models.cronLog.create({
        cronName: "player list create catch"
      })
    }
    let allGame
    let today = new Date()
    try {
      allGame = await models.game.findAll({
        where: {
          status: "A",
          competitionId: { [Op.in]: ["sr:competition:132", "sr:competition:234", "sr:competition:31", "sr:competition:648", "sr:competition:109", "sr:competition:2456" ] },
          startTime: {
            [Op.between]: [
              new Date(today.setDate(today.getDate() - 1)), // 1 day in the past
              new Date(today.setDate(today.getDate() + 3)) // 3 days into the future
            ]
          },
        },
        attributes: ["id", "sportsId", "competitionId", "gameId", "startTime"],
        order: [["startTime", "DESC"]]
      })
    } catch (e) {
      console.log("error on find game list from table", e)
    }
    console.log(allGame)
    console.log(allGame.length)

    for (let ii = 0; ii < allGame.length; ii++) {
      let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sport_events/" + allGame[ii].gameId + "/players_props." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
        headers: {}
      }

      axios.request(config)
        .then(async (response) => {
          let allPlayer
          if(allGame[ii].competitionId=="sr:competition:648"){
            allGame[ii].sportsId="sr:FNCAAsport:2"
          }
          console.log(JSON.stringify(response.data));
          // console.log(allGame[ii].sportsId)
          // return false
          for (let i = 0; i < response.data.sport_event_players_props?.players_props?.length; i++) {
            let findSamePlayerDetails
            let addedPlayerId
            try {
              findSamePlayerDetails = await models.playerList.findOne({
                where: { playersId: response.data.sport_event_players_props.players_props[i].player.id },
                attributes: ["id", "playerName"]
              })
            } catch (e) {
              console.log("error, in finding player name..")
            }
            if (findSamePlayerDetails) {
              addedPlayerId = findSamePlayerDetails.id
              try {
                await models.playerList.update({
                  playersId: response.data.sport_event_players_props.players_props[i].player.id,
                  playerName: response.data.sport_event_players_props.players_props[i].player.name,
                  sportsId: allGame[ii].sportsId,
                  sportsTableId: allGame[ii].sportsTableId,
                }, {
                  where: { id: findSamePlayerDetails.id }
                })
              } catch (e) {
                console.log("error, in updating player name..", e)
              }
            } else {
              try {
                let createdPlayerList = await models.playerList.create({
                  playersId: response.data.sport_event_players_props.players_props[i].player.id,
                  playerName: response.data.sport_event_players_props.players_props[i].player.name,
                  sportsId: allGame[ii].sportsId,
                  sportsTableId: allGame[ii].sportsTableId,
                })
                addedPlayerId = createdPlayerList.id
              } catch (e) {
                console.log("error, in creating player..")
              }
            }

            let findSamePlayer
            try {
              findSamePlayer = await models.players.findOne({
                where: { playersId: response.data.sport_event_players_props.players_props[i].player.id, gameId: response.data.sport_event_players_props.sport_event.id },
                attributes: ["id", "playersId", "gameId"]
              })
            } catch (e) {
              console.log("error, in finding player name..")
            }
            if (findSamePlayer) {
              try {
                await models.players.update({
                  sportsTableId: allGame[ii].sportsTableId,
                  sportsId: allGame[ii].sportsId,
                  competitionId: allGame[ii].competitionId,
                  gameId: allGame[ii].gameId,
                  startTime: response.data.sport_event_players_props.sport_event.start_time,
                  playersId: response.data.sport_event_players_props.players_props[i].player.id,
                  playerName: response.data.sport_event_players_props.players_props[i].player.name,
                  competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                  markets: response.data.sport_event_players_props.players_props[i].markets,
                  playerListId: addedPlayerId,
                }, {
                  where: { id: findSamePlayer.id }
                })
                for (let j = 0; j < response.data.sport_event_players_props.players_props[i].markets.length; j++) {
                  for (let k = 0; k < response.data.sport_event_players_props.players_props[i].markets[j].books.length; k++) {
                    let isMarketPresent = false
                    if (response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
                      isMarketPresent = true
                    }

                    console.log("market name", response.data.sport_event_players_props.players_props[i].markets[j].books[k].name)
                    // return false
                    if (isMarketPresent == true && response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
                      if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && allGame[ii].sportsId == "sr:sport:4")) {
                        let findMarket = await models.markets.findOne({
                          where: {
                            gameId: allGame[ii].gameId,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            playerTableId: findSamePlayer.id,
                          }
                        })
                        if (findMarket) {
                          await models.markets.update({
                            sportsTableId: allGame[ii].sportsTableId,
                            sportsId: allGame[ii].sportsId,
                            competitionId: allGame[ii].competitionId,
                            gameId: allGame[ii].gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            playerName: response.data.sport_event_players_props.players_props[i].player.name,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
                            oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
                            books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: findSamePlayer.id,
                          }, {
                            where: {
                              id: findMarket.id
                            }
                          })
                        } else {
                          await models.markets.create({
                            sportsTableId: allGame[ii].sportsTableId,
                            sportsId: allGame[ii].sportsId,
                            competitionId: allGame[ii].competitionId,
                            gameId: allGame[ii].gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            playerName: response.data.sport_event_players_props.players_props[i].player.name,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
                            oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
                            books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: findSamePlayer.id,
                          })
                        }
                      }
                    }

                    if (isMarketPresent == false && k == 0) {
                      if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && allGame[ii].sportsId == "sr:sport:4")) {
                        let findMarket = await models.markets.findOne({
                          where: {
                            gameId: allGame[ii].gameId,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            playerTableId: findSamePlayer.id,
                          }
                        })
                        if (findMarket) {
                          await models.markets.update({
                            sportsTableId: allGame[ii].sportsTableId,
                            sportsId: allGame[ii].sportsId,
                            competitionId: allGame[ii].competitionId,
                            gameId: allGame[ii].gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            playerName: response.data.sport_event_players_props.players_props[i].player.name,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
                            oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
                            books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: findSamePlayer.id,
                          }, {
                            where: {
                              id: findMarket.id
                            }
                          })
                        } else {
                          await models.markets.create({
                            sportsTableId: allGame[ii].sportsTableId,
                            sportsId: allGame[ii].sportsId,
                            competitionId: allGame[ii].competitionId,
                            gameId: allGame[ii].gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            playerName: response.data.sport_event_players_props.players_props[i].player.name,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
                            oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
                            books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: findSamePlayer.id,
                          })
                        }
                      }
                    }

                  }
                }
              } catch (e) {
                console.log("error, in update player name..", e)
              }
            } else {
              try {
                let playerCreate = await models.players.create({
                  sportsTableId: allGame[ii].sportsTableId,
                  sportsId: allGame[ii].sportsId,
                  competitionId: allGame[ii].competitionId,
                  gameId: allGame[ii].gameId,
                  startTime: response.data.sport_event_players_props.sport_event.start_time,
                  playersId: response.data.sport_event_players_props.players_props[i].player.id,
                  playerName: response.data.sport_event_players_props.players_props[i].player.name,
                  competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                  markets: response.data.sport_event_players_props.players_props[i].markets,
                  playerListId: addedPlayerId
                })
                for (let j = 0; j < response.data.sport_event_players_props.players_props[i].markets.length; j++) {
                  for (let k = 0; k < response.data.sport_event_players_props.players_props[i].markets[j].books.length; k++) {
                    console.log("market name", response.data.sport_event_players_props.players_props[i].markets[j].books[k].name)
                    // return false
                    let isMarketPresent = false
                    if (response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
                      isMarketPresent = true
                    }
                    // if (response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
                    if (isMarketPresent == true && response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
                      if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && findGame.sportsId == "sr:sport:4")) {
                        if (response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal > minimumOddsValue || response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[1]?.odds_decimal > minimumOddsValue) {
                          await models.markets.create({
                            sportsTableId: allGame[ii].sportsTableId,
                            sportsId: allGame[ii].sportsId,
                            competitionId: allGame[ii].competitionId,
                            gameId: allGame[ii].gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            playerName: response.data.sport_event_players_props.players_props[i].player.name,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal > minimumOddsValue ? response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.total : response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[1]?.total, //response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
                            oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal > minimumOddsValue ? response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal : response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[1]?.odds_decimal,
                            books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: playerCreate.id,
                          })

                          let findMarket = await models.marketName.findOne({
                            where: { marketId: response.data.sport_event_players_props.players_props[i].markets[j].id }
                          })
                          if (!findMarket) {
                            await models.marketName.create({
                              name: response.data.sport_event_players_props.players_props[i].markets[j].name,
                              marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                              sportsId: allGame[ii].sportsId,
                            })
                          }
                        }
                      }
                    }
                    else if (k == 0) {
                      if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && allGame[ii].sportsId == "sr:sport:4")) {
                        if (response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal > minimumOddsValue || response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[1]?.odds_decimal > minimumOddsValue) {

                          await models.markets.create({
                            sportsTableId: allGame[ii].sportsTableId,
                            sportsId: allGame[ii].sportsId,
                            competitionId: allGame[ii].competitionId,
                            gameId: allGame[ii].gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props.players_props[i].player.id,
                            playerName: response.data.sport_event_players_props.players_props[i].player.name,
                            competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
                            marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                            bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
                            bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                            bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal > minimumOddsValue ? response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.total : response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[1]?.total, // response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
                            oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal > minimumOddsValue ? response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal : response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[1]?.odds_decimal, //response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
                            books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: playerCreate.id,
                          })

                          let findMarket = await models.marketName.findOne({
                            where: { marketId: response.data.sport_event_players_props.players_props[i].markets[j].id }
                          })
                          if (!findMarket) {
                            await models.marketName.create({
                              name: response.data.sport_event_players_props.players_props[i].markets[j].name,
                              marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                              sportsId: allGame[ii].sportsId,
                            })
                          }
                        }
                      }
                    }
                  }
                }
                // return false
              } catch (e) {
                console.log("error, in create player..", e)
              }
            }
            // return false
          }
          //soccer
          // console.log("here...",response.data.sport_event_players_props?.players_props )
          // if (!response.data.sport_event_players_props?.players_props || response.data.sport_event_players_props?.players_props?.length == 0) {
          //   console.log("length 0")
          //   for (let i = 0; i < response.data.sport_event_players_props?.players_markets?.markets?.length; i++) {
          //     for (let j = 0; j < response.data.sport_event_players_props?.players_markets?.markets[i]?.books?.length; j++) {
          //       console.log("response.data.sport_event_players_props?.players_markets?.markets[i]?.books", response.data.sport_event_players_props?.players_markets?.markets[i]?.name)
          //       for (let k = 0; k < response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes?.length; k++) {

          //         let addedPlayerId
          //         let findSamePlayerDetails
          //         console.log(response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k])
          //         if (response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k] && response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id) {
          //           console.log("if", response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id)
          //           try {
          //             findSamePlayerDetails = await models.playerList.findOne({
          //               where: { playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id },
          //               attributes: ["id", "playerName"]
          //             })
          //           } catch (e) {
          //             console.log("error, in finding player name..", e)
          //           }
          //           if (findSamePlayerDetails) {
          //             addedPlayerId = findSamePlayerDetails.id
          //             try {
          //               await models.playerList.update({
          //                 playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                 playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
          //                 sportsId: allGame[ii].sportsId,
          //                 sportsTableId: allGame[ii].sportsTableId,
          //               }, {
          //                 where: { id: findSamePlayerDetails.id }
          //               })
          //             } catch (e) {
          //               console.log("error, in update player name..", e)
          //             }
          //           } else {
          //             try {
          //               let createdPlayerList = await models.playerList.create({
          //                 playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                 playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
          //                 sportsId: allGame[ii].sportsId,
          //                 sportsTableId: allGame[ii].sportsTableId,
          //               })
          //               addedPlayerId = createdPlayerList.id
          //             } catch (e) {
          //               console.log("error in create player", e);
          //             }
          //           }

          //           let findSamePlayer
          //           try {
          //             findSamePlayer = await models.players.findOne({
          //               where: { playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id, gameId: response.data.sport_event_players_props.sport_event.id },
          //               attributes: ["id", "playersId", "gameId"]
          //             })
          //           } catch (e) {
          //             console.log("error, in finding player name..", e)
          //           }
          //           if (findSamePlayer) {
          //             try {
          //               await models.players.update({
          //                 sportsTableId: allGame[ii].sportsTableId,
          //                 sportsId: allGame[ii].sportsId,
          //                 competitionId: allGame[ii].competitionId,
          //                 gameId: allGame[ii].gameId,
          //                 startTime: response.data.sport_event_players_props.sport_event.start_time,
          //                 playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                 playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
          //                 // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
          //                 // markets: response.data.sport_event_players_props.players_props[i].markets,
          //                 playerListId: addedPlayerId,
          //               }, {
          //                 where: { id: findSamePlayer.id }
          //               })

          //               // for (let jj = 0; jj < response.data.sport_event_players_props.players_props[i].markets.length; jj++) {
          //               //   for (let kk = 0; kk < response.data.sport_event_players_props.players_props[i].markets[j].books.length; kk++) {
          //               //     console.log("market name", response.data.sport_event_players_props.players_props[i].markets[j].books[k].name)
          //               // return false
          //               //   }
          //               // }
          //               if (response.data.sport_event_players_props?.players_markets?.markets[i]?.name == "FanDuel" || response.data.sport_event_players_props?.players_markets?.markets[i]?.name == "DraftKings") {
          //                 let findMarket = await models.markets.findOne({
          //                   where: {
          //                     gameId: allGame[ii].gameId,
          //                     playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                     // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
          //                     bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
          //                     marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
          //                     playerTableId: findSamePlayer.id,
          //                   }
          //                 })
          //                 if (findMarket) {
          //                   await models.markets.update({
          //                     sportsTableId: allGame[ii].sportsTableId,
          //                     sportsId: allGame[ii].sportsId,
          //                     competitionId: allGame[ii].competitionId,
          //                     gameId: allGame[ii].gameId,
          //                     startTime: response.data.sport_event_players_props.sport_event.start_time,
          //                     playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                     playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
          //                     // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
          //                     // markets: response.data.sport_event_players_props.players_props[i].markets,
          //                     playerListId: addedPlayerId,
          //                     marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
          //                     marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
          //                     bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
          //                     bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
          //                     bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
          //                     // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
          //                     playerTableId: findSamePlayer.id,
          //                   }, {
          //                     where: {
          //                       id: findMarket.id
          //                     }
          //                   })
          //                 } else {
          //                   await models.markets.create({
          //                     sportsTableId: allGame[ii].sportsTableId,
          //                     sportsId: allGame[ii].sportsId,
          //                     competitionId: allGame[ii].competitionId,
          //                     gameId: allGame[ii].gameId,
          //                     startTime: response.data.sport_event_players_props.sport_event.start_time,
          //                     playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                     playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
          //                     // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
          //                     // markets: response.data.sport_event_players_props.players_props[i].markets,
          //                     playerListId: addedPlayerId,
          //                     marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
          //                     marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
          //                     bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
          //                     bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
          //                     bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
          //                     // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
          //                     playerTableId: findSamePlayer.id,
          //                   })
          //                 }
          //                 // }
          //                 // }
          //               }
          //             } catch (e) {
          //               console.log("error, in updating player name..", e)
          //             }
          //           } else {
          //             try {
          //               let playerCreate = await models.players.create({
          //                 sportsTableId: allGame[ii].sportsTableId,
          //                 sportsId: allGame[ii].sportsId,
          //                 competitionId: allGame[ii].competitionId,
          //                 gameId: allGame[ii].gameId,
          //                 startTime: response.data.sport_event_players_props.sport_event.start_time,
          //                 playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                 playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
          //                 // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
          //                 // markets: response.data.sport_event_players_props.players_props[i].markets,
          //                 playerListId: addedPlayerId
          //               })
          //               if (response.data.sport_event_players_props?.players_markets?.markets[i]?.name == "FanDuel" || response.data.sport_event_players_props?.players_markets?.markets[i]?.name == "DraftKings") {
          //                 await models.markets.create({

          //                   sportsTableId: allGame[ii].sportsTableId,
          //                   sportsId: allGame[ii].sportsId,
          //                   competitionId: allGame[ii].competitionId,
          //                   gameId: allGame[ii].gameId,
          //                   startTime: response.data.sport_event_players_props.sport_event.start_time,
          //                   playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
          //                   playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
          //                   // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
          //                   // markets: response.data.sport_event_players_props.players_props[i].markets,
          //                   playerListId: addedPlayerId,
          //                   marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
          //                   marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
          //                   bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
          //                   bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
          //                   bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
          //                   // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
          //                   playerTableId: playerCreate.id
          //                 })
          //               }
          //             } catch (e) {
          //               console.log("error, in creating player..", e)
          //             }
          //           }
          //         }
          //         else {
          //           console.log("response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id")
          //         }
          //       }
          //     }
          //   }
          // }
        })
        .catch((error) => {
          console.log(error);
        });
    }
  })

  cron.schedule("0 4,7,10,12,17,21 * * *", async () => {  //4.30 am ....
    // cron.schedule("39 19 * * *", async () => {  //4.30 am ....
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: "https://api.sportradar.com/nfl/official/production/v7/en/games/current_week/schedule." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
      headers: {}
    }

    try {
      axios.request(config)
        .then(async (response) => {
          console.log(JSON.stringify(response.data));
          for (let i = 0; i < response.data.week?.games?.length; i++) {
            let findSameGame = await models.game.findAll({
              where: {
                competitors1Id: response.data.week?.games[i]?.home?.sr_id,
                competitors2Id: response.data.week?.games[i]?.away?.sr_id
              },
              order: [["createdAt", "DESC"]],
              limit: 1
            })
            // console.log(findSameGame[0].id)
            if (findSameGame.length > 0) {
              // console.log("if", response.data.week?.games[i]?.id, findSameGame[0].id)
              await models.game.update({
                externalGameId: response.data.week?.games[i]?.id
              }, {
                where: {
                  id: findSameGame[0].id
                }
              })
              // console.log(update)
            }
          }
        })
    } catch (e) {
      console.log("e", e)
    }
  })


  // for mma 1 am
  // cron.schedule("0 1 * * *", async () => {
  //   console.log("cron")
  //   let keyForMMA = "mma_mixed_martial_arts"
  //   console.log(keyForMMA)
  //   let config = {
  //     method: 'get',
  //     maxBodyLength: Infinity,
  //     url: process.env.ODDS_API_BASE_URL + "/sports/" + keyForMMA + "/odds/?apiKey=" + process.env.ODDS_API_API_KEY + "&regions=us&markets=h2h",
  //     headers: {}
  //   };

  //   console.log(config)
  //   axios.request(config)
  //     .then(async (response) => {
  //       let allPlayer
  //       console.log(JSON.stringify(response.data));
  //       for (let i = 0; i < response.data?.length; i++) {
  //         let findSameGame
  //         try {
  //           findSameGame = await models.game.findOne({
  //             where: { status: "A", gameId: response.data[i].id },
  //             attributes: ["id", "gameId"]
  //           })
  //         } catch (e) {
  //           console.log(e)
  //           return res.status(500).send({
  //             success: false,
  //             message: "error, in finding player name",
  //             error: e.message
  //           });
  //         }
  //         if (findSameGame) {
  //           try {
  //             await models.game.update({
  //               sportsId: "sr:sport:117",
  //               // competitionId: response.data.competitions[i].id,
  //               gameId: response.data[i].id,
  //               startTime: response.data[i].commence_time,
  //               // startTimeConfirmed: gameResponse.data.schedules[j].sport_event.start_time_confirmed,
  //               // competitors1Id: gameResponse.data.schedules[j].sport_event.competitors[0]?.id,
  //               competitors1Name: response.data[i].home_team,
  //               // competitors1Country: gameResponse.data.schedules[j].sport_event.competitors[0]?.country,
  //               // competitors1CountryCode: gameResponse.data.schedules[j].sport_event.competitors[0]?.country_code,
  //               // competitors1Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[0]?.abbreviation,
  //               // competitors1Qualifier: gameResponse.data.schedules[j].sport_event.competitors[0]?.qualifier,
  //               // competitors1RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[0]?.rotation_number,
  //               // competitors2Id: gameResponse.data.schedules[j].sport_event.competitors[1]?.id,
  //               competitors2Name: response.data[i].away_team,
  //               // competitors2Country: gameResponse.data.schedules[j].sport_event.competitors[1]?.country,
  //               // competitors2CountryCode: gameResponse.data.schedules[j].sport_event.competitors[1]?.country_code,
  //               // competitors2Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[1]?.abbreviation,
  //               // competitors2Qualifier: gameResponse.data.schedules[j].sport_event.competitors[1]?.qualifier,
  //               // competitors2RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[1]?.rotation_number,
  //             }, {
  //               where: { id: findSameGame.id }
  //             })
  //           } catch (e) {
  //             console.log(e)
  //             return res.status(500).send({
  //               success: false,
  //               message: "error, in updating game name",
  //               error: e.message
  //             });
  //           }
  //         } else {
  //           try {
  //             // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[0])
  //             // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[1])
  //             await models.game.create({
  //               sportsId: "sr:sport:117",
  //               // competitionId: response.data.competitions[i].id,
  //               gameId: response.data[i].id,
  //               startTime: response.data[i].commence_time,
  //               // startTimeConfirmed: gameResponse.data.schedules[j].sport_event.start_time_confirmed,
  //               // competitors1Id: gameResponse.data.schedules[j].sport_event.competitors[0]?.id,
  //               competitors1Name: response.data[i].home_team,
  //               // competitors1Country: gameResponse.data.schedules[j].sport_event.competitors[0]?.country,
  //               // competitors1CountryCode: gameResponse.data.schedules[j].sport_event.competitors[0]?.country_code,
  //               // competitors1Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[0]?.abbreviation,
  //               // competitors1Qualifier: gameResponse.data.schedules[j].sport_event.competitors[0]?.qualifier,
  //               // competitors1RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[0]?.rotation_number,
  //               // competitors2Id: gameResponse.data.schedules[j].sport_event.competitors[1]?.id,
  //               competitors2Name: response.data[i].away_team,
  //               // competitors2Country: gameResponse.data.schedules[j].sport_event.competitors[1]?.country,
  //               // competitors2CountryCode: gameResponse.data.schedules[j].sport_event.competitors[1]?.country_code,
  //               // competitors2Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[1]?.abbreviation,
  //               // competitors2Qualifier: gameResponse.data.schedules[j].sport_event.competitors[1]?.qualifier,
  //               // competitors2RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[1]?.rotation_number,
  //             })
  //           } catch (e) {
  //             console.log(e)
  //             return res.status(500).send({
  //               success: false,
  //               message: "error, in creating competetion name",
  //               error: e.message
  //             });
  //           }
  //         }

  //         for (let j = 0; j < response.data[i].bookmakers.length; j++) {
  //           if (response.data[i].bookmakers[j].key == "fanduel" || response.data[i].bookmakers[j].key == "draftkings") {
  //             for (let k = 0; k < response.data[i].bookmakers[j]?.markets[0]?.outcomes?.length; k++) {

  //               let findSamePlayerDetails
  //               let addedPlayerId
  //               try {
  //                 findSamePlayerDetails = await models.playerList.findOne({
  //                   where: { playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name },
  //                   attributes: ["id", "playerName"]
  //                 })
  //               } catch (e) {
  //                 return res.status(500).send({
  //                   success: false,
  //                   message: "error, in finding player name",
  //                   error: e.message
  //                 });
  //               }

  //               if (findSamePlayerDetails) {
  //                 addedPlayerId = findSamePlayerDetails.id
  //                 try {
  //                   await models.playerList.update({
  //                     playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     sportsId: "sr:sport:117",
  //                     sportsTableId: 7,
  //                   }, {
  //                     where: { id: findSamePlayerDetails.id }
  //                   })
  //                 } catch (e) {
  //                   console.log("e", e)
  //                   return res.status(500).send({
  //                     success: false,
  //                     message: "error, in updating player name",
  //                     error: e.message
  //                   });
  //                 }
  //               } else {
  //                 try {
  //                   let createdPlayerList = await models.playerList.create({
  //                     playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     sportsId: "sr:sport:117",
  //                     sportsTableId: 7,
  //                   })
  //                   addedPlayerId = createdPlayerList.id
  //                 } catch (e) {
  //                   return res.status(500).send({
  //                     success: false,
  //                     message: "error, in creating player",
  //                     error: e.message
  //                   });
  //                 }
  //               }


  //               let findSamePlayer
  //               try {
  //                 findSamePlayer = await models.players.findOne({
  //                   where: { playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name, gameId: response.data[i].id },
  //                   attributes: ["id", "playersId", "gameId"]
  //                 })
  //               } catch (e) {
  //                 return res.status(500).send({
  //                   success: false,
  //                   message: "error, in finding player name",
  //                   error: e.message
  //                 });
  //               }
  //               if (findSamePlayer) {
  //                 try {
  //                   await models.players.update({
  //                     sportsTableId: 7,
  //                     sportsId: "sr:sport:117",
  //                     // competitionId: findGame.competitionId,
  //                     gameId: response.data[i].id,
  //                     startTime: response.data[i].commence_time,
  //                     playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                     playerListId: addedPlayerId,
  //                   }, {
  //                     where: { id: findSamePlayer.id }
  //                   })

  //                   let findMarket = await models.markets.findOne({
  //                     where: {
  //                       gameId: response.data[i].id,
  //                       playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       // bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                       marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
  //                       playerTableId: findSamePlayer.id,
  //                     }
  //                   })
  //                   if (findMarket) {
  //                     await models.markets.update({
  //                       sportsTableId: 7,
  //                       sportsId: "sr:sport:117",
  //                       // competitionId: findGame.competitionId,
  //                       gameId: response.data[i].id,
  //                       startTime: response.data[i].commence_time,
  //                       playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                       playerListId: addedPlayerId,
  //                       marketName: response.data[i].bookmakers[j]?.markets[0]?.key,
  //                       marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
  //                       bookName: response.data[i].bookmakers[j]?.key,
  //                       bookId: response.data[i].bookmakers[j]?.key,
  //                       bookTotalValue: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k].price,
  //                       // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                       playerTableId: findSamePlayer.id,
  //                     }, {
  //                       where: {
  //                         id: findMarket.id
  //                       }
  //                     })
  //                   } else {
  //                     await models.markets.create({
  //                       sportsTableId: 7,
  //                       sportsId: "sr:sport:117",
  //                       // competitionId: findGame.competitionId,
  //                       gameId: response.data[i].id,
  //                       startTime: response.data[i].commence_time,
  //                       playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                       // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                       playerListId: addedPlayerId,
  //                       marketName: response.data[i].bookmakers[j]?.markets[0]?.key,
  //                       marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
  //                       bookName: response.data[i].bookmakers[j]?.key,
  //                       bookId: response.data[i].bookmakers[j]?.key,
  //                       bookTotalValue: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k].price,
  //                       // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                       playerTableId: findSamePlayer.id
  //                     })
  //                   }
  //                 } catch (e) {
  //                   console.log("ee", e)
  //                   return res.status(500).send({
  //                     success: false,
  //                     message: "error, in updating player name",
  //                     error: e.message
  //                   });
  //                 }
  //               } else {
  //                 try {
  //                   let newCreatedPlayer = await models.players.create({
  //                     sportsTableId: 7,
  //                     sportsId: "sr:sport:117",
  //                     // competitionId: findGame.competitionId,
  //                     gameId: response.data[i].id,
  //                     startTime: response.data[i].commence_time,
  //                     playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                     playerListId: addedPlayerId,
  //                   })

  //                   await models.markets.create({
  //                     sportsTableId: 7,
  //                     sportsId: "sr:sport:117",
  //                     // competitionId: findGame.competitionId,
  //                     gameId: response.data[i].id,
  //                     startTime: response.data[i].commence_time,
  //                     playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
  //                     // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                     playerListId: addedPlayerId,
  //                     marketName: response.data[i].bookmakers[j]?.markets[0]?.key,
  //                     marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
  //                     bookName: response.data[i].bookmakers[j]?.key,
  //                     bookId: response.data[i].bookmakers[j]?.key,
  //                     bookTotalValue: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k].price,
  //                     // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                     playerTableId: newCreatedPlayer.id
  //                   })
  //                 } catch (e) {
  //                   console.log("eee", e)
  //                   return res.status(500).send({
  //                     success: false,
  //                     message: "error, in updating player name",
  //                     error: e.message
  //                   });
  //                 }
  //               }
  //             }
  //           }
  //         }

  //       }
  //       return res.status(200).send({
  //         success: true,
  //         message: "All Players list",
  //         data: allPlayer,
  //         api: response.data
  //       });
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // })


  //soccer
  // cron.schedule("*/10 * * * *", async () => { // 1.30 am
  // cron.schedule("30 1-23/8 * * *", async () => { // 1.30 am
  //   // cron.schedule("*/10 * * * *", async () => {
  //   console.log("cron")
  //   let allGame
  //   let today = new Date()
  //   try {
  //     allGame = await models.game.findAll({
  //       where: {
  //         status: "A",
  //         sportsId: { [Op.in]: ["sr:sport:1"] },
  //         startTime: {
  //           [Op.between]: [
  //             new Date(today.setDate(today.getDate() - 1)), // 1 day in the past
  //             new Date(today.setDate(today.getDate() + 3)) // 3 days into the future
  //           ]
  //         },
  //       },
  //       attributes: ["id", "sportsId", "competitionId", "gameId", "startTime"]
  //     })
  //   } catch (e) {
  //     console.log("error on find game list from table", e)
  //   }
  //   console.log(allGame)
  //   console.log(allGame.length)

  //   for (let ii = 0; ii < allGame.length; ii++) {
  //     let config = {
  //       method: 'get',
  //       maxBodyLength: Infinity,
  //       url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sport_events/" + allGame[ii].gameId + "/players_props." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
  //       headers: {}
  //     }

  //     axios.request(config)
  //       .then(async (response) => {
  //         let allPlayer
  //         console.log(JSON.stringify(response.data));
  //         for (let i = 0; i < response.data.sport_event_players_props?.players_props?.length; i++) {
  //           let findSamePlayerDetails
  //           let addedPlayerId
  //           try {
  //             findSamePlayerDetails = await models.playerList.findOne({
  //               where: { playersId: response.data.sport_event_players_props.players_props[i].player.id },
  //               attributes: ["id", "playerName"]
  //             })
  //           } catch (e) {
  //             console.log("error, in finding player name..")
  //           }
  //           if (findSamePlayerDetails) {
  //             addedPlayerId = findSamePlayerDetails.id
  //             try {
  //               await models.playerList.update({
  //                 playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                 playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                 sportsId: allGame[ii].sportsId,
  //                 sportsTableId: allGame[ii].sportsTableId,
  //               }, {
  //                 where: { id: findSamePlayerDetails.id }
  //               })
  //             } catch (e) {
  //               console.log("error, in updating player name..")
  //             }
  //           } else {
  //             try {
  //               let createdPlayerList = await models.playerList.create({
  //                 playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                 playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                 sportsId: allGame[ii].sportsId,
  //                 sportsTableId: allGame[ii].sportsTableId,
  //               })
  //               addedPlayerId = createdPlayerList.id
  //             } catch (e) {
  //               console.log("error, in creating player..")
  //             }
  //           }

  //           let findSamePlayer
  //           try {
  //             findSamePlayer = await models.players.findOne({
  //               where: { playersId: response.data.sport_event_players_props.players_props[i].player.id, gameId: response.data.sport_event_players_props.sport_event.id },
  //               attributes: ["id", "playersId", "gameId"]
  //             })
  //           } catch (e) {
  //             console.log("error, in finding player name..")
  //           }
  //           if (findSamePlayer) {
  //             try {
  //               await models.players.update({
  //                 sportsTableId: allGame[ii].sportsTableId,
  //                 sportsId: allGame[ii].sportsId,
  //                 competitionId: allGame[ii].competitionId,
  //                 gameId: allGame[ii].gameId,
  //                 startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                 playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                 playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                 competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                 markets: response.data.sport_event_players_props.players_props[i].markets,
  //                 playerListId: addedPlayerId,
  //               }, {
  //                 where: { id: findSamePlayer.id }
  //               })
  //               for (let j = 0; j < response.data.sport_event_players_props.players_props[i].markets.length; j++) {
  //                 for (let k = 0; k < response.data.sport_event_players_props.players_props[i].markets[j].books.length; k++) {
  //                   let isMarketPresent = false
  //                   if (response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
  //                     isMarketPresent = true
  //                   }

  //                   console.log("market name", response.data.sport_event_players_props.players_props[i].markets[j].books[k].name)
  //                   // return false
  //                   if (isMarketPresent == true && response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
  //                     let findMarket = await models.markets.findOne({
  //                       where: {
  //                         gameId: allGame[ii].gameId,
  //                         playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                         competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                         bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                         marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
  //                         playerTableId: findSamePlayer.id,
  //                       }
  //                     })
  //                     if (findMarket) {
  //                       await models.markets.update({
  //                         sportsTableId: allGame[ii].sportsTableId,
  //                         sportsId: allGame[ii].sportsId,
  //                         competitionId: allGame[ii].competitionId,
  //                         gameId: allGame[ii].gameId,
  //                         startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                         playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                         playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                         competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                         // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                         playerListId: addedPlayerId,
  //                         marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
  //                         marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
  //                         bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
  //                         bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                         bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
  //                         oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
  //                         books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                         playerTableId: findSamePlayer.id,
  //                       }, {
  //                         where: {
  //                           id: findMarket.id
  //                         }
  //                       })
  //                     } else {
  //                       await models.markets.create({
  //                         sportsTableId: allGame[ii].sportsTableId,
  //                         sportsId: allGame[ii].sportsId,
  //                         competitionId: allGame[ii].competitionId,
  //                         gameId: allGame[ii].gameId,
  //                         startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                         playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                         playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                         competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                         // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                         playerListId: addedPlayerId,
  //                         marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
  //                         marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
  //                         bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
  //                         bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                         bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
  //                         oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
  //                         books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                         playerTableId: findSamePlayer.id,
  //                       })
  //                     }
  //                   }

  //                   if (isMarketPresent == false && k == 0) {
  //                     let findMarket = await models.markets.findOne({
  //                       where: {
  //                         gameId: allGame[ii].gameId,
  //                         playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                         competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                         bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                         marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
  //                         playerTableId: findSamePlayer.id,
  //                       }
  //                     })
  //                     if (findMarket) {
  //                       await models.markets.update({
  //                         sportsTableId: allGame[ii].sportsTableId,
  //                         sportsId: allGame[ii].sportsId,
  //                         competitionId: allGame[ii].competitionId,
  //                         gameId: allGame[ii].gameId,
  //                         startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                         playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                         playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                         competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                         // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                         playerListId: addedPlayerId,
  //                         marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
  //                         marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
  //                         bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
  //                         bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                         bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
  //                         oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
  //                         books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                         playerTableId: findSamePlayer.id,
  //                       }, {
  //                         where: {
  //                           id: findMarket.id
  //                         }
  //                       })
  //                     } else {
  //                       await models.markets.create({
  //                         sportsTableId: allGame[ii].sportsTableId,
  //                         sportsId: allGame[ii].sportsId,
  //                         competitionId: allGame[ii].competitionId,
  //                         gameId: allGame[ii].gameId,
  //                         startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                         playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                         playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                         competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                         // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                         playerListId: addedPlayerId,
  //                         marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
  //                         marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
  //                         bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
  //                         bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                         bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
  //                         oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
  //                         books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                         playerTableId: findSamePlayer.id,
  //                       })
  //                     }
  //                   }

  //                 }
  //               }
  //             } catch (e) {
  //               console.log("error, in update player name..")
  //             }
  //           } else {
  //             try {
  //               let playerCreate = await models.players.create({
  //                 sportsTableId: allGame[ii].sportsTableId,
  //                 sportsId: allGame[ii].sportsId,
  //                 competitionId: allGame[ii].competitionId,
  //                 gameId: allGame[ii].gameId,
  //                 startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                 playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                 playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                 competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                 markets: response.data.sport_event_players_props.players_props[i].markets,
  //                 playerListId: addedPlayerId
  //               })
  //               for (let j = 0; j < response.data.sport_event_players_props.players_props[i].markets.length; j++) {
  //                 for (let k = 0; k < response.data.sport_event_players_props.players_props[i].markets[j].books.length; k++) {
  //                   console.log("market name", response.data.sport_event_players_props.players_props[i].markets[j].books[k].name)
  //                   // return false
  //                   // if (response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
  //                   await models.markets.create({
  //                     sportsTableId: allGame[ii].sportsTableId,
  //                     sportsId: allGame[ii].sportsId,
  //                     competitionId: allGame[ii].competitionId,
  //                     gameId: allGame[ii].gameId,
  //                     startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                     playersId: response.data.sport_event_players_props.players_props[i].player.id,
  //                     playerName: response.data.sport_event_players_props.players_props[i].player.name,
  //                     competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                     // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                     playerListId: addedPlayerId,
  //                     marketName: response.data.sport_event_players_props.players_props[i].markets[j].name,
  //                     marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
  //                     bookName: response.data.sport_event_players_props.players_props[i].markets[j].books[k].name,
  //                     bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
  //                     bookTotalValue: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].total,
  //                     oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0]?.odds_decimal,
  //                     books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                     playerTableId: playerCreate.id,
  //                   })
  //                   // }
  //                 }
  //               }
  //               // return false
  //             } catch (e) {
  //               console.log("error, in create player..", e)
  //             }
  //           }
  //           // return false
  //         }
  //         //soccer
  //         // console.log("here...",response.data.sport_event_players_props?.players_props )
  //         if (!response.data.sport_event_players_props?.players_props || response.data.sport_event_players_props?.players_props?.length == 0) {
  //           console.log("length 0")
  //           for (let i = 0; i < response.data.sport_event_players_props?.players_markets?.markets?.length; i++) {
  //             if (response.data.sport_event_players_props?.players_markets?.markets?.name != "last goalscorer" || response.data.sport_event_players_props?.players_markets?.markets?.name != "anytime goalscorer") {
  //               for (let j = 0; j < response.data.sport_event_players_props?.players_markets?.markets[i]?.books?.length; j++) {
  //                 console.log("response.data.sport_event_players_props?.players_markets?.markets[i]?.books", response.data.sport_event_players_props?.players_markets?.markets[i]?.name)
  //                 for (let k = 0; k < response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes?.length; k++) {

  //                   let addedPlayerId
  //                   let findSamePlayerDetails
  //                   console.log(response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k])
  //                   if (response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k] && response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id) {
  //                     console.log("if", response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id)
  //                     try {
  //                       findSamePlayerDetails = await models.playerList.findOne({
  //                         where: { playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id },
  //                         attributes: ["id", "playerName"]
  //                       })
  //                     } catch (e) {
  //                       console.log("error, in finding player name..", e)
  //                     }
  //                     if (findSamePlayerDetails) {
  //                       addedPlayerId = findSamePlayerDetails.id
  //                       try {
  //                         await models.playerList.update({
  //                           playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                           playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
  //                           sportsId: allGame[ii].sportsId,
  //                           sportsTableId: allGame[ii].sportsTableId,
  //                         }, {
  //                           where: { id: findSamePlayerDetails.id }
  //                         })
  //                       } catch (e) {
  //                         console.log("error, in update player name..", e)
  //                       }
  //                     } else {
  //                       try {
  //                         let createdPlayerList = await models.playerList.create({
  //                           playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                           playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
  //                           sportsId: allGame[ii].sportsId,
  //                           sportsTableId: allGame[ii].sportsTableId,
  //                         })
  //                         addedPlayerId = createdPlayerList.id
  //                       } catch (e) {
  //                         console.log("error in create player", e);
  //                       }
  //                     }

  //                     let findSamePlayer
  //                     try {
  //                       findSamePlayer = await models.players.findOne({
  //                         where: { playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id, gameId: response.data.sport_event_players_props.sport_event.id },
  //                         attributes: ["id", "playersId", "gameId"]
  //                       })
  //                     } catch (e) {
  //                       console.log("error, in finding player name..", e)
  //                     }
  //                     if (findSamePlayer) {
  //                       try {
  //                         await models.players.update({
  //                           sportsTableId: allGame[ii].sportsTableId,
  //                           sportsId: allGame[ii].sportsId,
  //                           competitionId: allGame[ii].competitionId,
  //                           gameId: allGame[ii].gameId,
  //                           startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                           playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                           playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
  //                           // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                           // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                           playerListId: addedPlayerId,
  //                         }, {
  //                           where: { id: findSamePlayer.id }
  //                         })

  //                         // for (let jj = 0; jj < response.data.sport_event_players_props.players_props[i].markets.length; jj++) {
  //                         //   for (let kk = 0; kk < response.data.sport_event_players_props.players_props[i].markets[j].books.length; kk++) {
  //                         //     console.log("market name", response.data.sport_event_players_props.players_props[i].markets[j].books[k].name)
  //                         // return false
  //                         //   }
  //                         // }
  //                         if (response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "FanDuel" || response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "DraftKings") {
  //                           let findMarket = await models.markets.findOne({
  //                             where: {
  //                               gameId: allGame[ii].gameId,
  //                               playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                               // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                               bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
  //                               marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
  //                               playerTableId: findSamePlayer.id,
  //                             }
  //                           })
  //                           if (findMarket) {
  //                             await models.markets.update({
  //                               sportsTableId: allGame[ii].sportsTableId,
  //                               sportsId: allGame[ii].sportsId,
  //                               competitionId: allGame[ii].competitionId,
  //                               gameId: allGame[ii].gameId,
  //                               startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                               playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                               playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
  //                               // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                               // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                               playerListId: addedPlayerId,
  //                               marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
  //                               marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
  //                               bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
  //                               bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
  //                               bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
  //                               oddsDecimal: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k]?.odds_decimal,
  //                               // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                               playerTableId: findSamePlayer.id,
  //                             }, {
  //                               where: {
  //                                 id: findMarket.id
  //                               }
  //                             })
  //                           } else {
  //                             await models.markets.create({
  //                               sportsTableId: allGame[ii].sportsTableId,
  //                               sportsId: allGame[ii].sportsId,
  //                               competitionId: allGame[ii].competitionId,
  //                               gameId: allGame[ii].gameId,
  //                               startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                               playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                               playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
  //                               // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                               // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                               playerListId: addedPlayerId,
  //                               marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
  //                               marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
  //                               bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
  //                               bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
  //                               bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
  //                               oddsDecimal: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k]?.odds_decimal,
  //                               // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                               playerTableId: findSamePlayer.id,
  //                             })
  //                           }
  //                           // }
  //                           // }
  //                         }
  //                       } catch (e) {
  //                         console.log("error, in updating player name..", e)
  //                       }
  //                     } else {
  //                       try {
  //                         let playerCreate = await models.players.create({
  //                           sportsTableId: allGame[ii].sportsTableId,
  //                           sportsId: allGame[ii].sportsId,
  //                           competitionId: allGame[ii].competitionId,
  //                           gameId: allGame[ii].gameId,
  //                           startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                           playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                           playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
  //                           // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                           // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                           playerListId: addedPlayerId
  //                         })
  //                         if (response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "FanDuel" || response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "DraftKings") {
  //                           await models.markets.create({

  //                             sportsTableId: allGame[ii].sportsTableId,
  //                             sportsId: allGame[ii].sportsId,
  //                             competitionId: allGame[ii].competitionId,
  //                             gameId: allGame[ii].gameId,
  //                             startTime: response.data.sport_event_players_props.sport_event.start_time,
  //                             playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
  //                             playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
  //                             // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
  //                             // markets: response.data.sport_event_players_props.players_props[i].markets,
  //                             playerListId: addedPlayerId,
  //                             marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
  //                             marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
  //                             bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
  //                             bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
  //                             bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
  //                             oddsDecimal: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k]?.odds_decimal,
  //                             // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
  //                             playerTableId: playerCreate.id
  //                           })
  //                         }
  //                       } catch (e) {
  //                         console.log("error, in creating player..", e)
  //                       }
  //                     }
  //                   }
  //                   else {
  //                     console.log("response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id")
  //                   }
  //                 }
  //               }
  //             }
  //           }
  //         }
  //       })
  //       .catch((error) => {
  //         console.log(error);
  //       });
  //   }
  //   console.log("cron end")
  // })

  // result
  // cron.schedule("15 0,2,4,6,8,10,12,18,20,22 * * * * * *", async () => { // 5 am
  //   // cron.schedule("39 12 * * *", async () => { // 2.30 am
  //   try {
  //     await models.cronLog.create({
  //       cronName: "betting result create"
  //     })
  //   } catch (e) {
  //     await models.cronLog.create({
  //       cronName: "betting result create catch"
  //     })
  //   }
  //   let bettingList
  //   try {
  //     bettingList = await models.betting.findAll({
  //       where: {
  //         resultDecleared: false,
  //         endTime: { [Op.lte]: new Date() }
  //         // id: 139
  //       },
  //       include: [
  //         {
  //           required: false,
  //           model: models.settings,
  //           as: "bettingDetais",
  //           // attributes: ["id", "playType", "minimum", "maximum", "minimumCorrectionNeeded", "minimumPoint", "maximumPoint"],
  //           include: {
  //             required: false,
  //             model: models.multiplexForEntry,
  //             as: "entryDetails",
  //             where: { multiplex: { [Op.not]: 0 } },
  //             order: ["correctNeeded", "DESC"]
  //             // attributes: ["id", "profileImage", "playersId", "playerName"],
  //           },
  //         },
  //         {
  //           required: false,
  //           model: models.bettingPlayers,
  //           as: "addedPlayers",
  //           attributes: ["id", "userId", "playerId", "betType", "bettingId", "beforePoint", "afterPoint", "marketId"],
  //           include: [
  //             {
  //               required: false,
  //               model: models.markets,
  //               as: "marketDetails",
  //               attributes: ["id",
  //                 "marketName",
  //                 "marketShortName",
  //                 "marketId",
  //                 "bookName",
  //                 "bookId",
  //                 "bookTotalValue",
  //                 "gameId"]
  //             },
  //             {
  //               required: true,
  //               model: models.players,
  //               as: "playerDetails",
  //               attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerListId", "playerName", "competitorId"],
  //               include: [
  //                 {
  //                   required: false,
  //                   model: models.sports,
  //                   as: "sportDetais",
  //                   attributes: ["id", "shortName", "name"]
  //                 },
  //                 {
  //                   required: true,
  //                   model: models.game,
  //                   as: "gameDetais",
  //                   where: { status: "A" },
  //                   attributes: ["id", "competitionId", "gameId", "startTime", "competitors1Id", "competitors1Name", "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber", "status"]
  //                 },
  //                 {
  //                   required: true,
  //                   model: models.playerList,
  //                   as: "playerDetais",
  //                   attributes: ["id", "profileImage", "playersId", "playerName"],
  //                 },
  //               ]
  //             }
  //           ]
  //         },
  //       ]
  //     })
  //     console.log(bettingList.length)
  //   } catch (e) {
  //     console.log("error in finding bet list", e.message)
  //   }
  //   // return false
  //   try {
  //     for (let i = 0; i < bettingList.length; i++) {
  //       console.log(typeof bettingList[i].dataValues.addedPlayers);
  //       // let gameSet = new Set();
  //       let winCount = 0;
  //       let playerCount = 0;
  //       for (let j = 0; j < bettingList[i].dataValues.addedPlayers.length; j++) {
  //         console.log("for");
  //         // const gameId = bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.gameId;
  //         // gameSet.add(gameId);
  //         // let findMarketDetails = await models.markets.findOne({
  //         //   where: { id: bettingList[i].dataValues.addedPlayers[j].dataValues.marketId },
  //         //   attributes: ["id", "bookTotalValue"]
  //         // })
  //         // console.log("rows...............", bettingList[i].dataValues.addedPlayers[j].dataValues.betType, bettingList[i].dataValues.addedPlayers[j].dataValues.marketId, bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.playersId)

  //         let findResult = await checkCurrentResult(bettingList[i].dataValues.addedPlayers[j].dataValues.marketId, bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.playersId)

  //         // if(findResult==0){
  //         let playerStat = await models.playerStatAfterMatch.findOne({
  //           where: {
  //             playersId: bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.playersId,
  //             gameId: bettingList[i].dataValues.addedPlayers[j].dataValues.marketDetails.dataValues.gameId
  //           }
  //         });
  //         // }
  //         if (playerStat) {
  //           if (playerStat.minutes == "00:00") {
  //             playerStat = null
  //           }
  //         }
  //         // console.log(playerStat)
  //         // return false
  //         if (playerStat && bettingList[i].dataValues.addedPlayers[j].dataValues.betType == "LESS") {
  //           console.log("less............")
  //           if (Number(findResult) < Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
  //             console.log("less............1")
  //             await models.bettingPlayers.update({
  //               afterPoint: findResult,
  //               result: true,
  //               status: "A"
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
  //               }
  //             })
  //             winCount = winCount + 1
  //             playerCount = playerCount + 1
  //           } else if (playerStat && Number(findResult) > Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
  //             console.log("less............2")
  //             await models.bettingPlayers.update({
  //               afterPoint: findResult,
  //               result: false,
  //               status: "A"
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
  //               }
  //             })
  //             playerCount = playerCount + 1
  //           } else {
  //             console.log("less............3")
  //             await models.bettingPlayers.update({
  //               afterPoint: findResult,
  //               result: true,
  //               status: "D"
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
  //               }
  //             })
  //           }
  //         } else if (playerStat && bettingList[i].dataValues.addedPlayers[j].dataValues.betType == "MORE") {
  //           console.log("more............")
  //           // console.log("kjkjhfdkhjkiowejfdiojiokewiofr")
  //           if (Number(findResult) > Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
  //             await models.bettingPlayers.update({
  //               afterPoint: findResult,
  //               result: true,
  //               status: "A"
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
  //               }
  //             })
  //             winCount = winCount + 1
  //             playerCount = playerCount + 1
  //           } else if (playerStat && Number(findResult) < Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
  //             await models.bettingPlayers.update({
  //               afterPoint: findResult,
  //               result: false,
  //               status: "A"
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
  //               }
  //             })
  //             playerCount = playerCount + 1
  //           } else {
  //             await models.bettingPlayers.update({
  //               afterPoint: findResult,
  //               result: true,
  //               status: "D"
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
  //               }
  //             })
  //           }

  //         } else {
  //           // console.log("cancel............")
  //           await models.bettingPlayers.update({
  //             // afterPoint: findResult,
  //             result: true,
  //             status: "D"
  //           }, {
  //             where: {
  //               id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
  //             }
  //           })
  //         }
  //       }
  //       let userBalance = await models.balance.findOne({
  //         where: { userId: bettingList[i].dataValues.userId }
  //       })
  //       // console.log(winCount, playerCount)
  //       // console.log("length", playerCount)
  //       if (playerCount == 0) {  // when it becomes 0 pick
  //         let availableBalance = Number(userBalance.availableBalance) + Number(bettingList[i].dataValues.entry)
  //         // console.log(decreseAmount)
  //         await models.balance.update({
  //           availableBalance: availableBalance
  //         }, {
  //           where: { id: userBalance.id }
  //         })

  //         await models.betResultRecord.update({
  //           winAmount: 0,
  //           result: "refund",
  //           betStatus: "DONE"
  //         }, {
  //           where: { betId: bettingList[i].dataValues.id }
  //         })
  //       } else {
  //         if (bettingList[i].dataValues.bettingDetais.dataValues.playType == "POWER PLAY") {
  //           let lossCount = playerCount - winCount
  //           if (lossCount > 0) {  // loss
  //             // console.log("less...")
  //             await models.betting.update({
  //               resultDecleared: true,
  //               result: "loss",
  //               winCount: winCount
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.id
  //               }
  //             })

  //             // let winningMultiplex = await models.multiplexForEntry.findOne({
  //             //   where: { entryId: bettingList[i].dataValues.bettingDetais.dataValues.id, correctNeeded: winCount }
  //             // })

  //             let decreseAmount = Number(userBalance.depositMoney) - Number(bettingList[i].dataValues.entry)
  //             await models.balance.update({
  //               depositMoney: decreseAmount
  //             }, {
  //               where: { id: userBalance.id }
  //             })

  //             await models.betResultRecord.update({
  //               winAmount: 0,
  //               result: "loss",
  //               betStatus: "DONE"
  //             }, {
  //               where: { betId: bettingList[i].dataValues.id }
  //             })

  //           } else if (winCount != 0) {  //win
  //             console.log("win...")

  //             let findSetting = await models.settings.findOne({
  //               where: { playType: "POWER PLAY", entry: winCount }
  //             })
  //             let winningMultiplex
  //             if (findSetting) {
  //               winningMultiplex = await models.multiplexForEntry.findOne({
  //                 where: { entryId: findSetting.id, correctNeeded: winCount }
  //               })
  //             }
  //             await models.betting.update({
  //               resultDecleared: true,
  //               result: "win",
  //               winCount: winCount,
  //               bettingPlayType: findSetting.dataValues.id,
  //               preBettingPlayType: bettingList[i].dataValues.bettingPlayType
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.id
  //               }
  //             })

  //             let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
  //             let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
  //             await models.balance.update({
  //               depositMoney: increaseAmount,
  //               availableBalance: increaseAvailableAmount
  //             }, {
  //               where: { id: userBalance.id }
  //             })

  //             await models.betResultRecord.update({
  //               winAmount: (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)),
  //               result: "win",
  //               betStatus: "DONE"
  //             }, {
  //               where: { betId: bettingList[i].dataValues.id }
  //             })
  //           }
  //         } else {
  //           // console.log("flex...", winCount)
  //           let findSetting = await models.settings.findOne({
  //             where: { playType: "FLEX PLAY", entry: playerCount, status: "A" }
  //           })
  //           let winningMultiplex
  //           if (findSetting) {
  //             winningMultiplex = await models.multiplexForEntry.findOne({
  //               where: { entryId: findSetting.id, correctNeeded: winCount }
  //             })
  //           }
  //           // console.log("lll", findSetting.id)
  //           // return false

  //           if (winningMultiplex && winningMultiplex.multiplex != 0) {  //win
  //             // console.log("jhguigiu", bettingList[i].dataValues.id)
  //             await models.betting.update({
  //               resultDecleared: true,
  //               result: "win",
  //               winCount: winCount,
  //               bettingPlayType: findSetting.dataValues.id,
  //               preBettingPlayType: bettingList[i].dataValues.bettingPlayType
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.id
  //               }
  //             })

  //             // console.log(Number(bettingList[i].dataValues.entry), Number(winningMultiplex.multiplex), (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))

  //             let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
  //             let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
  //             // console.log(increaseAvailableAmount)
  //             await models.balance.update({
  //               depositMoney: increaseAmount,
  //               availableBalance: increaseAvailableAmount
  //             }, {
  //               where: { id: userBalance.id }
  //             })

  //             console.log(":here")
  //             await models.betResultRecord.update({
  //               winAmount: (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)),
  //               result: "win",
  //               betStatus: "DONE"
  //             }, {
  //               where: { betId: bettingList[i].dataValues.id }
  //             })

  //           } else { // loss
  //             // console.log("loss....")
  //             await models.betting.update({
  //               resultDecleared: true,
  //               result: "loss",
  //               winCount: winCount,
  //               bettingPlayType: findSetting?.dataValues.id,
  //               preBettingPlayType: bettingList[i].dataValues.bettingPlayType
  //             }, {
  //               where: {
  //                 id: bettingList[i].dataValues.id
  //               }
  //             })

  //             let decreseAmount = Number(userBalance.depositMoney) - Number(bettingList[i].dataValues.entry)
  //             // console.log(decreseAmount)
  //             await models.balance.update({
  //               depositMoney: decreseAmount
  //             }, {
  //               where: { id: userBalance.id }
  //             })

  //             await models.betResultRecord.update({
  //               winAmount: 0,
  //               result: "loss",
  //               betStatus: "DONE"
  //             }, {
  //               where: { betId: bettingList[i].dataValues.id }
  //             })

  //           }


  //         }
  //       }

  //       // const uniqueGameList = Array.from(gameSet);
  //       // console.log("Unique Game List:", uniqueGameList);

  //       // for(let j=0;j<uniqueGameList.length;j++){
  //       //     let config = {
  //       //         method: 'get',
  //       //         maxBodyLength: Infinity,
  //       //         url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sport_events/" + uniqueGameList[j] + "/players_props." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
  //       //         headers: {}
  //       //       };

  //       //       axios.request(config)
  //       //           .then(async (response) => {
  //       //             let allPlayer
  //       //             console.log(JSON.stringify(response.data));
  //       //             for (let i = 0; i < response.data.sport_event_players_props?.players_props?.length; i++) {

  //       //             }
  //       //         })
  //       // }
  //       console.log("Result decleared")
  //     }
  //     // return res.status(200).json({
  //     //   success: true,
  //     //   data: bettingList
  //     // });
  //   } catch (e) {
  //     console.log(e)
  //     // return res.status(500).json({
  //     //   success: false,
  //     //   data: e.message
  //     // });
  //   }
  // })

  //market name
  cron.schedule("15,30,40,50 3,6,9,12,16,20 * * *", async () => { //from 4.30 each 2 hrs// evey 2 hrs
    // cron.schedule("* * * * *", async () => { // evey 2 hrs
    let allMarketList
    try {
      allMarketList = await models.markets.findAll({
        where: {
          marketShortName: {
            [Op.or]: {
              [Op.not]: null,
              [Op.ne]: ''
            }
          }
        },
        attributes: ["id", "sportsId", "marketName", "marketId", "marketShortName"],
        group: ["sportsId", "marketId"]
      })
      console.log(allMarketList.length)

      for (const market of allMarketList) {
        const { sportsId, marketId, marketShortName } = market.get();

        // Update only rows where marketShortName is null or empty
        await models.markets.update(
          { marketShortName },
          {
            where: {
              sportsId,
              marketId,
              [Op.or]: [
                { marketShortName: null },
                { marketShortName: '' }
              ]
            }
          }
        );
      }

    } catch (e) {
      console.log("error in groupby market", e)
    }
  })

  // cron.schedule("35 4,12,15,17,20 * * *", async () => { //4.30            every 8 hrs for findResult
  // cron.schedule("36 20 * * *", async () => { //4.30            every 8 hrs for findResult
  // cron.schedule("35 1,3,5,7,9,13,17,19,21,23 * * *", async () => { //4.30            every 8 hrs for findResult
  //   console.log("for findResult, findResultNHL");
  //   try {
  //     await models.cronLog.create({
  //       cronName: "nhl result create"
  //     })
  //   } catch (e) {
  //     await models.cronLog.create({
  //       cronName: "nhl result create catch"
  //     })
  //   }
  //   try {
  //     let findMatches
  //     const now = new Date();
  //     const twoDaysAgo = new Date();
  //     twoDaysAgo.setDate(now.getDate() - 1);
  //     try {
  //       findMatches = await models.game.findAll({
  //         where: {
  //           // startTime: { [Op.lte]: new Date() },
  //           startTime: {
  //             [Op.between]: [twoDaysAgo, now]
  //           },
  //           // sportsId: "sr:sport:2",
  //           // competitionId: "sr:competition:132"
  //           sportsId: {
  //             [Op.in]: ["sr:sport:4"]
  //           },
  //           competitionId: {
  //             [Op.in]: ["sr:competition:234"]
  //           },
  //           resultFound: {[Op.not]: true},
  //           // limit: 1
  //         },
  //         attributes: ["id", "sportsId", "sportsTableId", "competitionId", "gameId", "competitors1Id"],

  //       })
  //     } catch (e) {
  //       console.log(e)
  //       // return res.status(500).json({
  //       //   success: false,
  //       //   message: "Error in having matches",
  //       // });
  //     }
  //     // const uniqueMatchIds = [...new Set(findMatches.map(match => match.gameId))];

  //     // console.log("Unique Match IDs:", uniqueMatchIds);

  //     console.log(findMatches.length)
  //     // return false
  //     for (let i = 0; i < findMatches.length; i++) {
  //       let config = {
  //         method: 'get',
  //         maxBodyLength: Infinity,
  //         url: "https://api.sportradar.com/icehockey/production/v2/" + process.env.SPORTRADER_LOCALE + "/sport_events/" + findMatches[i].gameId + "/summary." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
  //         headers: {}
  //       };

  //       await axios.request(config)
  //         .then(async (response) => {
  //           let allSports
  //           console.log(JSON.stringify(response.data.statistics));
  //           for (let j = 0; j < response.data.statistics.totals.competitors.length; j++) {
  //             for (let k = 0; k < response.data.statistics.totals.competitors[j].players.length; k++) {
  //               console.log("jhujkh")
  //               let findPlayerStat = await models.playerStatAfterMatch.findOne({
  //                 where: {
  //                   sportsId: findMatches[i].sportsId,
  //                   competitionId: findMatches[i].competitionId,
  //                   gameId: findMatches[i].gameId,
  //                   playersId: response.data.statistics.totals.competitors[j].players[k].id
  //                 }
  //               })
  //               if (findPlayerStat) {
  //                 try {
  //                   await models.playerStatAfterMatch.update({
  //                     sportsId: findMatches[i].sportsId,
  //                     competitionId: findMatches[i].competitionId,
  //                     gameId: findMatches[i].gameId,
  //                     playersId: response.data.statistics.totals.competitors[j].players[k].id,
  //                     compititorId: response.data.statistics.totals.competitors[j].id,
  //                     assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.assists,
  //                     first_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.first_assists,
  //                     goalie_minutes_played: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goalie_minutes_played,
  //                     goals: response.data.statistics.totals.competitors[j].players[k]?.statistics.goals,
  //                     goals_conceded: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goals_conceded,
  //                     penalties: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalties,
  //                     penalty_minutes: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalty_minutes,
  //                     plus_minus: response.data.statistics.totals.competitors[j].players[k]?.statistics?.plus_minus,
  //                     points: response.data.statistics.totals.competitors[j].players[k]?.statistics?.points,
  //                     saves: response.data.statistics.totals.competitors[j].players[k]?.statistics?.saves,
  //                     second_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.second_assists,
  //                     shots_on_goal: response.data.statistics.totals.competitors[j].players[k]?.statistics?.shots_on_goal
  //                   }, {
  //                     where: {
  //                       id: findPlayerStat.id
  //                     }
  //                   })
  //                 } catch (e) {
  //                   console.log("error on update", e)
  //                 }
  //               } else {
  //                 try {
  //                   await models.playerStatAfterMatch.create({
  //                     sportsId: findMatches[i].sportsId,
  //                     competitionId: findMatches[i].competitionId,
  //                     gameId: findMatches[i].gameId,
  //                     playersId: response.data.statistics.totals.competitors[j].players[k].id,
  //                     compititorId: response.data.statistics.totals.competitors[j].id,
  //                     assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.assists,
  //                     first_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.first_assists,
  //                     goalie_minutes_played: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goalie_minutes_played,
  //                     goals: response.data.statistics.totals.competitors[j].players[k]?.statistics.goals,
  //                     goals_conceded: response.data.statistics.totals.competitors[j].players[k]?.statistics?.goals_conceded,
  //                     penalties: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalties,
  //                     penalty_minutes: response.data.statistics.totals.competitors[j].players[k]?.statistics?.penalty_minutes,
  //                     plus_minus: response.data.statistics.totals.competitors[j].players[k]?.statistics?.plus_minus,
  //                     points: response.data.statistics.totals.competitors[j].players[k]?.statistics?.points,
  //                     saves: response.data.statistics.totals.competitors[j].players[k]?.statistics?.saves,
  //                     second_assists: response.data.statistics.totals.competitors[j].players[k]?.statistics?.second_assists,
  //                     shots_on_goal: response.data.statistics.totals.competitors[j].players[k]?.statistics?.shots_on_goal
  //                   })
  //                 }
  //                 catch (e) {
  //                   console.log("error on create", e)
  //                 }
  //               }
  //             }

  //           }
  //           if(response.data?.sport_event_status?.status=="closed"){
  //             try{
  //               await models.game.update({
  //                 resultFound: true
  //               },{
  //                 where:{
  //                   gameId: findMatches[i].gameId
  //                 }
  //               })

  //             }catch(e){
  //               console.log("update match result found")
  //             }
  //           }
  //           await sleep(2000);
  //           console.log("done")
  //         })
  //         .catch((e) => {
  //           console.log(e)
  //         })
  //     }
  //   } catch (error) {
  //     console.log("error in findResult, findResultNHL", error)
  //   }
  // })

  cron.schedule("0 1,3,5,7,9,11,13,15,17,19,21,23 * * *", async () => { //find result
    // cron.schedule("29 20 * * *", async () => { //4.30            every 8 hrs for findResult
    let currentTime = new Date()
    console.log("for findResult, findResultNBA");
    try {
      await models.cronLog.create({
        cronName: "nba result create"
      })
    } catch (e) {
      await models.cronLog.create({
        cronName: "nba result create catch"
      })
    }
    try {
      let findMatches
      const now = new Date();
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(now.getDate() - 1);
      try {
        findMatches = await models.game.findAll({
          where: {
            // startTime: { [Op.lte]: new Date() },
            startTime: {
              [Op.between]: [twoDaysAgo, now]
            },
            // sportsId: "sr:sport:2",
            // competitionId: "sr:competition:132"
            sportsId: {
              [Op.in]: ["sr:sport:2"]
            },
            resultFound: { [Op.not]: true },
            competitionId: {
              [Op.in]: ["sr:competition:132"]
            },
            // limit: 1
          },
          attributes: ["id", "sportsId", "sportsTableId", "competitionId", "gameId", "competitors1Id"],

        })
      } catch (e) {
        console.log(e)
        // return res.status(500).json({
        //   success: false,
        //   message: "Error in having matches",
        // });
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

        await axios.request(config)
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
                  try {
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
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
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
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }

            }
            if (response.data?.sport_event_status?.status == "closed") {
              try {
                await models.game.update({
                  resultFound: true
                }, {
                  where: {
                    gameId: findMatches[i].gameId
                  }
                })

              } catch (e) {
                console.log("update match result found")
              }
            }
            await sleep(2000);
            console.log("done")
          })
          .catch((e) => {
            console.log(e)
          })
      }


      //NCAA
      console.log("for findResult, NCAA");
      try {
        await models.cronLog.create({
          cronName: "NCAA result create"
        })
      } catch (e) {
        await models.cronLog.create({
          cronName: "NCAA result create catch"
        })
      }
      try {
        findMatches = await models.game.findAll({
          where: {
            // startTime: { [Op.lte]: new Date() },
            startTime: {
              [Op.between]: [twoDaysAgo, now]
            },
            sportsId: {
              [Op.in]: ["sr:FNCAAsport:2"]
            },
            resultFound: { [Op.not]: true },
            competitionId: {
              [Op.in]: ["sr:competition:648"]
            },
            // limit: 1
          },
          attributes: ["id", "sportsId", "sportsTableId", "competitionId", "gameId", "competitors1Id"],

        })
      } catch (e) {
        console.log(e)
        // return res.status(500).json({
        //   success: false,
        //   message: "Error in having matches",
        // });
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

        await axios.request(config)
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
                  try {
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
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
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
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }

            }
            if (response.data?.sport_event_status?.status == "closed") {
              try {
                await models.game.update({
                  resultFound: true
                }, {
                  where: {
                    gameId: findMatches[i].gameId
                  }
                })

              } catch (e) {
                console.log("update match result found")
              }
            }
            await sleep(2000);
            console.log("done")
          })
          .catch((e) => {
            console.log(e)
          })
      }


      console.log("for findResult, findResultNHL");
      try {
        await models.cronLog.create({
          cronName: "nhl result create"
        })
      } catch (e) {
        await models.cronLog.create({
          cronName: "nhl result create catch"
        })
      }
      try {
        let findNHLMatches
        const now = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(now.getDate() - 1);
        try {
          findNHLMatches = await models.game.findAll({
            where: {
              // startTime: { [Op.lte]: new Date() },
              startTime: {
                [Op.between]: [twoDaysAgo, now]
              },
              // sportsId: "sr:sport:2",
              // competitionId: "sr:competition:132"
              sportsId: {
                [Op.in]: ["sr:sport:4"]
              },
              competitionId: {
                [Op.in]: ["sr:competition:234"]
              },
              resultFound: { [Op.not]: true },
              // limit: 1
            },
            attributes: ["id", "sportsId", "sportsTableId", "competitionId", "gameId", "competitors1Id"],

          })
        } catch (e) {
          console.log(e)
        }
        console.log(findNHLMatches.length)
        // return false
        for (let i = 0; i < findNHLMatches.length; i++) {
          let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: "https://api.sportradar.com/icehockey/production/v2/" + process.env.SPORTRADER_LOCALE + "/sport_events/" + findNHLMatches[i].gameId + "/summary." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
            headers: {}
          };

          await axios.request(config)
            .then(async (response) => {
              let allSports
              console.log(JSON.stringify(response.data.statistics));
              for (let j = 0; j < response.data.statistics.totals.competitors.length; j++) {
                for (let k = 0; k < response.data.statistics.totals.competitors[j].players.length; k++) {
                  console.log("jhujkh")
                  let findPlayerStat = await models.playerStatAfterMatch.findOne({
                    where: {
                      sportsId: findNHLMatches[i].sportsId,
                      competitionId: findNHLMatches[i].competitionId,
                      gameId: findNHLMatches[i].gameId,
                      playersId: response.data.statistics.totals.competitors[j].players[k].id
                    }
                  })
                  if (findPlayerStat) {
                    try {
                      await models.playerStatAfterMatch.update({
                        sportsId: findNHLMatches[i].sportsId,
                        competitionId: findNHLMatches[i].competitionId,
                        gameId: findNHLMatches[i].gameId,
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
                    } catch (e) {
                      console.log("error on update", e)
                    }
                  } else {
                    try {
                      await models.playerStatAfterMatch.create({
                        sportsId: findNHLMatches[i].sportsId,
                        competitionId: findNHLMatches[i].competitionId,
                        gameId: findNHLMatches[i].gameId,
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
                      })
                    }
                    catch (e) {
                      console.log("error on create", e)
                    }
                  }
                }

              }
              if (response.data?.sport_event_status?.status == "closed") {
                try {
                  await models.game.update({
                    resultFound: true
                  }, {
                    where: {
                      gameId: findNHLMatches[i].gameId
                    }
                  })

                } catch (e) {
                  console.log("update match result found")
                }
              }
              await sleep(2000);
              console.log("done")
            })
            .catch((e) => {
              console.log(e)
            })
        }
      } catch (error) {
        console.log("error in findResult, findResultNHL", error)
      }
    } catch (error) {
      console.log("error in findResult, findResultNHL", error)
    }

    //nfl result
    try {
      console.log("for findResult, findResultNHL");
      try {
        await models.cronLog.create({
          cronName: "nfl result create"
        })
      } catch (e) {
        await models.cronLog.create({
          cronName: "nfl result create catch"
        })
      }
      try {
        let findNFLMatches
        const now = new Date();
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(now.getDate() - 3);
        try {
          findNFLMatches = await models.game.findAll({
            where: {
              // startTime: { [Op.lte]: new Date() },
              startTime: {
                [Op.between]: [twoDaysAgo, now]
              },
              // sportsId: "sr:sport:2",
              // competitionId: "sr:competition:132"
              sportsId: {
                [Op.in]: ["sr:sport:16"]
              },
              competitionId: {
                [Op.in]: ["sr:competition:31"]
              },
              resultFound: { [Op.not]: true },
              // limit: 1
            },
            attributes: ["id", "sportsId", "sportsTableId", "competitionId", "gameId", "externalGameId", "competitors1Id"],

          })
        } catch (e) {
          console.log(e)
        }
        console.log(findNFLMatches.length)
        // return false
        for (let i = 0; i < findNFLMatches.length; i++) {
          let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: "https://api.sportradar.com/nfl/official/production/v7/en/games/" + findNFLMatches[i]?.externalGameId + "/statistics." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
            headers: {}
          };

          await axios.request(config)
            .then(async (response) => {
              let allSports
              console.log(JSON.stringify(response.data.statistics));
              for (let j = 0; j < response.data.statistics.home.rushing?.players?.length; j++) {
                console.log("in nfl")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.rushing.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.rushing.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      first_downs: response.data.statistics.home.rushing.players[j].first_downs,
                      avg_yards: response.data.statistics.home.rushing.players[j]?.avg_yards,
                      attempts: response.data.statistics.home.rushing.players[j]?.attempts,
                      touchdowns: response.data.statistics.home.rushing.players[j]?.touchdowns,
                      rushingYards: response.data.statistics.home.rushing.players[j]?.yards,
                      longestRush: response.data.statistics.home.rushing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.home.rushing.players[j]?.longest_touchdown,
                      redzone_attempts: response.data.statistics.home.rushing.players[j]?.redzone_attempts,
                      tlost: response.data.statistics.home.rushing.players[j]?.tlost,
                      rushingTlostYards: response.data.statistics.home.rushing.players[j]?.tlost_yards,
                      broken_tackles: response.data.statistics.home.rushing.players[j]?.broken_tackles,
                      kneel_downs: response.data.statistics.home.rushing.players[j]?.kneel_downs,
                      scrambles: response.data.statistics.home.rushing.players[j]?.scrambles,
                      rushingYardsAfterContact: response.data.statistics.home.rushing.players[j]?.yards_after_contact
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.rushing.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      first_downs: response.data.statistics.home.rushing.players[j].first_downs,
                      avg_yards: response.data.statistics.home.rushing.players[j]?.avg_yards,
                      attempts: response.data.statistics.home.rushing.players[j]?.attempts,
                      touchdowns: response.data.statistics.home.rushing.players[j]?.touchdowns,
                      rushingYards: response.data.statistics.home.rushing.players[j]?.yards,
                      longestRush: response.data.statistics.home.rushing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.home.rushing.players[j]?.longest_touchdown,
                      redzone_attempts: response.data.statistics.home.rushing.players[j]?.redzone_attempts,
                      tlost: response.data.statistics.home.rushing.players[j]?.tlost,
                      rushingTlostYards: response.data.statistics.home.rushing.players[j]?.tlost_yards,
                      broken_tackles: response.data.statistics.home.rushing.players[j]?.broken_tackles,
                      kneel_downs: response.data.statistics.home.rushing.players[j]?.kneel_downs,
                      scrambles: response.data.statistics.home.rushing.players[j]?.scrambles,
                      rushingYardsAfterContact: response.data.statistics.home.rushing.players[j]?.yards_after_contact
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.receiving?.players?.length; j++) {
                console.log("in nfl, receiving")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.receiving.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.receiving.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      first_downs: response.data.statistics.home.receiving.players[j].first_downs,
                      receptions: response.data.statistics.home.receiving.players[j]?.receptions,
                      targets: response.data.statistics.home.receiving.players[j]?.targets,
                      receivingYards: response.data.statistics.home.receiving.players[j]?.yards,
                      avg_yards: response.data.statistics.home.receiving.players[j]?.avg_yards,
                      longestReception: response.data.statistics.home.receiving.players[j]?.longest,
                      touchdowns: response.data.statistics.home.receiving.players[j]?.touchdowns,
                      longest_touchdown: response.data.statistics.home.receiving.players[j]?.longest_touchdown,
                      yards_after_catch: response.data.statistics.home.receiving.players[j]?.yards_after_catch,
                      redzone_targets: response.data.statistics.home.receiving.players[j]?.redzone_targets,
                      air_yards: response.data.statistics.home.receiving.players[j]?.air_yards,
                      broken_tackles: response.data.statistics.home.receiving.players[j]?.broken_tackles,
                      dropped_passes: response.data.statistics.home.receiving.players[j]?.dropped_passes,
                      catchable_passes: response.data.statistics.home.receiving.players[j]?.catchable_passes,
                      yards_after_contact: response.data.statistics.home.receiving.players[j]?.yards_after_contact
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.receiving.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      first_downs: response.data.statistics.home.receiving.players[j].first_downs,
                      receptions: response.data.statistics.home.receiving.players[j]?.receptions,
                      targets: response.data.statistics.home.receiving.players[j]?.targets,
                      receivingYards: response.data.statistics.home.receiving.players[j]?.yards,
                      avg_yards: response.data.statistics.home.receiving.players[j]?.avg_yards,
                      longestReception: response.data.statistics.home.receiving.players[j]?.longest,
                      touchdowns: response.data.statistics.home.receiving.players[j]?.touchdowns,
                      longest_touchdown: response.data.statistics.home.receiving.players[j]?.longest_touchdown,
                      yards_after_catch: response.data.statistics.home.receiving.players[j]?.yards_after_catch,
                      redzone_targets: response.data.statistics.home.receiving.players[j]?.redzone_targets,
                      air_yards: response.data.statistics.home.receiving.players[j]?.air_yards,
                      broken_tackles: response.data.statistics.home.receiving.players[j]?.broken_tackles,
                      dropped_passes: response.data.statistics.home.receiving.players[j]?.dropped_passes,
                      catchable_passes: response.data.statistics.home.receiving.players[j]?.catchable_passes,
                      yards_after_contact: response.data.statistics.home.receiving.players[j]?.yards_after_contact
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.punts?.players?.length; j++) {
                console.log("in nfl, punts")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.punts.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.punts.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      attempts: response.data.statistics.home.punts.players[j].attempts,
                      yards: response.data.statistics.home.punts.players[j]?.yards,
                      avg_yards: response.data.statistics.home.punts.players[j]?.avg_yards,
                      blocked: response.data.statistics.home.punts.players[j]?.blocked,
                      longest: response.data.statistics.home.punts.players[j]?.longest,
                      touchbacks: response.data.statistics.home.punts.players[j]?.touchbacks,
                      inside_20: response.data.statistics.home.punts.players[j]?.inside_20,
                      avg_net_yards: response.data.statistics.home.punts.players[j]?.avg_net_yards,
                      return_yards: response.data.statistics.home.punts.players[j]?.return_yards,
                      net_yards: response.data.statistics.home.punts.players[j]?.net_yards,
                      hang_time: response.data.statistics.home.punts.players[j]?.hang_time,
                      avg_hang_time: response.data.statistics.home.punts.players[j]?.avg_hang_time,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.punts.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      attempts: response.data.statistics.home.punts.players[j].attempts,
                      yards: response.data.statistics.home.punts.players[j]?.yards,
                      avg_yards: response.data.statistics.home.punts.players[j]?.avg_yards,
                      blocked: response.data.statistics.home.punts.players[j]?.blocked,
                      longest: response.data.statistics.home.punts.players[j]?.longest,
                      touchbacks: response.data.statistics.home.punts.players[j]?.touchbacks,
                      inside_20: response.data.statistics.home.punts.players[j]?.inside_20,
                      avg_net_yards: response.data.statistics.home.punts.players[j]?.avg_net_yards,
                      return_yards: response.data.statistics.home.punts.players[j]?.return_yards,
                      net_yards: response.data.statistics.home.punts.players[j]?.net_yards,
                      hang_time: response.data.statistics.home.punts.players[j]?.hang_time,
                      avg_hang_time: response.data.statistics.home.punts.players[j]?.avg_hang_time,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.punt_returns?.players?.length; j++) {
                console.log("in nfl, punt_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.punt_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.punt_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      yards: response.data.statistics.home.punt_returns.players[j].yards,
                      avg_yards: response.data.statistics.home.punt_returns.players[j]?.avg_yards,
                      touchdowns: response.data.statistics.home.punt_returns.players[j]?.touchdowns,
                      longest: response.data.statistics.home.punt_returns.players[j]?.longest,
                      faircatches: response.data.statistics.home.punt_returns.players[j]?.faircatches,
                      number: response.data.statistics.home.punt_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.punt_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      yards: response.data.statistics.home.punt_returns.players[j].yards,
                      avg_yards: response.data.statistics.home.punt_returns.players[j]?.avg_yards,
                      touchdowns: response.data.statistics.home.punt_returns.players[j]?.touchdowns,
                      longest: response.data.statistics.home.punt_returns.players[j]?.longest,
                      faircatches: response.data.statistics.home.punt_returns.players[j]?.faircatches,
                      number: response.data.statistics.home.punt_returns.players[j]?.number,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.penalties?.players?.length; j++) {
                console.log("in nfl, penalties")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.penalties.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.penalties.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      first_downs: response.data.statistics.home.penalties.players[j].first_downs,
                      penalties: response.data.statistics.home.penalties.players[j]?.penalties,
                      yards: response.data.statistics.home.penalties.players[j]?.yards,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.penalties.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      first_downs: response.data.statistics.home.penalties.players[j].first_downs,
                      penalties: response.data.statistics.home.penalties.players[j]?.penalties,
                      yards: response.data.statistics.home.penalties.players[j]?.yards,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.passing?.players?.length; j++) {
                console.log("in nfl, passing")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.passing.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.passing.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      passingAttempts: response.data.statistics.home.passing.players[j].attempts,
                      completions: response.data.statistics.home.passing.players[j]?.completions,
                      cmp_pct: response.data.statistics.home.passing.players[j]?.cmp_pct,
                      passingInterception: response.data.statistics.home.passing.players[j]?.interceptions,
                      passingSackYards: response.data.statistics.home.passing.players[j]?.sack_yards,
                      rating: response.data.statistics.home.passing.players[j]?.rating,
                      passingTouchDown: response.data.statistics.home.passing.players[j]?.touchdowns,
                      avg_yards: response.data.statistics.home.passing.players[j]?.avg_yards,
                      passingSacks: response.data.statistics.home.passing.players[j]?.sacks,
                      passingLongest: response.data.statistics.home.passing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.home.passing.players[j]?.longest_touchdown,
                      passingAirYards: response.data.statistics.home.passing.players[j]?.air_yards,
                      passingRedZoneAttempts: response.data.statistics.home.passing.players[j]?.redzone_attempts,
                      net_yards: response.data.statistics.home.passing.players[j]?.net_yards,
                      passingYards: response.data.statistics.home.passing.players[j]?.yards,
                      first_downs: response.data.statistics.home.passing.players[j]?.first_downs,
                      int_touchdowns: response.data.statistics.home.passing.players[j]?.int_touchdowns,
                      throw_aways: response.data.statistics.home.passing.players[j]?.throw_aways,
                      defended_passes: response.data.statistics.home.passing.players[j]?.defended_passes,
                      dropped_passes: response.data.statistics.home.passing.players[j]?.dropped_passes,
                      spikes: response.data.statistics.home.passing.players[j]?.spikes,
                      blitzes: response.data.statistics.home.passing.players[j]?.blitzes,
                      hurries: response.data.statistics.home.passing.players[j]?.hurries,
                      knockdowns: response.data.statistics.home.passing.players[j]?.knockdowns,
                      pocket_time: response.data.statistics.home.passing.players[j]?.pocket_time,
                      avg_pocket_time: response.data.statistics.home.passing.players[j]?.avg_pocket_time,
                      batted_passes: response.data.statistics.home.passing.players[j]?.batted_passes,
                      on_target_throws: response.data.statistics.home.passing.players[j]?.on_target_throws,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.passing.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      passingAttempts: response.data.statistics.home.passing.players[j].attempts,
                      completions: response.data.statistics.home.passing.players[j]?.completions,
                      cmp_pct: response.data.statistics.home.passing.players[j]?.cmp_pct,
                      passingInterception: response.data.statistics.home.passing.players[j]?.interceptions,
                      passingSackYards: response.data.statistics.home.passing.players[j]?.sack_yards,
                      rating: response.data.statistics.home.passing.players[j]?.rating,
                      passingTouchDown: response.data.statistics.home.passing.players[j]?.touchdowns,
                      avg_yards: response.data.statistics.home.passing.players[j]?.avg_yards,
                      passingSacks: response.data.statistics.home.passing.players[j]?.sacks,
                      passingLongest: response.data.statistics.home.passing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.home.passing.players[j]?.longest_touchdown,
                      passingAirYards: response.data.statistics.home.passing.players[j]?.air_yards,
                      passingRedZoneAttempts: response.data.statistics.home.passing.players[j]?.redzone_attempts,
                      net_yards: response.data.statistics.home.passing.players[j]?.net_yards,
                      passingYards: response.data.statistics.home.passing.players[j]?.yards,
                      first_downs: response.data.statistics.home.passing.players[j]?.first_downs,
                      int_touchdowns: response.data.statistics.home.passing.players[j]?.int_touchdowns,
                      throw_aways: response.data.statistics.home.passing.players[j]?.throw_aways,
                      defended_passes: response.data.statistics.home.passing.players[j]?.defended_passes,
                      dropped_passes: response.data.statistics.home.passing.players[j]?.dropped_passes,
                      spikes: response.data.statistics.home.passing.players[j]?.spikes,
                      blitzes: response.data.statistics.home.passing.players[j]?.blitzes,
                      hurries: response.data.statistics.home.passing.players[j]?.hurries,
                      knockdowns: response.data.statistics.home.passing.players[j]?.knockdowns,
                      pocket_time: response.data.statistics.home.passing.players[j]?.pocket_time,
                      avg_pocket_time: response.data.statistics.home.passing.players[j]?.avg_pocket_time,
                      batted_passes: response.data.statistics.home.passing.players[j]?.batted_passes,
                      on_target_throws: response.data.statistics.home.passing.players[j]?.on_target_throws,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.misc_returns?.players?.length; j++) {
                console.log("in nfl, misc_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.misc_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.misc_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      yards: response.data.statistics.home.misc_returns.players[j].yards,
                      touchdowns: response.data.statistics.home.misc_returns.players[j]?.touchdowns,
                      blk_fg_touchdowns: response.data.statistics.home.misc_returns.players[j]?.blk_fg_touchdowns,
                      blk_punt_touchdowns: response.data.statistics.home.misc_returns.players[j]?.blk_punt_touchdowns,
                      fg_return_touchdowns: response.data.statistics.home.misc_returns.players[j]?.fg_return_touchdowns,
                      ez_rec_touchdowns: response.data.statistics.home.misc_returns.players[j]?.ez_rec_touchdowns,
                      number: response.data.statistics.home.misc_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.misc_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      yards: response.data.statistics.home.misc_returns.players[j].yards,
                      touchdowns: response.data.statistics.home.misc_returns.players[j]?.touchdowns,
                      blk_fg_touchdowns: response.data.statistics.home.misc_returns.players[j]?.blk_fg_touchdowns,
                      blk_punt_touchdowns: response.data.statistics.home.misc_returns.players[j]?.blk_punt_touchdowns,
                      fg_return_touchdowns: response.data.statistics.home.misc_returns.players[j]?.fg_return_touchdowns,
                      ez_rec_touchdowns: response.data.statistics.home.misc_returns.players[j]?.ez_rec_touchdowns,
                      number: response.data.statistics.home.misc_returns.players[j]?.number
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.kickoffs?.players?.length; j++) {
                console.log("in nfl, kickoffs")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.kickoffs.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.kickoffs.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      endzone: response.data.statistics.home.kickoffs.players[j].endzone,
                      inside_20: response.data.statistics.home.kickoffs.players[j]?.inside_20,
                      return_yards: response.data.statistics.home.kickoffs.players[j]?.return_yards,
                      touchbacks: response.data.statistics.home.kickoffs.players[j]?.touchbacks,
                      yards: response.data.statistics.home.kickoffs.players[j]?.yards,
                      out_of_bounds: response.data.statistics.home.kickoffs.players[j]?.out_of_bounds,
                      number: response.data.statistics.home.kickoffs.players[j]?.number,
                      total_endzone: response.data.statistics.home.kickoffs.players[j]?.total_endzone,
                      onside_attempts: response.data.statistics.home.kickoffs.players[j]?.onside_attempts,
                      onside_successes: response.data.statistics.home.kickoffs.players[j]?.onside_successes,
                      squib_kicks: response.data.statistics.home.kickoffs.players[j]?.squib_kicks,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.kickoffs.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      endzone: response.data.statistics.home.kickoffs.players[j].endzone,
                      inside_20: response.data.statistics.home.kickoffs.players[j]?.inside_20,
                      return_yards: response.data.statistics.home.kickoffs.players[j]?.return_yards,
                      touchbacks: response.data.statistics.home.kickoffs.players[j]?.touchbacks,
                      yards: response.data.statistics.home.kickoffs.players[j]?.yards,
                      out_of_bounds: response.data.statistics.home.kickoffs.players[j]?.out_of_bounds,
                      number: response.data.statistics.home.kickoffs.players[j]?.number,
                      total_endzone: response.data.statistics.home.kickoffs.players[j]?.total_endzone,
                      onside_attempts: response.data.statistics.home.kickoffs.players[j]?.onside_attempts,
                      onside_successes: response.data.statistics.home.kickoffs.players[j]?.onside_successes,
                      squib_kicks: response.data.statistics.home.kickoffs.players[j]?.squib_kicks,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.kick_returns?.players?.length; j++) {
                console.log("in nfl, kick_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.kick_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.kick_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      avg_yards: response.data.statistics.home.kick_returns.players[j].avg_yards,
                      yards: response.data.statistics.home.kick_returns.players[j]?.yards,
                      touchdowns: response.data.statistics.home.kick_returns.players[j]?.touchdowns,
                      faircatches: response.data.statistics.home.kick_returns.players[j]?.faircatches,
                      number: response.data.statistics.home.kick_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.kick_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      avg_yards: response.data.statistics.home.kick_returns.players[j].avg_yards,
                      yards: response.data.statistics.home.kick_returns.players[j]?.yards,
                      touchdowns: response.data.statistics.home.kick_returns.players[j]?.touchdowns,
                      faircatches: response.data.statistics.home.kick_returns.players[j]?.faircatches,
                      number: response.data.statistics.home.kick_returns.players[j]?.number,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.int_returns?.players?.length; j++) {
                console.log("in nfl, int_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.int_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.int_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      avg_yards: response.data.statistics.home.int_returns.players[j].avg_yards,
                      yards: response.data.statistics.home.int_returns.players[j]?.yards,
                      longest: response.data.statistics.home.int_returns.players[j]?.longest,
                      touchdowns: response.data.statistics.home.int_returns.players[j]?.touchdowns,
                      number: response.data.statistics.home.int_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.int_returns.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      avg_yards: response.data.statistics.home.int_returns.players[j].avg_yards,
                      yards: response.data.statistics.home.int_returns.players[j]?.yards,
                      longest: response.data.statistics.home.int_returns.players[j]?.longest,
                      touchdowns: response.data.statistics.home.int_returns.players[j]?.touchdowns,
                      number: response.data.statistics.home.int_returns.players[j]?.number,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.fumbles?.players?.length; j++) {
                console.log("in nfl, fumbles")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.fumbles.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.fumbles.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      fumbles: response.data.statistics.home.fumbles.players[j].fumbles,
                      lost_fumbles: response.data.statistics.home.fumbles.players[j]?.lost_fumbles,
                      own_rec: response.data.statistics.home.fumbles.players[j]?.own_rec,
                      own_rec_yards: response.data.statistics.home.fumbles.players[j]?.own_rec_yards,
                      opp_rec: response.data.statistics.home.fumbles.players[j]?.opp_rec,
                      opp_rec_yards: response.data.statistics.home.fumbles.players[j]?.opp_rec_yards,
                      out_of_bounds: response.data.statistics.home.fumbles.players[j]?.out_of_bounds,
                      forced_fumbles: response.data.statistics.home.fumbles.players[j]?.forced_fumbles,
                      own_rec_tds: response.data.statistics.home.fumbles.players[j]?.own_rec_tds,
                      opp_rec_tds: response.data.statistics.home.fumbles.players[j]?.opp_rec_tds,
                      ez_rec_tds: response.data.statistics.home.fumbles.players[j]?.ez_rec_tds,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.fumbles.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      fumbles: response.data.statistics.home.fumbles.players[j].fumbles,
                      lost_fumbles: response.data.statistics.home.fumbles.players[j]?.lost_fumbles,
                      own_rec: response.data.statistics.home.fumbles.players[j]?.own_rec,
                      own_rec_yards: response.data.statistics.home.fumbles.players[j]?.own_rec_yards,
                      opp_rec: response.data.statistics.home.fumbles.players[j]?.opp_rec,
                      opp_rec_yards: response.data.statistics.home.fumbles.players[j]?.opp_rec_yards,
                      out_of_bounds: response.data.statistics.home.fumbles.players[j]?.out_of_bounds,
                      forced_fumbles: response.data.statistics.home.fumbles.players[j]?.forced_fumbles,
                      own_rec_tds: response.data.statistics.home.fumbles.players[j]?.own_rec_tds,
                      opp_rec_tds: response.data.statistics.home.fumbles.players[j]?.opp_rec_tds,
                      ez_rec_tds: response.data.statistics.home.fumbles.players[j]?.ez_rec_tds,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.field_goals?.players.length; j++) {
                console.log("in nfl, field_goals")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.field_goals.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.field_goals.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      attempts: response.data.statistics.home.field_goals.players[j].attempts,
                      made: response.data.statistics.home.field_goals.players[j]?.made,
                      blocked: response.data.statistics.home.field_goals.players[j]?.blocked,
                      yards: response.data.statistics.home.field_goals.players[j]?.yards,
                      avg_yards: response.data.statistics.home.field_goals.players[j]?.avg_yards,
                      longest: response.data.statistics.home.field_goals.players[j]?.longest,
                      net_attempts: response.data.statistics.home.field_goals.players[j]?.net_attempts,
                      missed: response.data.statistics.home.field_goals.players[j]?.missed,
                      pct: response.data.statistics.home.field_goals.players[j]?.pct,
                      attempts_19: response.data.statistics.home.field_goals.players[j]?.attempts_19,
                      attempts_29: response.data.statistics.home.field_goals.players[j]?.attempts_29,
                      attempts_39: response.data.statistics.home.field_goals.players[j]?.attempts_39,
                      attempts_49: response.data.statistics.home.field_goals.players[j]?.attempts_49,
                      attempts_50: response.data.statistics.home.field_goals.players[j]?.attempts_50,
                      made_19: response.data.statistics.home.field_goals.players[j]?.made_19,
                      made_29: response.data.statistics.home.field_goals.players[j]?.made_29,
                      made_39: response.data.statistics.home.field_goals.players[j]?.made_39,
                      made_49: response.data.statistics.home.field_goals.players[j]?.made_49,
                      made_50: response.data.statistics.home.field_goals.players[j]?.made_50,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.field_goals.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      attempts: response.data.statistics.home.field_goals.players[j].attempts,
                      made: response.data.statistics.home.field_goals.players[j]?.made,
                      blocked: response.data.statistics.home.field_goals.players[j]?.blocked,
                      yards: response.data.statistics.home.field_goals.players[j]?.yards,
                      avg_yards: response.data.statistics.home.field_goals.players[j]?.avg_yards,
                      longest: response.data.statistics.home.field_goals.players[j]?.longest,
                      net_attempts: response.data.statistics.home.field_goals.players[j]?.net_attempts,
                      missed: response.data.statistics.home.field_goals.players[j]?.missed,
                      pct: response.data.statistics.home.field_goals.players[j]?.pct,
                      attempts_19: response.data.statistics.home.field_goals.players[j]?.attempts_19,
                      attempts_29: response.data.statistics.home.field_goals.players[j]?.attempts_29,
                      attempts_39: response.data.statistics.home.field_goals.players[j]?.attempts_39,
                      attempts_49: response.data.statistics.home.field_goals.players[j]?.attempts_49,
                      attempts_50: response.data.statistics.home.field_goals.players[j]?.attempts_50,
                      made_19: response.data.statistics.home.field_goals.players[j]?.made_19,
                      made_29: response.data.statistics.home.field_goals.players[j]?.made_29,
                      made_39: response.data.statistics.home.field_goals.players[j]?.made_39,
                      made_49: response.data.statistics.home.field_goals.players[j]?.made_49,
                      made_50: response.data.statistics.home.field_goals.players[j]?.made_50,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.defense?.players?.length; j++) {
                console.log("in nfl, defense")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.defense.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.defense.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      tackles: response.data.statistics.home.defense.players[j].tackles,
                      assists: response.data.statistics.home.defense.players[j]?.assists,
                      combined: response.data.statistics.home.defense.players[j]?.combined,
                      sacks: response.data.statistics.home.defense.players[j]?.sacks,
                      sack_yards: response.data.statistics.home.defense.players[j]?.sack_yards,
                      interceptions: response.data.statistics.home.defense.players[j]?.interceptions,
                      passes_defended: response.data.statistics.home.defense.players[j]?.passes_defended,
                      forced_fumbles: response.data.statistics.home.defense.players[j]?.forced_fumbles,
                      fumble_recoveries: response.data.statistics.home.defense.players[j]?.fumble_recoveries,
                      qb_hits: response.data.statistics.home.defense.players[j]?.qb_hits,
                      tloss: response.data.statistics.home.defense.players[j]?.tloss,
                      tloss_yards: response.data.statistics.home.defense.players[j]?.tloss_yards,
                      safeties: response.data.statistics.home.defense.players[j]?.safeties,
                      sp_tackles: response.data.statistics.home.defense.players[j]?.sp_tackles,
                      sp_assists: response.data.statistics.home.defense.players[j]?.sp_assists,
                      sp_forced_fumbles: response.data.statistics.home.defense.players[j]?.sp_forced_fumbles,
                      sp_fumble_recoveries: response.data.statistics.home.defense.players[j]?.sp_fumble_recoveries,
                      sp_blocks: response.data.statistics.home.defense.players[j]?.sp_blocks,
                      misc_tackles: response.data.statistics.home.defense.players[j]?.misc_tackles,
                      misc_assists: response.data.statistics.home.defense.players[j]?.misc_assists,
                      misc_forced_fumbles: response.data.statistics.home.defense.players[j]?.misc_forced_fumbles,
                      misc_fumble_recoveries: response.data.statistics.home.defense.players[j]?.misc_fumble_recoveries,
                      sp_own_fumble_recoveries: response.data.statistics.home.defense.players[j]?.sp_own_fumble_recoveries,
                      sp_opp_fumble_recoveries: response.data.statistics.home.defense.players[j]?.sp_opp_fumble_recoveries,
                      def_targets: response.data.statistics.home.defense.players[j]?.def_targets,
                      def_comps: response.data.statistics.home.defense.players[j]?.def_comps,
                      blitzes: response.data.statistics.home.defense.players[j]?.blitzes,
                      hurries: response.data.statistics.home.defense.players[j]?.hurries,
                      knockdowns: response.data.statistics.home.defense.players[j]?.knockdowns,
                      missed_tackles: response.data.statistics.home.defense.players[j]?.missed_tackles,
                      batted_passes: response.data.statistics.home.defense.players[j]?.batted_passes,
                      three_and_outs_forced: response.data.statistics.home.defense.players[j]?.three_and_outs_forced,
                      fourth_down_stops: response.data.statistics.home.defense.players[j]?.fourth_down_stops,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.defense.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      tackles: response.data.statistics.home.defense.players[j].tackles,
                      assists: response.data.statistics.home.defense.players[j]?.assists,
                      combined: response.data.statistics.home.defense.players[j]?.combined,
                      sacks: response.data.statistics.home.defense.players[j]?.sacks,
                      sack_yards: response.data.statistics.home.defense.players[j]?.sack_yards,
                      interceptions: response.data.statistics.home.defense.players[j]?.interceptions,
                      passes_defended: response.data.statistics.home.defense.players[j]?.passes_defended,
                      forced_fumbles: response.data.statistics.home.defense.players[j]?.forced_fumbles,
                      fumble_recoveries: response.data.statistics.home.defense.players[j]?.fumble_recoveries,
                      qb_hits: response.data.statistics.home.defense.players[j]?.qb_hits,
                      tloss: response.data.statistics.home.defense.players[j]?.tloss,
                      tloss_yards: response.data.statistics.home.defense.players[j]?.tloss_yards,
                      safeties: response.data.statistics.home.defense.players[j]?.safeties,
                      sp_tackles: response.data.statistics.home.defense.players[j]?.sp_tackles,
                      sp_assists: response.data.statistics.home.defense.players[j]?.sp_assists,
                      sp_forced_fumbles: response.data.statistics.home.defense.players[j]?.sp_forced_fumbles,
                      sp_fumble_recoveries: response.data.statistics.home.defense.players[j]?.sp_fumble_recoveries,
                      sp_blocks: response.data.statistics.home.defense.players[j]?.sp_blocks,
                      misc_tackles: response.data.statistics.home.defense.players[j]?.misc_tackles,
                      misc_assists: response.data.statistics.home.defense.players[j]?.misc_assists,
                      misc_forced_fumbles: response.data.statistics.home.defense.players[j]?.misc_forced_fumbles,
                      misc_fumble_recoveries: response.data.statistics.home.defense.players[j]?.misc_fumble_recoveries,
                      sp_own_fumble_recoveries: response.data.statistics.home.defense.players[j]?.sp_own_fumble_recoveries,
                      sp_opp_fumble_recoveries: response.data.statistics.home.defense.players[j]?.sp_opp_fumble_recoveries,
                      def_targets: response.data.statistics.home.defense.players[j]?.def_targets,
                      def_comps: response.data.statistics.home.defense.players[j]?.def_comps,
                      blitzes: response.data.statistics.home.defense.players[j]?.blitzes,
                      hurries: response.data.statistics.home.defense.players[j]?.hurries,
                      knockdowns: response.data.statistics.home.defense.players[j]?.knockdowns,
                      missed_tackles: response.data.statistics.home.defense.players[j]?.missed_tackles,
                      batted_passes: response.data.statistics.home.defense.players[j]?.batted_passes,
                      three_and_outs_forced: response.data.statistics.home.defense.players[j]?.three_and_outs_forced,
                      fourth_down_stops: response.data.statistics.home.defense.players[j]?.fourth_down_stops,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.home.extra_points?.kicks?.players.length; j++) {
                console.log("in nfl, extra_points")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.home.extra_points?.kicks?.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.extra_points.kicks.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      attempts: response.data.statistics.home.extra_points.kicks.players[j].attempts,
                      blocked: response.data.statistics.home.extra_points.kicks.players[j]?.blocked,
                      made: response.data.statistics.home.extra_points.kicks.players[j]?.made,
                      missed: response.data.statistics.home.extra_points.kicks.players[j]?.missed,
                      pct: response.data.statistics.home.extra_points.kicks.players[j]?.pct,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.home.extra_points.kicks.players[j].sr_id,
                      compititorId: response.data.statistics.home.sr_id,
                      attempts: response.data.statistics.home.extra_points.kicks.players[j].attempts,
                      blocked: response.data.statistics.home.extra_points.kicks.players[j]?.blocked,
                      made: response.data.statistics.home.extra_points.kicks.players[j]?.made,
                      missed: response.data.statistics.home.extra_points.kicks.players[j]?.missed,
                      pct: response.data.statistics.home.extra_points.kicks.players[j]?.pct,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }

              //away
              for (let j = 0; j < response.data.statistics.away.rushing?.players?.length; j++) {
                console.log("in nfl")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.rushing.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.rushing.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      first_downs: response.data.statistics.away.rushing.players[j].first_downs,
                      avg_yards: response.data.statistics.away.rushing.players[j]?.avg_yards,
                      attempts: response.data.statistics.away.rushing.players[j]?.attempts,
                      touchdowns: response.data.statistics.away.rushing.players[j]?.touchdowns,
                      rushingYards: response.data.statistics.away.rushing.players[j]?.yards,
                      longestRush: response.data.statistics.away.rushing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.away.rushing.players[j]?.longest_touchdown,
                      redzone_attempts: response.data.statistics.away.rushing.players[j]?.redzone_attempts,
                      tlost: response.data.statistics.away.rushing.players[j]?.tlost,
                      rushingTlostYards: response.data.statistics.away.rushing.players[j]?.tlost_yards,
                      broken_tackles: response.data.statistics.away.rushing.players[j]?.broken_tackles,
                      kneel_downs: response.data.statistics.away.rushing.players[j]?.kneel_downs,
                      scrambles: response.data.statistics.away.rushing.players[j]?.scrambles,
                      rushingYardsAfterContact: response.data.statistics.away.rushing.players[j]?.yards_after_contact
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.rushing.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      first_downs: response.data.statistics.away.rushing.players[j].first_downs,
                      avg_yards: response.data.statistics.away.rushing.players[j]?.avg_yards,
                      attempts: response.data.statistics.away.rushing.players[j]?.attempts,
                      touchdowns: response.data.statistics.away.rushing.players[j]?.touchdowns,
                      rushingYards: response.data.statistics.away.rushing.players[j]?.yards,
                      longestRush: response.data.statistics.away.rushing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.away.rushing.players[j]?.longest_touchdown,
                      redzone_attempts: response.data.statistics.away.rushing.players[j]?.redzone_attempts,
                      tlost: response.data.statistics.away.rushing.players[j]?.tlost,
                      rushingTlostYards: response.data.statistics.away.rushing.players[j]?.tlost_yards,
                      broken_tackles: response.data.statistics.away.rushing.players[j]?.broken_tackles,
                      kneel_downs: response.data.statistics.away.rushing.players[j]?.kneel_downs,
                      scrambles: response.data.statistics.away.rushing.players[j]?.scrambles,
                      rushingYardsAfterContact: response.data.statistics.away.rushing.players[j]?.yards_after_contact
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.receiving?.players?.length; j++) {
                console.log("in nfl, receiving")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.receiving.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.receiving.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      first_downs: response.data.statistics.away.receiving.players[j].first_downs,
                      receptions: response.data.statistics.away.receiving.players[j]?.receptions,
                      targets: response.data.statistics.away.receiving.players[j]?.targets,
                      receivingYards: response.data.statistics.away.receiving.players[j]?.yards,
                      avg_yards: response.data.statistics.away.receiving.players[j]?.avg_yards,
                      longestReception: response.data.statistics.away.receiving.players[j]?.longest,
                      touchdowns: response.data.statistics.away.receiving.players[j]?.touchdowns,
                      longest_touchdown: response.data.statistics.away.receiving.players[j]?.longest_touchdown,
                      yards_after_catch: response.data.statistics.away.receiving.players[j]?.yards_after_catch,
                      redzone_targets: response.data.statistics.away.receiving.players[j]?.redzone_targets,
                      air_yards: response.data.statistics.away.receiving.players[j]?.air_yards,
                      broken_tackles: response.data.statistics.away.receiving.players[j]?.broken_tackles,
                      dropped_passes: response.data.statistics.away.receiving.players[j]?.dropped_passes,
                      catchable_passes: response.data.statistics.away.receiving.players[j]?.catchable_passes,
                      yards_after_contact: response.data.statistics.away.receiving.players[j]?.yards_after_contact
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.receiving.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      first_downs: response.data.statistics.away.receiving.players[j].first_downs,
                      receptions: response.data.statistics.away.receiving.players[j]?.receptions,
                      targets: response.data.statistics.away.receiving.players[j]?.targets,
                      receivingYards: response.data.statistics.away.receiving.players[j]?.yards,
                      avg_yards: response.data.statistics.away.receiving.players[j]?.avg_yards,
                      longestReception: response.data.statistics.away.receiving.players[j]?.longest,
                      touchdowns: response.data.statistics.away.receiving.players[j]?.touchdowns,
                      longest_touchdown: response.data.statistics.away.receiving.players[j]?.longest_touchdown,
                      yards_after_catch: response.data.statistics.away.receiving.players[j]?.yards_after_catch,
                      redzone_targets: response.data.statistics.away.receiving.players[j]?.redzone_targets,
                      air_yards: response.data.statistics.away.receiving.players[j]?.air_yards,
                      broken_tackles: response.data.statistics.away.receiving.players[j]?.broken_tackles,
                      dropped_passes: response.data.statistics.away.receiving.players[j]?.dropped_passes,
                      catchable_passes: response.data.statistics.away.receiving.players[j]?.catchable_passes,
                      yards_after_contact: response.data.statistics.away.receiving.players[j]?.yards_after_contact
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.punts?.players?.length; j++) {
                console.log("in nfl, punts")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.punts.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.punts.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      attempts: response.data.statistics.away.punts.players[j].attempts,
                      yards: response.data.statistics.away.punts.players[j]?.yards,
                      avg_yards: response.data.statistics.away.punts.players[j]?.avg_yards,
                      blocked: response.data.statistics.away.punts.players[j]?.blocked,
                      longest: response.data.statistics.away.punts.players[j]?.longest,
                      touchbacks: response.data.statistics.away.punts.players[j]?.touchbacks,
                      inside_20: response.data.statistics.away.punts.players[j]?.inside_20,
                      avg_net_yards: response.data.statistics.away.punts.players[j]?.avg_net_yards,
                      return_yards: response.data.statistics.away.punts.players[j]?.return_yards,
                      net_yards: response.data.statistics.away.punts.players[j]?.net_yards,
                      hang_time: response.data.statistics.away.punts.players[j]?.hang_time,
                      avg_hang_time: response.data.statistics.away.punts.players[j]?.avg_hang_time,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.punts.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      attempts: response.data.statistics.away.punts.players[j].attempts,
                      yards: response.data.statistics.away.punts.players[j]?.yards,
                      avg_yards: response.data.statistics.away.punts.players[j]?.avg_yards,
                      blocked: response.data.statistics.away.punts.players[j]?.blocked,
                      longest: response.data.statistics.away.punts.players[j]?.longest,
                      touchbacks: response.data.statistics.away.punts.players[j]?.touchbacks,
                      inside_20: response.data.statistics.away.punts.players[j]?.inside_20,
                      avg_net_yards: response.data.statistics.away.punts.players[j]?.avg_net_yards,
                      return_yards: response.data.statistics.away.punts.players[j]?.return_yards,
                      net_yards: response.data.statistics.away.punts.players[j]?.net_yards,
                      hang_time: response.data.statistics.away.punts.players[j]?.hang_time,
                      avg_hang_time: response.data.statistics.away.punts.players[j]?.avg_hang_time,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.punt_returns?.players?.length; j++) {
                console.log("in nfl, punt_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.punt_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.punt_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      yards: response.data.statistics.away.punt_returns.players[j].yards,
                      avg_yards: response.data.statistics.away.punt_returns.players[j]?.avg_yards,
                      touchdowns: response.data.statistics.away.punt_returns.players[j]?.touchdowns,
                      longest: response.data.statistics.away.punt_returns.players[j]?.longest,
                      faircatches: response.data.statistics.away.punt_returns.players[j]?.faircatches,
                      number: response.data.statistics.away.punt_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.punt_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      yards: response.data.statistics.away.punt_returns.players[j].yards,
                      avg_yards: response.data.statistics.away.punt_returns.players[j]?.avg_yards,
                      touchdowns: response.data.statistics.away.punt_returns.players[j]?.touchdowns,
                      longest: response.data.statistics.away.punt_returns.players[j]?.longest,
                      faircatches: response.data.statistics.away.punt_returns.players[j]?.faircatches,
                      number: response.data.statistics.away.punt_returns.players[j]?.number,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.penalties?.players?.length; j++) {
                console.log("in nfl, penalties")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.penalties.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.penalties.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      first_downs: response.data.statistics.away.penalties.players[j].first_downs,
                      penalties: response.data.statistics.away.penalties.players[j]?.penalties,
                      yards: response.data.statistics.away.penalties.players[j]?.yards,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.penalties.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      first_downs: response.data.statistics.away.penalties.players[j].first_downs,
                      penalties: response.data.statistics.away.penalties.players[j]?.penalties,
                      yards: response.data.statistics.away.penalties.players[j]?.yards,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.passing?.players?.length; j++) {
                console.log("in nfl, passing")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.passing.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.passing.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      passingAttempts: response.data.statistics.away.passing.players[j].attempts,
                      completions: response.data.statistics.away.passing.players[j]?.completions,
                      cmp_pct: response.data.statistics.away.passing.players[j]?.cmp_pct,
                      passingInterception: response.data.statistics.away.passing.players[j]?.interceptions,
                      passingSackYards: response.data.statistics.away.passing.players[j]?.sack_yards,
                      rating: response.data.statistics.away.passing.players[j]?.rating,
                      passingTouchDown: response.data.statistics.away.passing.players[j]?.touchdowns,
                      avg_yards: response.data.statistics.away.passing.players[j]?.avg_yards,
                      passingSacks: response.data.statistics.away.passing.players[j]?.sacks,
                      passingLongest: response.data.statistics.away.passing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.away.passing.players[j]?.longest_touchdown,
                      passingAirYards: response.data.statistics.away.passing.players[j]?.air_yards,
                      passingRedZoneAttempts: response.data.statistics.away.passing.players[j]?.redzone_attempts,
                      net_yards: response.data.statistics.away.passing.players[j]?.net_yards,
                      passingYards: response.data.statistics.away.passing.players[j]?.yards,
                      first_downs: response.data.statistics.away.passing.players[j]?.first_downs,
                      int_touchdowns: response.data.statistics.away.passing.players[j]?.int_touchdowns,
                      throw_aways: response.data.statistics.away.passing.players[j]?.throw_aways,
                      defended_passes: response.data.statistics.away.passing.players[j]?.defended_passes,
                      dropped_passes: response.data.statistics.away.passing.players[j]?.dropped_passes,
                      spikes: response.data.statistics.away.passing.players[j]?.spikes,
                      blitzes: response.data.statistics.away.passing.players[j]?.blitzes,
                      hurries: response.data.statistics.away.passing.players[j]?.hurries,
                      knockdowns: response.data.statistics.away.passing.players[j]?.knockdowns,
                      pocket_time: response.data.statistics.away.passing.players[j]?.pocket_time,
                      avg_pocket_time: response.data.statistics.away.passing.players[j]?.avg_pocket_time,
                      batted_passes: response.data.statistics.away.passing.players[j]?.batted_passes,
                      on_target_throws: response.data.statistics.away.passing.players[j]?.on_target_throws,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.passing.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      passingAttempts: response.data.statistics.away.passing.players[j].attempts,
                      completions: response.data.statistics.away.passing.players[j]?.completions,
                      cmp_pct: response.data.statistics.away.passing.players[j]?.cmp_pct,
                      passingInterception: response.data.statistics.away.passing.players[j]?.interceptions,
                      passingSackYards: response.data.statistics.away.passing.players[j]?.sack_yards,
                      rating: response.data.statistics.away.passing.players[j]?.rating,
                      passingTouchDown: response.data.statistics.away.passing.players[j]?.touchdowns,
                      avg_yards: response.data.statistics.away.passing.players[j]?.avg_yards,
                      passingSacks: response.data.statistics.away.passing.players[j]?.sacks,
                      passingLongest: response.data.statistics.away.passing.players[j]?.longest,
                      longest_touchdown: response.data.statistics.away.passing.players[j]?.longest_touchdown,
                      passingAirYards: response.data.statistics.away.passing.players[j]?.air_yards,
                      passingRedZoneAttempts: response.data.statistics.away.passing.players[j]?.redzone_attempts,
                      net_yards: response.data.statistics.away.passing.players[j]?.net_yards,
                      passingYards: response.data.statistics.away.passing.players[j]?.yards,
                      first_downs: response.data.statistics.away.passing.players[j]?.first_downs,
                      int_touchdowns: response.data.statistics.away.passing.players[j]?.int_touchdowns,
                      throw_aways: response.data.statistics.away.passing.players[j]?.throw_aways,
                      defended_passes: response.data.statistics.away.passing.players[j]?.defended_passes,
                      dropped_passes: response.data.statistics.away.passing.players[j]?.dropped_passes,
                      spikes: response.data.statistics.away.passing.players[j]?.spikes,
                      blitzes: response.data.statistics.away.passing.players[j]?.blitzes,
                      hurries: response.data.statistics.away.passing.players[j]?.hurries,
                      knockdowns: response.data.statistics.away.passing.players[j]?.knockdowns,
                      pocket_time: response.data.statistics.away.passing.players[j]?.pocket_time,
                      avg_pocket_time: response.data.statistics.away.passing.players[j]?.avg_pocket_time,
                      batted_passes: response.data.statistics.away.passing.players[j]?.batted_passes,
                      on_target_throws: response.data.statistics.away.passing.players[j]?.on_target_throws,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.misc_returns?.players?.length; j++) {
                console.log("in nfl, misc_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.misc_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.misc_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      yards: response.data.statistics.away.misc_returns.players[j].yards,
                      touchdowns: response.data.statistics.away.misc_returns.players[j]?.touchdowns,
                      blk_fg_touchdowns: response.data.statistics.away.misc_returns.players[j]?.blk_fg_touchdowns,
                      blk_punt_touchdowns: response.data.statistics.away.misc_returns.players[j]?.blk_punt_touchdowns,
                      fg_return_touchdowns: response.data.statistics.away.misc_returns.players[j]?.fg_return_touchdowns,
                      ez_rec_touchdowns: response.data.statistics.away.misc_returns.players[j]?.ez_rec_touchdowns,
                      number: response.data.statistics.away.misc_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.misc_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      yards: response.data.statistics.away.misc_returns.players[j].yards,
                      touchdowns: response.data.statistics.away.misc_returns.players[j]?.touchdowns,
                      blk_fg_touchdowns: response.data.statistics.away.misc_returns.players[j]?.blk_fg_touchdowns,
                      blk_punt_touchdowns: response.data.statistics.away.misc_returns.players[j]?.blk_punt_touchdowns,
                      fg_return_touchdowns: response.data.statistics.away.misc_returns.players[j]?.fg_return_touchdowns,
                      ez_rec_touchdowns: response.data.statistics.away.misc_returns.players[j]?.ez_rec_touchdowns,
                      number: response.data.statistics.away.misc_returns.players[j]?.number
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.kickoffs?.players?.length; j++) {
                console.log("in nfl, kickoffs")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.kickoffs.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.kickoffs.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      endzone: response.data.statistics.away.kickoffs.players[j].endzone,
                      inside_20: response.data.statistics.away.kickoffs.players[j]?.inside_20,
                      return_yards: response.data.statistics.away.kickoffs.players[j]?.return_yards,
                      touchbacks: response.data.statistics.away.kickoffs.players[j]?.touchbacks,
                      yards: response.data.statistics.away.kickoffs.players[j]?.yards,
                      out_of_bounds: response.data.statistics.away.kickoffs.players[j]?.out_of_bounds,
                      number: response.data.statistics.away.kickoffs.players[j]?.number,
                      total_endzone: response.data.statistics.away.kickoffs.players[j]?.total_endzone,
                      onside_attempts: response.data.statistics.away.kickoffs.players[j]?.onside_attempts,
                      onside_successes: response.data.statistics.away.kickoffs.players[j]?.onside_successes,
                      squib_kicks: response.data.statistics.away.kickoffs.players[j]?.squib_kicks,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.kickoffs.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      endzone: response.data.statistics.away.kickoffs.players[j].endzone,
                      inside_20: response.data.statistics.away.kickoffs.players[j]?.inside_20,
                      return_yards: response.data.statistics.away.kickoffs.players[j]?.return_yards,
                      touchbacks: response.data.statistics.away.kickoffs.players[j]?.touchbacks,
                      yards: response.data.statistics.away.kickoffs.players[j]?.yards,
                      out_of_bounds: response.data.statistics.away.kickoffs.players[j]?.out_of_bounds,
                      number: response.data.statistics.away.kickoffs.players[j]?.number,
                      total_endzone: response.data.statistics.away.kickoffs.players[j]?.total_endzone,
                      onside_attempts: response.data.statistics.away.kickoffs.players[j]?.onside_attempts,
                      onside_successes: response.data.statistics.away.kickoffs.players[j]?.onside_successes,
                      squib_kicks: response.data.statistics.away.kickoffs.players[j]?.squib_kicks,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.kick_returns?.players?.length; j++) {
                console.log("in nfl, kick_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.kick_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.kick_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      avg_yards: response.data.statistics.away.kick_returns.players[j].avg_yards,
                      yards: response.data.statistics.away.kick_returns.players[j]?.yards,
                      touchdowns: response.data.statistics.away.kick_returns.players[j]?.touchdowns,
                      faircatches: response.data.statistics.away.kick_returns.players[j]?.faircatches,
                      number: response.data.statistics.away.kick_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.kick_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      avg_yards: response.data.statistics.away.kick_returns.players[j].avg_yards,
                      yards: response.data.statistics.away.kick_returns.players[j]?.yards,
                      touchdowns: response.data.statistics.away.kick_returns.players[j]?.touchdowns,
                      faircatches: response.data.statistics.away.kick_returns.players[j]?.faircatches,
                      number: response.data.statistics.away.kick_returns.players[j]?.number,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.int_returns?.players?.length; j++) {
                console.log("in nfl, int_returns")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.int_returns.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.int_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      avg_yards: response.data.statistics.away.int_returns.players[j].avg_yards,
                      yards: response.data.statistics.away.int_returns.players[j]?.yards,
                      longest: response.data.statistics.away.int_returns.players[j]?.longest,
                      touchdowns: response.data.statistics.away.int_returns.players[j]?.touchdowns,
                      number: response.data.statistics.away.int_returns.players[j]?.number,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.int_returns.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      avg_yards: response.data.statistics.away.int_returns.players[j].avg_yards,
                      yards: response.data.statistics.away.int_returns.players[j]?.yards,
                      longest: response.data.statistics.away.int_returns.players[j]?.longest,
                      touchdowns: response.data.statistics.away.int_returns.players[j]?.touchdowns,
                      number: response.data.statistics.away.int_returns.players[j]?.number,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.fumbles?.players?.length; j++) {
                console.log("in nfl, fumbles")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.fumbles.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.fumbles.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      fumbles: response.data.statistics.away.fumbles.players[j].fumbles,
                      lost_fumbles: response.data.statistics.away.fumbles.players[j]?.lost_fumbles,
                      own_rec: response.data.statistics.away.fumbles.players[j]?.own_rec,
                      own_rec_yards: response.data.statistics.away.fumbles.players[j]?.own_rec_yards,
                      opp_rec: response.data.statistics.away.fumbles.players[j]?.opp_rec,
                      opp_rec_yards: response.data.statistics.away.fumbles.players[j]?.opp_rec_yards,
                      out_of_bounds: response.data.statistics.away.fumbles.players[j]?.out_of_bounds,
                      forced_fumbles: response.data.statistics.away.fumbles.players[j]?.forced_fumbles,
                      own_rec_tds: response.data.statistics.away.fumbles.players[j]?.own_rec_tds,
                      opp_rec_tds: response.data.statistics.away.fumbles.players[j]?.opp_rec_tds,
                      ez_rec_tds: response.data.statistics.away.fumbles.players[j]?.ez_rec_tds,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.fumbles.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      fumbles: response.data.statistics.away.fumbles.players[j].fumbles,
                      lost_fumbles: response.data.statistics.away.fumbles.players[j]?.lost_fumbles,
                      own_rec: response.data.statistics.away.fumbles.players[j]?.own_rec,
                      own_rec_yards: response.data.statistics.away.fumbles.players[j]?.own_rec_yards,
                      opp_rec: response.data.statistics.away.fumbles.players[j]?.opp_rec,
                      opp_rec_yards: response.data.statistics.away.fumbles.players[j]?.opp_rec_yards,
                      out_of_bounds: response.data.statistics.away.fumbles.players[j]?.out_of_bounds,
                      forced_fumbles: response.data.statistics.away.fumbles.players[j]?.forced_fumbles,
                      own_rec_tds: response.data.statistics.away.fumbles.players[j]?.own_rec_tds,
                      opp_rec_tds: response.data.statistics.away.fumbles.players[j]?.opp_rec_tds,
                      ez_rec_tds: response.data.statistics.away.fumbles.players[j]?.ez_rec_tds,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.field_goals?.players?.length; j++) {
                console.log("in nfl, field_goals")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.field_goals.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.field_goals.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      attempts: response.data.statistics.away.field_goals.players[j].attempts,
                      made: response.data.statistics.away.field_goals.players[j]?.made,
                      blocked: response.data.statistics.away.field_goals.players[j]?.blocked,
                      yards: response.data.statistics.away.field_goals.players[j]?.yards,
                      avg_yards: response.data.statistics.away.field_goals.players[j]?.avg_yards,
                      longest: response.data.statistics.away.field_goals.players[j]?.longest,
                      net_attempts: response.data.statistics.away.field_goals.players[j]?.net_attempts,
                      missed: response.data.statistics.away.field_goals.players[j]?.missed,
                      pct: response.data.statistics.away.field_goals.players[j]?.pct,
                      attempts_19: response.data.statistics.away.field_goals.players[j]?.attempts_19,
                      attempts_29: response.data.statistics.away.field_goals.players[j]?.attempts_29,
                      attempts_39: response.data.statistics.away.field_goals.players[j]?.attempts_39,
                      attempts_49: response.data.statistics.away.field_goals.players[j]?.attempts_49,
                      attempts_50: response.data.statistics.away.field_goals.players[j]?.attempts_50,
                      made_19: response.data.statistics.away.field_goals.players[j]?.made_19,
                      made_29: response.data.statistics.away.field_goals.players[j]?.made_29,
                      made_39: response.data.statistics.away.field_goals.players[j]?.made_39,
                      made_49: response.data.statistics.away.field_goals.players[j]?.made_49,
                      made_50: response.data.statistics.away.field_goals.players[j]?.made_50,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.field_goals.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      attempts: response.data.statistics.away.field_goals.players[j].attempts,
                      made: response.data.statistics.away.field_goals.players[j]?.made,
                      blocked: response.data.statistics.away.field_goals.players[j]?.blocked,
                      yards: response.data.statistics.away.field_goals.players[j]?.yards,
                      avg_yards: response.data.statistics.away.field_goals.players[j]?.avg_yards,
                      longest: response.data.statistics.away.field_goals.players[j]?.longest,
                      net_attempts: response.data.statistics.away.field_goals.players[j]?.net_attempts,
                      missed: response.data.statistics.away.field_goals.players[j]?.missed,
                      pct: response.data.statistics.away.field_goals.players[j]?.pct,
                      attempts_19: response.data.statistics.away.field_goals.players[j]?.attempts_19,
                      attempts_29: response.data.statistics.away.field_goals.players[j]?.attempts_29,
                      attempts_39: response.data.statistics.away.field_goals.players[j]?.attempts_39,
                      attempts_49: response.data.statistics.away.field_goals.players[j]?.attempts_49,
                      attempts_50: response.data.statistics.away.field_goals.players[j]?.attempts_50,
                      made_19: response.data.statistics.away.field_goals.players[j]?.made_19,
                      made_29: response.data.statistics.away.field_goals.players[j]?.made_29,
                      made_39: response.data.statistics.away.field_goals.players[j]?.made_39,
                      made_49: response.data.statistics.away.field_goals.players[j]?.made_49,
                      made_50: response.data.statistics.away.field_goals.players[j]?.made_50,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.defense?.players?.length; j++) {
                console.log("in nfl, defense")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.defense.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.defense.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      tackles: response.data.statistics.away.defense.players[j].tackles,
                      assists: response.data.statistics.away.defense.players[j]?.assists,
                      combined: response.data.statistics.away.defense.players[j]?.combined,
                      sacks: response.data.statistics.away.defense.players[j]?.sacks,
                      sack_yards: response.data.statistics.away.defense.players[j]?.sack_yards,
                      interceptions: response.data.statistics.away.defense.players[j]?.interceptions,
                      passes_defended: response.data.statistics.away.defense.players[j]?.passes_defended,
                      forced_fumbles: response.data.statistics.away.defense.players[j]?.forced_fumbles,
                      fumble_recoveries: response.data.statistics.away.defense.players[j]?.fumble_recoveries,
                      qb_hits: response.data.statistics.away.defense.players[j]?.qb_hits,
                      tloss: response.data.statistics.away.defense.players[j]?.tloss,
                      tloss_yards: response.data.statistics.away.defense.players[j]?.tloss_yards,
                      safeties: response.data.statistics.away.defense.players[j]?.safeties,
                      sp_tackles: response.data.statistics.away.defense.players[j]?.sp_tackles,
                      sp_assists: response.data.statistics.away.defense.players[j]?.sp_assists,
                      sp_forced_fumbles: response.data.statistics.away.defense.players[j]?.sp_forced_fumbles,
                      sp_fumble_recoveries: response.data.statistics.away.defense.players[j]?.sp_fumble_recoveries,
                      sp_blocks: response.data.statistics.away.defense.players[j]?.sp_blocks,
                      misc_tackles: response.data.statistics.away.defense.players[j]?.misc_tackles,
                      misc_assists: response.data.statistics.away.defense.players[j]?.misc_assists,
                      misc_forced_fumbles: response.data.statistics.away.defense.players[j]?.misc_forced_fumbles,
                      misc_fumble_recoveries: response.data.statistics.away.defense.players[j]?.misc_fumble_recoveries,
                      sp_own_fumble_recoveries: response.data.statistics.away.defense.players[j]?.sp_own_fumble_recoveries,
                      sp_opp_fumble_recoveries: response.data.statistics.away.defense.players[j]?.sp_opp_fumble_recoveries,
                      def_targets: response.data.statistics.away.defense.players[j]?.def_targets,
                      def_comps: response.data.statistics.away.defense.players[j]?.def_comps,
                      blitzes: response.data.statistics.away.defense.players[j]?.blitzes,
                      hurries: response.data.statistics.away.defense.players[j]?.hurries,
                      knockdowns: response.data.statistics.away.defense.players[j]?.knockdowns,
                      missed_tackles: response.data.statistics.away.defense.players[j]?.missed_tackles,
                      batted_passes: response.data.statistics.away.defense.players[j]?.batted_passes,
                      three_and_outs_forced: response.data.statistics.away.defense.players[j]?.three_and_outs_forced,
                      fourth_down_stops: response.data.statistics.away.defense.players[j]?.fourth_down_stops,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.defense.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      tackles: response.data.statistics.away.defense.players[j].tackles,
                      assists: response.data.statistics.away.defense.players[j]?.assists,
                      combined: response.data.statistics.away.defense.players[j]?.combined,
                      sacks: response.data.statistics.away.defense.players[j]?.sacks,
                      sack_yards: response.data.statistics.away.defense.players[j]?.sack_yards,
                      interceptions: response.data.statistics.away.defense.players[j]?.interceptions,
                      passes_defended: response.data.statistics.away.defense.players[j]?.passes_defended,
                      forced_fumbles: response.data.statistics.away.defense.players[j]?.forced_fumbles,
                      fumble_recoveries: response.data.statistics.away.defense.players[j]?.fumble_recoveries,
                      qb_hits: response.data.statistics.away.defense.players[j]?.qb_hits,
                      tloss: response.data.statistics.away.defense.players[j]?.tloss,
                      tloss_yards: response.data.statistics.away.defense.players[j]?.tloss_yards,
                      safeties: response.data.statistics.away.defense.players[j]?.safeties,
                      sp_tackles: response.data.statistics.away.defense.players[j]?.sp_tackles,
                      sp_assists: response.data.statistics.away.defense.players[j]?.sp_assists,
                      sp_forced_fumbles: response.data.statistics.away.defense.players[j]?.sp_forced_fumbles,
                      sp_fumble_recoveries: response.data.statistics.away.defense.players[j]?.sp_fumble_recoveries,
                      sp_blocks: response.data.statistics.away.defense.players[j]?.sp_blocks,
                      misc_tackles: response.data.statistics.away.defense.players[j]?.misc_tackles,
                      misc_assists: response.data.statistics.away.defense.players[j]?.misc_assists,
                      misc_forced_fumbles: response.data.statistics.away.defense.players[j]?.misc_forced_fumbles,
                      misc_fumble_recoveries: response.data.statistics.away.defense.players[j]?.misc_fumble_recoveries,
                      sp_own_fumble_recoveries: response.data.statistics.away.defense.players[j]?.sp_own_fumble_recoveries,
                      sp_opp_fumble_recoveries: response.data.statistics.away.defense.players[j]?.sp_opp_fumble_recoveries,
                      def_targets: response.data.statistics.away.defense.players[j]?.def_targets,
                      def_comps: response.data.statistics.away.defense.players[j]?.def_comps,
                      blitzes: response.data.statistics.away.defense.players[j]?.blitzes,
                      hurries: response.data.statistics.away.defense.players[j]?.hurries,
                      knockdowns: response.data.statistics.away.defense.players[j]?.knockdowns,
                      missed_tackles: response.data.statistics.away.defense.players[j]?.missed_tackles,
                      batted_passes: response.data.statistics.away.defense.players[j]?.batted_passes,
                      three_and_outs_forced: response.data.statistics.away.defense.players[j]?.three_and_outs_forced,
                      fourth_down_stops: response.data.statistics.away.defense.players[j]?.fourth_down_stops,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              for (let j = 0; j < response.data.statistics.away.extra_points?.kicks?.players.length; j++) {
                console.log("in nfl, extra_points")
                let findPlayerStat = await models.playerStatAfterMatch.findOne({
                  where: {
                    sportsId: findNFLMatches[i].sportsId,
                    competitionId: findNFLMatches[i].competitionId,
                    gameId: findNFLMatches[i].gameId,
                    playersId: response.data.statistics.away.extra_points.kicks?.players[j].sr_id
                  }
                })
                if (findPlayerStat) {
                  try {
                    await models.playerStatAfterMatch.update({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.extra_points.kicks?.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      attempts: response.data.statistics.away.extra_points.kicks?.players[j].attempts,
                      blocked: response.data.statistics.away.extra_points.kicks?.players[j]?.blocked,
                      made: response.data.statistics.away.extra_points.kicks?.players[j]?.made,
                      missed: response.data.statistics.away.extra_points.kicks?.players[j]?.missed,
                      pct: response.data.statistics.away.extra_points.kicks?.players[j]?.pct,
                    }, {
                      where: {
                        id: findPlayerStat.id
                      }
                    })
                  } catch (e) {
                    console.log("error on update", e)
                  }
                } else {
                  try {
                    await models.playerStatAfterMatch.create({
                      sportsId: findNFLMatches[i].sportsId,
                      competitionId: findNFLMatches[i].competitionId,
                      gameId: findNFLMatches[i].gameId,
                      playersId: response.data.statistics.away.extra_points.kicks?.players[j].sr_id,
                      compititorId: response.data.statistics.away.sr_id,
                      attempts: response.data.statistics.away.extra_points.kicks?.players[j].attempts,
                      blocked: response.data.statistics.away.extra_points.kicks?.players[j]?.blocked,
                      made: response.data.statistics.away.extra_points.kicks?.players[j]?.made,
                      missed: response.data.statistics.away.extra_points.kicks?.players[j]?.missed,
                      pct: response.data.statistics.away.extra_points.kicks?.players[j]?.pct,
                    })
                  }
                  catch (e) {
                    console.log("error on create", e)
                  }
                }
              }
              if (response.data?.status == "closed") {
                try {
                  await models.game.update({
                    resultFound: true
                  }, {
                    where: {
                      gameId: findNFLMatches[i].gameId
                    }
                  })

                } catch (e) {
                  console.log("update match result found")
                }
              }
              await sleep(2000);
              console.log("done")
            })
            .catch((e) => {
              console.log(e)
            })
        }
      } catch (error) {
        console.log("error in findResult, findResultNHL", error)
      }
    } catch (e) {

    }
    try {
      await models.cronLog.create({
        cronName: "betting result create"
      })
    } catch (e) {
      await models.cronLog.create({
        cronName: "betting result create catch"
      })
    }
    let bettingList
    try {
      bettingList = await models.betting.findAll({
        where: {
          resultDecleared: false,
          endTime: { [Op.lte]: currentTime }
          // id: 173
        },
        include: [
          {
            required: false,
            model: models.settings,
            as: "bettingDetais",
            // attributes: ["id", "playType", "minimum", "maximum", "minimumCorrectionNeeded", "minimumPoint", "maximumPoint"],
            include: {
              required: false,
              model: models.multiplexForEntry,
              as: "entryDetails",
              where: { multiplex: { [Op.not]: 0 } },
              order: ["correctNeeded", "DESC"]
              // attributes: ["id", "profileImage", "playersId", "playerName"],
            },
          },
          {
            required: false,
            model: models.bettingPlayers,
            as: "addedPlayers",
            attributes: ["id", "userId", "playerId", "betType", "bettingId", "beforePoint", "afterPoint", "marketId"],
            include: [
              {
                required: false,
                model: models.markets,
                as: "marketDetails",
                attributes: ["id",
                  "marketName",
                  "marketShortName",
                  "marketId",
                  "bookName",
                  "bookId",
                  "bookTotalValue",
                  "gameId"]
              },
              {
                required: true,
                model: models.players,
                as: "playerDetails",
                attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerListId", "playerName", "competitorId"],
                include: [
                  {
                    required: false,
                    model: models.sports,
                    as: "sportDetais",
                    attributes: ["id", "shortName", "name"]
                  },
                  {
                    required: true,
                    model: models.game,
                    as: "gameDetais",
                    where: { status: "A" },
                    attributes: ["id", "competitionId", "gameId", "startTime", "competitors1Id", "competitors1Name", "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber", "status"]
                  },
                  {
                    required: true,
                    model: models.playerList,
                    as: "playerDetais",
                    attributes: ["id", "profileImage", "playersId", "playerName"],
                  },
                ]
              }
            ]
          },
        ]
      })
      console.log(bettingList.length)
    } catch (e) {
      console.log("error in finding bet list", e.message)
    }
    // return false
    try {
      for (let i = 0; i < bettingList.length; i++) {
        console.log(typeof bettingList[i].dataValues.addedPlayers);
        // let gameSet = new Set();
        let winCount = 0;
        let playerCount = 0;
        for (let j = 0; j < bettingList[i].dataValues.addedPlayers.length; j++) {
          console.log("for");
          // const gameId = bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.gameId;
          // gameSet.add(gameId);
          // let findMarketDetails = await models.markets.findOne({
          //   where: { id: bettingList[i].dataValues.addedPlayers[j].dataValues.marketId },
          //   attributes: ["id", "bookTotalValue"]
          // })
          // console.log("rows...............", bettingList[i].dataValues.addedPlayers[j].dataValues.betType, bettingList[i].dataValues.addedPlayers[j].dataValues.marketId, bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.playersId)

          let findResult = await checkCurrentResult(bettingList[i].dataValues.addedPlayers[j].dataValues.marketId, bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.playersId)

          // if(findResult==0){
          let playerStat = await models.playerStatAfterMatch.findOne({
            where: {
              playersId: bettingList[i].dataValues.addedPlayers[j].dataValues.playerDetails.dataValues.playersId,
              gameId: bettingList[i].dataValues.addedPlayers[j].dataValues.marketDetails.dataValues.gameId
            }
          });
          // }
          if (playerStat) {
            if (playerStat.minutes == "00:00") {
              playerStat = null
            }
          }
          // console.log(playerStat)
          // return false
          if (playerStat && bettingList[i].dataValues.addedPlayers[j].dataValues.betType == "LESS") {
            console.log("less............")
            if (Number(findResult) < Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
              console.log("less............1")
              await models.bettingPlayers.update({
                afterPoint: findResult,
                result: true,
                status: "A"
              }, {
                where: {
                  id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
                }
              })
              winCount = winCount + 1
              playerCount = playerCount + 1
            } else if (playerStat && Number(findResult) > Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
              console.log("less............2")
              await models.bettingPlayers.update({
                afterPoint: findResult,
                result: false,
                status: "A"
              }, {
                where: {
                  id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
                }
              })
              playerCount = playerCount + 1
            } else {
              console.log("less............3")
              await models.bettingPlayers.update({
                afterPoint: findResult,
                result: true,
                status: "D"
              }, {
                where: {
                  id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
                }
              })
            }
          } else if (playerStat && bettingList[i].dataValues.addedPlayers[j].dataValues.betType == "MORE") {
            console.log("more............")
            // console.log("kjkjhfdkhjkiowejfdiojiokewiofr")
            if (Number(findResult) > Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
              await models.bettingPlayers.update({
                afterPoint: findResult,
                result: true,
                status: "A"
              }, {
                where: {
                  id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
                }
              })
              winCount = winCount + 1
              playerCount = playerCount + 1
            } else if (playerStat && Number(findResult) < Number(bettingList[i].dataValues.addedPlayers[j].dataValues.beforePoint)) {
              await models.bettingPlayers.update({
                afterPoint: findResult,
                result: false,
                status: "A"
              }, {
                where: {
                  id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
                }
              })
              playerCount = playerCount + 1
            } else {
              await models.bettingPlayers.update({
                afterPoint: findResult,
                result: true,
                status: "D"
              }, {
                where: {
                  id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
                }
              })
            }

          } else {
            // console.log("cancel............")
            await models.bettingPlayers.update({
              // afterPoint: findResult,
              result: true,
              status: "D"
            }, {
              where: {
                id: bettingList[i].dataValues.addedPlayers[j].dataValues.id
              }
            })
          }
        }
        let userBalance = await models.balance.findOne({
          where: { userId: bettingList[i].dataValues.userId }
        })
        // console.log(winCount, playerCount)
        // console.log("length", playerCount)
        if (playerCount == 0) {  // when it becomes 0 pick
          let availableBalance = Number(userBalance.availableBalance) + Number(bettingList[i].dataValues.entry)
          // console.log(decreseAmount)
          await models.balance.update({
            availableBalance: availableBalance
          }, {
            where: { id: userBalance.id }
          })

          await models.betResultRecord.update({
            winAmount: 0,
            result: "refund",
            betStatus: "DONE"
          }, {
            where: { betId: bettingList[i].dataValues.id }
          })

          await models.betting.update({
            winAmount: 0,
            result: "refund",
            resultDecleared: true,
          }, {
            where: { id: bettingList[i].dataValues.id }
          })

        } else {
          if (bettingList[i].dataValues.bettingDetais.dataValues.playType == "POWER PLAY") {
            let lossCount = playerCount - winCount
            // console.log(decreseAmount)
            if (playerCount == 1) {
            let availableBalance = Number(userBalance.availableBalance) + Number(bettingList[i].dataValues.entry)
              await models.balance.update({
                availableBalance: availableBalance
              }, {
                where: { id: userBalance.id }
              })

              await models.betResultRecord.update({
                winAmount: 0,
                result: "refund",
                betStatus: "DONE"
              }, {
                where: { betId: bettingList[i].dataValues.id }
              })

              await models.betting.update({
                winAmount: 0,
                result: "refund",
                resultDecleared: true,
              }, {
                where: { id: bettingList[i].dataValues.id }
              })
            }else{

            if (lossCount > 0) {  // loss
              // console.log("less...")
              await models.betting.update({
                resultDecleared: true,
                result: "loss",
                winCount: winCount
              }, {
                where: {
                  id: bettingList[i].dataValues.id
                }
              })

              // let winningMultiplex = await models.multiplexForEntry.findOne({
              //   where: { entryId: bettingList[i].dataValues.bettingDetais.dataValues.id, correctNeeded: winCount }
              // })

              let decreseAmount = Number(userBalance.depositMoney) - Number(bettingList[i].dataValues.entry)
              await models.balance.update({
                depositMoney: decreseAmount
              }, {
                where: { id: userBalance.id }
              })

              await models.betResultRecord.update({
                winAmount: 0,
                result: "loss",
                betStatus: "DONE"
              }, {
                where: { betId: bettingList[i].dataValues.id }
              })

            } else if (winCount != 0) {  //win
              console.log("win...")

              let findSetting = await models.settings.findOne({
                where: { playType: "POWER PLAY", entry: winCount }
              })
              let winningMultiplex
              if (findSetting) {
                winningMultiplex = await models.multiplexForEntry.findOne({
                  where: { entryId: findSetting.id, correctNeeded: winCount }
                })
              }

              let settingDetails
              let inBetSettingsCreate
              try {
                settingDetails = await models.settings.findOne({
                  where: { id: findSetting.id, status: "A" }
                })

                inBetSettingsCreate = await models.inBetSettings.create({
                  playType: settingDetails.playType,
                  entry: settingDetails.entry,
                })

                let multiplexDetails = await models.multiplexForEntry.findAll({
                  where: { entryId: findSetting.id }
                })

                for (let i = 0; i < multiplexDetails.length; i++) {
                  await models.inBetMultiplexForEntry.create({
                    entryId: inBetSettingsCreate.id,
                    correctNeeded: multiplexDetails[i].correctNeeded,
                    multiplex: multiplexDetails[i].multiplex,
                  })
                }

              } catch (e) {
                console.log("store old api")
              }

              await models.betting.update({
                resultDecleared: true,
                result: "win",
                winCount: winCount,
                bettingPlayType: findSetting.dataValues.id,
                preBettingPlayType: bettingList[i].dataValues.bettingPlayType,
                inBetPreBettingPlayType: bettingList[i].inBetbettingPlayType,
                inBetbettingPlayType: inBetSettingsCreate?.id
              }, {
                where: {
                  id: bettingList[i].dataValues.id
                }
              })

              // let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
              // let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
              let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex))
              let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex))

              await models.balance.update({
                depositMoney: increaseAmount,
                availableBalance: increaseAvailableAmount
              }, {
                where: { id: userBalance.id }
              })

              await models.betResultRecord.update({
                winAmount: (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)),
                result: "win",
                betStatus: "DONE"
              }, {
                where: { betId: bettingList[i].dataValues.id }
              })
            }
          }
          } else {
            // console.log("flex...", winCount)
            if (playerCount <= 2) {
              let availableBalance = Number(userBalance.availableBalance) + Number(bettingList[i].dataValues.entry)
                await models.balance.update({
                  availableBalance: availableBalance
                }, {
                  where: { id: userBalance.id }
                })
  
                await models.betResultRecord.update({
                  winAmount: 0,
                  result: "refund",
                  betStatus: "DONE"
                }, {
                  where: { betId: bettingList[i].dataValues.id }
                })
  
                await models.betting.update({
                  winAmount: 0,
                  result: "refund",
                  resultDecleared: true,
                }, {
                  where: { id: bettingList[i].dataValues.id }
                })
            }else{
            let findSetting = await models.settings.findOne({
              where: { playType: "FLEX PLAY", entry: playerCount, status: "A" }
            })
            let winningMultiplex
            if (findSetting) {
              winningMultiplex = await models.multiplexForEntry.findOne({
                where: { entryId: findSetting.id, correctNeeded: winCount }
              })
            }
            // console.log("lll", findSetting.id)
            // return false

            if (winningMultiplex && winningMultiplex.multiplex != 0) {  //win
              // console.log("jhguigiu", bettingList[i].dataValues.id)
              await models.betting.update({
                resultDecleared: true,
                result: "win",
                winCount: winCount,
                bettingPlayType: findSetting.dataValues.id,
                preBettingPlayType: bettingList[i].dataValues.bettingPlayType
              }, {
                where: {
                  id: bettingList[i].dataValues.id
                }
              })

              // console.log(Number(bettingList[i].dataValues.entry), Number(winningMultiplex.multiplex), (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))

              // let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
              // let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
              let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex))
              let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex))

              // console.log(increaseAvailableAmount)
              await models.balance.update({
                depositMoney: increaseAmount,
                availableBalance: increaseAvailableAmount
              }, {
                where: { id: userBalance.id }
              })

              console.log(":here")
              await models.betResultRecord.update({
                winAmount: (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)),
                result: "win",
                betStatus: "DONE"
              }, {
                where: { betId: bettingList[i].dataValues.id }
              })

            } else { // loss
              // console.log("loss....")
              let settingDetails
              let inBetSettingsCreate
              try {
                settingDetails = await models.settings.findOne({
                  where: { id: findSetting.id, status: "A" }
                })

                inBetSettingsCreate = await models.inBetSettings.create({
                  playType: settingDetails.playType,
                  entry: settingDetails.entry,
                })

                let multiplexDetails = await models.multiplexForEntry.findAll({
                  where: { entryId: findSetting.id }
                })

                for (let i = 0; i < multiplexDetails.length; i++) {
                  await models.inBetMultiplexForEntry.create({
                    entryId: inBetSettingsCreate.id,
                    correctNeeded: multiplexDetails[i].correctNeeded,
                    multiplex: multiplexDetails[i].multiplex,
                  })
                }

              } catch (e) {
                console.log("store old api")
              }

              await models.betting.update({
                resultDecleared: true,
                result: "loss",
                winCount: winCount,
                bettingPlayType: findSetting?.dataValues.id,
                preBettingPlayType: bettingList[i].dataValues.bettingPlayType,
                inBetPreBettingPlayType: bettingList[i].inBetbettingPlayType,
                inBetbettingPlayType: inBetSettingsCreate?.id
              }, {
                where: {
                  id: bettingList[i].dataValues.id
                }
              })

              let decreseAmount = Number(userBalance.depositMoney) - Number(bettingList[i].dataValues.entry)
              // console.log(decreseAmount)
              await models.balance.update({
                depositMoney: decreseAmount
              }, {
                where: { id: userBalance.id }
              })

              await models.betResultRecord.update({
                winAmount: 0,
                result: "loss",
                betStatus: "DONE"
              }, {
                where: { betId: bettingList[i].dataValues.id }
              })

            }
          }


          }
        }

        // const uniqueGameList = Array.from(gameSet);
        // console.log("Unique Game List:", uniqueGameList);

        // for(let j=0;j<uniqueGameList.length;j++){
        //     let config = {
        //         method: 'get',
        //         maxBodyLength: Infinity,
        //         url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sport_events/" + uniqueGameList[j] + "/players_props." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
        //         headers: {}
        //       };

        //       axios.request(config)
        //           .then(async (response) => {
        //             let allPlayer
        //             console.log(JSON.stringify(response.data));
        //             for (let i = 0; i < response.data.sport_event_players_props?.players_props?.length; i++) {

        //             }
        //         })
        // }
        console.log("Result decleared")
      }
      // return res.status(200).json({
      //   success: true,
      //   data: bettingList
      // });
    } catch (e) {
      console.log(e)
      // return res.status(500).json({
      //   success: false,
      //   data: e.message
      // });
    }
  })
}