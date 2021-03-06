describe('$Scope test', function() {
    describe('$rootScope properties', function() {
        it('have no parent', function() {
            expect($rootScope.$parent).toBeFalsy();
        });
    });

    describe('creating new $scope from parent - non-isolated.', function() {
        it('$parent is set to to source $scope', function() {
            let $scope = $rootScope.$new();
            expect($scope.$parent).toBe($rootScope);
        });

        it('child have access to $parent\' prototype properties.', function() {
            $rootScope.hondaF1 = 'GP2 Engine. Argg!!!!';
            let $scope = $rootScope.$new();
            expect($scope.hondaF1).toBe($rootScope.hondaF1);
        });
    });

    describe('creating new $scope from parent - isolated.', function() {
        it('$parent is set to to source $scope', function() {
            let $scope = $rootScope.$new(true);
            expect($scope.$parent).toBe($rootScope);
        });

        it('child have NO access to $parent\' prototype properties.', function() {
            $rootScope.hondaF1 = 'GP2 Engine. Argg!!!!';
            let $scope = $rootScope.$new(true);
            expect($scope.hondaF1).toBeFalsy();
        });
    });

    describe('$emit/$on', function() {
        it('it calls $on of the same scope', function() {
            let called = false;
            $rootScope.$on('event', () => called = true);
            $rootScope.$emit('event');
            expect(called).toBeTruthy();
        });

        it ('it traverse upward, calling all $on on the way', function() {
            let called1 = false;
            $rootScope.$on('event', () => {
                called1 = true;
                expect(called2).toBeTruthy();
                expect(called3).toBeTruthy();
            });
            let $scope = $rootScope.$new();
            let called2 = false;
            $scope.$on('event', () => {
                called2 = true;
                expect(called3).toBeTruthy();
            });

            let $grand_scope = $scope.$new();
            let called3 = false;
            $grand_scope.$on('event', () => called3 = true);

            $grand_scope.$emit('event');
            expect(called1).toBeTruthy();
        });
    });

    describe('$broadcast/$on', function() {
        it('it calls $on of the same scope', function() {
            let called = false;
            $rootScope.$on('event', () => called = true);
            $rootScope.$broadcast('event');
            expect(called).toBeTruthy();
        });

        it('t calls $on on self and all of the descendants', function() {
            // Build a tree.
            let $scope_1 = $rootScope.$new();
            let $scope_2 = $rootScope.$new();

            let $grand_scope_1 = $scope_1.$new();
            let $grand_scope_2 = $scope_1.$new();

            let $grand_scope_3 = $scope_2.$new();
            let $grand_scope_4 = $scope_2.$new();

            let scopes = [
                $rootScope,
                $scope_1,
                $scope_2,
                $grand_scope_1,
                $grand_scope_2,
                $grand_scope_3,
                $grand_scope_4
            ];
            scopes.forEach(function($scope) {
                $scope._test_called = false;
               $scope.$on('event', function() {
                   $scope._test_called = true;
               });
            });

            $rootScope.$broadcast('event');

            scopes.forEach(function($scope) {
                expect($scope._test_called).toBeTruthy('$broadcast did not call all descendant scope (or self)');
            });
        });
    });

    describe('$destroy', function() {
        /*
         * Since this is made for Meteor's blaze, where destruction is
         * already handled, we don't to traverse up. Blaze will do
         * the traversal while destroying, calling $destroy along the way.
         */
        it('It only calls this for the current scope.', function() {
            let called1 = false;
            $rootScope.$on('$destroy', () => {
                called1 = true;
            });

            let $scope = $rootScope.$new();
            let called2 = false;
            $scope.$on('$destroy', () => {
                called2 = true;
            });

            $scope.$destroy();
            expect(called1).toBeFalsy();
            expect(called2).toBeTruthy();
        });
    });
});