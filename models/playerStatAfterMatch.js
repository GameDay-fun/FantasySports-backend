"use strict";

module.exports = (sequelize, DataTypes) => {
  const playerStatAfterMatch = sequelize.define(
    "playerStatAfterMatch",
    {
      sportsId: {
        type: DataTypes.TEXT,
      },
      sportsTableId:{
        type: DataTypes.INTEGER
      },
      competitionId: {
        type: DataTypes.TEXT,
      },
      gameId: {
        type: DataTypes.TEXT,
      },
      playersId: {
        type: DataTypes.TEXT,
      },
      compititorId: {
        type: DataTypes.TEXT,
      },
      playerTableId: {
        type: DataTypes.INTEGER,
      },
      assists: {
        type: DataTypes.INTEGER,
      },
      first_assists: {
        type: DataTypes.INTEGER,
      },
      goalie_minutes_played:{
        type: DataTypes.TEXT,
      },
      goals:{
        type: DataTypes.INTEGER,
      },
      goals_conceded:{
        type: DataTypes.INTEGER,
      },
      goals_conceded:{
        type: DataTypes.INTEGER,
      },
      penalties:{
        type: DataTypes.INTEGER,
      },
      penalty_minutes:{
        type: DataTypes.INTEGER,
      },
      plus_minus:{
        type: DataTypes.INTEGER,
      },
      saves:{
        type: DataTypes.INTEGER,
      },
      second_assists:{
        type: DataTypes.INTEGER,
      },
      shots_on_goal:{
        type: DataTypes.INTEGER,
      },
      blocks: {
        type: DataTypes.INTEGER,
      },
      defensive_rebounds:{
        type: DataTypes.INTEGER
      },
      field_goals_attempted:{
        type: DataTypes.INTEGER
      },
      field_goals_made:{
        type: DataTypes.INTEGER
      },
      free_throws_attempted:{
        type: DataTypes.INTEGER
      },
      free_throws_made:{
        type: DataTypes.INTEGER
      },
      minutes:{
        type: DataTypes.TEXT
      },
      offensive_rebounds: {
        type: DataTypes.INTEGER
      },
      personal_fouls:{
        type: DataTypes.INTEGER
      },
      points: {
        type: DataTypes.INTEGER
      },
      steals: {
        type: DataTypes.INTEGER
      },
      technical_fouls: {
        type: DataTypes.INTEGER
      },
      three_pointers_attempted: {
        type: DataTypes.INTEGER
      },
      three_pointers_made: {
        type: DataTypes.INTEGER
      },
      total_rebounds:{
        type: DataTypes.INTEGER
      },
      turnovers: {
        type: DataTypes.INTEGER
      },
      first_downs: {
        type: DataTypes.INTEGER
      },
      avg_yards: {
        type: DataTypes.DECIMAL(10, 2),
      },
      attempts: {
        type: DataTypes.INTEGER
      },
      touchdowns: {
        type: DataTypes.INTEGER
      },
      yards: {
        type: DataTypes.INTEGER
      },
      rushingYards: {
        type: DataTypes.INTEGER
      },
      rushingTlostYards: {
        type: DataTypes.INTEGER
      },
      rushingYardsAfterContact: {
        type: DataTypes.INTEGER
      },
      receivingYards: {
        type: DataTypes.INTEGER
      },
      longestRush: {
        type: DataTypes.INTEGER
      },
      passingSackYards:{
        type: DataTypes.INTEGER
      },
      passingAirYards:{
        type: DataTypes.INTEGER
      },
      passingYards:{
        type: DataTypes.INTEGER
      },
      passingTouchDown:{
        type: DataTypes.INTEGER
      },
      passingInterception:{
        type: DataTypes.INTEGER
      },
      passingAttempts:{
        type: DataTypes.INTEGER
      },
      passingRedZoneAttempts:{
        type: DataTypes.INTEGER
      },
      passingLongest: {
        type: DataTypes.INTEGER
      },
      longest: {
        type: DataTypes.INTEGER
      },
      longest_touchdown: {
        type: DataTypes.INTEGER
      },
      longestReception: {
        type: DataTypes.INTEGER
      },
      redzone_attempts: {
        type: DataTypes.INTEGER
      },
      tlost: {
        type: DataTypes.INTEGER
      },
      tlost_yards: {
        type: DataTypes.INTEGER
      },
      broken_tackles: {
        type: DataTypes.INTEGER
      },
      kneel_downs: {
        type: DataTypes.INTEGER
      },
      scrambles: {
        type: DataTypes.INTEGER
      },
      yards_after_contact: {
        type: DataTypes.INTEGER
      },
      turnovers: {
        type: DataTypes.INTEGER
      },
      receptions: {
        type: DataTypes.INTEGER
      },
      targets: {
        type: DataTypes.INTEGER
      },
      yards_after_catch: {
        type: DataTypes.INTEGER
      },
      redzone_targets: {
        type: DataTypes.INTEGER
      },
      air_yards: {
        type: DataTypes.INTEGER
      },
      dropped_passes: {
        type: DataTypes.INTEGER
      },
      catchable_passes:{
        type: DataTypes.INTEGER
      },
      yards_after_contact:{
        type: DataTypes.INTEGER
      },
      blocked:{
        type: DataTypes.INTEGER
      },
      touchbacks:{
        type: DataTypes.INTEGER
      },
      inside_20:{
        type: DataTypes.INTEGER
      },
      avg_net_yards:{
        type: DataTypes.DECIMAL(10, 2),
      },
      net_yards:{
        type: DataTypes.INTEGER
      },
      return_yards:{
        type: DataTypes.INTEGER
      },
      hang_time:{
        type: DataTypes.INTEGER
      },
      faircatches:{
        type: DataTypes.INTEGER
      },
      number:{
        type: DataTypes.INTEGER
      },
      avg_hang_time:{
        type: DataTypes.DECIMAL(10, 2),
      },
      completions:{
        type: DataTypes.INTEGER
      },
      cmp_pct:{
        type: DataTypes.DECIMAL(10, 2),
      },
      interceptions:{
        type: DataTypes.INTEGER
      },
      sack_yards:{
        type: DataTypes.INTEGER
      },
      rating:{
        type: DataTypes.DECIMAL(10, 2),
      },
      completions:{
        type: DataTypes.INTEGER
      },
      sacks:{
        type: DataTypes.INTEGER
      },
      passingSacks:{
        type: DataTypes.INTEGER
      },
      int_touchdowns:{
        type: DataTypes.INTEGER
      },
      throw_aways:{
        type: DataTypes.INTEGER
      },
      poor_throws:{
        type: DataTypes.INTEGER
      },
      defended_passes:{
        type: DataTypes.INTEGER
      },
      spikes:{
        type: DataTypes.INTEGER
      },
      blitzes:{
        type: DataTypes.INTEGER
      },
      hurries:{
        type: DataTypes.INTEGER
      },
      knockdowns:{
        type: DataTypes.INTEGER
      },
      pocket_time:{
        type: DataTypes.INTEGER
      },
      avg_pocket_time:{
        type: DataTypes.DECIMAL(10, 2)
      },
      on_target_throws:{
        type: DataTypes.INTEGER
      },
      blk_fg_touchdowns:{
        type: DataTypes.INTEGER
      },
      blk_punt_touchdowns:{
        type: DataTypes.INTEGER
      },
      fg_return_touchdowns:{
        type: DataTypes.INTEGER
      },
      ez_rec_touchdowns:{
        type: DataTypes.INTEGER
      },
      squib_kicks:{
        type: DataTypes.INTEGER
      },
      endzone:{
        type: DataTypes.INTEGER
      },
      out_of_bounds:{
        type: DataTypes.INTEGER
      },
      total_endzone:{
        type: DataTypes.INTEGER
      },
      onside_attempts:{
        type: DataTypes.INTEGER
      },
      onside_successes:{
        type: DataTypes.INTEGER
      },
      fumbles:{
        type: DataTypes.INTEGER
      },
      lost_fumbles:{
        type: DataTypes.INTEGER
      },
      own_rec:{
        type: DataTypes.INTEGER
      },
      own_rec_yards:{
        type: DataTypes.INTEGER
      },
      opp_rec:{
        type: DataTypes.INTEGER
      },
      opp_rec_yards:{
        type: DataTypes.INTEGER
      },
      out_of_bounds:{
        type: DataTypes.INTEGER
      },
      forced_fumbles:{
        type: DataTypes.INTEGER
      },
      own_rec_tds:{
        type: DataTypes.INTEGER
      },
      opp_rec_tds:{
        type: DataTypes.INTEGER
      },
      ez_rec_tds:{
        type: DataTypes.INTEGER
      },
      made:{
        type: DataTypes.INTEGER
      },
      net_attempts:{
        type: DataTypes.INTEGER
      },
      pct:{
        type: DataTypes.INTEGER
      },
      attempts_19:{
        type: DataTypes.INTEGER
      },
      attempts_29:{
        type: DataTypes.INTEGER
      },
      attempts_39:{
        type: DataTypes.INTEGER
      },
      attempts_49:{
        type: DataTypes.INTEGER
      },
      attempts_50:{
        type: DataTypes.INTEGER
      },
      made_19:{
        type: DataTypes.INTEGER
      },
      made_29:{
        type: DataTypes.INTEGER
      },
      made_39:{
        type: DataTypes.INTEGER
      },
      made_49:{
        type: DataTypes.INTEGER
      },
      made_50:{
        type: DataTypes.INTEGER
      },
      tackles:{
        type: DataTypes.INTEGER
      },
      combined:{
        type: DataTypes.INTEGER
      },
      passes_defended:{
        type: DataTypes.INTEGER
      },
      fumble_recoveries:{
        type: DataTypes.INTEGER
      },
      qb_hits:{
        type: DataTypes.INTEGER
      },
      tloss:{
        type: DataTypes.INTEGER
      },
      tloss_yards:{
        type: DataTypes.INTEGER
      },
      safeties:{
        type: DataTypes.INTEGER
      },
      sp_tackles:{
        type: DataTypes.INTEGER
      },
      sp_assists:{
        type: DataTypes.INTEGER
      },
      sp_forced_fumbles:{
        type: DataTypes.INTEGER
      },
      sp_fumble_recoveries:{
        type: DataTypes.INTEGER
      },
      sp_blocks:{
        type: DataTypes.INTEGER
      },
      misc_tackles:{
        type: DataTypes.INTEGER
      },
      misc_assists:{
        type: DataTypes.INTEGER
      },
      misc_forced_fumbles:{
        type: DataTypes.INTEGER
      },
      misc_fumble_recoveries:{
        type: DataTypes.INTEGER
      },
      sp_own_fumble_recoveries:{
        type: DataTypes.INTEGER
      },
      sp_opp_fumble_recoveries:{
        type: DataTypes.INTEGER
      },
      def_targets:{
        type: DataTypes.INTEGER
      },
      def_comps:{
        type: DataTypes.INTEGER
      },
      missed_tackles:{
        type: DataTypes.INTEGER
      },
      batted_passes:{
        type: DataTypes.INTEGER
      },
      three_and_outs_forced:{
        type: DataTypes.INTEGER
      },
      fourth_down_stops:{
        type: DataTypes.INTEGER
      },
      missed:{
        type: DataTypes.INTEGER
      },
      status: {
        type: DataTypes.ENUM({
          values: ["A", "D"],
        }),
        defaultValue: "A", // A- Active/D - Deleted/I- Inactive
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      underscored: false,
    }
  );

  return playerStatAfterMatch;
};
