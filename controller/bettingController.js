const models = require("../models");
const niv = require("node-input-validator");
// const randomstring = require("randomstring");
const { Op, useInflection } = require("sequelize");
const { checkCurrentResult } = require("../function/resultCalculation");

let matchTiming=3
exports.createBetting = async (req, res, next) => {
    // const v = new niv.Validator(req, {
    //     'body.*playerId': "required|integer",
    //     'body.*betType': "required|in:MORE,LESS",
    //     'body.*.deviceId': "string"
    // });
    // const matched = await v.check();

    // if (!matched) {
    //     return res.status(200).send({
    //         success: false,
    //         data: v.errors,
    //         message: "must have all required field",
    //         status: 422,
    //     });
    // }

    // for (let i = 0; i < req.body.betting.length; i++) {
    //     if (req?.authUser?.id) {  // userId
    //         let userId = req?.authUser?.id;
    //         let findExist
    //         try {
    //             findExist = await models.betting.findOne({
    //                 where: { userId: userId, playerId: req.body.betting[i].playerId }
    //             })
    //         } catch (e) {
    //             console.log(e)
    //             return res.status(500).json({
    //                 success: false,
    //                 message: "Error in finding exist betting",
    //             });
    //         }

    //         if (findExist) {
    //             try {
    //                 await models.betting.update({
    //                     betType: req.body.betting[i].betType,
    //                     bettingPlayType: req.body.bettingPlayType
    //                     // need to add current odd value
    //                 }, {
    //                     where: { id: findExist.id }
    //                 })
    //             } catch (e) {
    //                 return res.status(500).json({
    //                     success: false,
    //                     message: "Error in finding exist betting",
    //                 });
    //             }
    //         } else {
    //             try {
    //                 await models.betting.create({
    //                     userId: userId,
    //                     playerId: req.body.betting[i].playerId,
    //                     betType: req.body.betting[i].betType,
    //                     bettingPlayType: req.body.bettingPlayType,
    //                     groupId: groupId,
    //                     toWin: req.body.toWin,
    //                     entry: req.body.entry,
    //                     // need to add current odd value
    //                 })
    //             } catch (e) {
    //                 return res.status(500).json({
    //                     success: false,
    //                     message: "Error in finding exist betting",
    //                 });
    //             }
    //         }
    //     }
    //     // } else {
    //     //     let deviceId = req.body.deviceId;
    //     //     let findExist
    //     //     try {
    //     //         findExist = await models.betting.findOne({
    //     //             where: { deviceId: deviceId, playerId: req.body.betting[i].playerId }
    //     //         })
    //     //     } catch (e) {
    //     //         return res.status(500).json({
    //     //             success: false,
    //     //             message: "Error in finding exist betting",
    //     //         });
    //     //     }
    //     //     if (findExist) {
    //     //         try {
    //     //             await models.betting.update({
    //     //                 betType: req.body.betting[i].betType,
    //     //                 // need to add current odd value
    //     //             }, {
    //     //                 where: { id: findExist.id }
    //     //             })
    //     //         } catch (e) {
    //     //             return res.status(500).json({
    //     //                 success: false,
    //     //                 message: "Error in finding exist betting",
    //     //             });
    //     //         }
    //     //     } else {
    //     //         try {
    //     //             await models.betting.create({
    //     //                 deviceId: deviceId,
    //     //                 playerId: req.body.betting[i].playerId,
    //     //                 betType: req.body.betting[i].betType,
    //     //                 bettingPlayType: req.body.bettingPlayType,
    //     //                 groupId: groupId,
    //     //                 toWin: req.body.toWin,
    //     //                 entry: req.body.entry,
    //     //                 // need to add current odd value
    //     //             })
    //     //         } catch (e) {
    //     //             return res.status(500).json({
    //     //                 success: false,
    //     //                 message: "Error in finding exist betting",
    //     //             });
    //     //         }
    //     //     }

    //     // }
    // }
    if(req.body.entry<1){
        return res.status(400).json({
            success: false,
            message: "min 1$ of entry is required",
        }); 
    }
    let findAvailableBallance
    try {
        findAvailableBallance = await models.balance.findOne({
            where: { userId: req.authUser.id }
        })
    } catch (e) {
        return res.status(500).json({
            success: false,
            message: "Error in having balance",
        });
    }

    let settingDetails
    let inBetSettingsCreate
    try{
        settingDetails=await models.settings.findOne({
            where: { id: req.body.bettingPlayType, status: "A" }
        })

        inBetSettingsCreate=await models.inBetSettings.create({
            playType: settingDetails.playType,
            entry: settingDetails.entry,
        })

        let multiplexDetails=await models.multiplexForEntry.findAll({
            where: { entryId: req.body.bettingPlayType }
        })

        for(let i=0;i<multiplexDetails.length;i++){
            await models.inBetMultiplexForEntry.create({
                entryId: inBetSettingsCreate.id,
                correctNeeded: multiplexDetails[i].correctNeeded,
                multiplex: multiplexDetails[i].multiplex,
            })
        }

    }catch(e){
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in having settings",
            e: e.message
        });
    }

    try {
        if (Number(findAvailableBallance.availablePromo) + Number(findAvailableBallance.availableBalance) >= Number(req.body.entry)) {

            let createBet
            try {
                createBet = await models.betting.create({
                    userId: req.authUser.id,
                    bettingPlayType: req.body.bettingPlayType,
                    toWin: req.body.toWin,
                    entry: req.body.entry,
                    inBetbettingPlayType: inBetSettingsCreate.id
                    // minimumPoint: ,
                    // maximumPoint: ,
                })
            } catch (e) {
                return res.status(500).json({
                    success: false,
                    message: "Error in creating betting",
                });
            }
            let allStartTime = []

            for (let i = 0; i < req.body.betting.length; i++) {
                try {
                    let marketDetails = await models.markets.findOne({
                        where: { id: req.body.betting[i].marketId },
                        attributes: ["id", "bookTotalValue", "startTime", "bookTotalValue"]
                    })
                    allStartTime.push(marketDetails.startTime)
                    await models.bettingPlayers.create({
                        userId: req.authUser.id,
                        playerId: req.body.betting[i].playerId,
                        betType: req.body.betting[i].betType,
                        bettingId: createBet.id,
                        beforePoint: marketDetails.bookTotalValue,
                        marketId: marketDetails.id,
                        // need to add current odd value
                    })
                } catch (e) {
                    console.log(e)
                    return res.status(500).json({
                        success: false,
                        message: "Error in creating betting players",
                    });
                }
            }

            allStartTime.sort((a, b) => new Date(b) - new Date(a));
            console.log("allStartTime...", allStartTime)
            let newEndTime = new Date(allStartTime[0]);
            newEndTime.setHours(newEndTime.getHours() + matchTiming);

            await models.betting.update({
                endTime: newEndTime
            }, {
                where: {
                    id: createBet.id
                }
            })
            if (Number(findAvailableBallance.availablePromo) >= Number(req.body.entry)) {  // if only promo is enough
                let availablePromo = Number(findAvailableBallance.availablePromo) - Number(req.body.entry)
                await models.balance.update({
                    availablePromo: availablePromo
                }, {
                    where: { userId: req.authUser.id }
                })
            } else {  // if some more need with promo
                let amountNeed = Number(req.body.entry) - Number(findAvailableBallance.availablePromo)
                let availableBalance = Number(findAvailableBallance.availableBalance) - Number(amountNeed)
                await models.balance.update({
                    availablePromo: 0,
                    availableBalance: availableBalance
                }, {
                    where: { userId: req.authUser.id }
                })
            }

            let totalWagers = Number(req.authUser.totalWagers) + Number(req.body.entry)
            await models.user.update({
                totalWagers: totalWagers
            }, {
                where: {
                    id: req.authUser.id
                }
            });

            await models.betResultRecord.create({
                userId: req.authUser.id,
                betId: createBet.id,
                betPlaced: req.body.entry,
                betStatus: "PENDING"
            });
            console.log("req.authUser.totalWagers   create")

        } else {
            return res.status(400).json({
                success: false,
                message: "Not enough balance",
            });
        }
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in update bate",
        });
    }

    return res.status(200).json({
        success: true,
        message: "Bet added",
    });
}

