/**
 * scope-polyfill.js
 *
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
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { $data } from './data-polyfill';
import { } from './scope';
import { isDefined, noop, msie } from './lib';
import { template_scope_id_attribute_name } from './const';

function is_leaf_template () {
    return this.children().length === 0
}

/**
 * If the only one node (firstNode == lastNode), then attach a $scope to all of them.
 */
function attach_$scope_to_element () {
    let single_node = this.firstNode == this.lastNode;
    if (single_node) {
        let $element = $(this.firstNode);
        let already_have_scope = $element.attr(template_scope_id_attribute_name);

        if (already_have_scope) {
            let currentElemScope = $element.data('$scope');
            let currentElemScopeIsMoreSpecific = this.$scope.isPrototypeOf(currentElemScope);

            if (!currentElemScopeIsMoreSpecific) {
                $element.attr(template_scope_id_attribute_name, this.$uid);
                $element.data('$scope', this.$scope);
            }
        } else {
            $element.attr(template_scope_id_attribute_name, this.$uid);
            $element.data('$scope', this.$scope);
        }
    }
}

Template.onCreated(function() {
    this.$postLinked = false;
    this.$preLinked = false;
    this.new_scope = this.new_scope || false;
    this.$uid = _.uniqueId();

    let $scopedParentTemplate = this.parent(t => isDefined(t.$scope), true);
    this.$isRootTemplate = !$scopedParentTemplate;
    this.$scopedParentTemplate = $scopedParentTemplate;  // Cache to be used for onRendered and anywhere else.

    /*
     * Since blaze traverse from the very top at start, then "body" template should be considered
     * the root template since it will be the first one traversed (onCreated) and last one (onRendered).
     * And naturally, no parent template (thus no parent template with $scope).
     */
    if (this.$isRootTemplate) {
        // We don't just give $rootScope since, there might be multiple "rootScope" (templates without
        // parent).
        this.$scope = $rootScope.$new();
    } else {
        let $parent =  $scopedParentTemplate.$scope;

        if (this.new_scope) {
            this.$scope = $parent.$new();
        } else {
            this.$scope = $parent;
        }
    }

    $(this).triggerHandler('$scopeCreated');  // This is so other Template.onCreated can use this.

    let $preLinkHandler = () => {
        $(this).trigger('$preLink');  // Trigger $preLink for this $scope.
        this.$preLinked = true;
        $(this).trigger('$$preLink');  // Once $preLink for this scope is called, call $preLink for the children.
    };
    this.$preLinkHandler = $preLinkHandler;

    let $postLinkHandler = () => {
        let childTemplates = this.children();
        let allChildrenPostLinked = childTemplates.reduce((prevVal, currentVal, index) => {
            return currentVal && childTemplates[index].$postLinked;
        }, true);
        if (!this.$postLinked && allChildrenPostLinked) {
            $(this).triggerHandler('$postLink');
            this.$postLinked = true;
            this.$scopedParentTemplate && $(this.$scopedParentTemplate).triggerHandler('$$postLink');
        }
    };
    this.$postLinkHandler = $postLinkHandler;
    $(this).on('$$postLink', $postLinkHandler);

    // Debugging.
    // $(this).on('$preLink', () => console.log('$preLink', this.view.name));
    // $(this).on('$postLink', () => console.log('$postLink', this.view.name));

    this.view.onViewReady(() => $(this).trigger('$postRender'));
});

Template.onRenderedFirst(function() {
    attach_$scope_to_element.call(this);

    this.$scope.$on('$destroy', function() { delete $data[this.$uid]; });

    if (this.$isRootTemplate) {
        // Since he root template is rendered last (non-dynamic), we will start $preLink calls
        // when we render this thing.
        $(this).on('$postRender', this.$preLinkHandler.bind(this));  // Finish rendering.
    } else {
        /*
         * If for some reason parent already have preLink called, then onRendered for this template,
         * $preLink will be called for this parent. Otherwise, we set up a listener for parent's $$preLink.
         */
        if (!this.$scopedParentTemplate.$preLinked) {
            $(this.$scopedParentTemplate).on('$$preLink', this.$preLinkHandler);
        } else {
            $(this).on('$postRender', this.$preLinkHandler.bind(this));  // Finish rendering.
        }
    }

    // We hit bottom, start traversing back up.
    // Note: Can only be called here since this is the time in which we can call this.children.
    if (is_leaf_template.call(this)) {
        if (!this.$preLinked) {
            $(this).on('$$preLink', this.$postLinkHandler);
        } else {
            $(this).on('$postRender', this.$postLinkHandler.bind(this));  // Finish rendering.
        }
    }
});

Template.onDestroyed(function() {
    if (this.new_scope || this.$rootScope) {
        this.$scope.$destroy();
    }

    // Just because Template is destroyed, this callbacks can still be called,
    // causing ugly effects (if there are rendering functions inside callback),
    // rendering can still occur). Hence, destroy.
    $(this).off('$preLink');
    $(this).off('$postLink');
    $(this).off('$$preLink');
    $(this).off('$$postLink');
    $(this).off('$postRender');
    $(this).off('$scopeCreated');
});

export { $data };