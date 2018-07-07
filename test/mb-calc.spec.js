describe('mb-calc', () => {

    beforeEach(module("mb-calc"));

    const createCtrl = () => {
        let ctrl;
        inject($componentController => ctrl = $componentController("mbCalc", {}));
        return ctrl;
    }

    it('should calculate lower and higher odds', inject(($rootScope, $compile) => {
        const c = createCtrl();
        let t = c.getOddsTable(2, 10);
        expect(t).toEqual([1.95, 1.96, 1.97, 1.98, 1.99, 2, 2.01, 2.02, 2.03, 2.04, 2.05]);
        t = c.getOddsTable(3, 10);
        expect(t).toEqual([2.95, 2.96, 2.97, 2.98, 2.99, 3, 3.05, 3.1, 3.15, 3.2, 3.25]);
        t = c.getOddsTable(6, 10);
        expect(t).toEqual([5.5, 5.6, 5.7, 5.8, 5.9, 6, 6.2, 6.4, 6.6, 6.8, 7]);
        t = c.getOddsTable(10, 10);
        expect(t).toEqual([9, 9.2, 9.4, 9.6, 9.8, 10, 10.5, 11, 11.5, 12, 12.5]);
        t = c.getOddsTable(3, 10);
        expect(t).toEqual([2.95, 2.96, 2.97, 2.98, 2.99, 3, 3.05, 3.1, 3.15, 3.2, 3.25]);
    }));

    it('should have 1 tab by default', inject(($rootScope, $compile) => {
        const c = createCtrl();
        expect(c.tabs).toEqual([{
            backOdds: 2,
            layOdds: 3,
            commission: 2,
            stake: 5,
            isFreebet: false
        }]);
    }));

    it('should add a tab', inject(($rootScope, $compile) => {
        const c = createCtrl();
        c.backOdds = 10;
        c.layOdds = 11;
        c.commission = 3;
        c.stake = 80;
        c.isFreebet = true;
        c.recalculate();
        c.addTab();
        expect(c.tabs).toEqual([{
            backOdds: 10,
            layOdds: 11,
            commission: 3,
            stake: 80,
            isFreebet: true
        }, {
            backOdds: 2,
            layOdds: 3,
            commission: 2,
            stake: 5,
            isFreebet: false
        }]);
    }));
});