exports.editBetting = async (req, res, next) => {
    const v = new niv.Validator(req.body, {
        betType: "required|in:MORE,LESS",
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

    let findExist
    try {
        findExist = await models.betting.findOne({
            where: { id: req.params.betId, userId: req.authUser.id }
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in finding exist betting",
        });
    }

    if (findExist) {
        try {
            await models.betting.update({
                betType: req.body.betType,
                // need to add current odd value
            }, {
                where: { id: findExist.id }
            })

            return res.status(200).json({
                success: true,
                message: "Bet updated",
            });

        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Error in updating exist betting",
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            message: "This betting is not exist",
        });
    }
}

exports.deleteBetting = async (req, res, next) => {
    let findExist
    try {
        findExist = await models.betting.findOne({
            where: { id: req.params.betId, userId: req.authUser.id }
        })
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in finding exist betting",
        });
    }

    if (findExist) {
        try {
            await models.betting.update({
                status: "D",
            }, {
                where: { id: findExist.id }
            })

            return res.status(200).json({
                success: true,
                message: "Bet deleted",
            });

        } catch (e) {
            return res.status(500).json({
                success: false,
                message: "Error in deleting exist betting",
            });
        }
    } else {
        return res.status(400).json({
            success: false,
            message: "This betting is not exist",
        });
    }
}

