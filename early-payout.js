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
  paidOutBackOdds?: number;
  backMaxPayout?: number;

  // partial cashouts
  partBacks?: PartBack[];

  // slider value already normalised (0–1)
  lockinPercentage?: number;
}

export interface EarlyPayoutOutput {
  backWin: number;
  backLoss: number;

  layStake: number;
  liability: number;
  layWin: number;
  layLoss: number;

  paidOutBackStake: number;
  paidOutBackWin: number;
  paidOutBackLoss: number;

  totalProfitBack: number;
  totalProfitLay: number;
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
    paidOutBackOdds,
    backMaxPayout,
    partBacks = [],
    lockinPercentage = 1
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

  // ---- Partial cashouts ----
  let partBackTotalStake = 0;
  let partBackTotalProfit = 0;

  for (const p of partBacks) {
    partBackTotalStake += p.stake;
    partBackTotalProfit += p.stake * (p.odds - 1);
  }

  // ---- Early payout ----
  let paidOutBackStake = 0;
  let paidOutBackWin = 0;
  let paidOutBackLoss = 0;

  if (isPaidOut && paidOutBackOdds && paidOutBackOdds > 1) {
    let maxBackReturn = backStake * backOdds;

    if (backMaxPayout != null && backMaxPayout < maxBackReturn) {
      maxBackReturn = backMaxPayout;
    }

    paidOutBackStake = round(
      (
        maxBackReturn
        - backStake * backOdds
        + layStake * layOdds
        - partBackTotalStake
        - partBackTotalProfit
      ) / paidOutBackOdds * lockinPercentage
    );

    paidOutBackStake = Math.max(0, paidOutBackStake);

    paidOutBackWin = round(
      paidOutBackStake * (paidOutBackOdds - 1)
    );

    paidOutBackLoss = -paidOutBackStake;

    layLoss = round(
      -layStake * (layOdds - 1)
      + partBackTotalProfit
      + paidOutBackWin
    );

    layWin = round(
      layStake - partBackTotalStake - paidOutBackStake
    );
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

  return {
    backWin,
    backLoss,
    layStake,
    liability,
    layWin,
    layLoss,
    paidOutBackStake,
    paidOutBackWin,
    paidOutBackLoss,
    totalProfitBack,
    totalProfitLay
  };
}
})();
