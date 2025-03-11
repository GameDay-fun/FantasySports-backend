const models = require("../models");
const axios = require('axios');
const { Op } = require("sequelize");
const niv = require("node-input-validator");
const Sequelize = require('sequelize')
// from sporttrader
let minimumOddsValue=1.8

exports.sportraderSportsList = async (req, res) => {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sports." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
    headers: {}
  };

  axios.request(config)
    .then(async (response) => {
      let allSports
      // console.log(JSON.stringify(response.data));
      for (let i = 0; i < response.data.sports.length; i++) {
        let findSameSports
        try {
          findSameSports = await models.sports.findOne({
            where: { name: response.data.sports[i].name },
            attributes: ["id", "name"]
          })
        } catch (e) {
          return res.status(500).send({
            success: false,
            message: "error, in finding sports name",
            error: e.message
          });
        }
        if (findSameSports) {
          try {
            await models.sports.update({
              name: response.data.sports[i].name,
              sportsId: response.data.sports[i].id,
              type: response.data.sports[i].type,
            }, {
              where: { id: findSameSports.id }
            })
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in updating sports name",
              error: e.message
            });
          }
        } else {
          try {
            await models.sports.create({
              name: response.data.sports[i].name,
              sportsId: response.data.sports[i].id,
              type: response.data.sports[i].type,
            })
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in creating sports name",
              error: e.message
            });
          }
        }
        try {
          allSports = await models.sports.findAll({
            where: { status: "A" },
            attributes: ["id", "name", "shortName", "sportsId", "type"]
          })
        } catch (e) {
          return res.status(500).send({
            success: false,
            message: "error, in finding sports name",
            error: e.message
          });
        }
      }
      return res.status(200).send({
        success: true,
        message: "All Sports list",
        data: allSports
      });
    })
    .catch((error) => {
      console.log(error);
    });

}

