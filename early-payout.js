/*
export interface PartBack {
  stake: number;
  odds: number;
}

export interface EarlyPayoutInput {
  backStake: number;
  backOdds: number;

  layOdds: number;
  layCommission: number; // percent (e.g. 2)

  // optional overrides
  actualLayStake?: number;

  // early payout
  isPaidOut: boolean;
  inplayBackOdds?: number;
  backMaxPayout?: number;

  // partial cashouts
  partBacks?: PartBack[];

  // Value in range 0–1
  lockinPercentage?: number;
  coverInitialLossOnly?: boolean;
}

export interface EarlyPayoutOutput {
  backWin: number;
  backLoss: number;

  layStake: number;
  liability: number;
  layWin: number;
  layLoss: number;

  inplayBackStake: number;
  inplayBackWin: number;
  inplayBackLoss: number;

  totalProfitBack: number;
  totalProfitLay: number;

  totalIfWins: number;
  totalIfLoses: number;

  initialProfitLoss: number;
  stakeToCoverInitialLoss: number;
}
*/
(function() {
const round = (n/*: number*/, d = 2)/* : number */ =>
  Math.round(n * 10 ** d) / 10 ** d;

window.calculateEarlyPayout = function calculateEarlyPayout(
  input/* : EarlyPayoutInput */
)/* : EarlyPayoutOutput */ {
  const {
    backStake,
    backOdds,
    layOdds,
    layCommission,
    actualLayStake,
    isPaidOut,
    inplayBackOdds,
    backMaxPayout,
    partBacks = [],
    lockinPercentage = 1,
    coverInitialLossOnly = false,
  } = input;

  // ---- Back bet ----
  const backWin = round(backStake * (backOdds - 1));
  const backLoss = -backStake;

  // ---- Lay bet ----
  let layStake = round(
    (backStake * backOdds) /
    (layOdds - layCommission / 100)
  );

  if (actualLayStake != null) {
    layStake = actualLayStake;
  }

  const liability = round(layStake * (layOdds - 1));

  let layWin = round(layStake * (1 - layCommission / 100));
  let layLoss = round(-layStake * (layOdds - 1));

  const initialProfitLoss = backWin - liability;
  const stakeToCoverInitialLoss = round(Math.abs(initialProfitLoss) / (inplayBackOdds - 1));

  // ---- Partial cashouts ----
  let partBackTotalStake = 0;
  let partBackTotalProfit = 0;

  for (const p of partBacks) {
    partBackTotalStake += p.stake;
    partBackTotalProfit += p.stake * (p.odds - 1);
  }

  // ---- Early payout ----
  let inplayBackStake = 0;
  let inplayBackWin = 0;
  let inplayBackLoss = 0;

  if (isPaidOut && inplayBackOdds && inplayBackOdds > 1) {
    let maxBackReturn = backStake * backOdds;

    if (backMaxPayout != null && backMaxPayout < maxBackReturn) {
      maxBackReturn = backMaxPayout;
    }

    inplayBackStake = round(
      (
        maxBackReturn
        - backStake * backOdds
        + layStake * layOdds
        - partBackTotalStake
        - partBackTotalProfit
      ) / inplayBackOdds * lockinPercentage
    );

    inplayBackStake = coverInitialLossOnly ? stakeToCoverInitialLoss : Math.max(0, inplayBackStake);

    inplayBackWin = round(inplayBackStake * (inplayBackOdds - 1));

    inplayBackLoss = -inplayBackStake;

    layLoss = round(
      -layStake * (layOdds - 1)
      + partBackTotalProfit
      + inplayBackWin
    );

    layWin = round(layStake - partBackTotalStake - inplayBackStake);
  }

  // ---- Commission adjustments (only if positive) ----
  if (layWin > 0) {
    layWin = round(layWin * (1 - layCommission / 100));
  }

  if (layLoss > 0) {
    layLoss = round(layLoss * (1 - layCommission / 100));
  }

  // ---- Totals ----
  const totalProfitBack = round(backWin + layLoss);
  const totalProfitLay = round(layWin + backLoss);
  const totalIfWins = round(backWin + layLoss);
  const totalIfLoses = round(backWin + layWin);

  return {
    backWin,
    backLoss,
    layStake,
    liability,
    layWin,
    layLoss,
    inplayBackStake,
    inplayBackWin,
    inplayBackLoss,
    totalProfitBack,
    totalProfitLay,
    totalIfWins,
    totalIfLoses,
    initialProfitLoss,
    stakeToCoverInitialLoss,
  };
}
})();
