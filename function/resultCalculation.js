const models = require("../models");

const checkCurrentResult =async (markertId, playerId)=> {
    // console.log(markertId, playerId)
    // return false
    try {
      let marketDetail = await models.markets.findOne({
        where: {
          id: markertId
        }
      });

      let playerStat = await models.playerStatAfterMatch.findOne({
        where: {
            playersId: playerId,
          gameId: marketDetail.gameId
        }
      });

      let afterPoint=0

  
      if (marketDetail && playerStat) {
        if (marketDetail.sportsId === "sr:sport:2" || marketDetail.sportsId === "sr:FNCAAsport:2") { // for NBA
          if (marketDetail.marketName === "total points (incl. overtime)"){
            afterPoint=playerStat?.points
          } else if (marketDetail.marketName === "total assists (incl. overtime)") {
            afterPoint=playerStat?.assists
          } else if (marketDetail.marketName === "total rebounds (incl. overtime)") {
            afterPoint=playerStat?.total_rebounds
          } else if (marketDetail.marketName === "total 3-point field goals (incl. overtime)") {
            afterPoint=playerStat?.three_pointers_made
  
          } else if (marketDetail.marketName === "total points plus rebounds (incl. extra overtime)") {
              afterPoint=Number(playerStat?.points) + Number(playerStat?.total_rebounds)
  
          } else if (marketDetail.marketName === "total points plus assists (incl. extra overtime)") {
              afterPoint=Number(playerStat?.points) + Number(playerStat?.assists)
  
          } else if (marketDetail.marketName === "total rebounds plus assists (incl. extra overtime)") {
              afterPoint=Number(playerStat?.total_rebounds) + Number(playerStat?.assists)
  
          } else if (marketDetail.marketName === "total points plus assists plus rebounds (incl. extra overtime)") {
              afterPoint=Number(playerStat?.total_rebounds) + Number(playerStat?.assists) + Number(playerStat?.points)
  
          } else if (marketDetail.marketName === "total steals (incl. extra overtime)") {
              afterPoint=Number(playerStat?.steals)
  
          } else if (marketDetail.marketName === "total turnovers (incl. extra overtime)") {
              afterPoint=Number(playerStat?.turnovers)
          } else if (marketDetail.marketName === "total blocks (incl. extra overtime)") {
              afterPoint=Number(playerStat?.blocks)
  
          } else if (marketDetail.marketName === "total blocks plus steals (incl. extra overtime)") {
              afterPoint=Number(playerStat?.blocks)+Number(playerStat?.steals)
  
          } 
        } else if (marketDetail.sportsId === "sr:sport:4") { // for NHL
          if (marketDetail.marketName === "total shots (incl. extra overtime)"){
            afterPoint=playerStat?.shots_on_goal
          } else if (marketDetail.marketName === "total assists (incl. extra overtime)") {
            afterPoint=playerStat?.assists
          } else if (marketDetail.marketName === "total points (incl. extra overtime)") {
            afterPoint=playerStat?.points
          } else if (marketDetail.marketName === "total power play points (incl. extra overtime)") {  // no power play points in plyerstat
            afterPoint=playerStat?.points
  
          }
        } else if (marketDetail.sportsId === "sr:sport:16") { // for NFL
          if (marketDetail.marketName === "total receiving yards (incl. overtime)"){
            afterPoint=playerStat?.receivingYards
          } else if (marketDetail.marketName === "total receptions (incl. overtime)") {
            afterPoint=playerStat?.receptions
          } else if (marketDetail.marketName === "longest reception (incl. overtime)") {
            afterPoint=playerStat?.longestReception  // no longest reception there
          } else if (marketDetail.marketName === "total assists (incl. overtime)") { 
            afterPoint=playerStat?.assists; //+ playerStat?.first_assists + playerStat?.second_assists + playerStat?.sp_assists + playerStat?.misc_assists
          } else if (marketDetail.marketName === "total tackles (incl. overtime)") { 
            afterPoint=playerStat?.broken_tackles + playerStat?.tackles + playerStat?.sp_tackles+ playerStat?.misc_tackles  // should I take missed tackles?
          } else if (marketDetail.marketName === "total tackles plus assists (incl. overtime)") { 
            afterPoint=playerStat?.broken_tackles + playerStat?.tackles + playerStat?.sp_tackles+ playerStat?.misc_tackles + playerStat?.assists + playerStat?.first_assists + playerStat?.second_assists + playerStat?.sp_assists + playerStat?.misc_assists // should I take missed tackles?
          } else if (marketDetail.marketName === "total sacks (incl. overtime)") {  
            afterPoint=playerStat?.sacks + playerStat?.passingSacks
          } else if (marketDetail.marketName === "total kicking points (incl. overtime)") { 
            afterPoint=playerStat?.squib_kicks
          } else if (marketDetail.marketName === "total extra points made (incl. overtime)") {  
            afterPoint=playerStat?.points + playerStat?.three_pointers_made
          } else if (marketDetail.marketName === "total field goals made (incl. overtime)") {  
            afterPoint=playerStat?.made_19 + playerStat?.made_29 + playerStat.made_39 + playerStat.made_49 + playerStat.made_50
          // } else if (marketDetail.marketName === "total carries (incl. overtime)") {  
            // afterPoint=playerStat?.points
          }else if (marketDetail.marketName === "total rushing yards (incl. overtime)") {  
            afterPoint=playerStat?.rushingYards
          }else if (marketDetail.marketName === "total rushing plus receiving yards (incl. overtime)") {  
            afterPoint=playerStat?.rushingYards + playerStat?.receivingYards
          }else if (marketDetail.marketName === "longest rush (incl. overtime)") {  
            afterPoint=playerStat?.longestRush
          }else if (marketDetail.marketName === "total passing yards (incl. overtime)") {  
            afterPoint=playerStat?.passingYards + playerStat?.passingSackYards + playerStat?.passingAirYards
          }else if (marketDetail.marketName === "total pass completions (incl. overtime)") {  
            afterPoint=playerStat?.completions
          }else if (marketDetail.marketName === "total passing touchdowns (incl. overtime)") {  
            afterPoint=playerStat?.passingTouchDown
          }else if (marketDetail.marketName === "total passing interceptions (incl. overtime)") {  
            afterPoint=playerStat?.passingInterception
          }else if (marketDetail.marketName === "total passing attempts (incl. overtime)") {  
            afterPoint=playerStat?.passingAttempts + playerStat?.passingRedZoneAttempts
          }else if (marketDetail.marketName === "longest passing completion (incl. overtime)") {  
            afterPoint=playerStat?.passingLongest
          }else if (marketDetail.marketName === "total passing plus rushing yards (incl. overtime)") {  
            afterPoint=playerStat?.passingYards + playerStat?.passingSackYards + playerStat?.passingAirYards + playerStat?.rushingYards + playerStat?.rushingTlostYards + playerStat?.rushingYardsAfterContact
          }else if (marketDetail.marketName === "to throw an interception (incl. overtime)") {  
            afterPoint=playerStat?.throw_aways
          }
        } 
        // else if () {

        // }
        
      }
  
      return afterPoint
    } catch (error) {
      console.log("error in findMarket: ", error);
    }
  }

  module.exports = {
    checkCurrentResult
  };

  // old token = oMkSpBsLc6zIQoIvaAHT2nrXW7NDHoY5ee4FjJ0b