Template.onCreated(function() {
    this.postLinked = false;
    this.preLinked = false;

    let parentTemplate = this.parent(t => isDefined(t.$scope), true);
    this.rootTemplate = !parentTemplate;
    this.leafTemplate = false;
    this._scoped_parentTemplate = parentTemplate;  // Cache to be used for onRendered and anywhere else.

    /*
     * Since blaze traverse from the very top at start, then "body" template should be considered
     * the root template since it will be the first one traversed and naturally, no parent template
     * (thus no parent template with $scope).
     */
    if (this.rootTemplate) {
        this.$scope = this.$scope = $rootScope;
    } else {
        let $parent =  parentTemplate.$scope;
        this.$scope = $parent.$new();
    }
    $(this).triggerHandler('$scopeCreated');  // This is so other Template.onCreated can use this.

    let preLinkHandler = () => {
        $(this).trigger('$preLink');  // Trigger $preLink for this $scope.
        this.preLinked = true;
        $(this).trigger('$$preLink');  // Once $preLink for this scope is called, call $preLink for the children.
    };
    this._preLinkHandler = preLinkHandler;

    if (this.rootTemplate) {
        $(this).on('$rendered', preLinkHandler);
    } else {
        /*
         * If for some reason parent already have preLink called, then onRendered for this template,
         * $preLink will be called for this parent. Otherwise, we set up a listener for parent's $$preLink.
         */
        if (!parentTemplate.preLinked) {
            $(parentTemplate).on('$$preLink', preLinkHandler);
        } else {
            // will be called on onRendered.
        }
    }

    //$(this).on('$preLink', () => console.log('$preLink', this.view.name));
    //$(this).on('$postLink', () => console.log('$postLink', this.view.name));
});

Template.onRendered(function() {
    /*
     * If preLinked is already called in he parent, call preLink immediately.
     * This is the case when new elements are appended in which
     * this._scoped_parentTemplate.preLinked is already set to true.
     */
    let parent_preLinked = this._scoped_parentTemplate && this._scoped_parentTemplate.preLinked;
    if (parent_preLinked) {
        this._preLinkHandler();
    }

    // Assuming this will be called last, due to being added in startup. Template.onRendered will be added
    // during compile time.
    $(this).trigger('$rendered');

    let postLinkHandler = () => {
        if (!this.postLinked) {
            $(this).triggerHandler('$postLink');
            this._scoped_parentTemplate && $(this._scoped_parentTemplate).triggerHandler('$postLink');
            this.postLinked = true;
        }
    };

    this.leafTemplate = this.children().length === 0;

    if (this.leafTemplate) {
        if (!this.preLinked) {
            $(this).on('$$preLink', postLinkHandler);
        } else {
            postLinkHandler();
        }
    }

    /*
     * If the only one node (firstNode == lastNode), then attach a $scope to all of them.
     */
    let single_node = this.firstNode == this.lastNode;
    if (single_node) {
        $(this.firstNode).data('$scope', this.$scope);
    }
});

Template.onDestroyed(function() {
    this.$scope.$destroy();
});