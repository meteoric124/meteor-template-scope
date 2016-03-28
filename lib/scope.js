function $on(name, listener) {
    var namedListeners = this.$$listeners[name];
    if (!namedListeners) {
        this.$$listeners[name] = namedListeners = [];
    }
    namedListeners.push(listener);

    var current = this;
    do {
        if (!current.$$listenerCount[name]) {
            current.$$listenerCount[name] = 0;
        }
        current.$$listenerCount[name]++;

    } while ((current = current.$parent) && isDefined(current.$$listenerCount));

    var self = this;
    return function() {
        var indexOfListener = namedListeners.indexOf(listener);
        if (indexOfListener !== -1) {
            namedListeners[indexOfListener] = null;
            decrementListenerCount(self, 1, name);
        }
    };
}

function $emit(name, args) {
    var empty = [],
        namedListeners,
        scope = this,
        stopPropagation = false,
        event = {
            name: name,
            targetScope: scope,
            stopPropagation: function() {stopPropagation = true;},
            preventDefault: function() {
                event.defaultPrevented = true;
            },
            defaultPrevented: false
        },
        listenerArgs = concat([event], arguments, 1),
        i, length;

    do {
        namedListeners = scope.$$listeners[name] || empty;
        event.currentScope = scope;
        for (i = 0, length = namedListeners.length; i < length; i++) {

            // if listeners were deregistered, defragment the array
            if (!namedListeners[i]) {
                namedListeners.splice(i, 1);
                i--;
                length--;
                continue;
            }
            try {
                //allow all listeners attached to the current scope to run
                namedListeners[i].apply(null, listenerArgs);
            } catch (e) {
                throw e;
            }
        }
        //if any listener on the current scope stops propagation, prevent bubbling
        if (stopPropagation) {
            event.currentScope = null;
            return event;
        }
        //traverse upwards
        scope = scope.$parent;
    } while (scope && isDefined(scope.$$listeners));

    event.currentScope = null;

    return event;
}

/**
 * @ngdoc method
 * @name $rootScope.Scope#$broadcast
 * @kind function
 *
 * @description
 * Dispatches an event `name` downwards to all child scopes (and their children) notifying the
 * registered {@link ng.$rootScope.Scope#$on} listeners.
 *
 * The event life cycle starts at the scope on which `$broadcast` was called. All
 * {@link ng.$rootScope.Scope#$on listeners} listening for `name` event on this scope get
 * notified. Afterwards, the event propagates to all direct and indirect scopes of the current
 * scope and calls all registered listeners along the way. The event cannot be canceled.
 *
 * Any exception emitted from the {@link ng.$rootScope.Scope#$on listeners} will be passed
 * onto the {@link ng.$exceptionHandler $exceptionHandler} service.
 *
 * @param {string} name Event name to broadcast.
 * @param {...*} args Optional one or more arguments which will be passed onto the event listeners.
 * @return {Object} Event object, see {@link ng.$rootScope.Scope#$on}
 */
function $broadcast(name, args) {
    var target = this,
        current = target,
        next = target,
        event = {
            name: name,
            targetScope: target,
            preventDefault: function() {
                event.defaultPrevented = true;
            },
            defaultPrevented: false
        };

    if (!target.$$listenerCount[name]) return event;

    var listenerArgs = concat([event], arguments, 1),
        listeners, i, length;

    //down while you can, then up and next sibling or up and next sibling until back at root
    while ((current = next)) {
        event.currentScope = current;
        listeners = current.$$listeners[name] || [];
        for (i = 0, length = listeners.length; i < length; i++) {
            // if listeners were deregistered, defragment the array
            if (!listeners[i]) {
                listeners.splice(i, 1);
                i--;
                length--;
                continue;
            }

            try {
                listeners[i].apply(null, listenerArgs);
            } catch (e) {
                throw e;
            }
        }

        // Insanity Warning: scope depth-first traversal
        // yes, this code is a bit crazy, but it works and we have tests to prove it!
        // this piece should be kept in sync with the traversal in $digest
        // (though it differs due to having the extra check for $$listenerCount)
        if (!(next = ((current.$$listenerCount[name] && current.$$childHead) ||
            (current !== target && current.$$nextSibling)))) {
            while (current !== target && !(next = current.$$nextSibling)) {
                current = current.$parent;
            }
        }
    }

    event.currentScope = null;
    return event;
}