exports.bettingList = async (req, res, next) => {
    let whereClause = {
        userId: req.authUser.id, status: "A"
    }
    if (req.query.bettingTime) {
        if (req.query.bettingTime == "past") {
            whereClause = {
                userId: req.authUser.id, result: { [Op.in]: ["loss", "win", "refund"] }, status: "A"
            }
        } else {
            whereClause = {
                userId: req.authUser.id, result: { [Op.in]: ["pending"] }, status: "A"
            }
        }
    }

    if (req.query.win) {
        whereClause.result = "win"
    }

    // console.log(whereClause)
    try {
        const bettingList = await models.betting.findAll({
            where: whereClause,
            include: [
                {
                    required: true,
                    model: models.betResultRecord,
                    as: "resultDetails",
                    attributes: ["id", "userId", "betId", "betPlaced", "winAmount", "result", "betStatus"]
                },
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
                    required: true,
                    model: models.bettingPlayers,
                    as: "addedPlayers",
                    // where: { status: "A" },
                    attributes: ["id", "userId", "playerId", "betType", "bettingId", "beforePoint", "afterPoint", "marketId", "status"],
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
                                "bookTotalValue"]
                        },
                        {
                            required: true,
                            model: models.players,
                            as: "playerDetails",
                            attributes: ["id", "sportsId", "competitionId", "gameId", "playersId", "playerListId", "playerName", "competitorId"],
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
                                        "bookTotalValue"]
                                },
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
            ],
            order: [["createdAt", "DESC"]]
        })


        bettingList.forEach(betting => {
            const bettingDetails = Array.isArray(betting.bettingDetais) ? betting.bettingDetais : [betting.bettingDetais].filter(Boolean);

            bettingDetails.forEach(setting => {
                if (setting.entryDetails && setting.entryDetails.length > 0) {
                    setting.entryDetails.sort((a, b) => b.correctNeeded - a.correctNeeded);
                }
            });
        });

        return res.status(200).json({
            success: true,
            message: "All bet list",
            data: bettingList
        });
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in finding exist betting",
        });
    }
}

