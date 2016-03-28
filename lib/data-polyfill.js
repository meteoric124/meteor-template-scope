$data = {};

let old_$_data = $.fn.data;
$.fn.extend({
    data(key, value) {
        let uid = this.attr('uid');
        if (!_.isUndefined(uid)) {
            return this.$data.apply(this, arguments);
        }

        return old_$_data.apply(this, arguments);
    },
    $data(key, value) {
        let uid = this.attr('uid');
        if (arguments.length > 1) {
            $data[uid] = $data[uid] || {};
            $data[uid][key] = value;
        }
        return $data[uid][key];
    },
    scope() {
        return this.$data('$scope');
    }
});