function decrementListenerCount(current, count, name) {
    do {
        current.$$listenerCount[name] -= count;

        if (current.$$listenerCount[name] === 0) {
            delete current.$$listenerCount[name];
        }
    } while ((current = current.$parent));
}

/**
 * This is from angular source code. Only meant to be used for Scope.
 * @param array1
 * @param array2
 * @param index
 * @returns {string|Array.<T>}
 */
function concat(array1, array2, index) {
    return array1.concat(Array.prototype.slice.call(array2, index));
}

function $destroy () {
    if (!this.$$destroyed) {
        // Destroy parent so that we won't traverse upward anymore.
        Object.setPrototypeOf(this, null);
        this.$parent = null;
        this.$emit('$destroy');
        this.$$destroyed = true;

        // sever all the references to parent scopes (after this cleanup, the current scope should
        // not be retained by any of our references and should be eligible for garbage collection)
        if (parent && parent.$$childHead === this) parent.$$childHead = this.$$nextSibling;
        if (parent && parent.$$childTail === this) parent.$$childTail = this.$$prevSibling;
        if (this.$$prevSibling) this.$$prevSibling.$$nextSibling = this.$$nextSibling;
        if (this.$$nextSibling) this.$$nextSibling.$$prevSibling = this.$$prevSibling;
    }
}

/**
 * @ngdoc method
 * @name $rootScope.Scope#$new
 * @kind function
 *
 * @description
 * Creates a new child {@link ng.$rootScope.Scope scope}.
 *
 * The parent scope will propagate the {@link ng.$rootScope.Scope#$digest $digest()} event.
 * The scope can be removed from the scope hierarchy using {@link ng.$rootScope.Scope#$destroy $destroy()}.
 *
 * {@link ng.$rootScope.Scope#$destroy $destroy()} must be called on a scope when it is
 * desired for the scope and its child scopes to be permanently detached from the parent and
 * thus stop participating in model change detection and listener notification by invoking.
 *
 * @param {boolean} isolate If true, then the scope does not prototypically inherit from the
 *         parent scope. The scope is isolated, as it can not see parent scope properties.
 *         When creating widgets, it is useful for the widget to not accidentally read parent
 *         state.
 *
 * @param {Scope} [parent=this] The {@link ng.$rootScope.Scope `Scope`} that will be the `$parent`
 *                              of the newly created scope. Defaults to `this` scope if not provided.
 *                              This is used when creating a transclude scope to correctly place it
 *                              in the scope hierarchy while maintaining the correct prototypical
 *                              inheritance.
 *
 * @returns {Object} The newly created child scope.
 *
 */
function $new (isolate, parent) {
    var child;

    parent = parent || this;

    if (isolate) {
        child = new _Scope();
        child.$root = this.$root;
    } else {
        child = new _Scope();
        Object.setPrototypeOf(child, parent);
    }
    child.$parent = parent;
    child.$$prevSibling = parent.$$childTail;
    if (parent.$$childHead) {
        parent.$$childTail.$$nextSibling = child;
        parent.$$childTail = child;
    } else {
        parent.$$childHead = parent.$$childTail = child;
    }

    return child;
}

class _Scope {
    constructor() {
        this.$root = this;
        this.$parent = this.$$nextSibling = this.$$prevSibling = this.$$childHead = this.$$childTail = null
        this.$$destroyed = false;
        this.$$listeners = {};
        this.$$listenerCount = {};

        this.$on = $on;
        this.$emit = $emit;
        this.$new = $new;
        this.$destroy = $destroy;
        this.$broadcast = $broadcast;
    }
};

$Scope = _Scope;
$rootScope = new $Scope();