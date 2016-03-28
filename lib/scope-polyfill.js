/**
 * Concept:
 *
 * Start:
 * $isRootTemplate.onRendered => $isRootTemplate.child.$preLink => $isRootTemplate.child.$$preLink
 *
 * In between:
 * parentTemplate.$$preLink => childTemplate.$preLink => childTemplate.$$preLink => ...
 * childTemplate.$postLinked ? childTemplate.$$postLink => childTemplate.$postLink => parentTemplate.$$postlink => ... : noop
 *
 * In bottom:
 * leafTemplate.$$preLink => leafTemplate.$postLink => leafTemplate.parentTemplate.$$postLink => ...
 */

function is_leaf_template () {
    return this.children().length === 0
}

/**
 * If the only one node (firstNode == lastNode), then attach a $scope to all of them.
 */
function attach_$scope_to_element () {
    let single_node = this.firstNode == this.lastNode;
    if (single_node) {
        $(this.firstNode).attr('uid', this.$uid);
        $(this.firstNode).$data('$scope', this.$scope);
    }
}

Template.onCreated(function() {
    this.$postLinked = false;
    this.$preLinked = false;

    let $scopedParentTemplate = this.parent(t => isDefined(t.$scope), true);
    this.$isRootTemplate = !$scopedParentTemplate;
    this.$scopedParentTemplate = $scopedParentTemplate;  // Cache to be used for onRendered and anywhere else.

    /*
     * Since blaze traverse from the very top at start, then "body" template should be considered
     * the root template since it will be the first one traversed (onCreated) and last one (onRendered).
     * And naturally, no parent template (thus no parent template with $scope).
     */
    if (this.$isRootTemplate) {
        this.$scope = $rootScope;
    } else {
        let $parent =  $scopedParentTemplate.$scope;
        this.$scope = $parent.$new();
    }
    this.$scope._templateInstance = this;
    $(this).triggerHandler('$scopeCreated');  // This is so other Template.onCreated can use this.

    let $preLinkHandler = () => {
        $(this).trigger('$preLink');  // Trigger $preLink for this $scope.
        this.$preLinked = true;
        $(this).trigger('$$preLink');  // Once $preLink for this scope is called, call $preLink for the children.
    };
    this.$preLinkHandler = $preLinkHandler;

    let $postLinkHandler = () => {
        if (!this.$postLinked) {
            $(this).triggerHandler('$postLink');
            this.$postLinked = true;
            this.$scopedParentTemplate && $(this.$scopedParentTemplate).triggerHandler('$$postLink');
        }
    };
    this.$postLinkHandler = $postLinkHandler;
    $(this).on('$$postLink', $postLinkHandler);

    // Debugging.
    //$(this).on('$preLink', () => console.log('$preLink', this.view.name));
    //$(this).on('$postLink', () => console.log('$postLink', this.view.name));
    this.$uid = _.uniqueId('meteoric_');
});

Template.onRendered(function() {
    attach_$scope_to_element.call(this);

    // We hit bottom, start traversing back up.
    if (is_leaf_template.call(this)) {
        if (!this.$preLinked) {
            $(this).on('$$preLink', this.$postLinkHandler);
        } else {
            this.$postLinkHandler();
        }
    }

    /*
     * If $preLinked is already called in the parent, call preLink immediately.
     * This is the case when new elements are appended in which
     * this.$scopedParentTemplate.$preLinked is already set to true.
     */
    if (this.$isRootTemplate) {
        this.$preLinkHandler();
    } else {
        /*
         * If for some reason parent already have preLink called, then onRendered for this template,
         * $preLink will be called for this parent. Otherwise, we set up a listener for parent's $$preLink.
         */
        if (!this.$scopedParentTemplate.$preLinked) {
            $(this.$scopedParentTemplate).on('$$preLink', this.$preLinkHandler);
        } else {
            this.$preLinkHandler();
        }
    }
});

Template.onDestroyed(function() {
    this.$scope.$destroy();
});