exports.bettingDetails = async (req, res, next) => {
    try {
        const bettingList = await models.betting.findOne({
            where: { id: req.params.betId },
            include: [
                {
                    required: true,
                    model: models.betResultRecord,
                    as: "resultDetails",
                    attributes: ["id", "userId", "betId", "betPlaced", "winAmount", "result", "betStatus"]
                },
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
                    model: models.inBetSettings,
                    as: "inBetBettingDetais",
                    // attributes: ["id", "playType", "minimum", "maximum", "minimumCorrectionNeeded", "minimumPoint", "maximumPoint"],
                    include: {
                        required: false,
                        model: models.inBetMultiplexForEntry,
                        as: "entryDetails",
                        where: { multiplex: { [Op.not]: 0 } },
                        order: ["correctNeeded", "DESC"]
                        // attributes: ["id", "profileImage", "playersId", "playerName"],
                    },
                },
                {
                    required: true,
                    model: models.bettingPlayers,
                    as: "addedPlayers",
                    // where: { status: "A" },
                    attributes: ["id", "userId", "playerId", "betType", "bettingId", "beforePoint", "afterPoint", "marketId", "status"],
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
                                "bookTotalValue"]
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
                                    attributes: ["id", "competitionId", "gameId", "startTime", "competitors1Id", "competitors1Name", "competitors1Abbreviation", "competitors1Qualifier", "competitors1RotationNumber", "competitors2Id", "competitors2Name", "competitors2Abbreviation", "competitors2Qualifier", "competitors2RotationNumber", "status", "resultFound"]
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
            ],
            // order: [["createdAt", "DESC"]]
            order:[ [{ model: models.settings, as: "bettingDetais" }, { model: models.multiplexForEntry, as: "entryDetails" }, "correctNeeded", "DESC"]]
            //need to change sort for inBetBettingDetais
        })

        for (let i = 0; i < bettingList.dataValues.addedPlayers.length; i++) {
            console.log(bettingList.dataValues.addedPlayers[i].dataValues.marketId)
            let findResult = await checkCurrentResult(bettingList.dataValues.addedPlayers[i].dataValues.marketId, bettingList.dataValues.addedPlayers[i].dataValues.playerDetails.dataValues.playersId)
            console.log(findResult)
            try {
                await models.bettingPlayers.update({
                    afterPoint: findResult
                }, {
                    where: {
                        id: bettingList.dataValues.addedPlayers[i].dataValues.id
                    }
                })
                bettingList.dataValues.addedPlayers[i].dataValues.afterPoint = findResult
            } catch (e) {
                console.log(e)
            }
        }

        return res.status(200).json({
            success: true,
            message: "All bet list",
            data: bettingList
        });
    } catch (e) {
        console.log(e)
        return res.status(500).json({
            success: false,
            message: "Error in finding exist betting",
        });
    }
}

exports.bettingResult = async (req, res, next) => {
    let bettingList
    try {
        bettingList = await models.betting.findAll({
            where: {
                resultDecleared: false,
                endTime: { [Op.lte]: new Date() }
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
                            result: true
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
                            result: false
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
                            result: true
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
                            result: false
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
            if (bettingList[i].dataValues.bettingDetais.dataValues.playType == "POWER PLAY") {
                let lossCount = playerCount - winCount
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

                    let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
                    let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
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
            } else {
                // console.log("flex...", winCount)
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

                    let increaseAmount = Number(userBalance.depositMoney) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
                    let increaseAvailableAmount = Number(userBalance.availableBalance) + (Number(bettingList[i].dataValues.entry) + (Number(bettingList[i].dataValues.entry) * Number(winningMultiplex.multiplex)))
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
                    await models.betting.update({
                        resultDecleared: true,
                        result: "loss",
                        winCount: winCount,
                        bettingPlayType: findSetting.dataValues.id,
                        preBettingPlayType: bettingList[i].dataValues.bettingPlayType
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
        }
        return res.status(200).json({
            success: true,
            data: bettingList
        });
    } catch (e) {
        return res.status(500).json({
            success: false,
            data: e.message
        });
    }
}