exports.sportraderCompetitionList = async (req, res) => {
  let findSportDetails = await models.sports.findOne({
    where: { id: req.params.id }
  })
  if (findSportDetails.baseUrl != "") {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: findSportDetails.baseUrl + "/" + process.env.SPORTRADER_LOCALE + "/competitions." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
      headers: {}
    };

    axios.request(config)
      .then(async (response) => {
        let allCompetition
        // console.log(JSON.stringify(response.data));
        for (let i = 0; i < response.data.competitions.length; i++) {
          let findSameCompetition
          try {
            findSameCompetition = await models.competitions.findOne({
              where: { competitionsId: response.data.competitions[i].id },
              attributes: ["id", "competitionsId"]
            })
          } catch (e) {
            console.log(e)
            return res.status(500).send({
              success: false,
              message: "error, in finding competetion name",
              error: e.message
            });
          }
          if (findSameCompetition) {
            try {
              await models.competitions.update({
                sportsId: req.query.sportsId,
                sportsTableId: req.params.id,
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
              console.log(e)
              return res.status(500).send({
                success: false,
                message: "error, in updating competition name",
                error: e.message
              });
            }
          } else {
            try {
              await models.competitions.create({
                sportsTableId: req.params.id,
                sportsId: req.query.sportsId,
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
              console.log(e)
              return res.status(500).send({
                success: false,
                message: "error, in creating competition name",
                error: e.message
              });
            }
          }
        }
        try {
          allCompetition = await models.competitions.findAll({
            where: { status: "A", sportsTableId: req.params.id },
            attributes: ["id", "sportsId", "sportsTableId", "competitionsId", "name", "gender", "market", "futures", "playerProps", "categoryId", "categoryName", "categoryCountryCode"]
          })
        } catch (e) {
          console.log(e)
          return res.status(500).send({
            success: false,
            message: "error, in finding competition name",
            error: e.message
          });
        }
        return res.status(200).send({
          success: true,
          message: "All Competitions list",
          data: allCompetition
        });
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    console.log("else")
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sports/" + findSportDetails.sportsId + "/competitions." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
      headers: {}
    };

    axios.request(config)
      .then(async (response) => {
        let allCompetition
        // console.log(JSON.stringify(response.data));
        for (let i = 0; i < response.data.competitions.length; i++) {
          let findSameCompetition
          try {
            findSameCompetition = await models.competitions.findOne({
              where: { competitionsId: response.data.competitions[i].id },
              attributes: ["id", "competitionsId"]
            })
          } catch (e) {
            console.log("else...", e)
            return res.status(500).send({
              success: false,
              message: "error, in finding competetion name",
              error: e.message
            });
          }
          if (findSameCompetition) {
            try {
              await models.competitions.update({
                sportsId: req.query.sportsId,
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
              console.log("else...", e)
              return res.status(500).send({
                success: false,
                message: "error, in updating competition name",
                error: e.message
              });
            }
          } else {
            try {
              await models.competitions.create({
                sportsId: req.query.sportsId,
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
              console.log("else...", e)
              return res.status(500).send({
                success: false,
                message: "error, in creating competition name",
                error: e.message
              });
            }
          }
        }
        try {
          allCompetition = await models.competitions.findAll({
            where: { status: "A", sportsId: req.query.sportsId },
            attributes: ["id", "sportsId", "competitionsId", "name", "gender", "market", "futures", "playerProps", "categoryId", "categoryName", "categoryCountryCode"]
          })
        } catch (e) {
          console.log("else...", e)
          return res.status(500).send({
            success: false,
            message: "error, in finding competition name",
            error: e.message
          });
        }
        return res.status(200).send({
          success: true,
          message: "All Competitions list",
          data: allCompetition
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

exports.sportraderGameList = async (req, res) => {
  let findSportDetails = await models.sports.findOne({
    where: { id: req.params.id }
  })

  if (findSportDetails.baseUrl != "") {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;


    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: findSportDetails.baseUrl + "/" + process.env.SPORTRADER_LOCALE + "/schedules/" + formattedDate + "/summaries." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY2,
      headers: {}
      // can replace date with live
    };

    axios.request(config)
      .then(async (response) => {
        let allGames
        console.log(JSON.stringify(response.data));
        for (let i = 0; i < response.data.summaries.length; i++) {
          let findSameGame
          try {
            findSameGame = await models.game.findOne({
              where: { gameId: response.data.summaries[i].sport_event.id },
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
                // sportsId: findCompetition?.sportsId,
                sportsTableId: req.params.id,
                competitionId: response.data.summaries[i].sport_event?.sport_event_context?.competition?.id,
                gameId: response.data.summaries[i].sport_event.id,
                startTime: response.data.summaries[i].sport_event.start_time,
                startTimeConfirmed: response.data.summaries[i].sport_event.start_time_confirmed,
                competitors1Id: response.data.summaries[i].sport_event.competitors[0]?.id,
                competitors1Name: response.data.summaries[i].sport_event.competitors[0]?.name,
                competitors1Country: response.data.summaries[i].sport_event.competitors[0]?.country,
                competitors1CountryCode: response.data.summaries[i].sport_event.competitors[0]?.country_code,
                competitors1Abbreviation: response.data.summaries[i].sport_event.competitors[0]?.abbreviation,
                competitors1Qualifier: response.data.summaries[i].sport_event.competitors[0]?.qualifier,
                competitors1RotationNumber: response.data.summaries[i].sport_event.competitors[0]?.rotation_number,
                competitors2Id: response.data.summaries[i].sport_event.competitors[1]?.id,
                competitors2Name: response.data.summaries[i].sport_event.competitors[1]?.name,
                competitors2Country: response.data.summaries[i].sport_event.competitors[1]?.country,
                competitors2CountryCode: response.data.summaries[i].sport_event.competitors[1]?.country_code,
                competitors2Abbreviation: response.data.summaries[i].sport_event.competitors[1]?.abbreviation,
                competitors2Qualifier: response.data.summaries[i].sport_event.competitors[1]?.qualifier,
                competitors2RotationNumber: response.data.summaries[i].sport_event.competitors[1]?.rotation_number,
              }, {
                where: { id: findSameGame.id }
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in updating game name",
                error: e.message
              });
            }
          } else {
            try {
              await models.game.create({
                // sportsId: findCompetition?.sportsId,
                sportsTableId: req.params.id,
                competitionId: response.data.summaries[i].sport_event?.sport_event_context?.competition?.id,
                // competitionId: req.params.competitionId,
                gameId: response.data.summaries[i].sport_event.id,
                startTime: response.data.summaries[i].sport_event.start_time,
                startTimeConfirmed: response.data.summaries[i].sport_event.start_time_confirmed,
                competitors1Id: response.data.summaries[i].sport_event.competitors[0]?.id,
                competitors1Name: response.data.summaries[i].sport_event.competitors[0]?.name,
                competitors1Country: response.data.summaries[i].sport_event.competitors[0]?.country,
                competitors1CountryCode: response.data.summaries[i].sport_event.competitors[0]?.country_code,
                competitors1Abbreviation: response.data.summaries[i].sport_event.competitors[0]?.abbreviation,
                competitors1Qualifier: response.data.summaries[i].sport_event.competitors[0]?.qualifier,
                competitors1RotationNumber: response.data.summaries[i].sport_event.competitors[0]?.rotation_number,
                competitors2Id: response.data.summaries[i].sport_event.competitors[1]?.id,
                competitors2Name: response.data.summaries[i].sport_event.competitors[1]?.name,
                competitors2Country: response.data.summaries[i].sport_event.competitors[1]?.country,
                competitors2CountryCode: response.data.summaries[i].sport_event.competitors[1]?.country_code,
                competitors2Abbreviation: response.data.summaries[i].sport_event.competitors[1]?.abbreviation,
                competitors2Qualifier: response.data.summaries[i].sport_event.competitors[1]?.qualifier,
                competitors2RotationNumber: response.data.summaries[i].sport_event.competitors[1]?.rotation_number,
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in creating game name",
                error: e.message
              });
            }
          }
        }

        try {
          allGames = await models.game.findAll({
            where: { status: "A", sportsTableId: req.params.id },
            attributes: ["id", "sportsId", "competitionId", "sportsTableId", "gameId", "startTime", "startTimeConfirmed", "competitors1Id", "competitors1Name", "competitors1Country", "competitors1CountryCode",
              "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Country", "competitors2CountryCode", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber"]
          })
        } catch (e) {
          return res.status(500).send({
            success: false,
            message: "error, in finding competition name",
            error: e.message
          });
        }

        return res.status(200).send({
          success: true,
          message: "All Competitions list",
          data: allGames
        });
      })
      .catch((error) => {
        console.log(error);
      });
  } else {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/competitions/" + req.query.competitionId + "/schedules." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
      headers: {}
    };

    let findCompetition
    try {
      findCompetition = await models.competitions.findOne({
        where: {
          competitionsId: req.query.competitionId
        },
        attributes: ["id", "sportsId"]
      })
    } catch (e) {
      return res.status(500).send({
        success: false,
        message: "error, in finding sports name",
        error: e.message
      });
    }

    axios.request(config)
      .then(async (response) => {
        let allGames
        console.log(JSON.stringify(response.data));
        for (let i = 0; i < response.data.schedules.length; i++) {
          let findSameGame
          try {
            findSameGame = await models.game.findOne({
              where: { gameId: response.data.schedules[i].sport_event.id },
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
                sportsTableId: findCompetition?.sportsId,
                sportsId: findCompetition?.sportsId,
                competitionId: req.query.competitionId,
                gameId: response.data.schedules[i].sport_event.id,
                startTime: response.data.schedules[i].sport_event.start_time,
                startTimeConfirmed: response.data.schedules[i].sport_event.start_time_confirmed,
                competitors1Id: response.data.schedules[i].sport_event.competitors[0]?.id,
                competitors1Name: response.data.schedules[i].sport_event.competitors[0]?.name,
                competitors1Country: response.data.schedules[i].sport_event.competitors[0]?.country,
                competitors1CountryCode: response.data.schedules[i].sport_event.competitors[0]?.country_code,
                competitors1Abbreviation: response.data.schedules[i].sport_event.competitors[0]?.abbreviation,
                competitors1Qualifier: response.data.schedules[i].sport_event.competitors[0]?.qualifier,
                competitors1RotationNumber: response.data.schedules[i].sport_event.competitors[0]?.rotation_number,
                competitors2Id: response.data.schedules[i].sport_event.competitors[1]?.id,
                competitors2Name: response.data.schedules[i].sport_event.competitors[1]?.name,
                competitors2Country: response.data.schedules[i].sport_event.competitors[1]?.country,
                competitors2CountryCode: response.data.schedules[i].sport_event.competitors[1]?.country_code,
                competitors2Abbreviation: response.data.schedules[i].sport_event.competitors[1]?.abbreviation,
                competitors2Qualifier: response.data.schedules[i].sport_event.competitors[1]?.qualifier,
                competitors2RotationNumber: response.data.schedules[i].sport_event.competitors[1]?.rotation_number,
              }, {
                where: { id: findSameGame.id }
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in updating game name",
                error: e.message
              });
            }
          } else {
            try {
              // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[0])
              // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[1])
              await models.game.create({
                sportsTableId: findCompetition?.sportsId,
                sportsId: findCompetition?.sportsId,
                competitionId: req.query.competitionId,
                gameId: response.data.schedules[i].sport_event.id,
                startTime: response.data.schedules[i].sport_event.start_time,
                startTimeConfirmed: response.data.schedules[i].sport_event.start_time_confirmed,
                competitors1Id: response.data.schedules[i].sport_event.competitors[0]?.id,
                competitors1Name: response.data.schedules[i].sport_event.competitors[0]?.name,
                competitors1Country: response.data.schedules[i].sport_event.competitors[0]?.country,
                competitors1CountryCode: response.data.schedules[i].sport_event.competitors[0]?.country_code,
                competitors1Abbreviation: response.data.schedules[i].sport_event.competitors[0]?.abbreviation,
                competitors1Qualifier: response.data.schedules[i].sport_event.competitors[0]?.qualifier,
                competitors1RotationNumber: response.data.schedules[i].sport_event.competitors[0]?.rotation_number,
                competitors2Id: response.data.schedules[i].sport_event.competitors[1]?.id,
                competitors2Name: response.data.schedules[i].sport_event.competitors[1]?.name,
                competitors2Country: response.data.schedules[i].sport_event.competitors[1]?.country,
                competitors2CountryCode: response.data.schedules[i].sport_event.competitors[1]?.country_code,
                competitors2Abbreviation: response.data.schedules[i].sport_event.competitors[1]?.abbreviation,
                competitors2Qualifier: response.data.schedules[i].sport_event.competitors[1]?.qualifier,
                competitors2RotationNumber: response.data.schedules[i].sport_event.competitors[1]?.rotation_number,
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in creating game name",
                error: e.message
              });
            }
          }
        }

        try {
          allGames = await models.game.findAll({
            where: { status: "A", competitionId: req.query.competitionId },
            attributes: ["id", "sportsId", "competitionId", "gameId", "startTime", "startTimeConfirmed", "competitors1Id", "competitors1Name", "competitors1Country", "competitors1CountryCode",
              "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Country", "competitors2CountryCode", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber"]
          })
        } catch (e) {
          return res.status(500).send({
            success: false,
            message: "error, in finding competition name",
            error: e.message
          });
        }

        return res.status(200).send({
          success: true,
          message: "All Competitions list",
          data: allGames
        });
      })
      .catch((error) => {
        console.log(error);
      });
  }
}

exports.sportraderPlayerList = async (req, res) => {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sport_events/" + req.params.gameId + "/players_props." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
    headers: {}
  };

  let findGame
  try {
    findGame = await models.game.findOne({
      where: {
        gameId: req.params.gameId
      },
      attributes: ["id", "sportsId", "competitionId", "gameId", "sportsTableId"]
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding game details",
      error: e.message
    });
  }

  axios.request(config)
    .then(async (response) => {
      let allPlayer
      console.log(JSON.stringify(response.data));
      for (let i = 0; i < response.data.sport_event_players_props?.players_props?.length; i++) {
        let findSamePlayerDetails
        let addedPlayerId
        try {
          findSamePlayerDetails = await models.playerList.findOne({
            where: { playersId: response.data.sport_event_players_props.players_props[i].player.id },
            attributes: ["id", "playerName"]
          })
        } catch (e) {
          return res.status(500).send({
            success: false,
            message: "error, in finding player name",
            error: e.message
          });
        }
        if (findSamePlayerDetails) {
          addedPlayerId = findSamePlayerDetails.id
          try {
            await models.playerList.update({
              playersId: response.data.sport_event_players_props.players_props[i].player.id,
              playerName: response.data.sport_event_players_props.players_props[i].player.name,
              sportsId: findGame.sportsId,
              sportsTableId: findGame.sportsTableId,
            }, {
              where: { id: findSamePlayerDetails.id }
            })
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in updating player name",
              error: e.message
            });
          }
        } else {
          try {
            let createdPlayerList = await models.playerList.create({
              playersId: response.data.sport_event_players_props.players_props[i].player.id,
              playerName: response.data.sport_event_players_props.players_props[i].player.name,
              sportsId: findGame.sportsId,
              sportsTableId: findGame.sportsTableId,
            })
            addedPlayerId = createdPlayerList.id
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in creating player",
              error: e.message
            });
          }
        }

        let findSamePlayer
        try {
          findSamePlayer = await models.players.findOne({
            where: { playersId: response.data.sport_event_players_props.players_props[i].player.id, gameId: response.data.sport_event_players_props.sport_event.id },
            attributes: ["id", "playersId", "gameId"]
          })
        } catch (e) {
          return res.status(500).send({
            success: false,
            message: "error, in finding player name",
            error: e.message
          });
        }
        if (findSamePlayer) {
          try {
            await models.players.update({
              sportsTableId: findGame.sportsTableId,
              sportsId: findGame.sportsId,
              competitionId: findGame.competitionId,
              gameId: req.params.gameId,
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
                  if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && findGame.sportsId == "sr:sport:4")) {
                    let findMarket = await models.markets.findOne({
                      where: {
                        gameId: req.params.gameId,
                        playersId: response.data.sport_event_players_props.players_props[i].player.id,
                        competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                        bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                        marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                        playerTableId: findSamePlayer.id,
                      }
                    })
                    if (findMarket) {
                      await models.markets.update({
                        sportsTableId: findGame.sportsTableId,
                        sportsId: findGame.sportsId,
                        competitionId: findGame.competitionId,
                        gameId: req.params.gameId,
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
                        oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].odds_decimal,
                        books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                        playerTableId: findSamePlayer.id,
                      }, {
                        where: {
                          id: findMarket.id
                        }
                      })
                    } else {
                      await models.markets.create({
                        sportsTableId: findGame.sportsTableId,
                        sportsId: findGame.sportsId,
                        competitionId: findGame.competitionId,
                        gameId: req.params.gameId,
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
                        oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].odds_decimal,
                        books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                        playerTableId: findSamePlayer.id,
                      })
                    }
                  }
                }

                if (isMarketPresent == false && k == 0) {
                  if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && findGame.sportsId == "sr:sport:4")) {
                    let findMarket = await models.markets.findOne({
                      where: {
                        gameId: req.params.gameId,
                        playersId: response.data.sport_event_players_props.players_props[i].player.id,
                        competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                        bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                        marketId: response.data.sport_event_players_props.players_props[i].markets[j].id,
                        playerTableId: findSamePlayer.id,
                      }
                    })
                    if (findMarket) {
                      await models.markets.update({
                        sportsTableId: findGame.sportsTableId,
                        sportsId: findGame.sportsId,
                        competitionId: findGame.competitionId,
                        gameId: req.params.gameId,
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
                        oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].odds_decimal,
                        books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                        playerTableId: findSamePlayer.id,
                      }, {
                        where: {
                          id: findMarket.id
                        }
                      })
                    } else {
                      await models.markets.create({
                        sportsTableId: findGame.sportsTableId,
                        sportsId: findGame.sportsId,
                        competitionId: findGame.competitionId,
                        gameId: req.params.gameId,
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
                        oddsDecimal: response.data.sport_event_players_props.players_props[i].markets[j].books[k].outcomes[0].odds_decimal,
                        books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                        playerTableId: findSamePlayer.id,
                      })
                    }
                  }
                }

              }
            }
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in updating player name",
              error: e.message
            });
          }
        } else {
          try {
            let playerCreate = await models.players.create({
              sportsTableId: findGame.sportsTableId,
              sportsId: findGame.sportsId,
              competitionId: findGame.competitionId,
              gameId: req.params.gameId,
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
                if (isMarketPresent == true && response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "FanDuel" || response.data.sport_event_players_props.players_props[i].markets[j].books[k].name == "DraftKings") {
                  if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && findGame.sportsId == "sr:sport:4")) {

                    await models.markets.create({
                      sportsTableId: findGame.sportsTableId,
                      sportsId: findGame.sportsId,
                      competitionId: findGame.competitionId,
                      gameId: req.params.gameId,
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
                      playerTableId: playerCreate.id,
                    })
                  }
                } else if (k == 0) {
                  if (!(response.data.sport_event_players_props.players_props[i].markets[j].name == "total power play points (incl. extra overtime)" && findGame.sportsId == "sr:sport:4")) {

                    await models.markets.create({
                      sportsTableId: findGame.sportsTableId,
                      sportsId: findGame.sportsId,
                      competitionId: findGame.competitionId,
                      gameId: req.params.gameId,
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
                      playerTableId: playerCreate.id,
                    })
                  }
                }
              }
            }
            // return false
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in creating player",
              error: e.message
            });
          }
        }
        // return false
      }
      //soccer
      // console.log("here...",response.data.sport_event_players_props?.players_props )
      if (!response.data.sport_event_players_props?.players_props || response.data.sport_event_players_props?.players_props?.length == 0) {
        console.log("length 0")
        for (let i = 0; i < response.data.sport_event_players_props?.players_markets?.markets?.length; i++) {
          if (response.data.sport_event_players_props?.players_markets?.markets?.name != "last goalscorer" || response.data.sport_event_players_props?.players_markets?.markets?.name != "anytime goalscorer") {
            for (let j = 0; j < response.data.sport_event_players_props?.players_markets?.markets[i]?.books?.length; j++) {
              console.log("response.data.sport_event_players_props?.players_markets?.markets[i]?.books", response.data.sport_event_players_props?.players_markets?.markets[i]?.name)
              for (let k = 0; k < response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes?.length; k++) {

                let addedPlayerId
                let findSamePlayerDetails
                console.log(response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k])
                if (response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k] && response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id) {
                  console.log("if", response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id)
                  try {
                    findSamePlayerDetails = await models.playerList.findOne({
                      where: { playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id },
                      attributes: ["id", "playerName"]
                    })
                  } catch (e) {
                    return res.status(500).send({
                      success: false,
                      message: "error, in finding player name",
                      error: e.message
                    });
                  }
                  if (findSamePlayerDetails) {
                    addedPlayerId = findSamePlayerDetails.id
                    try {
                      await models.playerList.update({
                        playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                        playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
                        sportsId: findGame.sportsId,
                        sportsTableId: findGame.sportsTableId,
                      }, {
                        where: { id: findSamePlayerDetails.id }
                      })
                    } catch (e) {
                      return res.status(500).send({
                        success: false,
                        message: "error, in updating player name",
                        error: e.message
                      });
                    }
                  } else {
                    try {
                      let createdPlayerList = await models.playerList.create({
                        playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                        playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
                        sportsId: findGame.sportsId,
                        sportsTableId: findGame.sportsTableId,
                      })
                      addedPlayerId = createdPlayerList.id
                    } catch (e) {
                      console.log("e", e)
                      return res.status(500).send({
                        success: false,
                        message: "error, in creating player",
                        error: e.message
                      });
                    }
                  }



                  let findSamePlayer
                  try {
                    findSamePlayer = await models.players.findOne({
                      where: { playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id, gameId: response.data.sport_event_players_props.sport_event.id },
                      attributes: ["id", "playersId", "gameId"]
                    })
                  } catch (e) {
                    return res.status(500).send({
                      success: false,
                      message: "error, in finding player name",
                      error: e.message
                    });
                  }
                  if (findSamePlayer) {
                    try {
                      await models.players.update({
                        sportsTableId: findGame.sportsTableId,
                        sportsId: findGame.sportsId,
                        competitionId: findGame.competitionId,
                        gameId: req.params.gameId,
                        startTime: response.data.sport_event_players_props.sport_event.start_time,
                        playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                        playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
                        // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                        // markets: response.data.sport_event_players_props.players_props[i].markets,
                        playerListId: addedPlayerId,
                      }, {
                        where: { id: findSamePlayer.id }
                      })

                      // for (let jj = 0; jj < response.data.sport_event_players_props.players_props[i].markets.length; jj++) {
                      //   for (let kk = 0; kk < response.data.sport_event_players_props.players_props[i].markets[j].books.length; kk++) {
                      //     console.log("market name", response.data.sport_event_players_props.players_props[i].markets[j].books[k].name)
                      // return false
                      //   }
                      // }
                      console.log("market name..........", response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name)
                      if (response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "FanDuel" || response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "DraftKings") {
                        let findMarket = await models.markets.findOne({
                          where: {
                            gameId: req.params.gameId,
                            playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                            // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
                            marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
                            playerTableId: findSamePlayer.id,
                          }
                        })
                        if (findMarket) {
                          await models.markets.update({
                            sportsTableId: findGame.sportsTableId,
                            sportsId: findGame.sportsId,
                            competitionId: findGame.competitionId,
                            gameId: req.params.gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                            playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
                            // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
                            marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
                            bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
                            bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
                            bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
                            oddsDecimal: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k]?.odds_decimal,
                            // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: findSamePlayer.id,
                          }, {
                            where: {
                              id: findMarket.id
                            }
                          })
                        } else {
                          await models.markets.create({
                            sportsTableId: findGame.sportsTableId,
                            sportsId: findGame.sportsId,
                            competitionId: findGame.competitionId,
                            gameId: req.params.gameId,
                            startTime: response.data.sport_event_players_props.sport_event.start_time,
                            playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                            playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
                            // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                            // markets: response.data.sport_event_players_props.players_props[i].markets,
                            playerListId: addedPlayerId,
                            marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
                            marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
                            bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
                            bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
                            bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
                            oddsDecimal: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k]?.odds_decimal,
                            // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                            playerTableId: findSamePlayer.id,
                          })
                        }
                        // }
                        // }
                      }
                    } catch (e) {
                      return res.status(500).send({
                        success: false,
                        message: "error, in updating player name",
                        error: e.message
                      });
                    }
                  } else {
                    try {
                      let playerCreate = await models.players.create({
                        sportsTableId: findGame.sportsTableId,
                        sportsId: findGame.sportsId,
                        competitionId: findGame.competitionId,
                        gameId: req.params.gameId,
                        startTime: response.data.sport_event_players_props.sport_event.start_time,
                        playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                        playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
                        // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                        // markets: response.data.sport_event_players_props.players_props[i].markets,
                        playerListId: addedPlayerId
                      })
                      if (response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "FanDuel" || response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name == "DraftKings") {
                        await models.markets.create({

                          sportsTableId: findGame.sportsTableId,
                          sportsId: findGame.sportsId,
                          competitionId: findGame.competitionId,
                          gameId: req.params.gameId,
                          startTime: response.data.sport_event_players_props.sport_event.start_time,
                          playersId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id,
                          playerName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_name,
                          // competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                          // markets: response.data.sport_event_players_props.players_props[i].markets,
                          playerListId: addedPlayerId,
                          marketName: response.data.sport_event_players_props?.players_markets?.markets[i]?.name,
                          marketId: response.data.sport_event_players_props?.players_markets?.markets[i]?.id,
                          bookName: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].name,
                          bookId: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].id,
                          bookTotalValue: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k].open_odds_decimal,
                          oddsDecimal: response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j].outcomes[k]?.odds_decimal,
                          // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                          playerTableId: playerCreate.id
                        })
                      }
                    } catch (e) {
                      console.log("eee", e)
                      return res.status(500).send({
                        success: false,
                        message: "error, in creating player",
                        error: e.message
                      });
                    }
                  }
                }
                else {
                  console.log("response.data.sport_event_players_props?.players_markets?.markets[i]?.books[j]?.outcomes[k].player_id")
                }
              }
            }
          }
        }
      }
      try {
        allPlayer = await models.players.findAll({
          where: { status: "A", gameId: req.params.gameId },
          attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerName", "competitorId", "markets", "startTime", "playerListId"]
        })
      } catch (e) {
        return res.status(500).send({
          success: false,
          message: "error, in finding player details",
          error: e.message
        });
      }
      return res.status(200).send({
        success: true,
        message: "All Players list",
        data: allPlayer,
        api: response.data
      });

    })
    .catch((error) => {
      console.log(error);
    });

}

