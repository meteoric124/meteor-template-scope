let dynamic2_created = false;
let dynamic2_rendered = false;
let dynamic2_destroyed = false;
let dynamic2_cbs = {
    preLink: _.noop,
    postLink: _.noop
};
let dynamic2_instance = null;
let renderDynamic1 = new ReactiveVar(false);

Template.dynamic2.onCreated(function() {
    this.new_scope = true;

    dynamic2_instance = this;
    dynamic2_created = true;
    $(this).on('$preLink', dynamic2_cbs.preLink);
    $(this).on('$postLink', dynamic2_cbs.postLink);
});
Template.dynamic2.onRendered(function() {
    dynamic2_rendered = true;
});
Template.dynamic2.onDestroyed(function() {
    dynamic2_destroyed = true;
});
Template.dynamic2.helpers({
    renderDynamic() { return renderDynamic1.get(); }
});

let dynamic1_created = false;
let dynamic1_rendered = false;
let dynamic1_destroyed = false;
let dynamic1_cbs = {
    preLink: _.noop,
    postLink: _.noop
};
let dynamic1_instance = null;

Template.dynamic1.onCreated(function() {
    this.new_scope = true;

    dynamic1_instance = this;
    dynamic1_created = true;
    $(this).on('$preLink', dynamic1_cbs.preLink);
    $(this).on('$postLink', dynamic1_cbs.postLink);
});
Template.dynamic1.onRendered(function() {
    dynamic1_rendered = true;
});
Template.dynamic1.onDestroyed(function() {
    dynamic1_destroyed = true;
});

describe('template-scope - dynamic-templates', function () {
    it ('dynamic templates are traversed down/up in its own, not bothering already traversed templates', function() {
        let preLinkCallStack = [];
        let postLinkCallStack = [];

        dynamic2_cbs.preLink = function() {
            let children = dynamic2_instance.children();
            children.forEach(c => $(c).on('$preLink', function() {
                preLinkCallStack.push(this);
            }));
            children.forEach(c => $(c).on('$postLink', function() {
                postLinkCallStack.push(this);
            }));
            preLinkCallStack.push(this);
        };

        dynamic2_cbs.postLink = function() {
            postLinkCallStack.push(this);
        };

        var view = Blaze.render(Template.dynamic2, $('body')[0]);
        Tracker.flush();

        // Prior to dynamically adding Template.dynamic1
        expect(preLinkCallStack.map(t => t.view.name)).toEqual([
            'Template.dynamic2',
            'Template.static1'
        ], 'Template.dynamic2 was traversed by $preLink wrong.');
        expect(postLinkCallStack.map(t => t.view.name)).toEqual([
            'Template.static1',
            'Template.dynamic2'
        ], 'Template.dynamic2 was traversed by $postLink wrong.');
        
        // Dynamically add.
        dynamic1_cbs.preLink = function() {
            preLinkCallStack.push(this);
        };
        dynamic1_cbs.postLink = function() {
            postLinkCallStack.push(this);
        };
        renderDynamic1.set(true);
        Tracker.flush();

        expect(preLinkCallStack.map(t => t.view.name)).toEqual([
            'Template.dynamic2',
            'Template.static1',
            'Template.dynamic1'
        ], 'Template.dynamic2 was traversed by $preLink wrong.');
        expect(postLinkCallStack.map(t => t.view.name)).toEqual([
            'Template.static1',
            'Template.dynamic2',
            'Template.dynamic1'
        ], 'Template.dynamic2 was traversed by $postLink wrong.');

        Blaze.remove(view);
        expect(dynamic2_destroyed).toBe(true, 'Template.static2 not destroyed');
    });
});