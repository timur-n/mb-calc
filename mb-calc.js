angular
    .module("mb-calc", [
        "ngMaterial",
    ])
    .component("mbCalc", {
        template: `
<div layout="column" class="mb-calc__container">
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
            &pound;{{stake}}
        </md-button>
        <md-input-container class="mb-calc__stake">
            <input type="number" min="0" ng-model="$ctrl.stake" ng-change="$ctrl.recalculate()">
        </md-input-container>
    </div>
    <div layout="row" layout-align="space-between center">
        <md-button flex="50%" class="md-raised" ng-class="{'md-primary': !$ctrl.isFreebet}" ng-click="$ctrl.isFreebet = false">Qualifier</md-button>
        <md-button flex class="md-raised" ng-class="{'md-warn': $ctrl.isFreebet}" ng-click="$ctrl.isFreebet = true">Free SNR</md-button>
    </div>
    <div flex class="mb-calc__table-container">
        <table class="mb-calc__table">
            <thead>
                <th class="mb-calc__col1">Lay odds</th>
                <th class="mb-calc__col2">Profit</th>
                <th class="mb-calc__col3">Lay stake</th>
                <th class="mb-calc__col4">Liability</th>
            </thead>
            <tbody>
                <tr ng-repeat="result in $ctrl.results">
                    <td class="mb-calc__col1">{{result.layOdds}}</td>
                    <td class="mb-calc__col2">{{result.profitLoss}}</td>
                    <td class="mb-calc__col3">{{result.layStake}}</td>
                    <td class="mb-calc__col4">{{result.liability}}</td>
                </tr>
            </tbody>
        </table>
    </div>
</div>`,
        controller: function() {
            this.backOdds = 2.0;
            this.layOdds = 3.0;
            this.commission = 2;
            this.isFreebet = false;
            this.stake = 5;
            this.commissions = [0, 2, 5];
            this.stakes = [5, 10, 20, 25, 50, 100];

            this.updateStep = () => {
                this.step = 0.1;
            }
            this.updateStep();

            const calc = (layOdds, backStake, comm, isFreebet) => ({
                layOdds,
                layStake: 1,
                liability: 2,
                profitLoss: 3,
            });

            this.recalculate = () => {
                this.results = [];
                const low = this.layOdds - 10;
                const high = this.layOdds + 10;
                const step = 1;
                for (let i = low; i < high; i += step) {
                    const result = calc(i, this.backStake, this.commission, this.isFreebet);
                    result.isCurrent = result.layOdds === this.layOdds;
                    this.results.push(result);
                }
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
        }
    });