import { $ } from 'meteor/jquery';
import { template_scope_id_attribute_name, unauthorized_$data_modification_error_msg } from './const';
import { isDefined } from './lib';

export let $data = {};

let old_$_data = $.fn.data;
$.fn.extend({
    data(key, value) {
        let uid = this.attr(template_scope_id_attribute_name);
        if (isDefined(uid)) {
            return this.$data.apply(this, arguments);
        }

        return old_$_data.apply(this, arguments);
    },
    $data(key, value) {
        let uid = this.attr(template_scope_id_attribute_name);
        if (arguments.length > 1) {
            $data[uid] = $data[uid] || {};
            $data[uid][key] = value;
        }

        if (typeof $data[uid] !== "undefined") {
            return $data[uid][key];
        } else {
            // Note: This is not suppose to happen. The only thing I can think of is when someone
            // modifies $data themselves.
            console.log(unauthorized_$data_modification_error_msg);
            return undefined;
        }
    },
    scope() {
        return this.$data('$scope');
    }
});