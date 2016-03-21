let static_1_created = false;
let static_1_rendered = false;
let static_1_destroyed = false;
let static_1_cbs = {
    preLink: _.noop,
    postLink: _.noop
}

Template.static1.onCreated(function() {
    static_1_created = true;
    $(this).on('$preLink', static_1_cbs.preLink);
    $(this).on('$postLink', static_1_cbs.postLink);
});

Template.static1.onRendered(function() {
    static_1_rendered = true;
});

Template.static1.onDestroyed(function() {
    static_1_destroyed = true;
});

describe('template-scope - static-templates', function () {
    describe('Base case, just one template', function () {
        beforeEach(function() {
            // Reset the life cycle flags.
            static_1_created = false;
            static_1_rendered = false;
            static_1_destroyed = false;
        });

        it ('calls $preLink then $postLink', function() {
            let preLink = false;
            let postLink = false;
            static_1_cbs.preLink = function() {
                expect(preLink).toBe(false, 'Template.static1, $preLink was called twice.');
                expect(postLink).toBe(false, 'Template.static1, $postLink was called before $preLink.');
                preLink = true;
            };
            static_1_cbs.postLink = function() {
                expect(preLink).toBe(true, 'Template.static1, $preLink was not called before $postLink.');
                expect(postLink).toBe(false, 'Template.static1, $postLink was called twice.');
                postLink = true;
            };

            var view = Blaze.render(Template.static1, $('body')[0]);
            expect(static_1_created).toBe(true, 'Template.static1 not created');
            Tracker.flush();
            expect(static_1_rendered).toBe(true, 'Template.static1 not rendered');
            Blaze.remove(view);
            expect(static_1_destroyed).toBe(true, 'Template.static1 not destroyed');
        });

        it ('$emit calls the $on in the same template', function() {

        });
    });

    describe('Case with two nested templates', function() {

    });

    describe('Case with three nested templates', function() {

    });

    describe('Case with firstNode=lastNode (template have a root DOM element).', function() {

    });
});