# meteor-template-scope
Minimal replication of the angular's $scope mechanism.

## Example:
In your markup,
```handlebar
<template name="foo">
  Hello
</template>

<template name="bar">
  {{> foo}}
</template>
```

In your javascript,
```javascript
Template.bar.onCreated(function() {
  $(this).on('$scopeCreated', function() {
    // this.$scope is now available.
  });
});

Template.bar.onRendered(function() {
  // Note: this.$scope is always available in onRendered.

  $(this).on('$preLink', function() {
    // Called while traversing downwards from root template
  });

  $(this).on('$postLink', function() {
     // Called while traversing updward from leaf template.
     // Currently, this traversal is like DFS from leaf.
     // A natural consequence of Blaze's destruction sequence.
  });
});

Template.bar.onDestroyed(function() {
  // No need to do destroy this.$scope, this will be handled.
  // If you must destroy this.$scope prematurely, this.$scope.$destroy()
  // will do the job.
});
```

For the template above, the **$preLink** traversal is:
1. bar
2. foo

On the otherhand, the **$postLink** traversal is:
1. foo
2. bar

## Development
If you want to contribute, feel free to fork and make a pull request.

To run test locally:
1. Add this to packages/ directory of some dummy meteor project.
2. Execute: `VELOCITY_TEST_PACKAGES=1 meteor test-packages --driver-package velocity:html-reporter jandres:template-scope`