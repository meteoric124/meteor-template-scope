import { $data } from './data-polyfill';  // Needs to be globally available so declared here instead of scope-polyfill.js
import { scope_polyfill } from './scope-polyfill';

export { $data, scope_polyfill };  // For testing.