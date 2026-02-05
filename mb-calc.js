angular
    .module("mb-calc", [
        "ngMaterial",
    ])
    .service("mbClipboard", function () {
        this.copy = text => {
            window.electronAPI.copyText(text + '');
        };
    })
    .component("mbCalc", {
        templateUrl: './mb-calc.html',
        controller: function ($mdToast, mbClipboard, $scope) {
            this.backOdds = 2;
            this.layOdds = 3;
            this.commission = 2;
            this.mode = 'qualifier'
            this.stake = 5;
            this.commissions = [0, 2, 5];
            this.stakes = [5, 10, 20, 25, 50, 100];
            this.tabs = [];
            this.selectedTab = 0;
            this.lockins = [
                { text: 'Min', value: 0 },
                { text: 'Max', value: 100 },
                { text:'EV', value: undefined },
            ]

            const fix = number => Math.round(number * 100) / 100;

            const defaultTab = {
                backOdds: 2.8,
                layOdds: 3,
                commission: 2,
                stake: 5,
                mode: 'qualifier',
                inplayBackOdds: 1.2,
                earlyPayoutLockin: 100,
                earlyPayoutPartBacks: [
                    { odds: undefined, stake: undefined },
                    { odds: undefined, stake: undefined },
                ],
            };

            this.$onInit = () => {
                window.electronAPI.onPostData((event, data) => {
                    console.log('Received from network:', data);
                    // todo: add the received data to a new tab, currently it resets the previous tab - need to investigate
                    // this.addTab();
                    // $scope.$apply();

                    const safeFloat = input => parseFloat((input || 0).toString());
                    this.backOdds = safeFloat(data.backOdds);
                    this.layOdds = safeFloat(data.layOdds);
                    this.commission = safeFloat(data.commission ?? this.commission);
                    this.stake = safeFloat(data.stake ?? this.stake);
                    this.recalculate();
                    $mdToast.showSimple(`Got new odds: ${data.backOdds} / ${data.layOdds}`);
                    $scope.$apply();
                });
            };

            this.calcQualifier = (backOdds, layOdds, backStake, layCommission, size) => {
                const layCommissionPc = layCommission / 100
                const backReturn = backOdds * backStake;
                const result = {
                    backStake: backStake,
                    profit: NaN,
                    profitPc: NaN,
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
                result.profitPc = fix(result.profit / backStake * 100);

                return result;
            };

            this.calcFreebet = (backOdds, layOdds, backStake, layCommission, size) => {
                const layCommissionPc = layCommission / 100
                const result = {
                    backStake: backStake,
                    profit: NaN,
                    profitPc: NaN,
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
                result.profitPc = fix(result.profit / backStake * 100);

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
                if (odds < 2) {
                    return 0.01;
                } else if (odds >= 2 && odds < 3) {
                    return 0.02;
                } else if (odds >= 3 && odds < 4) {
                    return 0.05;
                } else if (odds >= 4 && odds < 6) {
                    return 0.1;
                } else if (odds >= 6 && odds < 10) {
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
                let result = [odds];
                result = result
                    .concat(getOdds(odds, -1, rowCount / 2))
                    .concat(getOdds(odds, 1, rowCount / 2))
                    .sort((a, b) => a - b);
                return result;
            };

            const swap = (source, dest) => {
                dest.backOdds = source.backOdds;
                dest.layOdds = source.layOdds;
                dest.commission = source.commission;
                dest.stake = source.stake;
                dest.mode = source.mode;
                dest.inplayBackOdds = source.inplayBackOdds;
                dest.earlyPayoutLockin = source.earlyPayoutLockin;
                dest.earlyPayoutPartBacks = source.earlyPayoutPartBacks.map(p => ({...p}));
            }

            this.addTab = () => {
                this.tabs.push({ ...defaultTab });
                this.selectTab(this.tabs[this.tabs.length - 1]);
            };

            this.removeTab = (tab, event) => {
                if (!event || (event && event.which === 3)) {
                    const i = this.tabs.indexOf(tab);
                    if (i >= 0 && this.tabs.length > 1) {
                        this.selectedTab = this.selectedTab ? this.selectedTab - 1 : 0;
                        this.tabs.splice(i, 1);
                    }
                }
            };

            this.getTabLabel = tab => `${tab.stake}@${tab.backOdds}/${tab.layOdds}`;

            this.selectTab = tab => {
                swap(tab, this);
                this.recalculate();
            };

            this.recalculate = () => {
                // Tried to change the inputs step according to the odds, but it doesn't work very well:
                // A glitch happens when we go down from 3 - it calculates the step as 0.05 and the next odds become 2.95, 
                // which ruins the whole thing because we get another recalculate() from somewhere with backOdds or layOdds suddenly undefined.
                // Currently I don't understand why, but this monkey patch fixes it.
/*                 
                if (this.backOdds === undefined) {
                    this.backOdds = 2.98;
                }
                if (this.layOdds === undefined) {
                    this.layOdds = 2.98;
                }
 */             
                this.results = [];
                if (this.isEarlyPayout()) {
                    const oddsTable = this.getOddsTable(this.inplayBackOdds, 10);
                    for (let i = 0; i < oddsTable.length; i += 1) {
                        const result = calculateEarlyPayout({
                            backStake: this.stake,
                            backOdds: this.backOdds,
                            layOdds: this.layOdds,
                            layCommission: this.commission,
                            isPaidOut: true,
                            inplayBackOdds: oddsTable[i],
                            lockinPercentage: (this.earlyPayoutLockin ?? 100) / 100,
                            coverInitialLossOnly: this.earlyPayoutLockin === undefined,
                            partBacks: this.earlyPayoutPartBacks.map(p => ({
                                stake: p.stake,
                                odds: p.odds,
                            })).filter(p => p.stake && p.odds)
                        });
                        result.isCurrent = i === 5;
                        result.isProfit = result.totalIfWins >= 0;
                        result.inplayBackOdds = oddsTable[i];
                        if (result.isCurrent) {
                            this.inplayBackStake = result.inplayBackStake;
                        }
                        this.results.push(result)
                    }
                } else {
                    const oddsTable = this.getOddsTable(this.layOdds, 10);
                    for (let i = 0; i < oddsTable.length; i += 1) {
                        const result = calc(this.backOdds, oddsTable[i], this.stake, this.commission, this.isFreebet());
                        result.isCurrent = result.layOdds === this.layOdds;
                        if (result.isCurrent) {
                            this.layStake = result.layStake;
                        }
                        this.results.push(result);
                    }
                    // Change the odds input step according to current odds,
                    // it jumps over one step when going down (because we don't know the direction):
                    // E.g. getStep(4) returns 0.1, but actually if we are going down the next value should be 3.95, not 3.9 which it currently sets.
                    // But can live with that for now.
    /*              
                    this.backStep = getStep(this.backOdds);
                    this.layStep = getStep(this.layOdds);
    */
                }
                // Save results to the current tab
                const tab = this.tabs[this.selectedTab];
                swap(this, tab);
            };

            this.updateCommission = commission => {
                this.commission = commission;
                this.recalculate();
            };

            this.updateStake = stake => {
                this.stake = stake;
                this.recalculate();
            }

            this.isFreebet = () => this.mode === 'freebet';

            this.isQualifier = () => this.mode === 'qualifier';

            this.isEarlyPayout = () => this.mode === 'earlyPayout';

            this.setMode = mode => {
                this.mode = mode;
                this.recalculate();
            }

            this.select = result => {
                mbClipboard.copy(result.layStake);
                this.layOdds = result.layOdds;
                this.recalculate();
                $mdToast.showSimple(`Copied ${result.layStake}`);
            };

            this.selectEarlyPayout = result => {
                mbClipboard.copy(result.inplayBackStake);
                this.inplayBackOdds = result.inplayBackOdds;
                this.recalculate();
                $mdToast.showSimple(`Copied ${result.inplayBackStake}`);
            };

            this.updateLockin = lockin => {
                this.earlyPayoutLockin = lockin.value;
                this.recalculate();
            };

            this.clearPartBack = (partBack) => {
                partBack.stake = undefined;
                partBack.odds = undefined;
                this.recalculate();
            }

            this.copyDetails = () => {
                const line = `${this.stake}\t${this.backOdds}\t${this.layOdds}\t${this.layStake}\t${this.commission}`;
                mbClipboard.copy(line);
                $mdToast.showSimple('Current details copied');
            };

            this.addTab();
        }
    });

    // todo: fit 2up into height and make only table scrollable