exports.sportraderAllListFrom = async (req, res) => {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sports/" + req.params.sportsId + "/competitions." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
    headers: {}
  };

  axios.request(config)
    .then(async (response) => {
      let allCompetition
      console.log(JSON.stringify(response.data));
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
              sportsId: req.params.sportsId,
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
              sportsId: req.params.sportsId,
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
        let gameConfig = {
          method: 'get',
          maxBodyLength: Infinity,
          url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/competitions/" + response.data.competitions[i].id + "/schedules." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
          headers: {}
        };
        axios.request(gameConfig)
          .then(async (gameResponse) => {
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
                    sportsId: req.params.sportsId,
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
                  // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[0])
                  // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[1])
                  await models.game.create({
                    sportsId: req.params.sportsId,
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
      }
      try {
        allCompetition = await models.game.findAll({
          where: { status: "A", sportsId: req.params.sportsId },
          attributes: ["id", "sportsId", "competitionId", "gameId", "startTime", "startTimeConfirmed", "competitors1Id", "competitors1Name", "competitors1Country", "competitors1CountryCode",
            "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Country", "competitors2CountryCode", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber"],
          order: [["startTime", "DESC"]],
        })
      } catch (e) {
        return res.status(500).send({
          success: false,
          message: "error, in finding competition name",
          error: e.message
        });
      }
      return res.status(200).send({
        success: true,
        message: "All Competitions list",
        data: allCompetition
      });
    })
    .catch((error) => {
      console.log(error);
    });

}

exports.sportraderPlayerCompetitionId = async (req, res) => {
  let findAllCompetition
  try {
    findAllCompetition = await models.game.findAll({
      where: {
        competitionId: req.params.competitionId,
        startTime: { [Op.gte]: new Date() }
      }
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding games",
      error: e.message
    });
  }
  console.log(findAllCompetition)
  return false
  for (let i = 0; i < req.body.findAllCompetition.length; i++) {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: process.env.SPORTRADER_BASE_URL + process.env.SPORTRADER_LOCALE + "/sport_events/" + findAllCompetition[i].gameId + "/players_props." + process.env.SPORTRADER_FORMAT + "?api_key=" + process.env.SPORTRADER_API_KEY,
      headers: {}
    };

    axios.request(config)
      .then(async (response) => {
        let allPlayer
        console.log(JSON.stringify(response.data));
        for (let i = 0; i < response.data.sport_event_players_props?.players_props?.length; i++) {
          let findSamePlayerDetails
          let addedPlayerId
          try {
            findSamePlayerDetails = await models.playerList.findOne({
              where: { playersId: response.data.sport_event_players_props.players_props[i].player.id },
              attributes: ["id", "playerName"]
            })
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in finding player name",
              error: e.message
            });
          }
          if (findSamePlayerDetails) {
            addedPlayerId = findSamePlayerDetails.id
            try {
              await models.playerList.update({
                playersId: response.data.sport_event_players_props.players_props[i].player.id,
                playerName: response.data.sport_event_players_props.players_props[i].player.name,
                sportsId: findAllCompetition[i].sportsId,
                sportsTableId: findAllCompetition[i].sportsTableId,
              }, {
                where: { id: findSamePlayerDetails.id }
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in updating player name",
                error: e.message
              });
            }
          } else {
            try {
              let createdPlayerList = await models.playerList.create({
                playersId: response.data.sport_event_players_props.players_props[i].player.id,
                playerName: response.data.sport_event_players_props.players_props[i].player.name,
                sportsId: findAllCompetition[i].sportsId,
                sportsTableId: findAllCompetition[i].sportsTableId,
              })
              addedPlayerId = createdPlayerList.id
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in creating player",
                error: e.message
              });
            }
          }

          let findSamePlayer
          try {
            findSamePlayer = await models.players.findOne({
              where: { playersId: response.data.sport_event_players_props.players_props[i].player.id, gameId: response.data.sport_event_players_props.sport_event.id },
              attributes: ["id", "playersId", "gameId"]
            })
          } catch (e) {
            return res.status(500).send({
              success: false,
              message: "error, in finding player name",
              error: e.message
            });
          }
          if (findSamePlayer) {
            try {
              await models.players.update({
                sportsTableId: findAllCompetition[i].sportsTableId,
                sportsId: findAllCompetition[i].sportsId,
                competitionId: findAllCompetition[i].competitionId,
                gameId: req.params.gameId,
                startTime: response.data.sport_event_players_props.sport_event.start_time,
                playersId: response.data.sport_event_players_props.players_props[i].player.id,
                playerName: response.data.sport_event_players_props.players_props[i].player.name,
                competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                markets: response.data.sport_event_players_props.players_props[i].markets,
                playerListId: addedPlayerId,
              }, {
                where: { id: findSamePlayer.id }
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in updating player name",
                error: e.message
              });
            }
          } else {
            try {
              await models.players.create({
                sportsTableId: findAllCompetition[i].sportsTableId,
                sportsId: findAllCompetition[i].sportsId,
                competitionId: findAllCompetition[i].competitionId,
                gameId: req.params.gameId,
                startTime: response.data.sport_event_players_props.sport_event.start_time,
                playersId: response.data.sport_event_players_props.players_props[i].player.id,
                playerName: response.data.sport_event_players_props.players_props[i].player.name,
                competitorId: response.data.sport_event_players_props.players_props[i].player.competitor_id,
                markets: response.data.sport_event_players_props.players_props[i].markets,
                playerListId: addedPlayerId
              })
            } catch (e) {
              return res.status(500).send({
                success: false,
                message: "error, in creating player",
                error: e.message
              });
            }
          }
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }

  try {
    allPlayer = await models.players.findAll({
      where: { status: "A", gameId: findAllCompetition.gameId },
      attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerName", "competitorId", "markets", "startTime", "playerListId"]
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding player details",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Players list",
    data: allPlayer
  });

}

exports.playerListMMA = async (req, res) => {
  console.log("jkhjj")
  let keyForMMA = "mma_mixed_martial_arts"
  console.log(keyForMMA)
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: process.env.ODDS_API_BASE_URL + "/sports/" + keyForMMA + "/odds/?apiKey=" + process.env.ODDS_API_API_KEY + "&regions=us&markets=h2h",
    headers: {}
  };

  console.log(config)
  axios.request(config)
    .then(async (response) => {
      let allPlayer
      console.log(JSON.stringify(response.data));
      for (let i = 0; i < response.data?.length; i++) {
        let findSameGame
        try {
          findSameGame = await models.game.findOne({
            where: { status: "A", gameId: response.data[i].id },
            attributes: ["id", "gameId"]
          })
        } catch (e) {
          console.log(e)
          return res.status(500).send({
            success: false,
            message: "error, in finding player name",
            error: e.message
          });
        }
        if (findSameGame) {
          try {
            await models.game.update({
              sportsId: "sr:sport:117",
              // competitionId: response.data.competitions[i].id,
              gameId: response.data[i].id,
              startTime: response.data[i].commence_time,
              // startTimeConfirmed: gameResponse.data.schedules[j].sport_event.start_time_confirmed,
              // competitors1Id: gameResponse.data.schedules[j].sport_event.competitors[0]?.id,
              competitors1Name: response.data[i].home_team,
              // competitors1Country: gameResponse.data.schedules[j].sport_event.competitors[0]?.country,
              // competitors1CountryCode: gameResponse.data.schedules[j].sport_event.competitors[0]?.country_code,
              // competitors1Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[0]?.abbreviation,
              // competitors1Qualifier: gameResponse.data.schedules[j].sport_event.competitors[0]?.qualifier,
              // competitors1RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[0]?.rotation_number,
              // competitors2Id: gameResponse.data.schedules[j].sport_event.competitors[1]?.id,
              competitors2Name: response.data[i].away_team,
              // competitors2Country: gameResponse.data.schedules[j].sport_event.competitors[1]?.country,
              // competitors2CountryCode: gameResponse.data.schedules[j].sport_event.competitors[1]?.country_code,
              // competitors2Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[1]?.abbreviation,
              // competitors2Qualifier: gameResponse.data.schedules[j].sport_event.competitors[1]?.qualifier,
              // competitors2RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[1]?.rotation_number,
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
            // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[0])
            // console.log("response.data.schedules[i].sport_event",response.data.schedules[i].sport_event.competitors[1])
            await models.game.create({
              sportsId: "sr:sport:117",
              // competitionId: response.data.competitions[i].id,
              gameId: response.data[i].id,
              startTime: response.data[i].commence_time,
              // startTimeConfirmed: gameResponse.data.schedules[j].sport_event.start_time_confirmed,
              // competitors1Id: gameResponse.data.schedules[j].sport_event.competitors[0]?.id,
              competitors1Name: response.data[i].home_team,
              // competitors1Country: gameResponse.data.schedules[j].sport_event.competitors[0]?.country,
              // competitors1CountryCode: gameResponse.data.schedules[j].sport_event.competitors[0]?.country_code,
              // competitors1Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[0]?.abbreviation,
              // competitors1Qualifier: gameResponse.data.schedules[j].sport_event.competitors[0]?.qualifier,
              // competitors1RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[0]?.rotation_number,
              // competitors2Id: gameResponse.data.schedules[j].sport_event.competitors[1]?.id,
              competitors2Name: response.data[i].away_team,
              // competitors2Country: gameResponse.data.schedules[j].sport_event.competitors[1]?.country,
              // competitors2CountryCode: gameResponse.data.schedules[j].sport_event.competitors[1]?.country_code,
              // competitors2Abbreviation: gameResponse.data.schedules[j].sport_event.competitors[1]?.abbreviation,
              // competitors2Qualifier: gameResponse.data.schedules[j].sport_event.competitors[1]?.qualifier,
              // competitors2RotationNumber: gameResponse.data.schedules[j].sport_event.competitors[1]?.rotation_number,
            })
          } catch (e) {
            console.log(e)
            return res.status(500).send({
              success: false,
              message: "error, in creating competetion name",
              error: e.message
            });
          }
        }

        for (let j = 0; j < response.data[i].bookmakers.length; j++) {
          if (response.data[i].bookmakers[j].key == "fanduel" || response.data[i].bookmakers[j].key == "draftkings") {
            for (let k = 0; k < response.data[i].bookmakers[j]?.markets[0]?.outcomes?.length; k++) {

              let findSamePlayerDetails
              let addedPlayerId
              try {
                findSamePlayerDetails = await models.playerList.findOne({
                  where: { playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name },
                  attributes: ["id", "playerName"]
                })
              } catch (e) {
                return res.status(500).send({
                  success: false,
                  message: "error, in finding player name",
                  error: e.message
                });
              }

              if (findSamePlayerDetails) {
                addedPlayerId = findSamePlayerDetails.id
                try {
                  await models.playerList.update({
                    playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    sportsId: "sr:sport:117",
                    sportsTableId: 7,
                  }, {
                    where: { id: findSamePlayerDetails.id }
                  })
                } catch (e) {
                  console.log("e", e)
                  return res.status(500).send({
                    success: false,
                    message: "error, in updating player name",
                    error: e.message
                  });
                }
              } else {
                try {
                  let createdPlayerList = await models.playerList.create({
                    playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    sportsId: "sr:sport:117",
                    sportsTableId: 7,
                  })
                  addedPlayerId = createdPlayerList.id
                } catch (e) {
                  return res.status(500).send({
                    success: false,
                    message: "error, in creating player",
                    error: e.message
                  });
                }
              }


              let findSamePlayer
              try {
                findSamePlayer = await models.players.findOne({
                  where: { playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name, gameId: response.data[i].id },
                  attributes: ["id", "playersId", "gameId"]
                })
              } catch (e) {
                return res.status(500).send({
                  success: false,
                  message: "error, in finding player name",
                  error: e.message
                });
              }
              if (findSamePlayer) {
                try {
                  await models.players.update({
                    sportsTableId: 7,
                    sportsId: "sr:sport:117",
                    // competitionId: findGame.competitionId,
                    gameId: response.data[i].id,
                    startTime: response.data[i].commence_time,
                    playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    // markets: response.data.sport_event_players_props.players_props[i].markets,
                    playerListId: addedPlayerId,
                  }, {
                    where: { id: findSamePlayer.id }
                  })

                  let findMarket = await models.markets.findOne({
                    where: {
                      gameId: response.data[i].id,
                      playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      // bookId: response.data.sport_event_players_props.players_props[i].markets[j].books[k].id,
                      marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
                      playerTableId: findSamePlayer.id,
                    }
                  })
                  if (findMarket) {
                    await models.markets.update({
                      sportsTableId: 7,
                      sportsId: "sr:sport:117",
                      // competitionId: findGame.competitionId,
                      gameId: response.data[i].id,
                      startTime: response.data[i].commence_time,
                      playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      // markets: response.data.sport_event_players_props.players_props[i].markets,
                      playerListId: addedPlayerId,
                      marketName: response.data[i].bookmakers[j]?.markets[0]?.key,
                      marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
                      bookName: response.data[i].bookmakers[j]?.key,
                      bookId: response.data[i].bookmakers[j]?.key,
                      bookTotalValue: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k].price,
                      // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                      playerTableId: findSamePlayer.id,
                    }, {
                      where: {
                        id: findMarket.id
                      }
                    })
                  } else {
                    await models.markets.create({
                      sportsTableId: 7,
                      sportsId: "sr:sport:117",
                      // competitionId: findGame.competitionId,
                      gameId: response.data[i].id,
                      startTime: response.data[i].commence_time,
                      playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                      // markets: response.data.sport_event_players_props.players_props[i].markets,
                      playerListId: addedPlayerId,
                      marketName: response.data[i].bookmakers[j]?.markets[0]?.key,
                      marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
                      bookName: response.data[i].bookmakers[j]?.key,
                      bookId: response.data[i].bookmakers[j]?.key,
                      bookTotalValue: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k].price,
                      // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                      playerTableId: findSamePlayer.id
                    })
                  }
                } catch (e) {
                  console.log("ee", e)
                  return res.status(500).send({
                    success: false,
                    message: "error, in updating player name",
                    error: e.message
                  });
                }
              } else {
                try {
                  let newCreatedPlayer = await models.players.create({
                    sportsTableId: 7,
                    sportsId: "sr:sport:117",
                    // competitionId: findGame.competitionId,
                    gameId: response.data[i].id,
                    startTime: response.data[i].commence_time,
                    playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    // markets: response.data.sport_event_players_props.players_props[i].markets,
                    playerListId: addedPlayerId,
                  })

                  await models.markets.create({
                    sportsTableId: 7,
                    sportsId: "sr:sport:117",
                    // competitionId: findGame.competitionId,
                    gameId: response.data[i].id,
                    startTime: response.data[i].commence_time,
                    playersId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    playerName: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    competitorId: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k]?.name,
                    // markets: response.data.sport_event_players_props.players_props[i].markets,
                    playerListId: addedPlayerId,
                    marketName: response.data[i].bookmakers[j]?.markets[0]?.key,
                    marketId: response.data[i].bookmakers[j]?.markets[0]?.key,
                    bookName: response.data[i].bookmakers[j]?.key,
                    bookId: response.data[i].bookmakers[j]?.key,
                    bookTotalValue: response.data[i].bookmakers[j]?.markets[0]?.outcomes[k].price,
                    // books: response.data.sport_event_players_props.players_props[i].markets[j].books[k],
                    playerTableId: newCreatedPlayer.id
                  })
                } catch (e) {
                  console.log("eee", e)
                  return res.status(500).send({
                    success: false,
                    message: "error, in updating player name",
                    error: e.message
                  });
                }
              }
            }
          }
        }

      }
      return res.status(200).send({
        success: true,
        message: "All Players list",
        data: allPlayer,
        api: response.data
      });
    })
    .catch((error) => {
      console.log(error);
    });

}

