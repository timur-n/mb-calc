angular
    .module("mb-calc", [
        "ngMaterial",
    ])
    .component("mbCalc", {
        template: `
<div layout="column" class="mb-calc__container">
    <md-tabs>
        <md-tab>Test1</md-tab>
        <md-tab>+</md-tab>
    </md-tabs>
    <div layout="row">
        <div class="mb-calc__back-odds-container">
            <md-input-container class="mb-calc__back-odds">
                <label>Back odds</label>
                <input type="number" ng-model="$ctrl.backOdds" ng-change="$ctrl.recalculate()">
            </md-input-container>
        </div>
        <div class="mb-calc__lay-odds-container">
            <md-input-container>
                <label>Lay odds</label>
                <input type="number" ng-model="$ctrl.layOdds" ng-change="$ctrl.recalculate()">
            </md-input-container>
        </div>
        <div class="mb-calc__commission-container" flex>
            <div class="mb-calc__commission-label">Commission</div>
            <div layout="row" layout-align="space-between center">
                <md-button ng-repeat="commission in $ctrl.commissions"
                    class="md-icon-button md-raised"
                    ng-class="{'md-primary': $ctrl.commission===commission}"
                    ng-click="$ctrl.updateCommission(commission)"
                >
                    {{commission}}%
                </md-button>
                <md-input-container class="mb-calc__commission">
                    <input type="number" min="0" ng-model="$ctrl.commission" ng-change="$ctrl.recalculate()">
                </md-input-container>
            </div>
        </div>
    </div>
    <div class="mb-calc__stake-container" layout="row" layout-align="space-between center">
        <span>Stake</span>
        <md-button ng-repeat="stake in $ctrl.stakes"
            class="md-icon-button md-raised"
            ng-class="{'md-primary': $ctrl.stake===stake}"
            ng-click="$ctrl.updateStake(stake)"
        >
            {{stake}}
        </md-button>
        <md-input-container class="mb-calc__stake">
            <input type="number" min="0" ng-model="$ctrl.stake" ng-change="$ctrl.recalculate()">
        </md-input-container>
    </div>
    <div layout="row" layout-align="space-between center">
        <md-button flex="50%" class="md-raised" ng-class="{'md-primary': !$ctrl.isFreebet}" ng-click="$ctrl.setFreebet(false)">Qualifier</md-button>
        <md-button flex class="md-raised" ng-class="{'md-warn': $ctrl.isFreebet}" ng-click="$ctrl.setFreebet(true)">Free SNR</md-button>
    </div>
    <div flex class="mb-calc__table-container" layout="row">
        <div flex>
            <table class="mb-calc__table" flex>
                <thead>
                    <th class="mb-calc__col1">Lay odds</th>
                    <th class="mb-calc__col2">Profit</th>
                    <th class="mb-calc__col3">Lay stake</th>
                    <th class="mb-calc__col4">Liability</th>
                </thead>
                <tbody>
                    <tr ng-repeat="result in $ctrl.results"
                        ng-class="{'mb-calc__row--selected': result.isCurrent, 'mb-calc__row--profit': result.isProfit, 'mb-calc__row--loss': !result.isProfit}"
                        ng-click="$ctrl.select(result)"
                    >
                        <td class="mb-calc__col1">{{result.layOdds}}</td>
                        <td class="mb-calc__col2">{{result.profit}}{{result.profitDetails}}</td>
                        <td class="mb-calc__col3" ng-class="{'mb-calc__col3--selected': result.isCurrent}">{{result.layStake}}</td>
                        <td class="mb-calc__col4">{{result.liability}}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div layout="column" style="display:none;">
            <md-button ng-repeat="step in $ctrl.steps" class="md-icon-button md-raised">
                {{step}}
            </md-button>
        </div>
    </div>
</div>`,
        controller: function($mdToast) {
            this.backOdds = 2.0;
            this.layOdds = 3.0;
            this.commission = 2;
            this.isFreebet = false;
            this.stake = 5;
            this.commissions = [0, 2, 5];
            this.stakes = [5, 10, 20, 25, 50, 100];
            this.steps = [0.01, 0.05, 0.1, 0.5, 1];

            this.updateStep = step => {
                this.step = step;
            }
            this.updateStep(0.1);

            const fix = number => Math.round(number * 100) / 100;

            this.calcQualifier = (backOdds, layOdds, backStake, layCommission, size) => {
                const layCommissionPc = layCommission / 100
                const backReturn = backOdds * backStake;
                const result = {
                    backStake: backStake,
                    profit: NaN,
                    isProfit: false,
                    layOdds: layOdds,
                    valid: true
                };

                // Lay stake, convert to fixed immediately to match betfair's numbers
                result.layStake = backReturn / (layOdds - layCommissionPc);
                result.layStake = result.layStake.toFixed(2) * 1.0;
                result.layProfit = result.layStake * (1 - layCommissionPc);

                // Lay risk (liability)
                result.liability = result.layStake * (layOdds - 1);
                result.liability = result.liability.toFixed(2) * 1.0;

                // Profit/Loss
                result.profit = fix(backReturn - result.liability - backStake);
                result.lostProfit = fix(result.layProfit - backStake);
                result.profitDetails = " / " + result.lostProfit;

                result.isProfit = result.lostProfit >= 0;
                result.isOk = !result.isProfit && (Math.abs(result.lostProfit) / backStake < 0.1);
                result.enough = size * 1.0 >= result.layStake;

                return result;
            };

            this.calcFreebet = (backOdds, layOdds, backStake, layCommission, size) => {
                const layCommissionPc = layCommission / 100
                const result = {
                    backStake: backStake,
                    profit: NaN,
                    isProfit: false,
                    layOdds: layOdds,
                    valid: true
                };

                var backReturnSNR = (backOdds - 1) * backStake;

                result.layStake = backReturnSNR / (layOdds - layCommissionPc);
                result.layStake = result.layStake.toFixed(2) * 1.0;

                // Lay risk (liability)
                result.liability = result.layStake * (layOdds - 1);
                result.liability = result.liability.toFixed(2);

                // Profit/Loss
                result.backProfit = backReturnSNR - result.liability;
                result.layProfit = result.layStake * (1 - layCommissionPc);
                result.profit = fix(result.backProfit);
                result.profitDetails = " (" + fix(result.profit / backStake * 100) + "%)";

                result.isProfit = true;
                result.isOk = false;
                result.enough = size * 1.0 >= result.layStake;

                return result;
            }

            const calc = (backOdds, layOdds, backStake, comm, isFreebet) => {
                if (isFreebet) {
                    return this.calcFreebet(backOdds, layOdds, backStake, comm);
                } else {
                    return this.calcQualifier(backOdds, layOdds, backStake, comm);
                }
            };

            const getStep = odds => {
                if (odds < 3) {
                    return 0.01;
                } else if (odds >= 3 && odds < 4) {
                    return 0.05;
                } else if (odds >= 4 && odds < 5) {
                    return 0.1;
                } else if (odds >= 5 && odds < 10) {
                    return 0.2;
                } else if (odds >= 10 && odds < 20) {
                    return 0.5;
                } else if (odds >= 20 && odds < 30) {
                    return 1;
                } else if (odds >= 30 && odds < 80) {
                    return 2;
                } else {
                    return 5;
                }
            };

            const getOdds = (start, dir, count) => {
                let done = 0;
                let step = 0.01;
                let current = start;
                let result = [];
                do {
                    step = getStep(current + dir * step);
                    current += dir * step;
                    result.push(fix(current));
                    done += 1;
                }
                while (done < count);
                return result;
            };

            this.getOddsTable = (odds, rowCount) => {
                let result = [this.layOdds];
                result = result
                    .concat(getOdds(odds, -1, rowCount / 2))
                    .concat(getOdds(odds, 1, rowCount / 2))
                    .sort((a, b) => a - b);
                return result;
            };

            this.recalculate = () => {
                this.results = [];
                const oddsTable = this.getOddsTable(this.layOdds, 10);
                for (let i = 0; i < oddsTable.length; i += 1) {
                    const result = calc(this.backOdds, oddsTable[i], this.stake, this.commission, this.isFreebet);
                    result.isCurrent = result.layOdds === this.layOdds;
                    this.results.push(result);
                }
                // todo: change input step
            };
            this.recalculate();

            this.updateCommission = commission => {
                this.commission = commission;
                this.recalculate();
            };

            this.updateStake = stake => {
                this.stake = stake;
                this.recalculate();
            }

            this.setFreebet = isFreebet => {
                this.isFreebet = isFreebet;
                this.recalculate();
            }

            this.select = result => {
                const {
                    clipboard
                } = require('electron');
                clipboard.writeText("" + result.layStake);
                this.layOdds = result.layOdds;
                this.recalculate();
                $mdToast.showSimple("Copied " + result.layStake);
            };
        }
    });