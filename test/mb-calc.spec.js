describe('mb-calc', () => {

    beforeEach(module("mb-calc"));

    const createCtrl = () => {
        let ctrl;
        inject($componentController => ctrl = $componentController("mbCalc", {}));
        return ctrl;
    }

    it('should calculate lower and higher odds', inject(($rootScope, $compile) => {
        // const c = createCtrl();
        const scope = $rootScope.new();
        const e = $compile(`<mb-calc></mb-calc>`, scope);
        scope.$apply();
        expect(c.step).toBe(1);
    }));
});