// from db
exports.sportsList = async (req, res) => {
  let allSports
  try {
    allSports = await models.sports.findAll({
      where: { status: "A" },
      attributes: ["id", "name", "shortName", "sportsId", "type", "icon"],
      order: [["order", "ASC"]]
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding sports name",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Sports list",
    data: allSports
  });
}

exports.getOneSports = async (req, res) => {
  const v = new niv.Validator(req.params, {
    id: "required|integer",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(200).send({
      success: false,
      data: v.errors,
      message: "must have all required field",
      status: 422,
    });
  }

  try {
    const { id } = req.params;

    const sportsRecord = await models.sports.findOne({
      where: { id: id },
    });

    if (!sportsRecord) {
      return res.status(404).json({
        success: false,
        message: "Sport not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sport fetched successfully.",
      data: sportsRecord,
    });
  } catch (error) {
    console.error("Error in getOneSports:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while fetching the sport.",
    });
  }
};

exports.updateOneSports = async (req, res) => {
  const v = new niv.Validator(req.params, {
    id: "required|integer",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(200).send({
      success: false,
      data: v.errors,
      message: "must have all required field",
      status: 422,
    });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;

    // Find the sports record by sportsId
    const sportsRecord = await models.sports.findOne({
      where: { id: id },
    });

    // Check if the record exists
    if (!sportsRecord) {
      return res.status(404).json({
        success: false,
        message: "Sport not found.",
      });
    }

    const [updatedCount] = await models.sports.update(updateData, {
      where: { id: id },
    });

    if (updatedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to update the sport.",
      });
    }

    const updatedSport = await models.sports.findOne({
      where: { id: id },
    });

    return res.status(200).json({
      success: true,
      message: "Sport updated successfully.",
      data: updatedSport,
    });
  } catch (error) {
    console.error("Error in updateOneSports:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while updating the sport.",
    });
  }
}

exports.deleteOneSports = async (req, res) => {
  const v = new niv.Validator(req.params, {
    id: "required|integer",
  });
  const matched = await v.check();

  if (!matched) {
    return res.status(200).send({
      success: false,
      data: v.errors,
      message: "must have all required field",
      status: 422,
    });
  }

  try {
    const { id } = req.params;

    const sportsRecord = await models.sports.findOne({
      where: { id: id },
    });

    if (!sportsRecord) {
      return res.status(404).json({
        success: false,
        message: "Sport not found.",
      });
    }

    const [updatedCount] = await models.sports.update(
      { status: "D" },
      { where: { id: id }, }
    );

    if (updatedCount === 0) {
      return res.status(400).json({
        success: false,
        message: "Failed to delete the sport.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Sport deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteOneSports:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while deleting the sport.",
    });
  }
};

exports.competitionList = async (req, res) => {
  let allSports
  try {
    allSports = await models.competitions.findAll({
      where: { status: "A", sportsId: req.params.sportsId },
      attributes: ["id", "sportsId", "competitionsId", "name", "gender", "market", "futures", "playerProps", "categoryId", "categoryName", "categoryCountryCode"]
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding sports name",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Sports list",
    data: allSports
  });
}

exports.gameList = async (req, res) => {
  try {
    allGames = await models.game.findAll({
      where: { status: "A", competitionId: req.params.competitionId },
      attributes: ["id", "sportsId", "competitionId", "gameId", "startTime", "startTimeConfirmed", "competitors1Id", "competitors1Name", "competitors1Country", "competitors1CountryCode",
        "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Country", "competitors2CountryCode", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber"]
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding competition name",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Competitions list",
    data: allGames
  });
}

exports.playerList = async (req, res) => {
  const perPage = +req?.query?.limit || 1000;
  const page = +req?.query?.page || 1;
  const offset = (perPage * page) - perPage;

  const playerDetailsWhereClause = {};

  if (req.query.searchTerm) {
    playerDetailsWhereClause[Op.or] = [
      { playerName: { [Op.like]: `%${req.query.searchTerm}%` } },
      { playersId: { [Op.like]: `%${req.query.searchTerm}%` } },
    ];
  }
  const startOfToday = new Date();
  // startOfToday.setDate(startOfToday.getDate() - 1);
  // startOfToday.setHours(0, 0, 0, 0);
  
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  threeDaysLater.setHours(23, 59, 59, 999);
  
  let whereClause = {
    status: "A",
    sportsId: req.params.sportsId,
    startTime: {
      [Op.between]: [startOfToday, threeDaysLater],
    },
  };

  if (req.query.gameId) {
    whereClause.gameId = req.query.gameId
  }

  let marketWhereClause = {
    oddsDecimal: {[Op.gt]: minimumOddsValue},
    bookTotalValue: {[Op.not]: null}
  }
  let marketRequired = true
  if (req.query.markertId) {
    //  findAllMarket=await models.markets.findAll({
    //     where:{
    //       sportsId: req.params.sportsId,
    //       marketId: req.query.markertId
    //     },
    //     group: ['playerTableId'], 
    //     attributes: ["id", "playerTableId"]
    //   })
    // console.log(findAllMarket.length)

    marketWhereClause = {
      sportsId: req.params.sportsId,
      marketId: req.query.markertId,
      oddsDecimal: {[Op.gt]: minimumOddsValue},
      bookTotalValue: {[Op.not]: null}
    }
    marketRequired = true
  }

  let allPlayer

  try {
    allPlayer = await models.players.findAll({
      where: whereClause,
      attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerName", "competitorId", "startTime"],
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
          where: playerDetailsWhereClause, // Filter `playerDetais` by `searchTerm`
        },
        {
          required: marketRequired,
          model: models.markets,
          as: "marketDetails",
          attributes: ["id", "bookId", "bookTotalValue", "bookName", "marketId", "marketName", "gameId", "playersId", "playerTableId", "marketShortName", "oddsDecimal"],
          where: marketWhereClause
        },
      ],
      group: ["playersId"],
      order: [["startTime", "ASC"]],
      limit: perPage,
      offset: offset,
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding player details",
      error: e.message
    });
  }

  allPlayer.forEach((player) => {
    if (player.marketDetails && Array.isArray(player.marketDetails)) {
      player.marketDetails.sort((a, b) => (b.bookTotalValue || 0) - (a.bookTotalValue || 0));
    }
  });

  // Then, sort `allPlayer` based on the first element of the sorted `marketDetails`
  const sortedPlayers = allPlayer.sort((a, b) => {
    const aMarketValue = a.marketDetails?.[0]?.bookTotalValue || 0;
    const bMarketValue = b.marketDetails?.[0]?.bookTotalValue || 0;
    return bMarketValue - aMarketValue; // Descending order
  });
  let count
  try {
    count = await models.players.findAll({
      where: whereClause,
      attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerName", "competitorId", "startTime"],
      include: [
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
          where: playerDetailsWhereClause, // Filter `playerDetais` by `searchTerm`
        },
        {
          required: marketRequired,
          model: models.markets,
          as: "marketDetails",
          attributes: ["id", "bookId", "bookTotalValue", "bookName", "marketId", "marketName", "gameId", "playersId", "playerTableId"],
          where: marketWhereClause
        },
      ],
      group: ["playersId"],
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding player details count",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Players list",
    data: sortedPlayers,
    count: count.length,
    // findAllMarket
  });

}

exports.matchList = async (req, res) => {
  try {
    allGames = await models.game.findAll({
      where: { status: "A", sportsId: req.params.sportId, startTime: { [Op.gte]: new Date() } },
      attributes: ["id", "sportsId", "competitionId", "gameId", "startTime", "startTimeConfirmed", "competitors1Id", "competitors1Name", "competitors1Country", "competitors1CountryCode",
        "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Country", "competitors2CountryCode", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber"]
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding competition name",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Competitions list",
    data: allGames
  });
}
// not using now
exports.playerListBySportId = async (req, res) => {
  const playerDetailsWhereClause = {};

  if (req.query.searchTerm) {
    playerDetailsWhereClause[Op.or] = [
      { playerName: { [Op.like]: `%${req.query.searchTerm}%` } },
      { playersId: { [Op.like]: `%${req.query.searchTerm}%` } },
    ];
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  let whereClause = {
    status: "A", sportsTableId: req.query.id, startTime: { [Op.gte]: startOfToday }
    //status: "A", sportsId: req.params.sportsId, startTime: { [Op.gte]: new Date()
  }

  if (req.query.sportsId) {
    whereClause = {
      status: "A",
      startTime: { [Op.gte]: startOfToday },
      [Op.or]: {
        sportsId: req.query.sportsId,
        sportsTableId: req.query.id
      }
      //status: "A", sportsId: req.params.sportsId, startTime: { [Op.gte]: new Date()
    }
  }

  if (req.query.gameId) {
    whereClause.gameId = req.query.gameId
  }
  let allPlayer
  console.log(whereClause)
  try {
    allPlayer = await models.players.findAll({
      where: whereClause,
      attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerName", "competitorId", "markets"],
      include: [
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
          where: playerDetailsWhereClause, // Filter `playerDetais` by `searchTerm`
        },
      ]
    })
  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "error, in finding player details",
      error: e.message
    });
  }
  return res.status(200).send({
    success: true,
    message: "All Players list",
    data: allPlayer
  });

}

exports.marketList = async (req, res) => {
  let allMarketList
  const startOfToday = new Date();
  // startOfToday.setDate(startOfToday.getDate() - 1);
  // startOfToday.setHours(0, 0, 0, 0);
  
  const threeDaysLater = new Date();
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  threeDaysLater.setHours(23, 59, 59, 999);
  try {
    allMarketList = await models.markets.findAll({
      where: {
        sportsId: req.params.sportsId,
        startTime: {
          [Op.between]: [startOfToday, threeDaysLater],
        },
      },
      attributes: ["id", "sportsId", "marketName", "marketId", "marketShortName"],
      group: ["marketId"]
    })

    return res.status(200).send({
      success: true,
      message: "All market list",
      data: allMarketList
    });

  } catch (e) {
    return res.status(500).send({
      success: false,
      message: "Error in market list",
      error: e.message
    });
  }
}